/**
 * Extends the actor to process special things from L5R.
 */
export class ActorL5r5e extends Actor {
    /**
     * Create a new entity using provided input data
     * @override
     */
    static async create(docData, options = {}) {
        // if (!Object.keys(docData).includes("type")) {
        //     data.type = "character";
        // }

        // Replace default image
        if (docData.img === undefined) {
            docData.img = `${CONFIG.l5r5e.paths.assets}icons/actors/${docData.type}.svg`;
        }

        // Some tweak on actors prototypeToken
        docData.prototypeToken = docData.prototypeToken || {};
        switch (docData.type) {
            case "character":
                foundry.utils.mergeObject(
                    docData.prototypeToken,
                    {
                        // vision: true,
                        // dimSight: 30,
                        // brightSight: 0,
                        actorLink: true,
                        disposition: 1, // friendly
                        bar1: {
                            attribute: "fatigue",
                        },
                        bar2: {
                            attribute: "strife",
                        },
                    },
                    { overwrite: false }
                );
                break;

            case "npc":
                foundry.utils.mergeObject(
                    docData.prototypeToken,
                    {
                        actorLink: true,
                        disposition: 0, // neutral
                        bar1: {
                            attribute: "fatigue",
                        },
                        bar2: {
                            attribute: "strife",
                        },
                    },
                    { overwrite: false }
                );
                break;

            case "army":
                foundry.utils.mergeObject(
                    docData.prototypeToken,
                    {
                        actorLink: true,
                        disposition: 0, // neutral
                        bar1: {
                            attribute: "battle_readiness.casualties_strength",
                        },
                        bar2: {
                            attribute: "battle_readiness.panic_discipline",
                        },
                    },
                    { overwrite: false }
                );
                break;
        }
        await super.create(docData, options);
    }

    /**
     * Entity-specific actions that should occur when the Entity is updated
     * @override
     */
    async update(docData = {}, context = {}) {
        // fix foundry v0.8.8 (config token=object, update=flat array)
        docData = foundry.utils.flattenObject(docData);

        // Need a _id
        if (!docData["_id"]) {
            docData["_id"] = this.id;
        }

        // Context informations (needed for unlinked token update)
        context.parent = this.parent;
        context.pack = this.pack;

        // NPC switch between types : Linked actor for Adversary, unlinked for Minion
        if (!!docData["system.type"] && this.type === "npc" && docData["system.type"] !== this.system.type) {
            docData["prototypeToken.actorLink"] = docData["system.type"] === "adversary";
        }

        // Only on linked Actor
        if (
            !!docData["prototypeToken.actorLink"] ||
            (docData["prototypeToken.actorLink"] === undefined && this.prototypeToken?.actorLink)
        ) {
            // Update the token name/image if the sheet name/image changed, but only if
            // they was previously the same, and token img was not set in same time
            Object.entries({ name: "name", img: "texture.src" }).forEach(([dataProp, TknProp]) => {
                if (
                    docData[dataProp] &&
                    !docData["prototypeToken." + TknProp] &&
                    this[dataProp] === foundry.utils.getProperty(this.prototypeToken, TknProp) &&
                    this[dataProp] !== docData[dataProp]
                ) {
                    docData["prototypeToken." + TknProp] = docData[dataProp];
                }
            });
        }

        return Actor.updateDocuments([docData], context).then(() => {
            // Notify the "Gm Monitor" if this actor is watched
            if (game.settings.get(CONFIG.l5r5e.namespace, "gm-monitor-actors").some((uuid) => uuid === this.uuid)) {
                game.l5r5e.HelpersL5r5e.refreshLocalAndSocket("l5r5e-gm-monitor");
            }
        });
    }

    /** @inheritDoc */
    async _preUpdate(changes, options, user) {
        if (this.isCharacterType) {
            // apply compromised condition if strife goes beyond max
            const strife = changes.system?.strife?.value ?? this.system.strife.value;
            const isCompromised = strife > this.system.composure;
            // apply incapacitated if fatigue goes beyond max endurance
            const fatigue = changes.system?.fatigue?.value ?? this.system.fatigue.value;
            const isIncapacitated = fatigue > this.system.endurance;
            await Promise.all([
                this.toggleStatusEffect('compromised', {active: isCompromised}),
                this.toggleStatusEffect('incapacitated', {active: isIncapacitated}),
            ]);
        }
    }

    /** @override */
    prepareData() {
        super.prepareData();

        if (this.isCharacterType) {
            const system = this.system;

            // No automation for npc as they cheat in stats
            if (this.isCharacter) {
                ActorL5r5e.computeDerivedAttributes(system);
            }

            const isAfflicted = this.statuses.has("afflicted");
            const isCompromised = this.statuses.has("compromised");

            // Attributes bars
            system.fatigue.max = system.endurance;
            system.strife.max = system.composure;
            system.void_points.max = system.approaches.fortune;

            // if compromised or afflicted, vigilance = 1
            system.is_afflicted_or_compromised = isAfflicted || isCompromised;

            // Make sure void points are never greater than max
            if (system.void_points.value > system.void_points.max) {
                system.void_points.value = system.void_points.max;
            }
        }
    }

    /**
     * Set derived attributes (endurance, composure, focus, vigilance) from approaches values
     * @param {Object} system
     */
    static computeDerivedAttributes(system) {
        system.endurance = (Number(system.approaches.resilience) + Number(system.approaches.power)) * 2;
        system.composure = (Number(system.approaches.resilience) + Number(system.approaches.swiftness)) * 2;
        system.focus = Number(system.approaches.precision) + Number(system.approaches.power);
        system.vigilance = Math.ceil((Number(system.approaches.precision) + Number(system.approaches.swiftness)) / 2);

        // Modifiers from conditions
        const modifiers = system.modifiers?.character;
        system.endurance = system.endurance + (Number(modifiers?.endurance) || 0);
        system.composure = system.composure + (Number(modifiers?.composure) || 0);
        system.focus = system.focus + (Number(modifiers?.focus) || 0);
        system.vigilance = system.vigilance + (Number(modifiers?.vigilance) || 0);
    }

    /**
     * Add a Ring/Skill point to the current actor if the item is a advancement
     * @param {Item} item
     * @return {Promise<void>}
     */
    async addBonus(item) {
        return this._updateActorFromAdvancement(item, true);
    }

    /**
     * Remove a Ring/Skill point to the current actor if the item is a advancement
     * @param {Item} item
     * @return {Promise<void>}
     */
    async removeBonus(item) {
        return this._updateActorFromAdvancement(item, false);
    }

    /**
     * @type {import("./types").Condition}
     *
     * Remove conditions by known string ids
     * @param conditions {Set<Condition>}
     * @returns {Promise<void>}
     */
    async removeConditions(conditions) {
        const effectsToRemove = this.statuses.intersection(conditions);
        const idsToRemove = this.effects.contents
            .filter(effect => effect.statuses.isSubsetOf(effectsToRemove))
            .map(effect => effect.id);
        await this.deleteEmbeddedDocuments("ActiveEffect", idsToRemove);
    }

    /**
     * Alter Actor skill/ring from a advancement
     * @param {Item}    item
     * @param {boolean} isAdd True=add, false=remove
     * @return {Promise<void>}
     * @private
     */
    async _updateActorFromAdvancement(item, isAdd) {
        if (item && item.type === "advancement") {
            const actor = foundry.utils.duplicate(this.system);
            const itemData = item.system;
            if (itemData.advancement_type === "approach") {
                // Approach
                if (isAdd) {
                    actor.approaches[itemData.approach] = Math.min(9, actor.approaches[itemData.approach] + 1);
                } else {
                    actor.approaches[itemData.approach] = Math.max(1, actor.approaches[itemData.approach] - 1);
                }
            } else {
                // Skill
                const skillCatId = CONFIG.l5r5e.skills.get(itemData.skill);
                if (skillCatId) {
                    if (isAdd) {
                        actor.skills[skillCatId][itemData.skill] = Math.min(
                            9,
                            actor.skills[skillCatId][itemData.skill] + 1
                        );
                    } else {
                        actor.skills[skillCatId][itemData.skill] = Math.max(
                            0,
                            actor.skills[skillCatId][itemData.skill] - 1
                        );
                    }
                }
            }

            // Update Actor
            await this.update({
                system: foundry.utils.diffObject(this.system, actor),
            });
        }
    }

    /**
     * Render the text template for this Actor (tooltips and chat)
     * @return {Promise<string|null>}
     */
    async renderTextTemplate() {
        const sheetData = (await this.sheet?.getData()) || this;
        const tpl = await foundry.applications.handlebars.renderTemplate(`${CONFIG.l5r5e.paths.templates}actors/actor-text.html`, sheetData);
        if (!tpl) {
            return null;
        }
        return tpl;
    }

    /**
     * Return true if this actor is a PC or NPC
     * @return {boolean}
     */
    get isCharacterType() {
        return ["character", "npc"].includes(this.type);
    }

    /**
     * Return true if this actor is a Character
     * @return {boolean}
     */
    get isCharacter() {
        return this.type === "character";
    }

    /**
     * Return true if this actor is an Adversary
     * @return {boolean}
     */
    get isAdversary() {
        return this.type === "npc" && this.system.type === "adversary";
    }

    /**
     * Return true if this actor is a Minion
     * @return {boolean}
     */
    get isMinion() {
        return this.type === "npc" && this.system.type === "minion";
    }

    /**
     * Return true if this actor is an Army
     * @return {boolean}
     */
    get isArmy() {
        return this.type === "army";
    }

    /**
     * Return true if this actor have an active player as owner
     * @returns {boolean}
     */
    get hasPlayerOwnerActive() {
        return game.users.find((u) => !!u.active && u.character?.id === this.id);
    }

    /**
     * Return true if this actor can do a initiative roll
     * @returns {boolean}
     */
    get canDoInitiativeRoll() {
        return game.combat?.combatants.some(
            (c) => !c.initiative && (c.tokenId === this.token?._id || (!this.token && c.actorId === this._id))
        );
    }

    /**
     * Return true if a weapon is equipped
     * @return {boolean}
     */
    get haveWeaponEquipped() {
        return this.items.some((e) => e.type === "weapon" && !!e.system.equipped);
    }

    /**
     * Return true if a weapon is readied
     * @return {boolean}
     */
    get haveWeaponReadied() {
        return this.items.some((e) => e.type === "weapon" && !!e.system.equipped && !!e.system.readied);
    }

    /**
     * Return true if a armor is equipped
     * @return {boolean}
     */
    get haveArmorEquipped() {
        return this.items.some((e) => e.type === "armor" && !!e.system.equipped);
    }

    /**
     * Return true if this actor is prepared (overridden by global)
     * @return {boolean}
     */
    get isPrepared() {
        if (!this.isCharacterType) {
            return false;
        }

        const cfg = {
            character: game.settings.get(CONFIG.l5r5e.namespace, "initiative-prepared-character"),
            adversary: game.settings.get(CONFIG.l5r5e.namespace, "initiative-prepared-adversary"),
            minion: game.settings.get(CONFIG.l5r5e.namespace, "initiative-prepared-minion"),
        };

        // Prepared is a boolean or if null we get the info in the actor
        let isPrepared = this.isCharacter ? cfg.character : cfg[this.system.type];
        if (isPrepared === "actor") {
            isPrepared = this.system.prepared ? "true" : "false";
        }

        return isPrepared;
    }

    /**
     * Return the Status Rank of this actor
     * @return {number|null}
     */
    get statusRank() {
        if (!this.isCharacterType) {
            return null;
        }
        return Math.floor(this.system.social.status / 10);
    }

    /**
     * Return the Intrigue Rank of this actor
     * @return {number|null}
     */
    get intrigueRank() {
        if (!this.isCharacterType) {
            return null;
        }
        return this.type === "npc" ? this.system.conflict_rank.social : this.system.identity.school_rank;
    }

    /**
     * Return the Martial Rank of this actor
     * @return {number|null}
     */
    get martialRank() {
        if (!this.isCharacterType) {
            return null;
        }
        return this.type === "npc" ? this.system.conflict_rank.martial : this.system.identity.school_rank;
    }
}
