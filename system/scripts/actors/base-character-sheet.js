import { BaseSheetL5r5e } from "./base-sheet.js";

/**
 * Base Sheet for Character types (Character and Npc)
 */
export class BaseCharacterSheetL5r5e extends BaseSheetL5r5e {
    /**
     * Commons options
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "actor"],
            // template: CONFIG.l5r5e.paths.templates + "actors/character-sheet.html",
            width: 600,
            height: 800,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
        });
    }

    /** @inheritdoc */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        sheetData.data.stances = CONFIG.l5r5e.stances;
        sheetData.data.techniquesList = game.l5r5e.HelpersL5r5e.getTechniquesList({ displayInTypes: true });

        // Split Techniques by types
        sheetData.data.splitTechniquesList = this._splitTechniques(sheetData);

        // Split Items by types
        sheetData.data.splitItemsList = this._splitItems(sheetData);

        // Store infos for this app (collapsible)
        sheetData.data.storeInfos = game.l5r5e.storage.getAppKeys(this.id);

        return sheetData;
    }

    /**
     * Split Techniques by types for better readability
     * @private
     */
    _splitTechniques(sheetData) {
        const out = {};
        const schoolTechniques = Array.from(CONFIG.l5r5e.techniques)
            .filter(([id, cfg]) => cfg.type === "school")
            .map(([id, cfg]) => id);

        // Build the list order
        Array.from(CONFIG.l5r5e.techniques)
            .filter(([id, cfg]) => cfg.type !== "custom" || game.settings.get(CONFIG.l5r5e.namespace, "techniques-customs"))
            .forEach(([id, cfg]) => {
                out[id] = [];
            });

        // Add tech the character knows
        sheetData.items.forEach((item) => {
            switch (item.type) {
                case "technique":
                    if (!out[item.system.technique_type]) {
                        console.warn(
                            `L5R5E | BCS | Empty or unknown technique type[${item.system.technique_type}] forced to "kata" in item id[${item._id}], name[${item.name}]`
                        );
                        item.system.technique_type = "kata";
                    }
                    out[item.system.technique_type].push(item);
                    break;

                case "title":
                    // Embed technique in titles
                    Array.from(item.system.items).forEach(([id, embedItem]) => {
                        if (embedItem.type === "technique") {
                            if (!out[embedItem.system.technique_type]) {
                                console.warn(
                                    `L5R5E | BCS | Empty or unknown technique type[${embedItem.system.technique_type}] forced to "kata" in item id[${id}], name[${embedItem.name}], parent: id[${item._id}], name[${item.name}]`
                                );
                                embedItem.system.technique_type = "kata";
                            }
                            out[embedItem.system.technique_type].push(embedItem);
                        }
                    });

                    // If unlocked, add the "title_ability" as technique (or always displayed for npc)
                    if (item.system.xp_used >= item.system.xp_cost || this.document.type === "npc") {
                        out["title_ability"].push(item);
                    }
                    break;
            } //swi
        });

        // Remove unused techs
        Object.keys(out).forEach((tech) => {
            if (out[tech].length < 1 && !sheetData.data.system.techniques[tech] && !schoolTechniques.includes(tech)) {
                delete out[tech];
            }
        });

        // Manage school add button
        sheetData.data.system.techniques["school_ability"] = out["school_ability"].length === 0;
        sheetData.data.system.techniques["mastery_ability"] = out["mastery_ability"].length === 0;

        // Always display "school_ability", but display a empty "mastery_ability" field only if rank >= 5
        if (sheetData.data.system.identity?.school_rank < 5 && out["mastery_ability"].length === 0) {
            delete out["mastery_ability"];
        }

        return out;
    }

    /**
     * Split Items by types for better readability
     * @private
     */
    _splitItems(sheetData) {
        const out = {
            weapon: [],
            armor: [],
            item: [],
        };

        sheetData.items.forEach((item) => {
            if (["item", "armor", "weapon"].includes(item.type)) {
                out[item.type].push(item);
            }
        });

        return out;
    }

    /**
     * Handle dropped data on the Actor sheet
     * @param {DragEvent} event
     */
    async _onDrop(event) {
        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable || this.actor.system.soft_locked) {
            console.log("L5R5E | BCS | This sheet is not editable");
            return;
        }

        // Check item type and subtype
        const item = await game.l5r5e.HelpersL5r5e.getDragnDropTargetObject(event);
        if (!item || !["Item", "JournalEntry"].includes(item.documentName) || item.type === "property") {
            console.log(`L5R5E | BCS | Wrong subtype ${item?.type}`, item);
            return;
        }

        // Specific curriculum journal drop
        if (item.documentName === "JournalEntry") {
            // npc does not have this
            if (!this.actor.system.identity?.school_curriculum_journal) {
                console.log("L5R5E | BCS | NPC won't go to school :'(");
                return;
            }
            this.actor.system.identity.school_curriculum_journal = {
                id: item._id,
                name: item.name,
                pack: item.pack || null,
            };
            await this.actor.update({
                system: {
                    identity: {
                        school_curriculum_journal: this.actor.system.identity.school_curriculum_journal,
                    },
                },
            });
            return;
        }

        // Dropped an item with same "id" as one owned
        if (this.actor.items) {
            // Exit if we already owned exactly this id (drag a personal item on our own sheet)
            if (
                this.actor.items.some((embedItem) => {
                    // Search in children
                    if (embedItem.items instanceof Map && embedItem.items.has(item._id)) {
                        return true;
                    }
                    return embedItem._id === item._id;
                })
            ) {
                console.log("L5R5E | BCS | This element has been ignored because it already exists in this actor", item.uuid);
                return;
            }

            // Add quantity instead if they have (id is different so use type and name)
            if (item.system.quantity) {
                const tmpItem = this.actor.items.find(
                    (embedItem) => embedItem.name === item.name && embedItem.type === item.type
                );
                if (tmpItem && this._modifyQuantity(tmpItem.id, 1)) {
                    return;
                }
            }
        }

        // Can add the item - Foundry override cause props
        const allowed = Hooks.call("dropActorSheetData", this.actor, this, item);
        if (allowed === false) {
            return;
        }

        let itemData = item.toObject(true);

        // If from another actor, break the link
        if (itemData.system.parent_id !== null && itemData.system.parent_id.actor_id !== this.actor._id) {
            itemData.system.parent_id = null;
        }

        // Item subtype specific
        switch (itemData.type) {
            case "army_cohort":
            case "army_fortification":
                console.warn("L5R5E | BCS | Army items are not allowed", item?.type, item);
                return;

            case "advancement":
                // Specific advancements, remove 1 to selected ring/skill
                await this.actor.addBonus(item);
                break;

            case "title":
                // Generate new Ids for the embed items
                await item.generateNewIdsForAllEmbedItems();

                // Add embed advancements bonus
                for (let [embedId, embedItem] of item.system.items) {
                    if (embedItem.type === "advancement") {
                        await this.actor.addBonus(embedItem);
                    }
                }

                // refresh data
                itemData = item.toObject(true);
                break;

            case "technique":
                // School_ability and mastery_ability, allow only 1 per type
                if (CONFIG.l5r5e.techniques.get(itemData.system.technique_type)?.type === "school") {
                    if (
                        Array.from(this.actor.items).some((e) => {
                            return e.type === "technique" && e.system.technique_type === itemData.system.technique_type;
                        })
                    ) {
                        ui.notifications.info("l5r5e.techniques.only_one", {localize: true});
                        return;
                    }

                    // No cost for schools
                    itemData.system.xp_cost = 0;
                    itemData.system.xp_used = 0;
                    itemData.system.in_curriculum = true;
                } else {
                    // Informative message : Check if technique is allowed for this character
                    if (!game.user.isGM && !this.actor.system.techniques[itemData.system.technique_type]) {
                        ui.notifications.info("l5r5e.techniques.not_allowed", {localize: true});
                    }

                    // Verify cost
                    itemData.system.xp_cost =
                        itemData.system.xp_cost > 0 ? itemData.system.xp_cost : CONFIG.l5r5e.xp.techniqueCost;
                    itemData.system.xp_used = itemData.system.xp_cost;
                }
                break;
        }

        // Modify the bought at rank to the current actor rank
        if (itemData.system.bought_at_rank !== undefined && this.actor.system.identity?.school_rank) {
            itemData.system.bought_at_rank = this.actor.system.identity.school_rank;
        }

        // Finally create the embed
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    /** @inheritdoc */
    _onDragStart(event) {
        // Patch Owned Items
        const li = event.currentTarget;
        if (li.dataset.itemParentId && li.dataset.itemId) {
            const item = this.actor.items.get(li.dataset.itemParentId)?.items.get(li.dataset.itemId);
            if (item) {
                event.dataTransfer.setData("text/plain", JSON.stringify({
                    type: "Item",
                    uuid: item.uuid,
                }));
                return;
            }
        }
        // Else regular
        super._onDragStart(event);
    }

    /**
     * Subscribe to events from the sheet.
     * @param {jQuery} html HTML content of the sheet.
     */
    activateListeners(html) {
        super.activateListeners(html);

        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable) {
            return;
        }

        // Dice event on Skills clic
        html.find(".dice-picker").on("click", this._openDicePickerForSkill.bind(this));

        // Dice event on Technique clic
        html.find(".dice-picker-tech").on("click", this._openDicePickerForTechnique.bind(this));

        // Prepared (Initiative)
        html.find(".prepared-control").on("click", this._switchPrepared.bind(this));

        // Equipped / Readied
        html.find(".equip-readied-control").on("click", this._switchEquipReadied.bind(this));

        // Others Advancements
        html.find(".item-advancement-choose").on("click", this._showDialogAddSubItem.bind(this));

        // Fatigue/Strife +/-
        html.find(".addsub-control").on("click", this._modifyFatigueOrStrife.bind(this));

        // Effect remove/display
        html.find(".effect-delete").on("click", this._removeEffectId.bind(this));
        html.find(".effect-name").on("click", this._openEffectJournal.bind(this));
    }

    /**
     * Remove an effect
     * @param {Event} event
     * @private
     */
    _removeEffectId(event) {
        event.preventDefault();
        event.stopPropagation();

        const effectId = $(event.currentTarget).data("effect-id");
        if (!effectId) {
            return;
        }

        const tmpItem = this.actor.effects.get(effectId);
        if (!tmpItem) {
            return;
        }

        const callback = async () => {
            return this.actor.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
        };

        // Holing Ctrl = without confirm
        if (event.ctrlKey) {
            return callback();
        }

        game.l5r5e.HelpersL5r5e.confirmDeleteDialog(
            game.i18n.format("l5r5e.global.delete_confirm", { name: tmpItem.name }),
            callback
        );
    }

    /**
     * Open the core linked journal effect if exist
     * @param {Event} event
     * @private
     */
    async _openEffectJournal(event) {
        event.preventDefault();
        event.stopPropagation();

        const effectId = $(event.currentTarget).data("effect-id");
        if (!effectId) {
            return;
        }

        const effect = this.actor.effects.get(effectId);
        if (!effect?.system?.id && !effect?.system?.uuid) {
            return;
        }

        const journal = await game.l5r5e.HelpersL5r5e.getObjectGameOrPack({
            id: effect.system.id,
            uuid: effect.system.uuid,
            type: "JournalEntry",
        });
        if (journal) {
            journal.sheet.render(true);
        }
    }

    /**
     * Switch the state "prepared" (initiative)
     * @param {Event} event
     * @private
     */
    _switchPrepared(event) {
        event.preventDefault();
        event.stopPropagation();

        this.actor.system.prepared = !this.actor.system.prepared;
        this.actor.update({
            system: {
                prepared: this.actor.system.prepared,
            },
        });
        this.render(false);
    }

    /**
     * Add a generic item with sub type
     * @param {string}      type           Item sub type (armor, weapon, bond...)
     * @param {boolean}     isEquipped     For item with prop "Equipped" set the value
     * @param {string|null} techniqueType  Technique subtype (kata, shuji...)
     * @return {Promise<void>}
     * @private
     */
    async _createSubItem({ type, isEquipped = false, techniqueType = null }) {
        if (!type) {
            return;
        }

        const created = await this.actor.createEmbeddedDocuments("Item", [
            {
                name: game.i18n.localize(`TYPES.Item.${type.toLowerCase()}`),
                type: type,
                img: `${CONFIG.l5r5e.paths.assets}icons/items/${type}.svg`,
            },
        ]);
        if (created?.length < 1) {
            return;
        }
        const item = this.actor.items.get(created[0].id);

        // Assign current school rank to the new adv/tech
        if (this.actor.system.identity?.school_rank) {
            item.system.bought_at_rank = this.actor.system.identity.school_rank;
            if (["advancement", "technique"].includes(item.type)) {
                item.system.rank = this.actor.system.identity.school_rank;
            }
        }

        switch (item.type) {
            case "item": // no break
            case "armor": // no break
            case "weapon":
                item.system.equipped = isEquipped;
                break;

            case "technique": {
                // If technique, select the current sub-type
                if (CONFIG.l5r5e.techniques.get(techniqueType)) {
                    item.name = game.i18n.localize(`l5r5e.techniques.${techniqueType}`);
                    item.img = `${CONFIG.l5r5e.paths.assets}icons/techs/${techniqueType}.svg`;
                    item.system.technique_type = techniqueType;
                }
                break;
            }
        }

        item.sheet.render(true);
    }

    /**
     * Display a dialog to choose what Item to add
     * @param {Event} event
     * @return {Promise<void>}
     * @private
     */
    async _showDialogAddSubItem(event) {
        game.l5r5e.HelpersL5r5e.showSubItemDialog(["bond", "title", "signature_scroll", "item_pattern"]).then(
            (selectedType) => {
                this._createSubItem({ type: selectedType });
            }
        );
    }

    /**
     * Add a generic item with sub type
     * @param {Event} event
     * @private
     */
    async _addSubItem(event) {
        event.preventDefault();
        event.stopPropagation();

        const type = $(event.currentTarget).data("item-type");
        if (!type) {
            return;
        }

        const isEquipped = $(event.currentTarget).data("item-equipped") || false;
        const techniqueType = $(event.currentTarget).data("tech-type") || null;

        return this._createSubItem({ type, isEquipped, techniqueType });
    }

    /**
     * Delete a generic item with sub type
     * @param {Event} event
     * @private
     */
    _deleteSubItem(event) {
        event.preventDefault();
        event.stopPropagation();

        const itemId = $(event.currentTarget).data("item-id");
        if (!itemId) {
            return;
        }

        const tmpItem = this.actor.items.get(itemId);
        if (!tmpItem) {
            return;
        }

        // Remove 1 qty if possible
        if (tmpItem.system.quantity > 1 && this._modifyQuantity(tmpItem.id, -1)) {
            return;
        }

        const callback = async () => {
            switch (tmpItem.type) {
                case "advancement":
                    // Remove advancements bonus (1 to selected ring/skill)
                    await this.actor.removeBonus(tmpItem);
                    break;

                case "title":
                    // Remove embed advancements bonus
                    for (let [embedId, embedItem] of tmpItem.system.items) {
                        if (embedItem.type === "advancement") {
                            await this.actor.removeBonus(embedItem);
                        }
                    }
                    break;
            }
            return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        };

        // Holing Ctrl = without confirm
        if (event.ctrlKey) {
            return callback();
        }

        game.l5r5e.HelpersL5r5e.confirmDeleteDialog(
            game.i18n.format("l5r5e.global.delete_confirm", { name: tmpItem.name }),
            callback
        );
    }

    /**
     * Switch "in_curriculum"
     * @param {Event} event
     * @private
     */
    _switchSubItemCurriculum(event) {
        event.preventDefault();
        event.stopPropagation();

        const itemId = $(event.currentTarget).data("item-id");
        const item = this.actor.items.get(itemId);
        if (item.type !== "item") {
            item.update({
                system: {
                    in_curriculum: !item.system.in_curriculum,
                },
            });
        }
    }

    /**
     * Add or subtract a quantity to a owned item
     * @private
     */
    _modifyQuantity(itemId, add) {
        const tmpItem = this.actor.items.get(itemId);
        if (tmpItem) {
            tmpItem.system.quantity = Math.max(1, tmpItem.system.quantity + add);
            tmpItem.update({
                system: {
                    quantity: tmpItem.system.quantity,
                },
            });
            return true;
        }
        return false;
    }

    /**
     * Add or Subtract Fatigue/Strife (+/- buttons)
     * @param {Event} event
     * @private
     */
    async _modifyFatigueOrStrife(event) {
        event.preventDefault();
        event.stopPropagation();

        const elmt = $(event.currentTarget);
        const type = elmt.data("type");
        let mod = elmt.data("value");
        if (!mod) {
            return;
        }
        switch (type) {
            case "fatigue":
                await this.actor.update({
                    system: {
                        fatigue: {
                            value: Math.max(0, this.actor.system.fatigue.value + mod),
                        },
                    },
                });
                break;

            case "strife":
                await this.actor.update({
                    system: {
                        strife: {
                            value: Math.max(0, this.actor.system.strife.value + mod),
                        },
                    },
                });
                break;

            default:
                console.warn("L5R5E | BCS | Unsupported type", type);
                break;
        }
    }

    /**
     * Switch Readied state on a weapon
     * @param {Event} event
     * @private
     */
    _switchEquipReadied(event) {
        event.preventDefault();
        event.stopPropagation();

        const type = $(event.currentTarget).data("type");
        if (!["equipped", "readied"].includes(type)) {
            return;
        }

        const itemId = $(event.currentTarget).data("item-id");
        const tmpItem = this.actor.items.get(itemId);
        if (!tmpItem || tmpItem.system[type] === undefined) {
            return;
        }

        tmpItem.system[type] = !tmpItem.system[type];
        const data = {
            equipped: tmpItem.system.equipped,
        };
        // Only weapons
        if (tmpItem.system.readied !== undefined) {
            data.readied = tmpItem.system.readied;
        }

        // Update the Item: we need to manually notify the "Gm Monitor" as the Actor himself is not updated
        tmpItem.update({ system: data }).then(() => {
            // Only if this actor is watched
            if (this.actor && game.settings.get(CONFIG.l5r5e.namespace, "gm-monitor-actors").some((uuid) => uuid === this.actor.uuid)) {
                game.l5r5e.HelpersL5r5e.refreshLocalAndSocket("l5r5e-gm-monitor");
            }
        });
    }

    /**
     * Get the skillId and uuid for this weaponId
     * @private
     */
    _getWeaponInfos(weaponId) {
        if (!weaponId) {
            return null;
        }
        const item = this.actor.items.get(weaponId);
        if (!item || item.type !== "weapon") {
            return null;
        }
        return {
            uuid: item.uuid,
            skill: item.system.skill,
        };
    }

    /**
     * Open the dice-picker for this skill
     * @param {Event} event
     * @private
     */
    _openDicePickerForSkill(event) {
        event.preventDefault();
        event.stopPropagation();

        // In Fvtt v13+ "Enter" trigger that mouse event, we ignore that below
        if (event.clientX ===  0 && event.clientY === 0) {
            return;
        }

        const li = $(event.currentTarget);
        const weapon = this._getWeaponInfos(li.data("weapon-id") || null);
        const isInitiative = li.data("initiative") || false;

        if (isInitiative) {
            if (!game.combat) {
                ui.notifications.warn("COMBAT.NoneActive", {localize: true});
                return;
            }
            if (!this.actor.canDoInitiativeRoll) {
                ui.notifications.error("l5r5e.conflict.initiative.already_set", {localize: true});
                return;
            }
            // Minion specific
            if (this.actor.isMinion) {
                this.actor.rollInitiative().then();
                return;
            }
        }

        new game.l5r5e.DicePickerDialog({
            ringId: li.data("ring") || null,
            skillId: weapon?.skill || li.data("skill") || null,
            skillCatId: li.data("skillcat") || null,
            isInitiativeRoll: isInitiative,
            actor: this.actor,
            itemUuid: weapon?.uuid,
        }).render(true);
    }

    /**
     * Open the dice-picker for this technique
     * @param {Event} event
     * @private
     */
    async _openDicePickerForTechnique(event) {
        event.preventDefault();
        event.stopPropagation();

        // Required for tech in titles, search in sub items
        const item = await game.l5r5e.HelpersL5r5e.getEmbedItemByEvent(event, this.actor);
        if (!item || item.type !== "technique" || !item.system.skill) {
            return;
        }

        const itemData = item.system;
        new game.l5r5e.DicePickerDialog({
            actor: this.actor,
            ringId: itemData.ring || null,
            difficulty: itemData.difficulty || null,
            skillsList: itemData.skill || null,
            itemUuid: item.uuid,
        }).render(true);
    }
}
