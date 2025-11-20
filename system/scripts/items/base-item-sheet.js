/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class BaseItemSheetL5r5e extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "item"],
            //template: CONFIG.l5r5e.paths.templates + "items/item/item-sheet.html",
            width: 520,
            height: game.settings.get(CONFIG.l5r5e.namespace, "custom-items-windows-height") || 800,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
        });
    }

    /**
     * Add the SendToChat button on top of sheet
     * @override
     */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();

        // Send To Chat
        buttons.unshift({
            label: game.i18n.localize("l5r5e.global.send_to_chat"),
            class: "send-to-chat",
            icon: "fas fa-comment-dots",
            onclick: () =>
                game.l5r5e.HelpersL5r5e.debounce(
                    "send2chat-" + this.object.id,
                    () => game.l5r5e.HelpersL5r5e.sendToChat(this.object),
                    2000,
                    true
                )(),
        });

        return buttons;
    }

    /**
     * @return {Object|Promise}
     */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        sheetData.data.dtypes = ["String", "Number", "Boolean"];

        // Fix editable
        sheetData.editable = this.isEditable;
        sheetData.options.editable = sheetData.editable;

        // Translate current reference
        const reference = this.item.system.source_reference.source;
        const label_or_reference = CONFIG.l5r5e.sourceReference[reference]?.label ?? reference
        sheetData.data.system.source_reference.source = game.i18n.localize(label_or_reference);

        // Translate list of available references
        const all_referencesSet = game.settings.get(CONFIG.l5r5e.namespace, "all-compendium-references");
        sheetData.source_references = [...all_referencesSet].map((reference) => {
            const label_or_reference = CONFIG.l5r5e.sourceReference[reference]?.label ?? reference
            return game.i18n.localize(label_or_reference)
        })

        return sheetData;
    }

    /**
     * This method is called upon form submission after form data is validated
     * @param   {Event}  event    The initial triggering submission event
     * @param   {Object} formData The object of validated form data with which to update the object
     * @returns {Promise}         A Promise which resolves once the update operation has completed
     * @override
     */
    async _updateObject(event, formData) {
        // If we have an official source then store the id instead
        if(event.type == 'submit' || event.currentTarget?.name === "system.source_reference.source") {
            Object.entries(CONFIG.l5r5e.sourceReference).forEach(([id, value]) => {
                if(game.i18n.localize(value.label) === formData["system.source_reference.source"]) {
                    formData["system.source_reference.source"] = id;
                }
            });
        }

        return super._updateObject(event,formData);
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
        if (name === "system.description" && initialContent) {
            initialContent = game.l5r5e.HelpersL5r5e.convertSymbols(initialContent, false);
        }
        return super.activateEditor(name, options, initialContent);
    }

    /**
     * Subscribe to events from the sheet.
     * @param {jQuery} html HTML content of the sheet.
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Commons
        game.l5r5e.HelpersL5r5e.commonListeners(html, this.actor);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) {
            return;
        }

        // On focus on one numeric element, select all text for better experience
        html.find(".select-on-focus").on("focus", (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.target.select();
        });
    }

    /**
     * Add a embed item
     * @param {Event} event
     * @private
     */
    _addSubItem(event) {
        event.preventDefault();
        event.stopPropagation();
        const itemId = $(event.currentTarget).data("item-id");
        console.warn("L5R5E | BIS | TODO ItemSheetL5r5e._addSubItem()", itemId); // TODO _addSubItem Currently not used, title override it
    }

    /**
     * Add a embed item
     * @param {Event} event
     * @private
     */
    _editSubItem(event) {
        event.preventDefault();
        event.stopPropagation();
        const itemId = $(event.currentTarget).data("item-id");
        const item = this.document.items.get(itemId);
        if (item) {
            item.sheet.render(true);
        }
    }

    /**
     * Delete a embed item
     * @param {Event} event
     * @private
     */
    _deleteSubItem(event) {
        event.preventDefault();
        event.stopPropagation();
        const itemId = $(event.currentTarget).data("item-id");
        const item = this.document.getEmbedItem(itemId);
        if (!item) {
            return;
        }

        const callback = async () => {
            this.document.deleteEmbedItem(itemId);
        };

        // Holing Ctrl = without confirm
        if (event.ctrlKey) {
            return callback();
        }

        game.l5r5e.HelpersL5r5e.confirmDeleteDialog(
            game.i18n.format("l5r5e.global.delete_confirm", { name: item.name }),
            callback
        );
    }
}
