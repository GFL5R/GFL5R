import { L5r5eSetField } from "./data/l5r5e-setfield.js";

/**
 * Custom system settings register
 */
export const RegisterSettings = function () {
    const isBabeleRegistered = (typeof Babele !== "undefined");

    /* ------------------------------------ */
    /* User settings                        */
    /* ------------------------------------ */
    game.settings.register(CONFIG.l5r5e.namespace, "rnk-deleteOldMessage", {
        name: "SETTINGS.RollNKeep.DeleteOldMessage",
        hint: "SETTINGS.RollNKeep.DeleteOldMessageHint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-setTn1OnTypeChange", {
        name: "SETTINGS.Initiative.SetTn1OnTypeChange",
        hint: "SETTINGS.Initiative.SetTn1OnTypeChangeHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register(CONFIG.l5r5e.namespace, "show-all-status-effects", {
        name: "SETTINGS.ShowAllStatusEffects.Title",
        hint: "SETTINGS.ShowAllStatusEffects.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        requiresReload: true,
    });
    game.settings.register(CONFIG.l5r5e.namespace, "techniques-customs", {
        name: "SETTINGS.CustomTechniques.Title",
        hint: "SETTINGS.CustomTechniques.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register(CONFIG.l5r5e.namespace, "custom-compendium-name", {
        name: "SETTINGS.CustomCompendiumName.Title",
        hint: "SETTINGS.CustomCompendiumName.Hint",
        scope: "world",
        config: isBabeleRegistered,
        requiresReload: true,
        type: String,
        default: "l5r5e-custom-compendiums",
        onChange: (name) => {
            if (game.babele && !game.babele.modules.find((module) => module.module === name)) {
                ui.notifications.warn(game.i18n.format("SETTINGS.CustomCompendiumName.Notification", { name }), { permanent: true });
            }
        }
    });

    /* -------------------------------------- */
    /* Compendium view Settings (GM only)     */
    /* -------------------------------------- */
    // This value is updated whenever we add a reference and on boot
    game.settings.register(CONFIG.l5r5e.namespace, "all-compendium-references", {
        type: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
        default: Object.keys(CONFIG.l5r5e.sourceReference),
        config: false,
        scope: "world",
    });

    game.settings.register(CONFIG.l5r5e.namespace, "compendium-official-content-for-players", {
        name: "SETTINGS.Compendium.AllowedOfficialSources.Title",
        hint: "SETTINGS.Compendium.AllowedOfficialSources.Hint",
        type: new L5r5eSetField( {
            groups: Array.from(new Set(Object.values(CONFIG.l5r5e.sourceReference).map(value =>
                    (value.type.split(",")).map(value => value.trim())
                ).flat()))
                .concat("l5r5e.multiselect.sources_categories.others"),
            options: Object.values(CONFIG.l5r5e.sourceReference).map((reference) => {
                return {
                    ...reference,
                    localize: true,
                    group: CONFIG.l5r5e.sourceReference[reference.value]?.type ?? "l5r5e.multiselect.sources_categories.others"
                };
            })
        }),
        default: [],
        config: true,
        scope: "world",
    });

    game.settings.register(CONFIG.l5r5e.namespace, "compendium-unofficial-content-for-players", {
        name: "SETTINGS.Compendium.AllowedUnofficialSources.Title",
        hint: "SETTINGS.Compendium.AllowedUnofficialSources.Hint",
        type: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
        default: [],
        config: true,
        scope: "world",
    });

    game.settings.register(CONFIG.l5r5e.namespace, "compendium-hide-empty-sources-from-players", {
        name: "SETTINGS.Compendium.HideEmptySourcesFromPlayers.Title",
        hint: "SETTINGS.Compendium.HideEmptySourcesFromPlayers.Hint",
        type: Boolean,
        default: false,
        config: true,
        scope: "world",
    });

    game.settings.register(CONFIG.l5r5e.namespace, "compendium-hide-disabled-sources", {
        name: "SETTINGS.Compendium.HideDisabledSources.Title",
        hint: "SETTINGS.Compendium.HideDisabledSources.Hint",
        type: Boolean,
        default: true,
        config: true,
        scope: "world",
    });

    /* ------------------------------------ */
    /* Client preferences                   */
    /* ------------------------------------ */
    game.settings.register(CONFIG.l5r5e.namespace, "custom-items-windows-height", {
        name: "SETTINGS.CustomItemsHeight.Title",
        hint: "SETTINGS.CustomItemsHeight.Hint",
        scope: "client",
        config: true,
        requiresReload: true,
        type: Number,
        range: {
            min: 400,
            max: 2000,
            step: 50
        },
        default: 800,
    });
    game.settings.register(CONFIG.l5r5e.namespace, "token-reverse-token-bars", {
        name: "SETTINGS.ReverseTokenBars.Title",
        hint: "SETTINGS.ReverseTokenBars.Hint",
        scope: "client",
        config: true,
        default: "none",
        choices: {
            "none": "SETTINGS.ReverseTokenBars.None",
            "fatigue": "SETTINGS.ReverseTokenBars.Fatigue",
            "strife": "SETTINGS.ReverseTokenBars.Strife",
            "both": "SETTINGS.ReverseTokenBars.Both"
        },
        type: String,
    });

    /* ------------------------------------ */
    /* Update                               */
    /* ------------------------------------ */
    game.settings.register(CONFIG.l5r5e.namespace, "systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: String,
        default: 0,
    });

    /* ------------------------------------ */
    /* Initiative Roll Dialog (GM only)     */
    /* ------------------------------------ */
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-difficulty-hidden", {
        name: "Initiative difficulty is hidden",
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
        onChange: () => game.l5r5e.HelpersL5r5e.notifyDifficultyChange(),
    });
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-difficulty-value", {
        name: "Initiative difficulty value",
        scope: "world",
        config: false,
        type: Number,
        default: 2,
        onChange: () => game.l5r5e.HelpersL5r5e.notifyDifficultyChange(),
    });
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-encounter", {
        name: "Initiative encounter type",
        scope: "world",
        config: false,
        type: String,
        default: "skirmish",
        onChange: () => {
            if (game.settings.get(CONFIG.l5r5e.namespace, "initiative-setTn1OnTypeChange")) {
                game.settings.set(CONFIG.l5r5e.namespace, "initiative-difficulty-value", 1);
            }
            ui.combat.render(true);
        },
    });
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-prepared-character", {
        name: "Initiative PC prepared or not",
        scope: "world",
        config: false,
        type: String,
        default: "actor",
        onChange: () => {
            game.l5r5e.HelpersL5r5e.refreshLocalAndSocket("l5r5e-gm-monitor");
            ui.combat.render(true);
        },
    });
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-prepared-adversary", {
        name: "Initiative NPC adversary are prepared or not",
        scope: "world",
        config: false,
        type: String,
        default: "actor",
        onChange: () => {
            game.l5r5e.HelpersL5r5e.refreshLocalAndSocket("l5r5e-gm-monitor");
            ui.combat.render(true);
        },
    });
    game.settings.register(CONFIG.l5r5e.namespace, "initiative-prepared-minion", {
        name: "Initiative NPC minion are prepared or not",
        scope: "world",
        config: false,
        type: String,
        default: "actor",
        onChange: () => {
            game.l5r5e.HelpersL5r5e.refreshLocalAndSocket("l5r5e-gm-monitor");
            ui.combat.render(true);
        },
    });

    /* ------------------------------------ */
    /* GM Monitor windows (GM only)         */
    /* ------------------------------------ */
    game.settings.register(CONFIG.l5r5e.namespace, "gm-monitor-actors", {
        name: "Gm Monitor",
        scope: "world",
        config: false,
        type: Array,
        default: [],
        onChange: () => game.l5r5e.HelpersL5r5e.refreshLocalAndSocket("l5r5e-gm-monitor"),
    });
};
