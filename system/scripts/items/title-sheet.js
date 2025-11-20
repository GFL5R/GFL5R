import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheet}
 */
export class TitleSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "title"],
            template: CONFIG.l5r5e.paths.templates + "items/title/title-sheet.html",
        });
    }

    /**
     * @return {Object|Promise}
     */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // Prepare OwnedItems
        sheetData.data.embedItemsList = this._prepareEmbedItems(sheetData.data.system.items);

        // Automatically compute the total xp cost (full price) and XP in title (cursus, some halved prices)
        const { xp_used_total, xp_used } = game.l5r5e.HelpersL5r5e.getItemsXpCost(sheetData.data.embedItemsList);
        sheetData.data.system.xp_used_total = xp_used_total;
        sheetData.data.system.xp_used = xp_used;

        return sheetData;
    }

    /**
     * Prepare Embed items
     * @param {[]|Map} itemsMap
     * @return {[]}
     * @private
     */
    _prepareEmbedItems(itemsMap) {
        let itemsList = itemsMap;
        if (itemsMap instanceof Map) {
            itemsList = Array.from(itemsMap).map(([id, item]) => item);
        }

        // Sort by rank desc
        itemsList.sort((a, b) => (b.system.rank || 0) - (a.system.rank || 0));

        return itemsList;
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

        // Check item type and subtype
        let item = await game.l5r5e.HelpersL5r5e.getDragnDropTargetObject(event);
        if (!item || item.documentName !== "Item" || !["technique", "advancement"].includes(item.type)) {
            return;
        }

        const data = item.toObject(false);

        // Check xp for techs
        if (item.type === "technique") {
            data.system.xp_cost = data.system.xp_cost > 0 ? data.system.xp_cost : CONFIG.l5r5e.xp.techniqueCost;
            data.system.xp_used = data.system.xp_cost;
        }

        this.document.addEmbedItem(data);
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

        // *** Sub-Items management ***
        html.find(".item-add").on("click", this._addSubItem.bind(this));
        html.find(`.item-edit`).on("click", this._editSubItem.bind(this));
        html.find(`.item-delete`).on("click", this._deleteSubItem.bind(this));
        html.find(`.item-curriculum`).on("click", this._switchSubItemCurriculum.bind(this));
    }

    /**
     * Display a dialog to choose what Item to add, and add it on this Item
     * @param {Event} event
     * @return {Promise<void>}
     * @private
     */
    async _addSubItem(event) {
        event.preventDefault();
        event.stopPropagation();

        // Show Dialog
        const selectedType = await game.l5r5e.HelpersL5r5e.showSubItemDialog(["advancement", "technique"]);
        if (!selectedType) {
            return;
        }

        // Create the new Item
        const itemId = await this.document.addEmbedItem(
            new game.l5r5e.ItemL5r5e({
                name: game.i18n.localize(`TYPES.Item.${selectedType.toLowerCase()}`),
                type: selectedType,
                img: `${CONFIG.l5r5e.paths.assets}icons/items/${selectedType}.svg`,
            })
        );

        // Get the store object and display it
        const item = this.document.items.get(itemId);
        if (item) {
            item.sheet.render(true);
        }
    }

    /**
     * Toogle the curriculum for this embed item
     * @param {Event} event
     * @return {Promise<void>}
     * @private
     */
    async _switchSubItemCurriculum(event) {
        event.preventDefault();
        event.stopPropagation();

        const itemId = $(event.currentTarget).data("item-id");
        const item = this.document.getEmbedItem(itemId);
        if (!item) {
            return;
        }

        // Switch the state and update
        item.system.in_curriculum = !item.system.in_curriculum;
        return this.document.updateEmbedItem(item);
    }
}
