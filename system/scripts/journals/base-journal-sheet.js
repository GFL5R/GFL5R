/**
 * Base JournalSheet for L5R5e
 * @extends {JournalSheet}
 */
export class BaseJournalSheetL5r5e extends foundry.appv1.sheets.JournalSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "journal-sheet", "journal-entry", "l5r5e", "sheet", "journal"], // sheet journal-sheet journal-entry
            // template: CONFIG.l5r5e.paths.templates + "journal/journal-sheet.html",
            // width: 520,
            // height: 480,
            // tabs: [{ navSelector: ".journal-tabs", contentSelector: ".journal-body", initial: "description" }],
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
     * Activate a named TinyMCE text editor
     * @param {string} name             The named data field which the editor modifies.
     * @param {object} options          TinyMCE initialization options passed to TextEditor.create
     * @param {string} initialContent   Initial text content for the editor area.
     * @override
     */
    activateEditor(name, options = {}, initialContent = "") {
        // For Compatibility with old compendium modules (PRE l5r v1.7.2)
        if (initialContent) {
            initialContent = game.l5r5e.HelpersL5r5e.convertSymbols(initialContent, false);
        }
        return super.activateEditor(name, options, initialContent);
    }

    /**
     * Activate listeners after page content has been injected.
     * @protected
     */
    _activatePageListeners() {
        super._activatePageListeners();
        const html = this.element;

        // Commons
        game.l5r5e.HelpersL5r5e.commonListeners(html);

        // *** Everything below here is only needed if the sheet is editable ***
        // if (!this.isEditable) {
        //     return;
        // }
    }
}
