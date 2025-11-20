// Import Commons Modules
import { L5R5E } from "./config.js";
import { HelpersL5r5e } from "./helpers.js";
import { SocketHandlerL5r5e } from "./socket-handler.js";
import { RegisterSettings } from "./settings.js";
import { PreloadTemplates } from "./preloadTemplates.js";
import { RegisterHandlebars } from "./handlebars.js";
import HooksL5r5e from "./hooks.js";
// Actors
import { ActorL5r5e } from "./actor.js";
import { CharacterSheetL5r5e } from "./actors/character-sheet.js";
import { NpcSheetL5r5e } from "./actors/npc-sheet.js";
import { ArmySheetL5r5e } from "./actors/army-sheet.js";
// Dice and rolls
import { L5rBaseDie } from "./dice/dietype/l5r-base-die.js";
import { AbilityDie } from "./dice/dietype/ability-die.js";
import { RingDie } from "./dice/dietype/ring-die.js";
import { RollL5r5e } from "./dice/roll.js";
import { DicePickerDialog } from "./dice/dice-picker-dialog.js";
import { RollnKeepDialog } from "./dice/roll-n-keep-dialog.js";
import { CombatL5r5e } from "./combat.js";
// Items
import { ItemL5r5e } from "./item.js";
import { ItemSheetL5r5e } from "./items/item-sheet.js";
import { ArmorSheetL5r5e } from "./items/armor-sheet.js";
import { WeaponSheetL5r5e } from "./items/weapon-sheet.js";
import { TechniqueSheetL5r5e } from "./items/technique-sheet.js";
import { PropertySheetL5r5e } from "./items/property-sheet.js";
import { AdvancementSheetL5r5e } from "./items/advancement-sheet.js";
import { PeculiaritySheetL5r5e } from "./items/peculiarity-sheet.js";
import { TitleSheetL5r5e } from "./items/title-sheet.js";
import { BondSheetL5r5e } from "./items/bond-sheet.js";
import { SignatureScrollSheetL5r5e } from "./items/signature-scroll-sheet.js";
import { ItemPatternSheetL5r5e } from "./items/item-pattern-sheet.js";
import { ArmyCohortSheetL5r5e } from "./items/army-cohort-sheet.js";
import { ArmyFortificationSheetL5r5e } from "./items/army-fortification-sheet.js";
// JournalEntry
import { JournalL5r5e } from "./journal.js";
import { BaseJournalSheetL5r5e } from "./journals/base-journal-sheet.js";
// Specific
import { MigrationL5r5e } from "./migration.js";
import { GmToolbox } from "./gm/gm-toolbox.js";
import { GmMonitor } from "./gm/gm-monitor.js";
import { Storage } from "./storage.js";
// Misc
import { L5r5eHtmlMultiSelectElement } from "./misc/l5r5e-multiselect.js";

window.customElements.define(L5r5eHtmlMultiSelectElement.tagName, L5r5eHtmlMultiSelectElement);

/* ------------------------------------ */
/* Initialize system                    */
/* ------------------------------------ */
Hooks.once("init", async () => {
    // ***** Initializing l5r5e *****
    // Ascii art :p
    console.log(
        "  _    ___ ___   ___\n" +
            " | |  | __| _ \\ | __| ___ \n" +
            " | |__|__ \\   / |__ \\/ -_)\n" +
            " |____|___/_|_\\ |___/\\___|\n" +
            " "
    );

    // ***** Config *****
    // Global access to L5R Config
    CONFIG.l5r5e = L5R5E;

    // Assign custom classes and constants here
    CONFIG.Combat.documentClass = CombatL5r5e;
    CONFIG.Actor.documentClass = ActorL5r5e;
    CONFIG.Actor.sheetClasses = CharacterSheetL5r5e;
    CONFIG.Item.documentClass = ItemL5r5e;
    CONFIG.JournalEntry.documentClass = JournalL5r5e;
    CONFIG.JournalEntry.sheetClass = BaseJournalSheetL5r5e;

    // Define custom Roll class
    CONFIG.Dice.rolls.unshift(RollL5r5e);

    // Define DiceTerms
    CONFIG.Dice.terms[AbilityDie.DENOMINATION] = AbilityDie;
    CONFIG.Dice.terms[RingDie.DENOMINATION] = RingDie;

    // Add some classes in game
    game.l5r5e = {
        L5rBaseDie,
        RingDie,
        AbilityDie,
        HelpersL5r5e,
        ItemL5r5e,
        JournalL5r5e,
        RollL5r5e,
        ActorL5r5e,
        DicePickerDialog,
        RollnKeepDialog,
        GmToolbox,
        GmMonitor,
        storage: new Storage(),
        sockets: new SocketHandlerL5r5e(),
        migrations: MigrationL5r5e,
    };

    // Register custom system settings
    RegisterSettings();

    // Register custom Handlebars Helpers
    RegisterHandlebars();

    // Preload Handlebars templates (Important : Do not await ! It's sometime break the css in clients)
    PreloadTemplates().then(() => {});

    // ***** Register custom sheets *****
    const fdc = foundry.documents.collections;
    const fav1s = foundry.appv1.sheets;

    // Actors
    fdc.Actors.unregisterSheet("core", fav1s.ActorSheet);
    fdc.Actors.registerSheet(L5R5E.namespace, CharacterSheetL5r5e, {
        types: ["character"],
        label: "TYPES.Actor.character",
        makeDefault: true,
    });
    fdc.Actors.registerSheet(L5R5E.namespace, NpcSheetL5r5e, {
        types: ["npc"],
        label: "TYPES.Actor.npc",
        makeDefault: true,
    });
    fdc.Actors.registerSheet(L5R5E.namespace, ArmySheetL5r5e, {
        types: ["army"],
        label: "TYPES.Actor.army",
        makeDefault: true,
    });

    // Items
    fdc.Items.unregisterSheet("core", fav1s.ItemSheet);
    fdc.Items.registerSheet(L5R5E.namespace, ItemSheetL5r5e, {
        types: ["item"],
        label: "TYPES.Item.item",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, ArmorSheetL5r5e, {
        types: ["armor"],
        label: "TYPES.Item.armor",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, WeaponSheetL5r5e, {
        types: ["weapon"],
        label: "TYPES.Item.weapon",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, TechniqueSheetL5r5e, {
        types: ["technique"],
        label: "TYPES.Item.technique",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, PropertySheetL5r5e, {
        types: ["property"],
        label: "TYPES.Item.property",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, PeculiaritySheetL5r5e, {
        types: ["peculiarity"],
        label: "TYPES.Item.peculiarity",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, AdvancementSheetL5r5e, {
        types: ["advancement"],
        label: "TYPES.Item.advancement",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, TitleSheetL5r5e, {
        types: ["title"],
        label: "TYPES.Item.title",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, BondSheetL5r5e, {
        types: ["bond"],
        label: "TYPES.Item.bond",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, SignatureScrollSheetL5r5e, {
        types: ["signature_scroll"],
        label: "TYPES.Item.signature_scroll",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, ItemPatternSheetL5r5e, {
        types: ["item_pattern"],
        label: "TYPES.Item.item_pattern",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, ArmyCohortSheetL5r5e, {
        types: ["army_cohort"],
        label: "TYPES.Item.army_cohort",
        makeDefault: true,
    });
    fdc.Items.registerSheet(L5R5E.namespace, ArmyFortificationSheetL5r5e, {
        types: ["army_fortification"],
        label: "TYPES.Item.army_fortification",
        makeDefault: true,
    });

    // Journal
    fdc.Journal.unregisterSheet("core", fav1s.JournalSheet);
    fdc.Journal.registerSheet(L5R5E.namespace, BaseJournalSheetL5r5e, {
        label: "TYPES.Journal.journal",
        makeDefault: true,
    });

    // Override enrichHTML for Symbol replacement
    const oldEnrichHTML = foundry.applications.ux.TextEditor.implementation.prototype.constructor.enrichHTML;
    foundry.applications.ux.TextEditor.implementation.prototype.constructor.enrichHTML = async function (content, options = {}) {
        return HelpersL5r5e.convertSymbols(await oldEnrichHTML.call(this, content, options), true);
    };

    // Override the default Token _drawBar function to allow fatigue bar reversing.
    foundry.canvas.placeables.Token.prototype._drawBar = function (number, bar, data) {
        const barSettings = game.settings.get(L5R5E.namespace, "token-reverse-token-bars");
        const reverseBar = barSettings === 'both' || barSettings === data.attribute;

        // Bar value
        const pct = Math.clamp(Number(data.value), 0, data.max) / data.max;

        // Modify color
        let color = number === 0 ? [pct / 1.2, 1 - pct, 0] : [0.5 * pct, 0.7 * pct, 0.5 + pct / 2];

        // Red if compromised
        if (data.attribute === "strife" && data.value > data.max) {
            color = [1, 0.1, 0.1];
        }

        // Enlarge the bar for large tokens
        let h = Math.max(canvas.dimensions.size / 12, 8);
        if (this.height >= 2) {
            h *= 1.6;
        }

        // Draw the bar
        bar.clear()
            .beginFill(0x000000, 0.5)
            .lineStyle(2, 0x000000, 0.9)
            .drawRoundedRect(0, 0, this.w, h, 3)
            .beginFill(PIXI.utils.rgb2hex(color), 0.8)
            .lineStyle(1, 0x000000, 0.8)
            .drawRoundedRect(1, 1, (reverseBar ? 1 - pct : pct) * (this.w - 2), h - 2, 2);

        // Set position
        bar.position.set(0, number === 0 ? this.h - h : 0);
    };
});

/* ------------------------------------ */
/* Hooks Once                           */
/* ------------------------------------ */
Hooks.once("setup", HooksL5r5e.setup);
Hooks.once("ready", HooksL5r5e.ready);
Hooks.once("init", HooksL5r5e.init);
Hooks.once("diceSoNiceReady", (dice3d) => HooksL5r5e.diceSoNiceReady(dice3d));

/* ------------------------------------ */
/* Hooks On                             */
/* ------------------------------------ */
Hooks.on("renderSidebarTab", (app, html, data) => HooksL5r5e.renderSidebarTab(app, html, data));
Hooks.on("activateSettings", async (app)=> HooksL5r5e.activateSettings(app));
Hooks.on("renderChatMessageHTML", (message, html, data) => HooksL5r5e.renderChatMessage(message, html, data));
Hooks.on("renderCombatTracker", (app, html, data) => HooksL5r5e.renderCombatTracker(app, html, data));
Hooks.on("renderCompendium", async (app, html, data) => HooksL5r5e.renderCompendium(app, html, data));
Hooks.on("diceSoNiceRollStart", (messageId, context) => HooksL5r5e.diceSoNiceRollStart(messageId, context));
Hooks.on("updateCompendium", (pack, documents, options, userId) => HooksL5r5e.updateCompendium(pack, documents, options, userId));
