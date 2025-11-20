import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheet}
 */
export class ItemPatternSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "item-pattern"],
            template: CONFIG.l5r5e.paths.templates + "items/item-pattern/item-pattern-sheet.html",
        });
    }

    /**
     * @return {Object|Promise}
     */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // Linked Property
        sheetData.data.linkedProperty = await this.getLinkedProperty(sheetData);

        return sheetData;
    }

    /**
     * Get the linked property name
     * @param sheetData
     * @return {Promise<null|{name, id}>}
     */
    async getLinkedProperty(sheetData) {
        if (sheetData.data.system.linked_property_id) {
            const linkedProperty = await game.l5r5e.HelpersL5r5e.getObjectGameOrPack({
                id: sheetData.data.system.linked_property_id,
                type: "Item",
            });
            if (linkedProperty) {
                return {
                    id: linkedProperty._id,
                    name: linkedProperty.name,
                };
            }
        }
        return null;
    }

    /**
     * Subscribe to events from the sheet.
     * @param {jQuery} html HTML content of the sheet.
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) {
            return;
        }

        // Delete the linked property
        html.find(`.linked-property-delete`).on("click", this._deleteLinkedProperty.bind(this));
    }

    /**
     * Callback actions which occur when a dragged element is dropped on a target.
     * @param {DragEvent} event       The originating DragEvent
     * @private
     */
    async _onDrop(event) {
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) {
            return;
        }

        // Only property allowed here
        let item = await game.l5r5e.HelpersL5r5e.getDragnDropTargetObject(event);
        if (!item || item.documentName !== "Item" || item.type !== "property") {
            return;
        }

        // Set the new property, and update
        this.document.system.linked_property_id = item.id;
        this.document.update({
            system: {
                linked_property_id: this.document.system.linked_property_id,
            },
        });
    }

    /**
     * Remove the link to a property for the current item
     * @param {Event} event
     * @return {Promise<void>}
     * @private
     */
    async _deleteLinkedProperty(event) {
        event.preventDefault();
        event.stopPropagation();

        let name;
        const linkedProperty = await game.l5r5e.HelpersL5r5e.getObjectGameOrPack({
            id: this.document.system.linked_property_id,
            type: "Item",
        });
        if (linkedProperty) {
            name = linkedProperty.name;
        }

        const callback = async () => {
            this.document.system.linked_property_id = null;
            this.document.update({
                system: {
                    linked_property_id: this.document.system.linked_property_id,
                },
            });
        };

        // Holing Ctrl = without confirm
        if (event.ctrlKey || !name) {
            return callback();
        }

        game.l5r5e.HelpersL5r5e.confirmDeleteDialog(
            game.i18n.format("l5r5e.global.delete_confirm", { name }),
            callback
        );
    }
}
