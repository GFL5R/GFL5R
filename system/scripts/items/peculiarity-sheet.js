import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * Commun class for Advantages / Disadvantages types
 * @extends {ItemSheet}
 */
export class PeculiaritySheetL5r5e extends ItemSheetL5r5e {
    /**
     * Sub Types of Advantage/Disadvantage
     */
    static types = ["distinction", "passion", "adversity", "anxiety"];

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "peculiarity"],
            template: CONFIG.l5r5e.paths.templates + "items/peculiarity/peculiarity-sheet.html",
        });
    }

    async getData(options = {}) {
        const sheetData = await super.getData(options);

        sheetData.data.subTypesList = PeculiaritySheetL5r5e.types.map((e) => ({
            id: e,
            label: game.i18n.localize("l5r5e.peculiarities.types." + e),
        }));

        return sheetData;
    }
}
