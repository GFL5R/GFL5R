const HandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;
const ApplicationV2 = foundry.applications.api.ApplicationV2;

export class GmToolbox extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @override ApplicationV2 */
    static get DEFAULT_OPTIONS() { return {
        id: "l5r5e-gm-toolbox",
        window: {
            contentClasses: ["l5r5e", "gm-toolbox", "faded-ui"],
            title: "l5r5e.gm.toolbox.title",
            minimizable: true,
        },
        position: {
            width: "auto",
            height: "auto"
        },
        actions: {
            open_gm_monitor: GmToolbox.#openGmMonitor,
            toggle_hide_difficulty: GmToolbox.#onToggleHideDifficulty,
            // Buttons map (0: left, 1: middle, 2: right, 3: extra 1, 4: extra 2)
            // Foundry v13 use middle (1) for popup and currently not bind it for custom
            // See : https://github.com/foundryvtt/foundryvtt/issues/12531
            change_difficulty: {
                buttons: [0, 1, 2],
                handler: GmToolbox.#onChangeDifficulty
            },
            reset_void: {
                buttons: [0, 1, 2, 3, 4],
                handler: GmToolbox.#onResetVoid
            },
            sleep: {
                buttons: [0, 1, 2, 3, 4],
                handler: GmToolbox.#onSleep
            },
            scene_end: {
                buttons: [0, 1, 2, 3, 4],
                handler: GmToolbox.#onSceneEnd
            },
        }
    }};

    /** @override HandlebarsApplicationMixin */
    static PARTS = {
        main: {
            id: "gm-tool-content",
            template: "systems/l5r5e/templates/" + "gm/gm-toolbox.html"
        }
    };

    /**
     * hooks we act upon, saved since we need to remove them when this window is not open
     */
    #hooks = [];

    constructor() {
        super();
        this.#hooks.push({
            hook: "updateSetting",
            fn: Hooks.on("updateSetting", (setting) => this.#onUpdateSetting(setting))
        });
    }

    /** @override ApplicationV2*/
    async _prepareContext() {
        return {
            difficulty: game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-value"),
            difficultyHidden: game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-hidden"),
        };
    }

    /**
     * The ApplicationV2 always adds the close button so just remove it when redering the frame
     * @override ApplicationV2
     */
    async _renderFrame(options) {
        const frame = await super._renderFrame(options);
        $(frame).find('button[data-action="close"]').remove();
        return frame;
    }

    /**
     * The ApplicationV2 always adds the close button so just remove it when redering the frame
     * @override ApplicationV2
     */
    _onFirstRender(context, options) {
        //const x = $(window).width();
        const y = $(window).height();
        options.position.top = y - 220;
        options.position.left = 220; //x - 630;
    }

    /**
     * The GM Toolbox should not be removed when toggling the main menu with the esc key etc.
     * @override ApplicationV2
     */
    async close(options) {
        return Promise.resolve(this);
    }

    /**
     * Refresh data (used from socket)
     */
    async refresh() {
        if (!game.user.isGM) {
            return;
        }
        this.render(false);
    }

    static #openGmMonitor() {
        const app = foundry.applications.instances.get("l5r5e-gm-monitor")
        if (app) {
            app.close();
        } else {
            new game.l5r5e.GmMonitor().render(true);
        }
    }

    /**
     * @param {PointerEvent} event  The originating click event
     */
    static #onChangeDifficulty(event) {
        let difficulty = game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-value");
        switch (event.button) {
            case 0: // left click
                difficulty = Math.min(9, difficulty + 1);
                break;
            case 1: // middle click
                difficulty = 2;
                break;
            case 2: // right click
                difficulty = Math.max(0, difficulty - 1);
                break;
        }
        game.settings.set(CONFIG.l5r5e.namespace, "initiative-difficulty-value", difficulty);
    }

    static #onToggleHideDifficulty() {
        const hiddenSetting = game.settings.get(CONFIG.l5r5e.namespace, "initiative-difficulty-hidden")
        game.settings.set(CONFIG.l5r5e.namespace, "initiative-difficulty-hidden", !hiddenSetting);
    }

    /**
     * @param {Boolean} allActors
     * @param {ActorL5r5e} actor
     * @returns {Boolean}
     */
    static #updatableCharacter(allActors, actor) {
        if (!actor.isCharacterType) {
            return false;
        }

        if (allActors) {
            return true;
        }
        return actor.isCharacter && actor.hasPlayerOwnerActive
    }

    /**
     * @param {Boolean} allActors
     * @param {String} type
     */
    static #uiNotification(allActors, type) {
        ui.notifications.info(
            ` <i class="fas fa-user${allActors ? "s" : ""}"></i> ` + game.i18n.localize(`l5r5e.gm.toolbox.${type}_info`)
        );
    }

    /**
     * @param {PointerEvent} event The originating click event
     */
    static async #onResetVoid(event) {
        const allActors = event.button !== 0;
        for await (const actor of game.actors.contents) {
            if (!GmToolbox.#updatableCharacter(allActors, actor)) {
                continue;
            }
            await actor.update({
                system: {
                    void_points: {
                        value: Math.ceil(actor.system.void_points.max / 2),
                    },
                },
            });
        }

        GmToolbox.#uiNotification(allActors, "reset_void");
    }

    /**
     * @param {PointerEvent} event The originating click event
     */
    static async #onSleep(event) {
        const allActors = event.button !== 0;
        for await (const actor of game.actors.contents) {
            if (!GmToolbox.#updatableCharacter(allActors, actor)) {
                continue;
            }
            await actor.update({
                system: {
                    fatigue: {
                        value: Math.max(0,
                            actor.system.fatigue.value - Math.ceil(actor.system.rings.water * 2)
                        ),
                    }
                },
            });
            await actor.removeConditions(new Set(["exhausted"]));
        }

        GmToolbox.#uiNotification(allActors, "sleep");
    }

    /**
     * @param {PointerEvent} event The originating click event
     */
    static async #onSceneEnd(event) {
        const allActors = event.button !== 0;
        for await (const actor of game.actors.contents) {
            if (!GmToolbox.#updatableCharacter(allActors, actor)
                || actor.statuses.has("exhausted")) {
                continue;
            }

            await actor.update({
                system: {
                    fatigue: {
                        value: Math.min(
                            actor.system.fatigue.value,
                            Math.ceil(actor.system.fatigue.max / 2)
                        )
                    },
                    strife: {
                        value: Math.min(
                            actor.system.strife.value,
                            Math.ceil(actor.system.strife.max / 2)
                        )
                    }
                }
            });
        }

        GmToolbox.#uiNotification(allActors, "scene_end");
    }

    /**
     * @param {Setting} setting The setting that is being updated
     */
    async #onUpdateSetting(setting) {
        switch (setting.key) {
            case "l5r5e.initiative-difficulty-value":
            case "l5r5e.initiative-difficulty-hidden":
                this.render(false);
                break;
            default:
                return;
        }
    }
}
