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
            dragDrop: [
                { dragSelector: ".item-list .item", dropSelector: null },
                { dragSelector: ".discipline-item", dropSelector: ".discipline-drop-zone" },
                { dragSelector: ".ability-item", dropSelector: ".discipline-ability-drop-zone" }
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

        // Split Money
        sheetData.data.system.money = this._zeniToMoney(this.actor.system.zeni);

        // Prepare discipline data
        this._prepareDisciplines(sheetData);

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
            "system.identity.roles",
            game.l5r5e.HelpersL5r5e.getLocalizedRolesList(),
            ","
        );

        // Money +/-
        html.find(".money-control").on("click", this._modifyMoney.bind(this));

        // Discipline management
        html.find(".discipline-edit").on("click", this._editDiscipline.bind(this));
        html.find(".discipline-remove").on("click", this._removeDiscipline.bind(this));
        html.find(".discipline-ability-remove").on("click", this._removeDisciplineAbility.bind(this));
    }

    /**
     * Handle dropping items onto the character sheet
     * @param {Event} event
     * @param {Object} data
     */
    async _onDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const target = event.target.closest('[data-drop-target]');

        if (!target) return;

        const dropTarget = target.dataset.dropTarget;
        const slotKey = target.dataset.slotKey;

        if (dropTarget === 'discipline') {
            await this._onDropDiscipline(data, slotKey);
        } else if (dropTarget === 'discipline-ability') {
            await this._onDropDisciplineAbility(data, slotKey);
        } else {
            // Handle other drops with parent method
            return super._onDrop(event);
        }
    }

    /**
     * Handle dropping a discipline item
     */
    async _onDropDiscipline(data, slotKey) {
        if (data.type !== 'Item' || !data.uuid) return;

        const item = await fromUuid(data.uuid);
        if (!item || item.type !== 'discipline') return;

        // Check if discipline already exists
        const existingDiscipline = this.actor.items.find(i => i.type === 'discipline' && i.name === item.name);
        if (existingDiscipline) {
            ui.notifications.warn("Discipline already assigned to this character.");
            return;
        }

        // Create a copy of the discipline for this character
        const disciplineData = item.toObject();
        disciplineData.system.xp = 0;
        disciplineData.system.rank = 1;

        await this.actor.createEmbeddedDocuments('Item', [disciplineData]);
        ui.notifications.info(`Added discipline: ${item.name}`);
    }

    /**
     * Handle dropping an ability item onto a discipline
     */
    async _onDropDisciplineAbility(data, slotKey) {
        if (data.type !== 'Item' || !data.uuid) return;

        const item = await fromUuid(data.uuid);
        if (!item || item.type !== 'technique') return;

        // Find the discipline for this slot
        const disciplineItems = this.actor.items.filter(i => i.type === 'discipline');
        const slotIndex = parseInt(slotKey.replace('slot', '')) - 1;
        const discipline = disciplineItems[slotIndex];

        if (!discipline) return;

        // Create a copy of the ability linked to this discipline
        const abilityData = item.toObject();
        abilityData.system.discipline_id = discipline.id;

        await this.actor.createEmbeddedDocuments('Item', [abilityData]);
        ui.notifications.info(`Added ability to ${discipline.name}: ${item.name}`);
    }

    /**
     * Edit a discipline
     */
    _editDiscipline(event) {
        event.preventDefault();
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) item.sheet.render(true);
    }

    /**
     * Remove a discipline
     */
    async _removeDiscipline(event) {
        event.preventDefault();
        const slotKey = event.currentTarget.dataset.slotKey;
        const disciplineItems = this.actor.items.filter(i => i.type === 'discipline');
        const slotIndex = parseInt(slotKey.replace('slot', '')) - 1;
        const discipline = disciplineItems[slotIndex];

        if (discipline) {
            await this.actor.deleteEmbeddedDocuments('Item', [discipline.id]);
            ui.notifications.info(`Removed discipline: ${discipline.name}`);
        }
    }

    /**
     * Remove an ability from a discipline
     */
    async _removeDisciplineAbility(event) {
        event.preventDefault();
        const abilityId = event.currentTarget.dataset.abilityId;
        await this.actor.deleteEmbeddedDocuments('Item', [abilityId]);
    }
    }

    /**
     * Prepare discipline data for the sheet
     */
    _prepareDisciplines(sheetData) {
        const disciplines = [];
        let totalDisciplineXp = 0;

        // Get discipline items from actor
        const disciplineItems = sheetData.items.filter(item => item.type === 'discipline');

        // Create slots for up to 5 disciplines
        for (let i = 0; i < 5; i++) {
            const slotKey = `slot${i + 1}`;
            const discipline = disciplineItems[i];

            if (discipline) {
                const rank = discipline.system.rank || 1;
                const xp = discipline.system.xp || 0;
                const xpCostForNextRank = CONFIG.l5r5e.xp.disciplineCostPerRank[rank] || 0;
                const xpToNext = Math.max(0, xpCostForNextRank - xp);
                const xpProgress = xpCostForNextRank > 0 ? (xp / xpCostForNextRank) * 100 : 100;

                // Get abilities associated with this discipline
                const abilities = sheetData.items.filter(item =>
                    item.type === 'technique' &&
                    item.system.discipline_id === discipline.id
                );

                // Get unlocked techniques based on rank
                const unlockedTechniques = this._getUnlockedTechniquesForDiscipline(discipline, rank);

                disciplines.push({
                    slotKey,
                    slotNumber: i + 1,
                    discipline,
                    rank,
                    xp,
                    xpToNext: xpToNext > 0 ? xpToNext : null,
                    xpProgress,
                    abilities,
                    unlockedTechniques
                });

                totalDisciplineXp += xp;
            } else {
                disciplines.push({
                    slotKey,
                    slotNumber: i + 1,
                    discipline: null,
                    rank: 1,
                    xp: 0,
                    xpToNext: null,
                    xpProgress: 0,
                    abilities: [],
                    unlockedTechniques: []
                });
            }
        }

        sheetData.disciplineSlots = disciplines;
        sheetData.disciplines = disciplineItems;

        // Add discipline XP to total spent
        sheetData.data.system.xp_spent = (sheetData.data.system.xp_spent || 0) + totalDisciplineXp;
    }

    /**
     * Get unlocked techniques for a discipline at a given rank
     */
    _getUnlockedTechniquesForDiscipline(discipline, rank) {
        // TODO: Implement technique unlocking based on discipline rank
        // For now, return techniques that have required_rank <= current rank
        return (discipline.system.unlocked_techniques || []).filter(tech => tech.requiredRank <= rank);
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
}
