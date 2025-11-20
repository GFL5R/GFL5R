/**
 * Roll for L5R5e
 */
export class RollL5r5e extends Roll {
    static CHAT_TEMPLATE = "dice/chat-roll.html";
    static TOOLTIP_TEMPLATE = "dice/tooltip.html";

    /**
     * Specific data for L5R
     */
    l5r5e = {
        actor: null,
        dicesTypes: {
            std: false,
            l5r: false,
        },
        difficulty: 2,
        difficultyHidden: false,
        history: null,
        initialFormula: null,
        isInitiativeRoll: false,
        item: null,
        keepLimit: null,
        rnkEnded: false,
        skillAssistance: 0,
        skillCatId: "",
        skillId: "",
        stance: "",
        strifeApplied: 0,
        summary: {
            totalSuccess: 0,
            totalBonus: 0,
            success: 0,
            explosive: 0,
            opportunity: 0,
            strife: 0,
        },
        target: null,
        voidPointUsed: false,
    };

    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);

        // Parse flavor for stance and skillId
        const flavors = Array.from(formula.matchAll(/\d+d([sr])\[([^\]]+)\]/gmu));
        flavors.forEach((res) => {
            if (res[1] === "r" && !!res[2] && this.l5r5e.stance === "") {
                this.l5r5e.stance = res[2];
            }
            if (res[1] === "s" && !!res[2] && this.l5r5e.skillId === "") {
                this.l5r5e.skillId = res[2];
            }
        });

        // Target Infos : get the 1st selected target
        const targetToken = Array.from(game.user.targets).values().next()?.value?.document;
        if (targetToken) {
            this.target = targetToken;
        }
    }

    /**
     * Set actor
     * @param {ActorL5r5e} actor
     */
    set actor(actor) {
        this.l5r5e.actor = actor instanceof Actor && actor.isOwner ? actor : null;
    }

    /**
     * Set Target Infos (Name, Img)
     * @param {TokenDocument} targetToken
     */
    set target(targetToken) {
        this.l5r5e.target = targetToken || null;
    }

    /**
     * Execute the Roll, replacing dice and evaluating the total result
     * @override
     **/
    async evaluate({ minimize = false, maximize = false } = {}) {
        if (this._evaluated) {
            throw new Error("This Roll object has already been rolled.");
        }
        if (this.terms.length < 1) {
            throw new Error("This Roll object need dice to be rolled.");
        }

        // Clean terms (trim symbols)
        this.terms = this.constructor.simplifyTerms(this.terms);

        // Roll dices and inner dices
        this._total = 0;

        // Roll
        await super.evaluate({ minimize, maximize });
        this._evaluated = true;

        // Save initial formula
        if (!this.l5r5e.initialFormula) {
            this.l5r5e.initialFormula = this.formula;
        }

        // Compute summary
        this.l5rSummary();

        return this;
    }

    /**
     * Summarise the total of success, strife... for L5R dices for the current roll
     *
     * @private
     */
    l5rSummary() {
        const summary = this.l5r5e.summary;

        // Reset totals
        summary.success = 0;
        summary.explosive = 0;
        summary.opportunity = 0;
        summary.strife = 0;
        summary.totalSuccess = 0;

        // Current terms - L5R Summary
        this.terms.forEach((term) => this._l5rTermSummary(term));

        // Check inner L5R rolls - L5R Summary
        this._dice.forEach((term) => this._l5rTermSummary(term));

        // Store final outputs
        this.l5r5e.dicesTypes.std = this.dice.some(
            (term) => term instanceof foundry.dice.terms.DiceTerm && !(term instanceof game.l5r5e.L5rBaseDie)
        ); // ignore math symbols
        this.l5r5e.dicesTypes.l5r = this.dice.some((term) => term instanceof game.l5r5e.L5rBaseDie);
        summary.totalBonus = Math.max(0, summary.totalSuccess - this.l5r5e.difficulty);

        if (!this.l5r5e.keepLimit) {
            // count ring die + skill assistance
            this.l5r5e.keepLimit =
                this.dice.reduce((acc, term) => (term instanceof game.l5r5e.RingDie ? acc + term.number : acc), 0) +
                Math.max(0, this.l5r5e.skillAssistance || 0);

            // if only bulk skill dice, count the skill dice
            if (!this.l5r5e.keepLimit) {
                this.l5r5e.keepLimit = this.dice.reduce(
                    (acc, term) => (term instanceof game.l5r5e.AbilityDie ? acc + term.number : acc),
                    0
                );
            }
        }

        // RnK Can do some action ?
        if (this.l5r5e.history) {
            this.l5r5e.rnkEnded = !this.l5r5e.history[this.l5r5e.history.length - 1].some(
                (e) => !!e && e.choice === null
            );
        }
    }

    /**
     * Summarise the total of success, strife... for L5R dices for the current term
     *
     * @param term
     * @private
     */
    _l5rTermSummary(term) {
        if (!(term instanceof game.l5r5e.L5rBaseDie)) {
            return;
        }

        ["success", "explosive", "opportunity", "strife"].forEach((props) => {
            this.l5r5e.summary[props] += parseInt(term.l5r5e[props]);
        });
        this.l5r5e.summary.totalSuccess += term.totalSuccess;
    }

    /**
     * Return the total result of the Roll expression if it has been evaluated, otherwise null
     * @override
     */
    get total() {
        // Return null to trigger the L5R template.
        // This beak inline roll, but as we need RnK to really resolve the roll, this is acceptable...
        if (this.l5r5e.dicesTypes.l5r) {
            return null;
        }

        if (!this._evaluated) {
            return null;
        }

        let total = "";

        // Regular dices total (eg 6)
        if (this.l5r5e.dicesTypes.std) {
            total = this._total;
        }

        // Add L5R summary
        // if (this.l5r5e.dicesTypes.l5r) {
        //     const summary = this.l5r5e.summary;
        //     total +=
        //         (this.l5r5e.dicesTypes.std ? " | " : "") +
        //         ["success", "explosive", "opportunity", "strife"]
        //             .map((props) => (summary[props] > 0 ? `<i class="i_${props}"></i> ${summary[props]}` : null))
        //             .filter((c) => !!c)
        //             .join(" | ");
        // }
        return total;
    }

    /**
     * Render the tooltip HTML for a Roll instance and inner rolls (eg [[2ds]])
     * @param contexte Used to differentiate render (no l5r dices) or inline tooltip (with l5r dices)
     * @override
     */
    getTooltip(contexte = null) {
        const parts = this.dice.map((term) => {
            const cls = term.constructor;
            const isL5rDie = term instanceof game.l5r5e.L5rBaseDie;

            return {
                formula: term.formula,
                total: term.total,
                faces: term.faces,
                flavor: term.options.flavor,
                isDieL5r: isL5rDie,
                isDieStd: !isL5rDie,
                display: !isL5rDie || contexte?.from !== "render",
                rolls: term.results.map((r) => {
                    return {
                        result: term.getResultLabel(r),
                        classes: [
                            cls.name.toLowerCase(),
                            "d" + term.faces,
                            isL5rDie && r.swapped ? "swapped" : null,
                            r.rerolled ? "rerolled" : null,
                            r.exploded ? "exploded" : null,
                            !isL5rDie && r.discarded ? "discarded" : null,
                            !isL5rDie && r.result === 1 ? "min" : null,
                            !isL5rDie && r.result === term.faces ? "max" : null,
                        ]
                            .filter((c) => !!c)
                            .join(" "),
                    };
                }),
            };
        });
        parts.addedResults = this.addedResults;

        const chatData = {
            parts: parts,
            l5r5e: this.l5r5e,
            displaySummary: contexte?.from !== "render",
        };

        return foundry.applications.handlebars.renderTemplate(CONFIG.l5r5e.paths.templates + this.constructor.TOOLTIP_TEMPLATE, { chatData });
    }

    /**
     * Render a Roll instance to HTML
     * @override
     */
    async render(chatOptions = {}) {
        chatOptions = foundry.utils.mergeObject(
            {
                user: game.user.id,
                flavor: null,
                template: CONFIG.l5r5e.paths.templates + this.constructor.CHAT_TEMPLATE,
                blind: false,
            },
            chatOptions
        );
        const isPrivate = chatOptions.isPrivate;

        // Execute the roll, if needed
        if (!this._evaluated) {
            await this.roll();
        }

        // Define chat data
        const chatData = {
            formula: isPrivate ? "???" : this._formula,
            flavor: isPrivate ? null : chatOptions.flavor || this.options.flavor,
            user: chatOptions.user,
            isPublicRoll: !isPrivate,
            tooltip: isPrivate ? "" : await this.getTooltip({ from: "render" }),
            total: isPrivate ? "?" : this.total,
            profileImg: this.l5r5e.actor?.img || "icons/svg/mystery-man.svg",
            noTargetDisclosure:
                this.l5r5e.item?.system?.difficulty?.startsWith("@T:") &&
                /\|m(in|ax)/.test(this.l5r5e.item.system.difficulty),
            l5r5e: isPrivate
                ? {}
                : {
                      ...this.l5r5e,
                      dices: this.dice.map((term) => {
                          const isL5rDie = term instanceof game.l5r5e.L5rBaseDie;
                          return {
                              diceTypeL5r: isL5rDie,
                              rolls: term.results.map((r) => {
                                  return {
                                      result: term.getResultLabel(r),
                                      classes: [
                                          isL5rDie && r.swapped ? "swapped" : null,
                                          r.rerolled ? "rerolled" : null,
                                          r.exploded ? "exploded" : null,
                                      ]
                                          .filter((c) => !!c)
                                          .join(" "),
                                  };
                              }),
                          };
                      }),
                  },
        };

        // Render the roll display template
        return foundry.applications.handlebars.renderTemplate(chatOptions.template, chatData);
    }

    /**
     * Transform a Roll instance into a ChatMessage, displaying the roll result.
     * This function can either create the ChatMessage directly, or return the data object that will be used to create.
     * @override
     */
    async toMessage(messageData = {}, { rollMode = null } = {}) {
        // Perform the roll, if it has not yet been rolled
        if (!this._evaluated) {
            await this.evaluate();
        }

        // RollMode
        const rMode = rollMode || messageData.rollMode || game.settings.get("core", "rollMode");
        if (rMode) {
            messageData = ChatMessage.applyRollMode(messageData, rMode);
        }

        // Force the content to avoid weird foundry behaviour
        const content = this.l5r5e.dicesTypes.l5r ? await this.render({}) : this.total;

        // Prepare chat data
        messageData = foundry.utils.mergeObject(
            {
                user: game.user.id,
                content,
                sound: CONFIG.sounds.dice,
                speaker: {
                    actor: this.l5r5e.actor?.id || null,
                    token: this.l5r5e.actor?.token || null,
                    alias: this.l5r5e.actor?.name || null,
                },
            },
            messageData
        );
        messageData.rolls = [this];

        // Either create the message or just return the chat data
        return ChatMessage.implementation.create(messageData, {
            rollMode: rMode,
        });
    }

    /** @override */
    static fromData(data) {
        const roll = super.fromData(data);

        roll.data = foundry.utils.duplicate(data.data);
        roll.l5r5e = foundry.utils.duplicate(data.l5r5e);

        // Get real Actor object
        if (data.l5r5e.actor) {
            if (data.l5r5e.actor instanceof game.l5r5e.ActorL5r5e) {
                // Duplicate break the object, relink it
                roll.l5r5e.actor = data.l5r5e.actor;
            } else if (data.l5r5e.actor.uuid) {
                // Only uuid, get the object
                let actor;
                const tmpItem = fromUuidSync(data.l5r5e.actor.uuid);
                if (tmpItem instanceof Actor) {
                    actor = tmpItem;
                } else if (tmpItem instanceof TokenDocument) {
                    actor = tmpItem.actor;
                }
                if (actor) {
                    roll.l5r5e.actor = actor;
                }
            } else if (data.l5r5e.actor.id) {
                // Compat old chat message : only id
                const actor = game.actors.get(data.l5r5e.actor.id);
                if (actor) {
                    roll.l5r5e.actor = actor;
                }
            }
        }

        // Get real Item object
        if (data.l5r5e.item) {
            if (data.l5r5e.item instanceof game.l5r5e.ItemL5r5e) {
                // Duplicate break the object, relink it
                roll.l5r5e.item = data.l5r5e.item;
            } else if (data.l5r5e.item.uuid) {
                // Only uuid, get the object
                const tmpItem = fromUuidSync(data.l5r5e.item.uuid);
                if (tmpItem) {
                    roll.l5r5e.item = tmpItem;
                }
            }
        }

        // Get real Target object
        if (data.l5r5e.target) {
            if (data.l5r5e.target instanceof TokenDocument) {
                // Duplicate break the object, relink it
                roll.l5r5e.target = data.l5r5e.target;
            } else if (data.l5r5e.target.uuid) {
                // Only uuid, get the object
                const tmpItem = fromUuidSync(data.l5r5e.target.uuid);
                if (tmpItem) {
                    roll.l5r5e.target = tmpItem;
                }
            }
        }

        return roll;
    }

    /**
     * Represent the data of the Roll as an object suitable for JSON serialization
     * @override
     */
    toJSON() {
        const json = super.toJSON();

        json.data = foundry.utils.duplicate(this.data);
        json.l5r5e = foundry.utils.duplicate(this.l5r5e);

        // Lightweight the Actor
        if (json.l5r5e.actor && this.l5r5e.actor?.uuid) {
            json.l5r5e.actor = {
                uuid: this.l5r5e.actor.uuid,
            };
        }

        // Lightweight the Item
        if (json.l5r5e.item && this.l5r5e.item?.uuid) {
            json.l5r5e.item = {
                uuid: this.l5r5e.item.uuid,
            };
        }

        // Lightweight the Target Token
        if (json.l5r5e.target && this.l5r5e.target?.uuid) {
            json.l5r5e.target = {
                uuid: this.l5r5e.target.uuid,
            };
        }

        return json;
    }
}
