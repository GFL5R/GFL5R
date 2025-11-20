import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheet}
 */
export class WeaponSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "weapon"],
            template: CONFIG.l5r5e.paths.templates + "items/weapon/weapon-sheet.html",
        });
    }

    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // Martial skills only
        sheetData.data.skills = Array.from(CONFIG.l5r5e.skills)
            .filter(([id, cat]) => cat === "martial")
            .map(([id, cat]) => ({
                id,
                label: "l5r5e.skills." + cat.toLowerCase() + "." + id.toLowerCase(),
            }));

        return sheetData;
    }
}
