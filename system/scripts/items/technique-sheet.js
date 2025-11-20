import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheet}
 */
export class TechniqueSheetL5r5e extends ItemSheetL5r5e {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "technique"],
            template: CONFIG.l5r5e.paths.templates + "items/technique/technique-sheet.html",
        });
    }

    /** @override */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // List all available techniques type
        const types = ["core", "school", "title"];
        if (game.settings.get(CONFIG.l5r5e.namespace, "techniques-customs")) {
            types.push("custom");
        }
        sheetData.data.techniquesList = game.l5r5e.HelpersL5r5e.getTechniquesList({ types });

        // Sanitize Difficulty and Skill list
        sheetData.data.system.difficulty = TechniqueSheetL5r5e.formatDifficulty(sheetData.data.system.difficulty);
        sheetData.data.system.skill = TechniqueSheetL5r5e.translateSkillsList(
            TechniqueSheetL5r5e.formatSkillList(sheetData.data.system.skill.split(",")),
            false
        ).join(", ");

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
        // Change the image according to the type if this is already the case
        if (
            formData["system.technique_type"] &&
            formData.img === `${CONFIG.l5r5e.paths.assets}icons/techs/${this.object.system.technique_type}.svg`
        ) {
            formData.img = `${CONFIG.l5r5e.paths.assets}icons/techs/${formData["system.technique_type"]}.svg`;
        }

        // Sanitize Difficulty and Skill list
        formData["system.difficulty"] = TechniqueSheetL5r5e.formatDifficulty(formData["system.difficulty"]);
        formData["system.skill"] = TechniqueSheetL5r5e.formatSkillList(
            TechniqueSheetL5r5e.translateSkillsList(formData["system.skill"].split(","), true)
        ).join(",");

        return super._updateObject(event, formData);
    }

    /**
     * Listen to html elements
     * @param {jQuery} html HTML content of the sheet.
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        // *** Everything below here is only needed if the sheet is editable ***
        if (!this.isEditable) {
            return;
        }

        // Autocomplete
        game.l5r5e.HelpersL5r5e.autocomplete(
            html,
            "system.difficulty",
            [
                "@T:intrigueRank",
                "@T:focus",
                "@T:martialRank",
                "@T:statusRank|max",
                "@T:strife.value|max",
                "@T:vigilance",
                "@T:vigilance|max",
                "@T:vigilance|min",
                "@T:vigilance|max(@T:statusRank)",
            ],
            ","
        );
        game.l5r5e.HelpersL5r5e.autocomplete(
            html,
            "system.skill",
            Object.values(TechniqueSheetL5r5e.getSkillsTranslationMap(false)),
            ","
        );
    }

    /**
     * Sanitize the technique difficulty
     * @param  {string} str
     * @return {string}
     */
    static formatDifficulty(str) {
        if (str && !Number.isNumeric(str) && !CONFIG.l5r5e.regex.techniqueDifficulty.test(str)) {
            return "";
        }
        return str;
    }

    /**
     * Get a flat map for skill translation
     * @param  {boolean} bToSkillId if true flip props/values
     * @return {Object}
     */
    static getSkillsTranslationMap(bToSkillId) {
        return Array.from(CONFIG.l5r5e.skills).reduce((acc, [id, cat]) => {
            if (bToSkillId) {
                acc[game.l5r5e.HelpersL5r5e.normalize(game.i18n.localize(`l5r5e.skills.${cat}.${id}`))] = id;
                acc[game.l5r5e.HelpersL5r5e.normalize(game.i18n.localize(`l5r5e.skills.${cat}.title`))] = cat;
            } else {
                acc[id] = game.i18n.localize(`l5r5e.skills.${cat}.${id}`);
                acc[cat] = game.i18n.localize(`l5r5e.skills.${cat}.title`);
            }
            return acc;
        }, {});
    }

    /**
     * Translate a list of skill and category
     * @param  {string[]}   aIn
     * @param  {boolean} bToSkillId
     * @return {string[]}
     */
    static translateSkillsList(aIn, bToSkillId) {
        const map = TechniqueSheetL5r5e.getSkillsTranslationMap(bToSkillId);
        return aIn.map((skill) => map[game.l5r5e.HelpersL5r5e.normalize(skill)]);
    }

    /**
     * Sanitize the technique skill list
     * @param  {string[]} skillList
     * @return {string[]}
     */
    static formatSkillList(skillList) {
        if (!skillList) {
            return "";
        }
        const categories = game.l5r5e.HelpersL5r5e.getCategoriesSkillsList();

        // List categories
        const unqCatList = new Set();
        skillList.forEach((s) => {
            s = s?.trim();
            if (!!s && categories.has(s)) {
                unqCatList.add(s);
            }
        });

        // List skill (not include in cat)
        const unqSkillList = new Set();
        skillList.forEach((s) => {
            s = s?.trim();
            if (!!s && CONFIG.l5r5e.skills.has(s)) {
                const cat = CONFIG.l5r5e.skills.get(s);
                if (!unqCatList.has(cat)) {
                    unqSkillList.add(s);
                }
            }
        });

        return [...unqCatList, ...unqSkillList];
    }
}
