import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheetL5r5e}
 */
export class ArmyCohortSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "army-cohort"],
            template: CONFIG.l5r5e.paths.templates + "items/army-cohort/army-cohort-sheet.html",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "infos" }],
            dragDrop: [{ dragSelector: ".item", dropSelector: null }],
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
        if (data.leader_actor_id) {
            const actor = game.actors.get(data.leader_actor_id);
            if (actor) {
                this._updateLinkedActorData(actor);
            } else {
                this._removeLinkedActor();
            }
        }
    }

    /**
     * @return {Object|Promise}
     */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // Editors enrichment
        sheetData.data.enrichedHtml.abilities = await foundry.applications.ux.TextEditor.implementation.enrichHTML(sheetData.data.system.abilities, {
            async: true,
        });

        return sheetData;
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
        if (name === "system.abilities" && initialContent) {
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

        // Delete the linked Actor
        html.find(".actor-remove-control").on("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this._removeLinkedActor();
        });
    }

    /**
     * Handle dropped Item data on the Actor sheet (cohort, fortification)
     * @param {DragEvent} event
     */
    async _onDrop(event) {
        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable) {
            return;
        }

        const droppedActor = await game.l5r5e.HelpersL5r5e.getDragnDropTargetObject(event);
        return this._updateLinkedActorData(droppedActor);
    }

    /**
     * Update actor datas for this army sheet
     * @param {ActorL5r5e} actor actor object
     * @return {Promise<abstract.Document>}
     * @private
     */
    async _updateLinkedActorData(actor) {
        if (!actor || actor.documentName !== "Actor" || !actor.isCharacterType) {
            console.warn("L5R5E | Army Cohort | Wrong actor type", actor?.type, actor);
            return;
        }

        return this.object.update({
            img: actor.img,
            system: {
                leader: actor.name,
                leader_actor_id: actor._id,
            },
        });
    }

    /**
     * Remove the linked actor (commander/warlord)
     * @return {Promise<void>}
     * @private
     */
    async _removeLinkedActor() {
        return this.object.update({
            system: {
                leader_actor_id: null,
            },
        });
    }
}
