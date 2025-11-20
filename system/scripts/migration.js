/**
 * L5R Migration class
 */
export class MigrationL5r5e {
    /**
     * Minimum Version needed for migration stuff to trigger
     * @type {string}
     */
    static NEEDED_VERSION = "1.13.0";

    /**
     * Return true if the version need some updates
     * @param {string} version Version number to contest against the current version
     * @return {boolean}
     */
    static needUpdate(version) {
        const currentVersion = game.settings.get(CONFIG.l5r5e.namespace, "systemMigrationVersion");
        return !currentVersion || foundry.utils.isNewerVersion(version, currentVersion);
    }

    /**
     * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
     * @param options
     * @return {Promise<void>} A Promise which resolves once the migration is completed
     */
    static async migrateWorld(options = { force: false }) {
        if (!game.user.isFirstGM) {
            return;
        }

        // if (MigrationL5r5e.needUpdate("1.3.0")) {
        //     ChatMessage.create({"content": "<strong>L5R5E v1.3.0 :</strong><br>"});
        // }

        // Warn the users
        ui.notifications.info(
            `Applying L5R5e System Migration for version ${game.system.version}.` +
                ` Please be patient and do not close your game or shut down your server.`,
            { permanent: true }
        );

        console.groupCollapsed(`L5R5e System Migration v${game.system.version}.`);

        // Migrate World Actors
        console.group(`Checking within ${game.actors.size} actors`);
        for (let actor of game.actors.contents) {
            console.group(`Checking Actor [${actor.name}][${actor._id}]`);
            try {
                const updateData = MigrationL5r5e._migrateActorData(actor, options);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`L5R5E | Migration | Migrating Actor document done`);
                    await actor.update(updateData);
                }
            } catch (err) {
                err.message = `L5R5E | Migration | Failed L5R5e system migration for Actor ${actor.name}[${actor._id}]: ${err.message}`;
                console.error(err);
            }

            // Migrate Actor's Items
            if (actor.items.size) {
                console.group(`Checking within ${actor.items.size} items`);
                await MigrationL5r5e._migrateItemsWorker(actor.items, options);
                console.groupEnd();
            }
            console.groupEnd();
        }
        console.groupEnd();

        // Migrate World Items
        console.group(`Checking within ${game.items.size} world's items`);
        await MigrationL5r5e._migrateItemsWorker(game.items, options);
        console.groupEnd();

        // Migrate Actor Override Tokens
        console.group(`Checking within ${game.scenes.size} Scene`);
        for (let scene of game.scenes.contents) {
            console.group(`Checking Scene [${scene.name}][${scene._id}]`);
            try {
                const updateData = MigrationL5r5e._migrateSceneData(scene, options);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`L5R5E | Migration | Migrating Scene document done`);
                    await scene.update(updateData);
                    // If we do not do this, then synthetic token actors remain in cache
                    // with the un-updated actorData.
                    scene.tokens.contents.forEach((t) => (t._actor = null));
                }
            } catch (err) {
                err.message = `L5R5E | Migration | Failed L5R5e system migration for Scene ${scene.name}[${scene._id}]: ${err.message}`;
                console.error(err);
            }
            console.groupEnd();
        }
        console.groupEnd();

        // Migrate World Compendium Packs
        console.group(`Checking within ${game.packs.size} Compendium Packs`);
        for (let pack of game.packs) {
            if (pack.metadata.packageType !== "world" || !["Actor", "Item", "Scene"].includes(pack.metadata.type)) {
                continue;
            }
            await MigrationL5r5e._migrateCompendium(pack, options);
        }
        console.groupEnd();

        // Migrate ChatMessages
        try {
            const updatedChatList = [];
            for (let message of game.collections.get("ChatMessage")) {
                const updateData = MigrationL5r5e._migrateChatMessage(message, options);
                if (!foundry.utils.isEmpty(updateData)) {
                    updateData["_id"] = message._id;
                    updatedChatList.push(updateData);
                }
            }
            // Save all the modified entries at once
            if (updatedChatList.length > 0) {
                console.log(`L5R5E | Migration | Migrating ${updatedChatList.length} ChatMessage documents`);
                await ChatMessage.updateDocuments(updatedChatList);
            }
        } catch (err) {
            err.message = `L5R5E | Migration | Failed L5R5e system migration for ChatMessage`;
            console.error(err);
        }

        console.groupEnd();

        // Set the migration as complete
        await game.settings.set(CONFIG.l5r5e.namespace, "systemMigrationVersion", game.system.version);
        ui.notifications.info(`L5R5e System Migration to version ${game.system.version} completed!`, {
            permanent: true,
        });
    }

    /**
     * Item's migration iterator
     * @param {Collection} items
     * @param options
     * @returns {Promise<void>}
     */
    static async _migrateItemsWorker(items, options) {
        for (let item of items.contents) {
            try {
                const updateData = MigrationL5r5e._migrateItemData(item, options);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`L5R5E | Migration | Migrating Item document ${item.name}[${item._id}]`);
                    await item.update(updateData);
                }
            } catch (err) {
                err.message = `L5R5E | Migration | Failed L5R5e system migration for Item ${item.name}[${item._id}]: ${err.message}`;
                console.error(err);
            }
        }
    }

    /**
     * Apply migration rules to all documents within a single Compendium pack
     * @param {CompendiumCollection} pack
     * @param options
     * @return {Promise}
     */
    static async _migrateCompendium(pack, options = { force: false }) {
        const docType = pack.metadata.type;
        const wasLocked = pack.locked;
        try {
            // Unlock the pack for editing
            await pack.configure({ locked: false });

            // Begin by requesting server-side data model migration and get the migrated content
            await pack.migrate();
            const documents = await pack.getDocuments();

            // Iterate over compendium entries - applying fine-tuned migration functions
            const updateDatasList = [];
            for (let doc of documents) {
                let updateData = {};

                switch (docType) {
                    case "Actor":
                        updateData = MigrationL5r5e._migrateActorData(doc, options);
                        break;
                    case "Item":
                        updateData = MigrationL5r5e._migrateItemData(doc, options);
                        break;
                    case "Scene":
                        updateData = MigrationL5r5e._migrateSceneData(doc, options);
                        break;
                }
                if (foundry.utils.isEmpty(updateData)) {
                    continue;
                }

                // Add the entry, if data was changed
                updateData["_id"] = doc._id;
                updateDatasList.push(updateData);

                console.log(`L5R5E | Migration | Migrating ${docType} document ${doc.name}[${doc._id}] in Compendium ${pack.collection}`);
            }

            // Save the modified entries
            if (updateDatasList.length > 0) {
                await pack.documentClass.updateDocuments(updateDatasList, { pack: pack.collection });
            }
        } catch (err) {
            // Handle migration failures
            err.message = `L5R5E | Migration | Failed system migration for documents ${docType} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }

        // Apply the original locked status for the pack
        await pack.configure({ locked: wasLocked });
        console.log(`L5R5E | Migration | Migrated all ${docType} contents from Compendium ${pack.collection}`);
    }

    /**
     * Migrate a single Scene document to incorporate changes to the data model of its actor data overrides
     * Return an Object of updateData to be applied
     * @param  {Scene} scene  The Scene data to Update
     * @param  options
     * @return {Object}       The updateData to apply
     */
    static _migrateSceneData(scene, options = { force: false }) {
        const tokens = scene.tokens.map((token) => {
            const t = token.toJSON();
            if (!t.actorId || t.actorLink) {
                t.delta = {};
            } else if (!game.actors.has(t.actorId)) {
                t.actorId = null;
                t.delta = {};
            } else if (!t.actorLink) {
                const actorData = foundry.utils.duplicate(t.delta);
                actorData.type = token.actor?.type;
                const update = MigrationL5r5e._migrateActorData(actorData, options);
                ["items", "effects"].forEach((embeddedName) => {
                    if (!update[embeddedName]?.length) {
                        return;
                    }
                    const updates = new Map(update[embeddedName].map((u) => [u._id, u]));
                    t.delta[embeddedName].forEach((original) => {
                        const update = updates.get(original._id);
                        if (update) {
                            foundry.utils.mergeObject(original, update);
                        }
                    });
                    delete update[embeddedName];
                });

                foundry.utils.mergeObject(t.delta, update);
            }
            return t;
        });
        return { tokens };
    }

    /**
     * Migrate a single Actor document to incorporate latest data model changes
     * Return an Object of updateData to be applied
     * @param  {ActorL5r5e|Object} actor The actor, or the TokenDocument.delta to Update
     * @param  options
     * @return {Object} The updateData to apply
     */
    static _migrateActorData(actor, options = { force: false }) {
        const updateData = {};
        const system = actor.system;

        // We need to be careful with unlinked tokens, only the diff is store in "actorData".
        // ex no diff : actor = {type: "npc"}, actorData = undefined
        if (!system) {
            return updateData;
        }

        // ***** Start of 1.1.0 *****
        if (options?.force || MigrationL5r5e.needUpdate("1.1.0")) {
            // Add "Prepared" in actor
            if (system.prepared === undefined) {
                updateData["system.prepared"] = true;
            }

            // NPC are now without autostats, we need to save the value
            if (actor.type === "npc") {
                if (system.endurance < 1) {
                    updateData["system.endurance"] = (Number(system.rings.earth) + Number(system.rings.fire)) * 2;
                    updateData["system.composure"] = (Number(system.rings.earth) + Number(system.rings.water)) * 2;
                    updateData["system.focus"] = Number(system.rings.air) + Number(system.rings.fire);
                    updateData["system.vigilance"] = Math.ceil(
                        (Number(system.rings.air) + Number(system.rings.water)) / 2
                    );
                }
            }
        }
        // ***** End of 1.1.0 *****

        // ***** Start of 1.3.0 *****
        if (options?.force || MigrationL5r5e.needUpdate("1.3.0")) {
            // PC/NPC removed notes useless props "value"
            if (system.notes?.value) {
                updateData["system.notes"] = system.notes.value;
            }

            // NPC have now more than a Strength and a Weakness
            if (actor.type === "npc" && system.rings_affinities?.strength) {
                const aff = system.rings_affinities;
                updateData["system.rings_affinities." + aff.strength.ring] = aff.strength.value;
                updateData["system.rings_affinities." + aff.weakness.ring] = aff.weakness.value;

                // Delete old keys
                updateData["system.rings_affinities.-=strength"] = null;
                updateData["system.rings_affinities.-=weakness"] = null;
            }
        }
        // ***** End of 1.3.0 *****

        return updateData;
    }

    /**
     * Migrate a single Item document to incorporate latest data model changes
     * @param {ItemL5r5e} item
     * @param options
     */
    static _migrateItemData(item, options = { force: false }) {
        const updateData = {};

        // ***** Start of 1.12.3 *****
        if (options?.force || MigrationL5r5e.needUpdate("1.12.3")) {
            // Splitting book reference & page
            if (item.system.book_reference) {
                const bookReference = item.system.book_reference.match(/^((?!p\.)\D+?)?(?:\s*p\.)?(\d+)?$/);
                if (!bookReference) {
                    console.warn(`L5R5E | Migration | Failed to properly migrate item document ${item.name}[${item._id}]: Could not parse the book_reference`);
                    updateData["system.source_reference.source"] = item.system.book_reference;

                } else {
                    updateData["system.source_reference.source"] = bookReference[1]?.trim();
                    updateData["system.source_reference.page"] = bookReference[2];
                }

                // Delete the old key
                updateData["system.-=book_reference"] = null;
            }
        }
        // ***** End of 1.12.3 *****

        return updateData;
    }

    /**
     * Migrate a single Item document to incorporate latest data model changes
     * @param {ChatMessage} message
     * @param options
     */
    static _migrateChatMessage(message, options = { force: false }) {
        const updateData = {};

        // ***** Start of 1.3.0 *****
        if (options?.force || MigrationL5r5e.needUpdate("1.3.0")) {
            // Old chat messages have a "0" in content, in foundry 0.8+ the roll content is generated only if content is null
            if (message.content === "0") {
                updateData["content"] = "";
            }
        }
        // ***** End of 1.3.0 *****

        // ***** Start of 1.13.0 *****
        if (options?.force || MigrationL5r5e.needUpdate("1.13.0")) {
           // Fix Roll messages
            if (message.isRoll && message.content !== "") {
                updateData["content"] = message.content
                    .replace('<div class="l5r5e dice-roll">', '<div class="l5r5e chat dice-roll">')
                    .replace(/<div class="l5r5e item-display dices-l5r">(?!<\/div>)/, '<div class="l5r5e item-display dices-l5r"><div class="l5r5e dice-container">')
                    .replace(/(?!<\/div>)<button class="l5r5e chat-dice-rnk/, '</div><button class="l5r5e chat-dice-rnk')
                ;
            }
        }

        // ***** End of 1.13.0 *****
        return updateData;
    }
}
