/**
 * L5R Dice picker dialog
 * @extends {FormApplication}
 */
export class DicePickerDialog extends FormApplication {
    /**
     * Current Actor
     * @type {ActorL5r5e}
     * @private
     */
    _actor = null;

    /**
     * Current used Item (Technique, Weapon)
     * @type {ItemL5r5e}
     * @private
     */
    _item = null;

    /**
     * Current Target (Token)
     * @type {TokenDocument}
     * @private
     */
    _target = null;

    /**
     * If GM or Constructor set to hidden, lock the player choice, so he cannot look the TN
     * @type {{gm: boolean, option: boolean}}
     * @private
     */
    _difficultyHiddenIsLock = {
        gm: false,
        option: false,
    };

    /**
     * Payload Object
     */
    object = {
        ring: {
            id: "void",
            value: 1,
        },
        skill: {
            id: "",
            value: 0,
            defaultValue: 0,
            cat: "",
            list: [],
            name: "",
            assistance: 0,
        },
        difficulty: {
            value: 2,
            hidden: false,
            addVoidPoint: false,
        },
        useVoidPoint: false,
        isInitiativeRoll: false,
    };

    /**
     * Assign the default options
     * @override
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "l5r5e-dice-picker-dialog",
            classes: ["l5r5e", "dice-picker-dialog"],
            template: CONFIG.l5r5e.paths.templates + "dice/dice-picker-dialog.html",
            title: game.i18n.localize("l5r5e.dice.dicepicker.title"),
            actor: null,
            approachId: null,
            skillId: "",
            difficulty: 2,
            difficultyHidden: false,
        });
    }

    /**
     * Define a unique and dynamic element ID for the rendered application
     */
    get id() {
        return `l5r5e-dice-picker-dialog-${this._actor?.id ?? "no-actor"}`;
    }

    /**
     * Add a create macro button on top of sheet
     * @override
     */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();

        buttons.unshift({
            label: game.i18n.localize("l5r5e.dice.dicepicker.bt_add_macro"),
            class: "bt-add-macro",
            icon: "fas fa-star",
            onclick: async () => {
                await this._createMacro();
            },
        });

        return buttons;
    }

    /**
     * Create dialog
     *
     * ex: new game.l5r5e.DicePickerDialog({skillId: 'aesthetics', approachId: 'swiftness', actor: game.user.character}).render(true);
     *
     * Options :
     *   actor             {Actor}         Any `Actor` object instance. Ex : `game.user.character`, `canvas.tokens.controlled[0].actor`
     *   actorId           {string}        This is the `id` not the `uuid` of an actor. Ex : "AbYgKrNwWeAxa9jT"
     *   actorName         {string}        Careful this is case-sensitive. Ex : "Isawa Aki"
     *   difficulty        {number}        `1` to `9`
     *   difficultyHidden  {boolean}       If `true`, hide the difficulty and lock the view for the player.
     *   isInitiativeRoll  {boolean}       `true` if this is an initiative roll
     *   item              {Item}          The object of technique or weapon used for this roll.
     *   itemUuid          {string}        The `uuid` of technique or weapon used for this roll. Can be anything retrieved by `fromUuid()` or `fromUuidSync()`
     *   approachId        {string}        If not provided, take the current stance of the actor if any. Ex : "power", "swiftness"
     *   skillId           {string}        Skill `id`. Ex : "design", "aesthetics", "courtesy"
     *   skillCatId        {string}        Skill category `id`. Ex : "artisan", "scholar"
     *   skillsList        {string[]}      `skillId`/`skillCatId` list coma separated. Allow the player to select the skill used in a select. Ex : "artisan,design"
     *   target            {TokenDocument} The targeted Token
     *
     * @param options actor, actorId, actorName, difficulty, difficultyHidden, isInitiativeRoll, item, itemUuid, approachId, skillId, skillCatId, skillsList, target
     */
    constructor(options = {}) {
        super({}, options);

        // Try to get Actor from: options, first selected token or player's selected character
        [
            options?.actor,
            game.actors.get(options?.actorId),
            game.actors.getName(options?.actorName),
            canvas.tokens.controlled[0]?.actor,
            game.user.character,
        ].forEach((actor) => {
            if (!this._actor) {
                this.actor = actor;
            }
        });

        // Approach
        if (options.approachId) {
            this.approachId = options.approachId;
        }

        // SkillList
        if (options.skillsList) {
            this.skillList = options.skillsList;
        }

        // Skill
        if (options.skillId) {
            this.skillId = options.skillId;
        }

        // SkillCategory skillCatId
        if (options.skillCatId) {
            this.skillCatId = options.skillCatId;
        }

        // Target Infos
        if (options.target) {
            this.target = options.target;
        }
        if (!this._target) {
            // Get the 1st selected target
            const targetToken = Array.from(game.user.targets).values().next()?.value?.document;
            if (targetToken) {
                this.target = targetToken;
            }
        }

        // Difficulty
        if (!options.difficulty || !this.parseDifficulty(options.difficulty)) {
            this.difficulty = game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-value");
        }

        // DifficultyHidden
        if (options.difficultyHidden) {
            this._difficultyHiddenIsLock.option = true;
        }
        this.difficultyHidden = !!options.difficultyHidden;

        // InitiativeRoll
        this.object.isInitiativeRoll = !!options.isInitiativeRoll;

        // Item (weapon/technique)
        if (options.item) {
            this.item = options.item;
        } else if (options.itemUuid) {
            this.item = fromUuidSync(options.itemUuid);
        }
    }

    /**
     * Refresh data (used from socket)
     */
    async refresh() {
        if (this._difficultyHiddenIsLock.option) {
            this.difficulty = game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-value");
            this.difficultyHidden = false;
        }
        this.render(false);
    }

    /**
     * Set actor
     * @param {ActorL5r5e} actor
     */
    set actor(actor) {
        if (!actor) {
            return;
        }
        if (!(actor instanceof Actor) || !actor.isOwner) {
            console.warn("L5R5E | DP | Actor rejected : Not a valid Actor instance or permission was denied", actor);
            return;
        }
        this._actor = actor;
        this.approachId = this._actor.system.stance;
    }

    /**
     * Set used item
     * @param {ItemL5r5e} item
     */
    set item(item) {
        if (!item) {
            return;
        }
        if (!(item instanceof Item) || !item.isOwner) {
            console.warn("L5R5E | DP | Item rejected : Not a valid Item instance or permission was denied", item);
            return;
        }
        this._item = item;
    }

    /**
     * Set Target Infos object
     * @param {TokenDocument} targetToken
     */
    set target(targetToken) {
        if (!targetToken) {
            return;
        }
        if (!(targetToken instanceof TokenDocument)) {
            console.warn("L5R5E | DP | target rejected : Not a valid TokenDocument instance", targetToken);
            return;
        }
        this._target = targetToken;
    }

    /**
     * Set approach preset
     * @param approachId
     */
    set approachId(approachId) {
        this.object.approach.id = CONFIG.l5r5e.stances.includes(approachId) ? approachId : "fortune";
        this.object.approach.value = this._actor.system.approaches?.[this.object.approach.id] || 1;
    }

    /**
     * Set the list of allowed skill to choose.
     * Coma separated, can be a category names or skill names.
     * @param {string} skillsList
     */
    set skillList(skillsList) {
        if (!skillsList) {
            return;
        }
        this.object.skill.list = this.parseSkillsList(skillsList);
        if (this.object.skill.list.length > 0) {
            // Set 1st skill
            if (this.useCategory) {
                this.skillCatId = this.object.skill.list[0].id;
            } else {
                this.skillId = this.object.skill.list[0].id;
            }
            // Remove the list if only one item
            if (this.object.skill.list.length === 1) {
                this.object.skill.list = null;
            }
        }
    }

    /**
     * Set and load skill's required data from actor and skillId
     * @param skillId
     */
    set skillId(skillId) {
        if (!skillId) {
            return;
        }

        this.object.skill = {
            ...this.object.skill,
            id: skillId.toLowerCase().trim(),
            value: 0,
            cat: "",
            name: "",
        };

        this.skillCatId = CONFIG.l5r5e.skills.get(skillId);
    }

    /**
     * Set and load skill's required data from actor and skillCatId
     * @param skillCatId
     */
    set skillCatId(skillCatId) {
        if (!skillCatId) {
            return;
        }

        this.object.skill = {
            ...this.object.skill,
            value: 0,
            cat: skillCatId.toLowerCase().trim(),
            name: game.i18n.localize("l5r5e.skills." + skillCatId + "." + (this.object.skill.id || "title")),
        };

        if (!this._actor) {
            return;
        }
        switch (this._actor.type) {
            case "character":
                this.object.skill.value = this._actor.system.skills[skillCatId]?.[this.object.skill.id] || 0;
                this.object.skill.defaultValue = this.object.skill.value;
                break;

            case "npc":
                // Skill value is in categories for npc
                this.object.skill.value = this._actor.system.skills[skillCatId] || 0;
                this.object.skill.defaultValue = this.object.skill.value;
                break;
        }
    }

    /**
     * Set Difficulty level (default 2)
     * @param difficulty
     */
    set difficulty(difficulty) {
        if (this._difficultyHiddenIsLock.option) {
            return;
        }
        difficulty = parseInt(difficulty);
        if (isNaN(difficulty) || difficulty < 0) {
            difficulty = 2;
        }
        this.object.difficulty.value = difficulty;
    }

    /**
     * Set if Difficulty is Hidden or not (default)
     * @param isHidden
     */
    set difficultyHidden(isHidden) {
        // If GM hide, then player choice don't matter
        this._difficultyHiddenIsLock.gm = game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-hidden");
        if (this._difficultyHiddenIsLock.gm || this._difficultyHiddenIsLock.option) {
            isHidden = true;
        }
        this.object.difficulty.hidden = !!isHidden;
        this.object.difficulty.addVoidPoint = this.object.difficulty.hidden;
        this._updateVoidPointUsage();
    }

    /**
     * Add the Entity name into the window title
     * @type {String}
     */
    get title() {
        return game.i18n.localize("l5r5e.dice.dicepicker.title") + (this._actor ? " - " + this._actor.name : "");
    }

    /**
     * Return true if an actor is loaded and is a NPC
     * @return {boolean}
     */
    get useCategory() {
        return !!this._actor && this._actor.type === "npc";
    }

    /**
     * Construct and return the data object used to render the HTML template for this form application.
     * @param options
     * @return {Object}
     */
    async getData(options = null) {
        return {
            ...(await super.getData(options)),
            approachesList: game.l5r5e.HelpersL5r5e.getApproachesList(this._actor),
            data: this.object,
            actor: this._actor,
            useCategory: this.useCategory,
            canUseVoidPoint:
                this.object.difficulty.addVoidPoint ||
                !this._actor ||
                (this._actor.isCharacterType && this._actor.system.void_points.value > 0),
            disableSubmit: this.object.skill.value < 1 && this.object.approach.value < 1,
            difficultyHiddenIsLock: this._difficultyHiddenIsLock.gm || this._difficultyHiddenIsLock.option,
        };
    }

    /**
     * Render the dialog
     * @param force
     * @param options
     * @returns {Application}
     */
    render(force, options) {
        options = {
            ...options,
        };

        if (force === undefined) {
            force = true;
        }

        return super.render(force, options);
    }

    /**
     * Listen to html elements
     * @param {jQuery} html HTML content of the sheet.
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Skill Selection from list
        html.find("select[name=skill]").on("change", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (this.useCategory) {
                this.skillCatId = event.target.value;
            } else {
                this.skillId = event.target.value;
            }
            this.render(false);
        });

        // Select Approach
        html.find('input[name="approach"]').on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.approachId = event.target.dataset.approachid;
            this.object.approach.value = parseInt(event.target.value) + (this.object.useVoidPoint ? 1 : 0);
            this.render(false);
        });

        // Quantity change for difficulty, ring and skill
        html.find(".quantity").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const data = $(event.currentTarget);
            this._quantityChange(data.data("item"), data.data("value"));
            this.render(false);
        });

        // Skill assistance
        html.find(".assistance").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const assistanceAdd = $(event.currentTarget).data("value");
            if (this.object.skill.assistance > 0 || assistanceAdd > 0) {
                this._quantityChange("skill", assistanceAdd);
            }
            this.object.skill.assistance = Math.max(
                Math.min(parseInt(this.object.skill.assistance) + assistanceAdd, 9),
                0
            );
            this.render(false);
        });

        // Click on the Default Skill Dice
        html.find("#skill_default_value").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.object.skill.value = this.object.skill.defaultValue;
            this.object.skill.assistance = 0;
            this.render(false);
        });

        // Spend a Void point checkbox
        html.find("#use_void_point").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.object.useVoidPoint = event.target.checked;
            this._quantityChange("ring", this.object.useVoidPoint ? 1 : -1);
            this.render(false);
        });

        // Difficulty Hidden
        html.find("#diff_hidden").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.object.difficulty.hidden = !this.object.difficulty.hidden;
            this.object.difficulty.addVoidPoint = this.object.difficulty.hidden;
            this._updateVoidPointUsage();
            this.render(false);
        });

        // Difficulty Add a void point
        html.find("#diff_add_void_point").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.object.difficulty.addVoidPoint = !this.object.difficulty.addVoidPoint;
            this._updateVoidPointUsage();
            this.render(false);
        });
    }

    /**
     * This method is called upon form submission after form data is validated
     * @param event    The initial triggering submission event
     * @param formData The object of validated form data with which to update the object
     * @returns        A Promise which resolves once the update operation has completed
     * @override
     */
    async _updateObject(event, formData) {
        if (this.object.skill.value < 1 && this.object.approach.value < 1) {
            return false;
        }

        // If initiative roll, check if player already have
        if (this.object.isInitiativeRoll) {
            if (!game.combat) {
                ui.notifications.warn("COMBAT.NoneActive", {localize: true});
                return this.close();
            }

            if (!this._actor.canDoInitiativeRoll) {
                ui.notifications.error(
                    game.i18n.localize("l5r5e.conflict.initiative.already_set") + ` [${this._actor.name}]`
                );
                return this.close();
            }
        }

        // Update Actor
        if (this._actor) {
            const actorData = foundry.utils.duplicate(this._actor.system);

            // Update the actor stance on initiative only
            if (this.object.isInitiativeRoll) {
                actorData.stance = this.object.approach.id;
            }

            // If hidden add 1 void pt
            if (this.object.difficulty.addVoidPoint) {
                actorData.void_points.value = Math.min(actorData.void_points.value + 1, actorData.void_points.max);
            }

            // If Void point is used, minus the actor
            if (this.object.useVoidPoint) {
                actorData.void_points.value = Math.max(actorData.void_points.value - 1, 0);
            }

            // Update actor if needed
            const updateDiff = foundry.utils.diffObject(this._actor.system, actorData);
            if (Object.keys(updateDiff).length > 0) {
                await this._actor.update({
                    system: updateDiff,
                });
            }
        }

        // Build the formula
        let formula = [];
        if (this.object.approach.value > 0) {
            formula.push(`${this.object.approach.value}dr`);
        }
        if (this.object.skill.value > 0) {
            formula.push(`${this.object.skill.value}ds`);
        }

        let message;
        if (this.object.isInitiativeRoll) {
            // Initiative roll
            let msgOptions = {
                item: this._item,
                skillId: this.object.skill.id,
                rnkMessage: null,
                difficulty: this.object.difficulty.value,
                useVoidPoint: this.object.useVoidPoint,
                skillAssistance: this.object.skill.assistance,
                difficultyHidden: this.object.difficulty.hidden,
            };

            await this._actor.rollInitiative({
                rerollInitiative: true,
                initiativeOptions: {
                    formula: formula.join("+"),
                    // updateTurn: true,
                    messageOptions: msgOptions,
                },
            });
            // Adhesive tape to get the messageId :/
            message = msgOptions.rnkMessage;
            delete msgOptions.rnkMessage;
        } else {
            // Regular roll, so let's roll !
            const roll = await new game.l5r5e.RollL5r5e(formula.join("+"));

            roll.actor = this._actor;
            roll.l5r5e.item = this._item;
            roll.l5r5e.target = this._target;
            roll.l5r5e.stance = this.object.approach.id;
            roll.l5r5e.skillId = this.object.skill.id;
            roll.l5r5e.skillCatId = this.object.skill.cat;
            roll.l5r5e.difficulty = this.object.difficulty.value;
            roll.l5r5e.voidPointUsed = this.object.useVoidPoint;
            roll.l5r5e.skillAssistance = this.object.skill.assistance;
            roll.l5r5e.difficultyHidden = this.object.difficulty.hidden;

            await roll.roll();
            message = await roll.toMessage();
        }

        if (message) {
            // if DsN active, delay the popup for 2s
            new Promise((r) => setTimeout(r, !game.dice3d ? 0 : 2000)).then(() => {
                new game.l5r5e.RollnKeepDialog(message.id).render(true);
            });
        }

        return this.close();
    }

    /**
     * Change quantity between 0-9 on the element, and return the new value
     * @private
     */
    _quantityChange(element, add) {
        this.object[element].value = Math.max(Math.min(parseInt(this.object[element].value) + add, 9), 0);
    }

    /**
     * Remove the use of void point if actor don't have any and use of vp is un checked
     * @private
     */
    _updateVoidPointUsage() {
        if (
            this.object.useVoidPoint &&
            !this.object.difficulty.addVoidPoint &&
            !!this._actor &&
            this._actor.system.void_points.value < 1
        ) {
            this.object.useVoidPoint = false;
            this._quantityChange("ring", -1);
        }
    }

    /**
     * Create a macro on the first empty space in player's bar
     * @private
     */
    async _createMacro() {
        const params = {};
        let name = "DicePicker";

        if (this._actor?.id) {
            params.actorId = this._actor.id;
            name = this._actor.name;
        }

        if (this.object.skill.id) {
            params.skillId = this.object.skill.id;
        } else if (this.object.skill.cat) {
            params.skillCatId = this.object.skill.cat;
        }
        if (this.object.skill.name) {
            name = name + " - " + this.object.skill.name;
        }

        const command = `new game.l5r5e.DicePickerDialog(${JSON.stringify(params)}).render(true);`;

        let macro = game.macros.contents.find((m) => m.name === name && m.command === command && m.isAuthor);
        if (!macro) {
            macro = await Macro.create({
                name,
                type: "script",
                scope: "actor",
                command,
                img: this._actor?.img || "systems/l5r5e/assets/dices/default/ring_et.svg",
            });
        }

        // Search if already in player hotbar
        if (Object.values(game.user.hotbar).includes(macro.id)) {
            return;
        }

        return game.user.assignHotbarMacro(macro, "auto"); // 1st available
    }

    /**
     * Return the token actor who have the min/max value for this property
     * @param  {string}       property Property name (vigilance, strife.value)
     * @param  {boolean|null} isMin    Null: single target, Min/Max: get the actor who have the max value
     * @return {TokenDocument|null}
     * @private
     */
    static _getTargetTokenFromSelection(property, isMin = null) {
        if (game.user.targets.size < 1) {
            return null;
        }

        let targetToken;
        if (isMin === null) {
            // only one target, get the first element
            targetToken = Array.from(game.user.targets).values().next()?.value?.document;
        } else {
            // Group (Min/Max)
            const targetGrp = Array.from(game.user.targets).reduce(
                (acc, tgt) => {
                    const targetActor = tgt.document.actor;
                    if (!targetActor.isCharacterType) {
                        return acc;
                    }

                    const targetData = targetActor.system;
                    const value = targetActor[property] || targetData[property] || null;
                    if (!value) {
                        return acc;
                    }

                    if ((isMin && value < acc.value) || (!isMin && value > acc.value)) {
                        acc.actor = tgt.document;
                        acc.value = value;
                    }
                    return acc;
                },
                { actor: null, value: 0 }
            );
            targetToken = targetGrp.actor;
        }
        return targetToken;
    }

    /**
     * Parse the difficulty from technique
     *
     * Examples :
     * "@S:vigilance"
     * "@T:vigilance"
     * "@T:vigilance|min"
     * "@T:vigilance|max"
     * "@T:vigilance|max(statusRank)"
     * "@T:intrigueRank"
     * "@T:martialRank"
     * "@T:statusRank|max"
     * "@T:strife.value|max"
     *
     * @param {string|number} difficulty
     * @return {boolean}
     */
    parseDifficulty(difficulty) {
        // Macro style
        if (!Number.isNumeric(difficulty) && difficulty.startsWith("@")) {
            // 0: "@T:vigilance|max(statusRank)"
            // 1: "T" // Meaning : S(elf), T(arget)
            // 2: "vigilance"
            // 3: "max"
            // 4: "statusRank"
            const infos = difficulty.match(CONFIG.l5r5e.regex.techniqueDifficulty);
            if (!infos) {
                console.log("L5R5E | DP | Fail to parse difficulty", difficulty);
                return false;
            }

            // Define which actor is needed for the difficulty
            let targetActor = null;
            let targetToken = null;
            if (infos[1] === "S") {
                targetActor = this._actor;
            } else if (game.user.targets.size > 0) {
                // Between the targets
                targetToken = DicePickerDialog._getTargetTokenFromSelection(
                    infos[4] || infos[2],
                    !infos[3] ? null : infos[3] === "min"
                );
                if (targetToken) {
                    targetActor = targetToken.actor;
                }
            }
            // Wrong syntax or no target set, do manual TN
            if (!targetActor) {
                console.log("L5R5E | DP | Fail to get actor from target selection, or no target selected");
                return false;
            }

            // Check in actor.<prop> or actor.system.<prop>
            difficulty = targetActor[infos[2]] || targetActor.system[infos[2]] || null;
            if (difficulty < 1) {
                console.log("L5R5E | DP | Fail to parse difficulty from target");
                return false;
            }

            // Before difficultyHiddenIsLock
            this.difficulty = difficulty;

            // Hide npc stats on target
            if (infos[1] === "T") {
                this.difficultyHidden = true;
                this._difficultyHiddenIsLock.option = true;
                this.target = targetToken;
            }
            return true;
        }

        // finally
        difficulty = parseInt(difficulty);
        if (isNaN(difficulty) || difficulty < 0) {
            return false;
        }
        this.difficulty = difficulty;
        return true;
    }

    /**
     * Parse Skills from technique
     *
     * Character : expand category (social) to it's skillname (command,courtesy...)
     * NPC : shrink to category names
     *
     * @param {string} skillList
     * @return {string[]}
     */
    parseSkillsList(skillList) {
        const categories = game.l5r5e.HelpersL5r5e.getCategoriesSkillsList();

        // Sanitize and uniques values
        const unqSkillList = new Set();
        skillList.split(",").forEach((s) => {
            s = s.trim();

            if (CONFIG.l5r5e.skills.has(s)) {
                unqSkillList.add(this.useCategory ? CONFIG.l5r5e.skills.get(s) : s);
            } else if (categories.has(s)) {
                if (this.useCategory) {
                    unqSkillList.add(s);
                } else {
                    categories.get(s).forEach((e) => unqSkillList.add(e));
                }
            }
        });

        // Sort by the translated label
        const array = [...unqSkillList].map((id) => {
            return {
                id: id,
                label: this.useCategory
                    ? game.i18n.localize(`l5r5e.skills.${id}.title`)
                    : game.i18n.localize(`l5r5e.skills.${CONFIG.l5r5e.skills.get(id)}.${id}`),
            };
        });
        array.sort((a, b) => a.label.localeCompare(b.label));

        return array;
    }
}
