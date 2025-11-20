import { ItemSheetL5r5e } from "./item-sheet.js";

/**
 * @extends {ItemSheet}
 */
export class AdvancementSheetL5r5e extends ItemSheetL5r5e {
    /**
     * Sub Types of advancements
     */
    static types = [
        { id: "approach", label: "l5r5e.approaches.label" },
        { id: "skill", label: "l5r5e.skills.label" },
        // others have theirs own xp count
    ];

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "advancement"],
            template: CONFIG.l5r5e.paths.templates + "items/advancement/advancement-sheet.html",
        });
    }

    async getData(options = {}) {
        const sheetData = await super.getData(options);

        sheetData.data.subTypesList = AdvancementSheetL5r5e.types;
        sheetData.data.skillsList = game.l5r5e.HelpersL5r5e.getSkillsList(true);

        return sheetData;
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

        // const currentType = this.object.system.advancement_type;
        const currentApproach = this.object.system.approach;
        const currentSkill = this.object.system.skill;

        html.find("#advancement_type").on("change", (event) => {
            const targetEvt = $(event.target);
            targetEvt.prop("disabled", true);

            if (targetEvt.val() === "skill") {
                this._updateChoice({ ring: currentRing }, { skill: currentSkill }).then(
                    targetEvt.prop("disabled", false)
                );
            } else if (targetEvt.val() === "ring") {
                this._updateChoice({ skill: currentSkill }, { ring: currentRing }).then(
                    targetEvt.prop("disabled", false)
                );
            }
        });

        html.find("#advancement_ring").on("change", (event) => {
            const targetEvt = $(event.target);
            targetEvt.prop("disabled", true);
            this._updateChoice({ ring: currentRing }, { ring: targetEvt.val() }).then(
                targetEvt.prop("disabled", false)
            );
        });

        html.find("#advancement_skill").on("change", (event) => {
            const targetEvt = $(event.target);
            targetEvt.prop("disabled", true);
            this._updateChoice({ skill: currentSkill }, { skill: targetEvt.val() }).then(
                targetEvt.prop("disabled", false)
            );
        });
    }

    /**
     * Update Actor and Object to the current choice
     * @private
     */
    async _updateChoice(oldChoice, newChoice) {
        let xp_used = this.object.system.xp_used;
        let name = this.object.name;
        let img = this.object.img;

        // Modify image to reflect choice
        if (newChoice.approach) {
            name = game.i18n.localize(`l5r5e.approaches.${newChoice.approach}`) + "+1";
            img = `systems/l5r5e/assets/icons/approaches/${newChoice.approach}.svg`;
        } else if (newChoice.skill) {
            name =
                game.i18n.localize(`l5r5e.skills.${CONFIG.l5r5e.skills.get(newChoice.skill)}.${newChoice.skill}`) +
                "+1";
            img = `systems/l5r5e/assets/dices/default/skill_blank.svg`;
        }

        // Object embed in actor ?
        const actor = this.document.actor;
        if (actor) {
            const actorData = foundry.utils.duplicate(actor.system);
            let skillCatId = null;

            // Old choices
            if (oldChoice.approach) {
                actorData.approaches[oldChoice.approach] = Math.max(1, actorData.approaches[oldChoice.approach] - 1);
            }
            if (oldChoice.skill) {
                skillCatId = CONFIG.l5r5e.skills.get(oldChoice.skill);
                actorData.skills[skillCatId][oldChoice.skill] = Math.max(
                    0,
                    actorData.skills[skillCatId][oldChoice.skill] - 1
                );
            }

            // new choices
            if (newChoice.approach) {
                actorData.approaches[newChoice.approach] = actorData.approaches[newChoice.approach] + 1;
                xp_used = actorData.approaches[newChoice.approach] * CONFIG.l5r5e.xp.ringCostMultiplier;
                name =
                    game.i18n.localize(`l5r5e.approaches.${newChoice.approach}`) +
                    ` +1 (${actorData.approaches[newChoice.approach] - 1} -> ${actorData.approaches[newChoice.approach]})`;
            }
            if (newChoice.skill) {
                skillCatId = CONFIG.l5r5e.skills.get(newChoice.skill);
                actorData.skills[skillCatId][newChoice.skill] = actorData.skills[skillCatId][newChoice.skill] + 1;
                xp_used = actorData.skills[skillCatId][newChoice.skill] * CONFIG.l5r5e.xp.skillCostMultiplier;
                name =
                    game.i18n.localize(`l5r5e.skills.${skillCatId}.${newChoice.skill}`) +
                    ` +1 (${actorData.skills[skillCatId][newChoice.skill] - 1} -> ${
                        actorData.skills[skillCatId][newChoice.skill]
                    })`;
            }

            // Update Actor
            await actor.update({
                system: foundry.utils.diffObject(actor.system, actorData),
            });
        }

        // Update object
        await this.object.update({
            name: name,
            img: img,
            system: {
                xp_used: xp_used,
            },
        });
    }
}
