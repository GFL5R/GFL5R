/**
 * Base Sheet for Actor and Npc
 */
export class BaseSheetL5r5e extends foundry.appv1.sheets.ActorSheet {
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

    /**
     * Add buttons to L5R specific bar
     * @return {{label: string, class: string, icon: string, onclick: Function|null}[]}
     */
    _getL5rHeaderButtons() {
        /**
         * @var {{label: string, class: string, icon: string, onclick: Function|null}[]}
         */
        const buttons = [];

        if (this.isEditable && !this.actor.limited) {
            // Lock/Unlock
            buttons.unshift({
                label: `l5r5e.global.${this.actor.system.soft_locked ? "" : "un"}locked`,
                class: "l5r-softlock",
                icon: this.actor.system.soft_locked ? "fas fa-lock" : "fas fa-unlock",
                onclick: () =>
                    game.l5r5e.HelpersL5r5e.debounce(
                        "lock-" + this.object.id,
                        () => {
                            this.actor.update({
                                system: {
                                    soft_locked: !this.actor.system.soft_locked,
                                },
                            });
                        },
                        500,
                        true
                    )(),
            });
        }

        // Send To Chat
        buttons.unshift({
            label: "l5r5e.global.send_to_chat",
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

    /** @inheritdoc */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // System Header Buttons
        sheetData.l5rHeaderButtons = this._getL5rHeaderButtons();

        sheetData.data.dtypes = ["String", "Number", "Boolean"];

        // Sort Items by name
        sheetData.items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        // Editors enrichment
        sheetData.data.enrichedHtml = {
            description: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sheetData.data.system.description, { async: true }),
            notes: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sheetData.data.system.notes, { async: true }),
        };

        // Shortcut for some tests
        sheetData.data.editable_not_soft_locked = sheetData.editable && !sheetData.data.system.soft_locked;

        return sheetData;
    }

    /**
     * Return a light sheet if in "limited" state
     * @override
     */
    get template() {
        if (!game.user.isGM && this.actor.limited) {
            return `${CONFIG.l5r5e.paths.templates}actors/limited-sheet.html`;
        }
        return this.options.template;
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
        if (["system.notes", "system.description"].includes(name) && initialContent) {
            initialContent = game.l5r5e.HelpersL5r5e.convertSymbols(initialContent, false);
        }
        return super.activateEditor(name, options, initialContent);
    }

    /**
     * This method is called upon form submission after form data is validated
     * @param event {Event}       The initial triggering submission event
     * @param formData {Object}   The object of validated form data with which to update the object
     * @returns {Promise}         A Promise which resolves once the update operation has completed
     * @override
     */
    async _updateObject(event, formData) {
        // Remove autocomplete list name/index if exist
        if (formData["autoCompleteListName"] || formData["autoCompleteListSelectedIndex"]) {
            delete formData["autoCompleteListName"];
            delete formData["autoCompleteListSelectedIndex"];
        }
        return super._updateObject(event, formData);
    }

    /**
     * Subscribe to events from the sheet.
     * @param {jQuery} html HTML content of the sheet.
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Commons
        game.l5r5e.HelpersL5r5e.commonListeners(html, this.actor);

        // System Header Buttons
        const l5rHeaderButtons = this._getL5rHeaderButtons();
        html.find(".l5r-header-button").click((event) => {
            event.preventDefault();
            const button = l5rHeaderButtons.find((b) => event.currentTarget.classList.contains(b.class));
            button.onclick(event);
        });

        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable) {
            return;
        }

        // On focus on one numeric element, select all text for better experience
        html.find(".select-on-focus").on("focus", (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.target.select();
        });

        // *** Items : add, edit, delete ***
        html.find(".item-add").on("click", this._addSubItem.bind(this));
        html.find(`.item-edit`).on("click", this._editSubItem.bind(this));
        html.find(`.item-delete`).on("click", this._deleteSubItem.bind(this));
    }

    /**
     * Add a generic item with sub type
     * @param {string}      type           Item sub type (armor, weapon, bond...)
     * @return {Promise<void>}
     * @private
     */
    async _createSubItem({ type }) {
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

        item.sheet.render(true);
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

        return this._createSubItem({ type });
    }

    /**
     * Edit a generic item with sub type
     * @param {Event} event
     * @private
     */
    _editSubItem(event) {
        event.preventDefault();
        event.stopPropagation();

        game.l5r5e.HelpersL5r5e.getEmbedItemByEvent(event, this.actor).then((item) => {
            if (item) {
                item.sheet.render(true);
            }
        });
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

        const callback = async () => {
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
}
