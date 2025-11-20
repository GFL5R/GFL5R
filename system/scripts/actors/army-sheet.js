import { BaseSheetL5r5e } from "./base-sheet.js";

/**
 * Sheet for Army "actor"
 */
export class ArmySheetL5r5e extends BaseSheetL5r5e {
    /**
     * Commons options
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "actor", "army"],
            template: CONFIG.l5r5e.paths.templates + "actors/army-sheet.html",
            width: 600,
            height: 800,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "army" }],
        });
    }

    /** @override */
    constructor(options = {}) {
        super(options);
        this._initialize();
    }

    /**
     * Initialize once
     * @private
     */
    _initialize() {
        const data = this.object.system;

        // update linked actor datas
        if (data.commander_actor_id) {
            const commander = game.actors.get(data.commander_actor_id);
            if (commander) {
                this._updateLinkedActorData("commander", commander, true);
            } else {
                this._removeLinkedActorData("commander");
            }
        }
        if (data.warlord_actor_id) {
            const warlord = game.actors.get(data.warlord_actor_id);
            if (warlord) {
                this._updateLinkedActorData("warlord", warlord, true);
            } else {
                this._removeLinkedActorData("warlord");
            }
        }
    }

    /**
     * Create drag-and-drop workflow handlers for this Application
     * @return An array of DragDrop handlers
     */
    _createDragDropHandlers() {
        return [
            new foundry.applications.ux.DragDrop.implementation({
                dropSelector: ".warlord",
                callbacks: { drop: this._onDropActors.bind(this, "warlord") },
            }),
            new foundry.applications.ux.DragDrop.implementation({
                dropSelector: ".commander",
                callbacks: { drop: this._onDropActors.bind(this, "commander") },
            }),
            new foundry.applications.ux.DragDrop.implementation({
                dropSelector: null,
                callbacks: { drop: this._onDrop.bind(this) },
            }),
        ];
    }

    /**
     * Activate a named TinyMCE text editor
     * @param {string} name             The named data field which the editor modifies.
     * @param {object} options          TinyMCE initialization options passed to TextEditor.create
     * @param {string} initialContent   Initial text content for the editor area.
     * @override
     */
    activateEditor(name, options = {}, initialContent = "") {
        // Symbols Compatibility with old compendium modules (PRE l5r v1.7.2)
        if (
            ["system.army_abilities", "system.supplies_logistics", "system.past_battles"].includes(name) &&
            initialContent
        ) {
            initialContent = game.l5r5e.HelpersL5r5e.convertSymbols(initialContent, false);
        }
        return super.activateEditor(name, options, initialContent);
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

        // Casualties/Panic +/-
        html.find(".addsub-control").on("click", this._modifyCasualtiesOrPanic.bind(this));

        if (this.actor.system.soft_locked) {
            return;
        }

        // Delete the linked Actor (warlord/commander)
        html.find(".actor-remove-control").on("click", this._removeLinkedActor.bind(this));
    }

    /** @inheritdoc */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // Split Items by types
        sheetData.data.splitItemsList = this._splitItems(sheetData);

        // Editors enrichment
        for (const name of ["army_abilities", "supplies_logistics", "past_battles"]) {
            sheetData.data.enrichedHtml[name] = await foundry.applications.ux.TextEditor.implementation.enrichHTML(sheetData.data.system[name], {
                async: true,
            });
        }

        return sheetData;
    }

    /**
     * Split Items by types for better readability
     * @private
     */
    _splitItems(sheetData) {
        const out = {
            army_cohort: [],
            army_fortification: [],
        };

        sheetData.items.forEach((item) => {
            if (["army_cohort", "army_fortification"].includes(item.type)) {
                out[item.type].push(item);
            }
        });

        return out;
    }

    /**
     * Handle dropped Item data on the Actor sheet (cohort, fortification)
     * @param {DragEvent} event
     */
    async _onDrop(event) {
        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable || this.actor.system.soft_locked) {
            return;
        }

        const item = await game.l5r5e.HelpersL5r5e.getDragnDropTargetObject(event);
        if (!item || item.documentName !== "Item" || !["army_cohort", "army_fortification"].includes(item.type)) {
            // actor dual trigger...
            if (item?.documentName !== "Actor") {
                console.warn("L5R5E | AS | Characters items are not allowed", item?.type, item);
            }
            return;
        }

        // Can add the item - Foundry override cause props
        const allowed = Hooks.call("dropActorSheetData", this.actor, this, item);
        if (allowed === false) {
            return;
        }

        let itemData = item.toObject(true);

        // Finally, create the embed
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    /**
     * Handle dropped Actor data on the Actor sheet
     * @param {string}    type  warlord|commander|item
     * @param {DragEvent} event
     */
    async _onDropActors(type, event) {
        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable || this.actor.system.soft_locked) {
            return;
        }

        const droppedActor = await game.l5r5e.HelpersL5r5e.getDragnDropTargetObject(event);
        return this._updateLinkedActorData(type, droppedActor, false);
    }

    /**
     * Remove the linked actor (commander/warlord)
     * @param {Event} event
     * @return {Promise<void>}
     * @private
     */
    async _removeLinkedActor(event) {
        event.preventDefault();
        event.stopPropagation();

        const id = $(event.currentTarget).data("actor-id");
        const type = $(event.currentTarget).data("type");
        if (!id || !type) {
            return;
        }
        return this._removeLinkedActorData(type);
    }

    /**
     * Update actor datas for this army sheet
     * @param {string}     type   commander|warlord
     * @param {ActorL5r5e} actor  actor object
     * @param {boolean}    isInit If it's initialization process
     * @return {Promise<abstract.Document>}
     * @private
     */
    async _updateLinkedActorData(type, actor, isInit = false) {
        if (!actor || actor.documentName !== "Actor" || !actor.isCharacterType) {
            console.warn("L5R5E | AS | Wrong actor type", actor?.type, actor);
            return;
        }

        const actorPath = `${CONFIG.l5r5e.paths.assets}icons/actors/`;
        const actorData = {};
        switch (type) {
            case "commander":
                actorData["system.commander"] = actor.name;
                actorData["system.commander_actor_id"] = actor._id;
                actorData["system.commander_standing.honor"] = actor.system.social.honor;
                actorData["system.commander_standing.glory"] = actor.system.social.glory;
                actorData["system.commander_standing.status"] = actor.system.social.status;

                // Replace the image by commander's image
                if (
                    !isInit &&
                    this.actor.img !== actor.img &&
                    ![`${actorPath}character.svg`, `${actorPath}npc.svg`].includes(actor.img)
                ) {
                    actorData["img"] = actor.img;
                    actorData["prototypeToken.texture.src"] = actor.prototypeToken.texture.src;
                }
                break;

            case "warlord":
                actorData["system.warlord"] = actor.name;
                actorData["system.warlord_actor_id"] = actor._id;
                break;

            default:
                console.warn("L5R5E | AS | Unknown type", type);
                return;
        }
        return this.actor.update(actorData);
    }

    /**
     * Clean ActorId for army sheet
     * @param  {string} type commander|warlord
     * @return {Promise<abstract.Document>}
     * @private
     */
    async _removeLinkedActorData(type) {
        const actorData = {};
        switch (type) {
            case "commander":
                actorData.commander_actor_id = null;
                break;

            case "warlord":
                actorData.warlord_actor_id = null;
                break;

            default:
                console.warn("L5R5E | AS | Unknown type", type);
                return;
        }
        return this.actor.update({ system: actorData });
    }

    /**
     * Add or Subtract Casualties/Panic (+/- buttons)
     * @param {Event} event
     * @private
     */
    async _modifyCasualtiesOrPanic(event) {
        event.preventDefault();
        event.stopPropagation();

        const elmt = $(event.currentTarget);
        const type = elmt.data("type");
        let mod = elmt.data("value");
        if (!mod) {
            return;
        }
        switch (type) {
            case "casualties":
                await this.actor.update({
                    system: {
                        battle_readiness: {
                            casualties_strength: {
                                value: Math.max(0, this.actor.system.battle_readiness.casualties_strength.value + mod),
                            },
                        },
                    },
                });
                break;

            case "panic":
                await this.actor.update({
                    system: {
                        battle_readiness: {
                            panic_discipline: {
                                value: Math.max(0, this.actor.system.battle_readiness.panic_discipline.value + mod),
                            },
                        },
                    },
                });
                break;

            default:
                console.warn("L5R5E | AS | Unsupported type", type);
                break;
        }
    }
}
