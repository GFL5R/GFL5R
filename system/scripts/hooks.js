import { L5r5eHtmlMultiSelectElement } from "./misc/l5r5e-multiselect.js";

export default class HooksL5r5e {
    /**
     * Do initialization
     */
    static async init() {
        // L5R conditions
        if (game.settings.get(CONFIG.l5r5e.namespace, "show-all-status-effects")) {
            // Add L5R conditions to foundry conditions (don't restrict users)
            CONFIG.statusEffects.push(...CONFIG.l5r5e.conditions);
        } else {
            // L5R conditions only
            CONFIG.statusEffects = CONFIG.l5r5e.conditions;
        }
    }

    /**
     * Do anything after initialization but before ready
     */
    static setup() {
        // Enable embed Babele compendiums only if custom compendium is not found or disabled
        if (
            game.babele &&
            game.babele.modules.every((module) => module.module !== game.settings.get(CONFIG.l5r5e.namespace, "custom-compendium-name"))
        ) {
            game.babele.setSystemTranslationsDir("babele"); // Since Babele v2.0.7
        }
    }

    /**
     * Do anything once the system is ready
     */
    static async ready() {
        // If multiple GM connected, tag the 1st alive, useful for some traitements that need to be done once (migration, delete...)
        Object.defineProperty(game.user, "isFirstGM", {
            get: function () {
                return game.user.isGM && game.user.id === game.users.find((u) => u.active && u.isGM)?.id;
            },
        });

        // Migration stuff
        if (game.user.isFirstGM && game.l5r5e.migrations.needUpdate(game.l5r5e.migrations.NEEDED_VERSION)) {
            game.l5r5e.migrations.migrateWorld({ force: false }).then();
        }

        // Taken from dnd5 : Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
        Hooks.on("hotbarDrop", (bar, data, slot) => {
            if (data.type === "Item") {
                HooksL5r5e.#createItemMacro(data, slot);
                return false;
            }
        });

        // For some reason, not always really ready, so wait a little
        await new Promise((r) => setTimeout(r, 2000));

        // Settings TN and EncounterType
        if (game.user.isGM) {
                new game.l5r5e.GmToolbox().render(true);
        }

        // ***** UI *****
        // If any disclaimer "not translated by Edge"
        const disclaimer = game.i18n.localize("l5r5e.global.edge_translation_disclaimer");
        if (disclaimer !== "" && disclaimer !== "l5r5e.global.edge_translation_disclaimer") {
            ui.notifications.info(disclaimer);
        }

        // Find all additional source references that is not the official ones:
        const references = new Set(Object.keys(CONFIG.l5r5e.sourceReference));
        for(let pack of game.packs) {
            if(pack.metadata.packageType === "system") {
                continue;
            }
            const documents = await pack.getDocuments();
            for(let document of documents) {
                if(document?.system?.source_reference) {
                    references.add(document.system.source_reference.source);
                }
            }
        }
        game.settings.set(CONFIG.l5r5e.namespace, "all-compendium-references", references);
    }

    /**
     * SidebarTab
     */
    static renderSidebarTab(app, html, data) {
        html = $(html); // basic patch for v13

        switch (app.tabName) {
            case "chat":
                // Add DP on dice icon
                html.find(`.chat-control-icon`).on("mousedown", async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    switch (event.which) {
                        case 1:
                            // Left clic - Local DP
                            new game.l5r5e.DicePickerDialog().render();
                            break;
                        case 3:
                            // Right clic - Players DP
                            if (game.user.isGM) {
                                game.l5r5e.HelpersL5r5e.debounce(
                                    "gm-request-dp",
                                    () => {
                                        game.l5r5e.sockets.openDicePicker({
                                            users: game.users.players.filter((u) => u.active && u.hasPlayerOwner),
                                            dpOptions: {
                                                skillsList: "artisan,martial,scholar,social,trade",
                                            },
                                        });
                                        ui.notifications.info("l5r5e.dice.dicepicker.gm_request_dp_to_players", {localize: true});
                                    },
                                    3000,
                                    true
                                )();
                            }
                            break;
                    }
                });

                // Add title on button dice icon
                html.find(".chat-control-icon")[0].title = game.i18n.localize("l5r5e.dice.dicepicker.title");
                break;
            }
    }

    static async activateSettings(app) {
        const html = app.element
        const pip = html.querySelector(".info .system .notification-pip");
        html.querySelector(".info.system.l5r5e")?.remove();

        const section = document.createElement("section");
        section.className = "info system l5r5e";
        const tpl = await foundry.applications.handlebars.renderTemplate(`${CONFIG.l5r5e.paths.templates}settings/logo.html`, {
            SystemVersion: game.system.version
        });
        section.append(foundry.utils.parseHTML(tpl));
        if ( pip ) section.querySelector(".system-info").insertAdjacentElement("beforeend", pip);
        html.querySelector(".info").insertAdjacentElement("afterend", section);
    }

    /**
     * Chat Message
     */
    static renderChatMessage(message, html, data) {
        html = $(html); // basic patch for v13

        if (message.isRoll) {
            // Add an extra CSS class to roll
            html.addClass("roll");
            html.on("click", ".chat-dice-rnk", game.l5r5e.RollnKeepDialog.onChatAction.bind(this));

            // Remove specific elements
            if (game.user.isGM) {
                html.find(".player-only").remove();
            } else {
                html.find(".gm-only").remove();
            }
        }

        // Compendium folder link
        html.find(".compendium-link").on("click", (event) => {
            const packId = $(event.currentTarget).data("pack");
            if (packId) {
                const pack = game.packs.get(packId);
                if (pack) {
                    pack.render(true);
                }
            }
        });
    }

    /**
     * Combat tracker
     */
    static async renderCombatTracker(app, html, data) {
        // Display Combat bar (only for GMs)
        await this._gmCombatBar(app, $(html), data);
    }

    /**
     * Display a GM bar for Combat/Initiative
     * @private
     */
    static async _gmCombatBar(app, html, data) {
        // Only for GMs
        if (!game.user.isGM) {
            return;
        }

        html = $(html); // basic patch for v13

        // *** Conf ***
        const encounterTypeList = Object.keys(CONFIG.l5r5e.initiativeSkills);
        const prepared = {
            character: game.settings.get(CONFIG.l5r5e.namespace, "initiative-prepared-character"),
            adversary: game.settings.get(CONFIG.l5r5e.namespace, "initiative-prepared-adversary"),
            minion: game.settings.get(CONFIG.l5r5e.namespace, "initiative-prepared-minion"),
        };

        // *** Template ***
        const tpl = await foundry.applications.handlebars.renderTemplate(`${CONFIG.l5r5e.paths.templates}gm/combat-tracker-bar.html`, {
            encounterType: game.settings.get(CONFIG.l5r5e.namespace, "initiative-encounter"),
            encounterTypeList,
            prepared,
        });

        // Add/replace in bar
        const elmt = html.find("#l5r5e_gm_combat_tracker_bar");
        if (elmt.length > 0) {
            elmt.replaceWith(tpl);
        } else {
            html.find(".combat-tracker-header").append(tpl);
        }

        // Buttons Listeners
        html.find(".encounter-control").on("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const encounter = $(event.currentTarget).data("id");
            if (!encounterTypeList.includes(encounter)) {
                return;
            }
            game.settings.set(CONFIG.l5r5e.namespace, "initiative-encounter", encounter);
        });

        html.find(".prepared-control").on("mousedown", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const preparedId = $(event.currentTarget).data("id");
            if (!Object.hasOwnProperty.call(prepared, preparedId)) {
                return;
            }
            const rev = event.which === 3;
            const nextValue = {
                false: rev ? "true" : "actor",
                true: rev ? "actor" : "false",
                actor: rev ? "false" : "true",
            };
            game.settings.set(CONFIG.l5r5e.namespace, `initiative-prepared-${preparedId}`, nextValue[prepared[preparedId]]);
        });
    }

    /**
     * Compendium display (Add filters)
     */
    static async renderCompendium(app, html, data) {
        html = $(html); // basic patch for v13

        if (app.collection.documentName === "Item") {
            const content = await app.collection.getDocuments();
            const sourcesInThisCompendium = new Set([]);
            const filtersToShow = {
                rank: false,
                rarity: false,
                source: false,
                ring: false,
            };
            // Used to auto hide same values for a full compendium
            const previousValue = {
                rank: null,
                rarity: null,
                source: null,
                ring: null,
            };

            // Cache
            const header = html.find(".directory-header");
            const entries = html.find(".directory-item");

            // Add additional data to the entries to make it faster to lookup.
            // Add Ring/rank/rarity information
            for (const document of content) {
                const entry = entries.filter(`[data-entry-id="${document.id}"]`);

                // Hide filter if only one value of this type is found in the compendium
                const autoDisplayFilter = (props, documentData = null) => {
                    documentData ??= document.system[props];

                    if (filtersToShow[props] || previousValue[props] === documentData) {
                        return;
                    }
                    filtersToShow[props] = previousValue[props] !== null && previousValue[props] !== documentData;
                    previousValue[props] = documentData;
                };

                if (document.system?.rank) {
                    autoDisplayFilter('rank');
                    entry.data("rank", document.system.rank);
                }

                if (document.system?.source_reference.source) {
                    autoDisplayFilter('source', document.system.source_reference.source);
                    sourcesInThisCompendium.add(document.system.source_reference.source);
                    entry.data("source", document.system.source_reference);
                }

                if (document.system?.ring) {
                    autoDisplayFilter('ring');
                    entry.data("ring", document.system.ring);
                }

                if (document.system?.rarity) {
                    autoDisplayFilter('rarity');
                    entry.data("rarity", document.system.rarity);
                }

                // Add ring/rank/rarity information on the item in the compendium view
                if (document.system?.ring || document.system?.rarity || document.system?.rank) {
                    const ringRarityRank = await foundry.applications.handlebars.renderTemplate(`${CONFIG.l5r5e.paths.templates}compendium/ring-rarity-rank.html`, document.system);
                    entry.append(ringRarityRank);
                }
            }

            // Setup filters
            const officialContentSet             = game.settings.get(CONFIG.l5r5e.namespace, "compendium-official-content-for-players");
            const unofficialContentSet           = game.settings.get(CONFIG.l5r5e.namespace, "compendium-unofficial-content-for-players");
            const allCompendiumReferencesSet     = game.settings.get(CONFIG.l5r5e.namespace, "all-compendium-references")
            const hideEmptySourcesFromPlayers = game.settings.get(CONFIG.l5r5e.namespace, "compendium-hide-empty-sources-from-players");

            const unavailableSourceForPlayersSet = new Set([...allCompendiumReferencesSet].filter((element) => {
                if (CONFIG.l5r5e.sourceReference[element]) {
                    return officialContentSet.size > 0 ? !officialContentSet.has(element) : false;
                }
                return unofficialContentSet.size > 0 ? !unofficialContentSet.has(element) : false;
            }));

            // Create filter function
            const applyCompendiumFilter = () => {
                const userFilter = header.find("l5r5e-multi-select").val();
                const rankFilter = header.find(".rank-filter .selected").data("rank");
                const ringFilter = header.find(".ring-filter .selected").data("ring");
                const rarityFilter = header.find(".rarity-filter .selected").data("rarity");

                entries.each(function () {
                    const lineSource = $(this).data("source")?.source;

                    // We might have stuff in the compendium view that does not have a source (folders etc.) Ignore those.
                    if (lineSource === null || lineSource === undefined) {
                        return;
                    }

                    let shouldShow = true;

                    // Handle unavailable sources
                    if (unavailableSourceForPlayersSet.has(lineSource)) {
                        if (game.user.isGM) {
                            shouldShow &= true;
                            $(this)
                                .addClass("not-for-players")
                                .attr("data-tooltip", game.i18n.localize("l5r5e.compendium.not_for_players"));
                        } else {
                            shouldShow &= false;
                        }
                    }

                    // Handle empty sources
                    if (lineSource === "" && hideEmptySourcesFromPlayers) {
                        if (game.user.isGM) {
                            shouldShow &= true;
                            $(this)
                                .addClass("not-for-players")
                                .attr("data-tooltip", game.i18n.localize("l5r5e.compendium.not_for_players"));
                        } else {
                            shouldShow &= false;
                        }
                    }

                    // Apply filters
                    if (rankFilter) {
                        shouldShow &= $(this).data("rank") == rankFilter;
                    }
                    if (userFilter?.length) {
                        shouldShow &= userFilter.includes(lineSource);
                    }
                    if (ringFilter) {
                        shouldShow &= $(this).data("ring") == ringFilter;
                    }
                    if (rarityFilter >= 0) {
                        shouldShow &= $(this).data("rarity") == rarityFilter;
                    }

                    // Show or hide this entry based on the result
                    shouldShow ? $(this).show() : $(this).hide();
                });
            };

            // Filter setup
            const addFilter = async (filterType, templateFile, templateData) => {
                if (!filtersToShow[filterType]) {
                    return;
                }
                const filterTemplate = await foundry.applications.handlebars.renderTemplate(
                    `${CONFIG.l5r5e.paths.templates}compendium/${templateFile}.html`,
                    templateData
                );
                header.append(filterTemplate);

                header.find(`.${filterType}-filter`).children().each(function () {
                    $(this).on("click", (event) => {
                        const selected = $(event.target).hasClass("selected");
                        header.find(`.${filterType}-filter`).children().removeClass("selected");
                        $(event.target).toggleClass("selected", !selected);
                        applyCompendiumFilter();
                    });
                });
            };

            // Add Rank, Rarity, Ring Filters
            await Promise.all([
                addFilter('rank'  , 'rank-filter', { type: "rank", number: [1, 2, 3, 4, 5] }),
                addFilter('rarity', 'rank-filter', { type: "rarity", number: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
                addFilter('ring'  , 'ring-filter', {}),
            ]);

            if (filtersToShow.source) {
                // Build the source select
                const selectableSourcesArray = [...allCompendiumReferencesSet].map((reference) => ({
                    value: reference,
                    label: CONFIG.l5r5e.sourceReference[reference]?.label ?? reference,
                    translate: true,
                    group: CONFIG.l5r5e.sourceReference[reference]?.type.split(",")[0] ?? "l5r5e.multiselect.sources_categories.others",
                    disabled: !sourcesInThisCompendium.has(reference) || (!game.user.isGM && unavailableSourceForPlayersSet.has(reference))
                }));
                const filterSourcesBox = L5r5eHtmlMultiSelectElement.create({
                    name: "filter-sources",
                    options: selectableSourcesArray,
                    localize: true,
                });
                header.append(filterSourcesBox.outerHTML);
                $("l5r5e-multi-select").on("change", applyCompendiumFilter);

                // If gm add an extra button to easily filter the content to see the same stuff as a player
                if (game.user.isGM && unavailableSourceForPlayersSet.size > 0) {
                    const buttonHTML = `<button type="button" class="gm" data-tooltip="${game.i18n.localize('l5r5e.multiselect.player_filter_tooltip')}">`
                        + game.i18n.localize('l5r5e.multiselect.player_filter_label')
                        + '</button>'

                    const filterPlayerViewArray = [...allCompendiumReferencesSet]
                        .filter((item) => !unavailableSourceForPlayersSet.has(item))
                        .filter((item) => sourcesInThisCompendium.has(item));

                    $(buttonHTML).appendTo($(header).find("l5r5e-multi-select")).click(function() {
                        header.find("l5r5e-multi-select")[0].value = filterPlayerViewArray;
                    });
                }
            }

            // TODO: This delay is a workaround and should be addressed in another way.
            // This is ugly but if we hide the content too early then it won't be hidden for some reason.
            // Current guess is that the foundry search filter is doing something.
            // Adding a delay here so that we hide the content. This will fail on slow computers/network...
            setTimeout(() => {
                applyCompendiumFilter();
            }, 250);

            return false;
        }
    }

    static updateCompendium(pack, documents, options, userId) {
        documents.forEach((document) => {
            const inc_reference = document?.system?.source_reference?.source?.trim();
            if (!!inc_reference) {
                const references = game.settings.get(CONFIG.l5r5e.namespace, "all-compendium-references");
                if (!references.includes(inc_reference)) {
                    references.push(inc_reference);
                    game.settings.set(CONFIG.l5r5e.namespace, "all-compendium-references", references);
                }
            }
        });
    }

    /**
     * DiceSoNice - Add L5R DicePresets
     */
    static diceSoNiceReady(dice3d) {
        const texturePath = `${CONFIG.l5r5e.paths.assets}dices/default/3d/`;

        // dice3d.addSystem({
        //     id: "l5r5e",
        //     name: "Legend of the Five Rings 5E"
        // }, "force");

        // Rings
        dice3d.addDicePreset(
            {
                name: "L5R Ring Dice",
                type: "dr",
                labels: Object.keys(game.l5r5e.RingDie.FACES).map(
                    (e) => `${texturePath}${game.l5r5e.RingDie.FACES[e].image.replace("ring_", "")}.png`
                ),
                bumpMaps: Object.keys(game.l5r5e.RingDie.FACES).map(
                    (e) => `${texturePath}${game.l5r5e.RingDie.FACES[e].image.replace("ring_", "")}_bm.png`
                ),
                colorset: "black",
                system: "standard",
            },
            "d6"
        );

        // Skills
        dice3d.addDicePreset(
            {
                name: "L5R Skill Dice",
                type: "ds",
                labels: Object.keys(game.l5r5e.AbilityDie.FACES).map(
                    (e) => `${texturePath}${game.l5r5e.AbilityDie.FACES[e].image.replace("skill_", "")}.png`
                ),
                bumpMaps: Object.keys(game.l5r5e.AbilityDie.FACES).map(
                    (e) => `${texturePath}${game.l5r5e.AbilityDie.FACES[e].image.replace("skill_", "")}_bm.png`
                ),
                colorset: "white",
                system: "standard",
            },
            "d12"
        );
    }

    /**
     * DiceSoNice - Do not show 3D roll for the Roll n Keep series
     *
     * @param {string} messageId
     * @param {object} context
     */
    static diceSoNiceRollStart(messageId, context) {
        // In DsN 4.2.1+ the roll is altered in context.
        // So we need to get the original message instead of "context.roll.l5r5e?.history"
        const message = game.messages.get(messageId);
        if (message?.rolls?.[0]?.l5r5e?.history) {
            context.blind = true;
        }
    }

    /**
     * Attempt to create a macro from the dropped data. Will use an existing macro if one exists.
     * @param {object} dropData     The dropped data
     * @param {number} slot         The hotbar slot to use
     * @returns {Promise}
     */
    static async #createItemMacro(dropData, slot) {
        const itemData = await Item.implementation.fromDropData(dropData);
        if (!itemData) {
            console.log("L5R5E | HK | Fail to get itemData", dropData);
            return null;
        }

        const macroData = {
            type: "script",
            scope: "actor",
            name: (itemData.actor?.name ? `${itemData.actor?.name} : ` : '') + itemData.name,
            img: itemData.img,
            command: `await Hotbar.toggleDocumentSheet("${itemData.uuid}")`,
        };

        // Assign the macro to the hotbar
        const macro = game.macros.find((m) =>
                m.name === macroData.name
                && m.command === macroData.command
                && m.isAuthor
            ) || await Macro.create(macroData);

        await game.user.assignHotbarMacro(macro, slot);
    }

    static async createCombatant(document, options, userId) {

        console.log(document, options, userId);

        new game.l5r5e.CombatActions().render(true);
    }
}
