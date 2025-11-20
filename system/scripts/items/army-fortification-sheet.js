import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheetL5r5e}
 */
export class ArmyFortificationSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "army-fortification"],
            template: CONFIG.l5r5e.paths.templates + "items/army-fortification/army-fortification-sheet.html",
        });
    }
}
