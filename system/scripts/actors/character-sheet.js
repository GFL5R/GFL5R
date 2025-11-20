import { BaseCharacterSheetL5r5e } from "./base-character-sheet.js";
import { TwentyQuestionsDialog } from "./twenty-questions-dialog.js";

/**
 * Actor / Character Sheet
 */
export class CharacterSheetL5r5e extends BaseCharacterSheetL5r5e {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["l5r5e", "sheet", "actor"],
            template: CONFIG.l5r5e.paths.templates + "actors/character-sheet.html",
            tabs: [
                { navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" },
                { navSelector: ".advancements-tabs", contentSelector: ".advancements-body", initial: "last" },
            ],
        });
    }

    /**
     * Add the TwentyQuestions button in L5R specific bar
     * @override
     * @return {{label: string, class: string, icon: string, onclick: Function|null}[]}
     */
    _getL5rHeaderButtons() {
        const buttons = super._getL5rHeaderButtons();
        if (!this.isEditable || this.actor.limited) {
            return buttons;
        }

        buttons.unshift({
            label: game.i18n.localize("l5r5e.twenty_questions.bt_abrev"),
            class: "twenty-questions",
            icon: "fas fa-graduation-cap",
            onclick: async () => {
                await new TwentyQuestionsDialog(this.actor).render(true);
            },
        });
        return buttons;
    }

    /**
     * Commons datas
     */
    async getData(options = {}) {
        const sheetData = await super.getData(options);

        // Min rank = 1
        this.actor.system.identity.school_rank = Math.max(1, this.actor.system.identity.school_rank);

        // Split Money
        sheetData.data.system.money = this._zeniToMoney(this.actor.system.zeni);

        // Split school advancements by rank, and calculate xp spent and add it to total
        this._prepareSchoolAdvancement(sheetData);

        // Split Others advancements, and calculate xp spent and add it to total
        this._prepareOthersAdvancement(sheetData);

        // Total
        sheetData.data.system.xp_saved = Math.floor(
            parseInt(sheetData.data.system.xp_total) - parseInt(sheetData.data.system.xp_spent)
        );

        return sheetData;
    }

    /**
     * Subscribe to events from the sheet.
     * @param {jQuery} html HTML content of the sheet.
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
            "system.identity.clan",
            game.l5r5e.HelpersL5r5e.getLocalizedClansList()
        );
        game.l5r5e.HelpersL5r5e.autocomplete(
            html,
            "system.identity.family",
            CONFIG.l5r5e.families.get(
                Object.entries(game.l5r5e.HelpersL5r5e.getLocalizedRawObject("l5r5e.clans")).find(
                    ([k, v]) => v === this.actor.system.identity.clan
                )?.[0]
            )
        );
        game.l5r5e.HelpersL5r5e.autocomplete(
            html,
            "system.identity.school",
            game.l5r5e.HelpersL5r5e.getSchoolsList(),
            ","
        );
        game.l5r5e.HelpersL5r5e.autocomplete(
            html,
            "system.identity.roles",
            game.l5r5e.HelpersL5r5e.getLocalizedRolesList(),
            ","
        );

        // Open linked school curriculum journal
        html.find(".school-journal-link").on("click", this._openLinkedJournal.bind(this));

        // Curriculum management
        html.find(".item-curriculum").on("click", this._switchSubItemCurriculum.bind(this));
        html.find("button[name=validate-curriculum]").on("click", this._actorAddOneToRank.bind(this));

        // Money +/-
        html.find(".money-control").on("click", this._modifyMoney.bind(this));

        // Advancements Tab to current rank onload
        // TODO class "Active" Bug on load, dunno why :/
        this._tabs
            .find((e) => e._navSelector === ".advancements-tabs")
            .activate("advancement_rank_" + (this.actor.system.identity.school_rank || 0));
    }

    /**
     * Split the school advancement, calculate the total xp spent and the current total xp spent by rank
     */
    _prepareSchoolAdvancement(sheetData) {
        const adv = [];
        sheetData.data.system.xp_spent = 0;
        sheetData.items
            .filter((item) => ["peculiarity", "technique", "advancement"].includes(item.type))
            .forEach((item) => {
                const { xp_used_total, xp_used } = game.l5r5e.HelpersL5r5e.getItemsXpCost(item);
                sheetData.data.system.xp_spent += xp_used_total;

                const rank = Math.max(0, item.system.bought_at_rank);
                if (!adv[rank]) {
                    adv[rank] = {
                        rank: rank,
                        spent: {
                            total: 0,
                            curriculum: 0,
                        },
                        goal: CONFIG.l5r5e.xp.costPerRank[rank] || null,
                        list: [],
                    };
                }
                adv[rank].list.push(item);
                adv[rank].spent.total += xp_used_total;
                adv[rank].spent.curriculum += xp_used;
            });
        sheetData.data.advancementsListByRank = adv;
    }

    /**
     * Prepare Bonds, Item Pattern, Signature Scroll and get xp spend
     */
    _prepareOthersAdvancement(sheetData) {
        // Split OthersAdvancement from items
        sheetData.data.advancementsOthers = sheetData.items.filter((item) =>
            ["bond", "item_pattern", "title", "signature_scroll"].includes(item.type)
        );

        // Sort by rank desc
        sheetData.data.advancementsOthers.sort((a, b) => (b.system.rank || 0) - (a.system.rank || 0));

        // Total xp spent in curriculum & total
        sheetData.data.advancementsOthersTotalXp = sheetData.data.advancementsOthers.reduce(
            (acc, item) => acc + parseInt(item.system.xp_used_total || item.system.xp_used || 0),
            0
        );

        // Update the total spent
        sheetData.data.system.xp_spent += sheetData.data.advancementsOthersTotalXp;
    }

    /**
     * Update the actor.
     * @param event
     * @param formData
     */
    _updateObject(event, formData) {
        // Clan tag trim if autocomplete in school name
        if (
            formData["autoCompleteListName"] === "system.identity.school" &&
            formData["autoCompleteListSelectedIndex"] >= 0 &&
            !!formData["system.identity.clan"] &&
            formData["system.identity.school"].indexOf(` [${formData["system.identity.clan"]}]`) !== -1
        ) {
            formData["system.identity.school"] = formData["system.identity.school"].replace(
                ` [${formData["system.identity.clan"]}]`,
                ""
            );
        }

        // Store money in Zeni
        if (formData["system.money.koku"] || formData["system.money.bu"] || formData["system.money.zeni"]) {
            formData["system.zeni"] = this._moneyToZeni(
                formData["system.money.koku"] || 0,
                formData["system.money.bu"] || 0,
                formData["system.money.zeni"] || 0
            );
            // Remove fake money object
            delete formData["system.money.koku"];
            delete formData["system.money.bu"];
            delete formData["system.money.zeni"];
        }

        // Save computed values
        const currentData = this.object.system;
        formData["system.focus"] = currentData.focus;
        formData["system.vigilance"] = currentData.vigilance;
        formData["system.endurance"] = currentData.endurance;
        formData["system.composure"] = currentData.composure;
        formData["system.fatigue.max"] = currentData.fatigue.max;
        formData["system.strife.max"] = currentData.strife.max;
        formData["system.void_points.max"] = currentData.void_points.max;

        return super._updateObject(event, formData);
    }

    /**
     * Convert a sum in Zeni to Zeni, Bu and Koku
     * @param {number} zeni
     * @return {{bu: number, koku: number, zeni: number}}
     * @private
     */
    _zeniToMoney(zeni) {
        const money = {
            koku: 0,
            bu: 0,
            zeni: zeni,
        };

        if (money.zeni >= CONFIG.l5r5e.money[0]) {
            money.koku = Math.floor(money.zeni / CONFIG.l5r5e.money[0]);
            money.zeni = Math.floor(money.zeni % CONFIG.l5r5e.money[0]);
        }
        if (money.zeni >= CONFIG.l5r5e.money[1]) {
            money.bu = Math.floor(money.zeni / CONFIG.l5r5e.money[1]);
            money.zeni = Math.floor(money.zeni % CONFIG.l5r5e.money[1]);
        }

        return money;
    }

    /**
     * Convert a sum in Zeni, Bu and Koku to Zeni
     * @param {number} koku
     * @param {number} bu
     * @param {number} zeni
     * @return {number}
     * @private
     */
    _moneyToZeni(koku, bu, zeni) {
        return Math.floor(koku * CONFIG.l5r5e.money[0]) + Math.floor(bu * CONFIG.l5r5e.money[1]) + Math.floor(zeni);
    }

    /**
     * Add or Subtract money (+/- buttons)
     * @param {Event} event
     * @private
     */
    _modifyMoney(event) {
        event.preventDefault();
        event.stopPropagation();

        const elmt = $(event.currentTarget);
        const type = elmt.data("type");
        let mod = elmt.data("value");
        if (!mod || !type) {
            return;
        }

        if (type !== "zeni") {
            mod = Math.floor(mod * CONFIG.l5r5e.money[type === "koku" ? 0 : 1]);
        }

        this.actor.system.zeni = +this.actor.system.zeni + mod;
        this.actor.update({
            system: {
                zeni: this.actor.system.zeni,
            },
        });
        this.render(false);
    }

    /**
     * Add +1 to actor school rank
     * @param {Event} event
     * @private
     */
    async _actorAddOneToRank(event) {
        event.preventDefault();
        event.stopPropagation();

        this.actor.system.identity.school_rank = this.actor.system.identity.school_rank + 1;
        await this.actor.update({
            system: {
                identity: {
                    school_rank: this.actor.system.identity.school_rank,
                },
            },
        });
        this.render(false);
    }

    /**
     * Open the linked school curriculum journal
     * @param {Event} event
     * @private
     */
    async _openLinkedJournal(event) {
        event.preventDefault();
        event.stopPropagation();

        const actorJournal = this.actor.system.identity.school_curriculum_journal;
        if (!actorJournal.id) {
            return;
        }

        const journal = await game.l5r5e.HelpersL5r5e.getObjectGameOrPack({
            id: actorJournal.id,
            pack: actorJournal.pack,
            type: "JournalEntry",
        });
        if (journal) {
            journal.sheet.render(true);
        }
    }
}
