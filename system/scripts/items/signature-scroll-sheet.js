import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheet}
 */
export class SignatureScrollSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "signature-scroll"],
            template: CONFIG.l5r5e.paths.templates + "items/signature-scroll/signature-scroll-sheet.html",
        });
    }
}
