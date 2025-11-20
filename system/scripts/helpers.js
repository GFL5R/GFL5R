import { L5r5ePopupManager } from './misc/l5r5e-popup-manager.js';

/**
 * Extends the actor to process special things from L5R.
 */
export class HelpersL5r5e {
    /**
     * Get Approaches/Element for List / Select
     * @param {Actor|null} actor
     * @return {{id: string, label: *, value}[]}
     */
    static getApproachesList(actor = null) {
        return CONFIG.l5r5e.stances.map((e) => ({
            id: e,
            label: game.i18n.localize(`l5r5e.approaches.${e}`),
            value: actor?.system?.approaches?.[e] || 1,
        }));
    }

    /**
     * Get Skills for List / Select with groups
     * @param {boolean} useGroup
     * @return {{cat: any, id: any, label: *}[]}
     */
    static getSkillsList(useGroup = false) {
        if (!useGroup) {
            return Array.from(CONFIG.l5r5e.skills).map(([id, cat]) => ({
                id: id,
                cat: cat,
                label: game.i18n.localize(`l5r5e.skills.${cat}.${id}`),
            }));
        }

        const skills = {};
        Array.from(CONFIG.l5r5e.skills).forEach(([id, cat]) => {
            if (!skills[cat]) {
                skills[cat] = [];
            }
            skills[cat].push({
                id: id,
                cat: cat,
                label: game.i18n.localize(`l5r5e.skills.${cat}.${id}`),
            });
        });
        return skills;
    }

    /**
     * Return Categories and Skill names in it
     * @return {Map}
     */
    static getCategoriesSkillsList() {
        return Array.from(CONFIG.l5r5e.skills).reduce((acc, [id, cat]) => {
            if (acc.has(cat)) {
                acc.set(cat, [...acc.get(cat), id]);
            } else {
                acc.set(cat, [id]);
            }
            return acc;
        }, new Map());
    }

    /**
     * Get Techniques for List / Select
     * @param types           core|school|title|custom
     * @param displayInTypes  null|true|false
     * @returns {{displayInTypes: boolean|*, id: any, label: *, type: *}[]}
     */
    static getTechniquesList({ types = [], displayInTypes = null }) {
        return Array.from(CONFIG.l5r5e.techniques)
            .filter(
                ([id, cfg]) =>
                    (types.length === 0 || types.includes(cfg.type)) &&
                    (displayInTypes === null || cfg.displayInTypes === displayInTypes)
            )
            .map(([id, cfg]) => ({
                id,
                label: game.i18n.localize(`l5r5e.techniques.${id}`),
                type: cfg.type,
                displayInTypes: cfg.displayInTypes,
            }));
    }

    /**
     * Return the list of Clans
     * @return {string[]}
     */
    static getLocalizedClansList() {
        return Object.entries(game.l5r5e.HelpersL5r5e.getLocalizedRawObject("l5r5e.clans"))
            .filter(([k, v]) => !["title", "label"].includes(k))
            .map(([k, v]) => v);
    }

    /**
     * Return the list of Schools (from compendium)
     * @return {string[]}
     */
    static getSchoolsList() {
        const comp = game.packs.get("l5r5e.core-journal-school-curriculum");
        if (!comp) {
            return [];
        }
        return Array.from(comp.index).map((v) => v.name);
    }

    /**
     * Get the raw object from localization, with fallback if the selected language is unknown
     * @param   {string} key
     * @returns {*}
     */
    static getLocalizedRawObject(key) {
        let object = foundry.utils.getProperty(game.i18n.translations, key);
        if (!!object) {
            return object;
        }
        object = foundry.utils.getProperty(game.i18n._fallback, key);
        return object ?? key;
    }

    /**
     * Return the list of Roles
     * @return {string[]}
     */
    static getLocalizedRolesList() {
        return CONFIG.l5r5e.roles.map((e) => game.i18n.localize(`l5r5e.roles.${e}`));
    }

    /**
     * Return the target object on a drag n drop event, or null if not found
     * @param {DragEvent} event
     * @return {Promise<null>}
     */
    static async getDragnDropTargetObject(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer?.getData("text/plain"));
        } catch (err) {
            return null;
        }
        return await HelpersL5r5e.getObjectGameOrPack(data);
    }

    /**
     * Return the object from Game or Pack by his ID, or null if not found
     * @param {string}      uuid     "Item.5qI6SU85VSFqji8W"
     * @param {string}      id       "5qI6SU85VSFqji8W"
     * @param {string}      type     Type ("Item", "JournalEntry"...)
     * @param {any[]|null}  data     Plain document data
     * @param {string|null} pack     Pack name
     * @param {string|null} parentId Used to avoid an infinite loop in properties if set
     * @return {Promise<null>}
     */
    static async getObjectGameOrPack({ uuid, id, type, data = null, pack = null, parentId = null }) {
        let document = null;

        try {
            // Direct Object
            if (data?._id) {
                document = HelpersL5r5e.createDocumentFromCompendium({ type, data });
            } else if (!uuid && (!id || !type)) {
                return null;
            }

            // UUID
            if (!document && !!uuid) {
                document = await fromUuid(uuid);
            }
            // TODO need to migrate to UUID

            // Named pack
            if (!document) {
                // If no pack passed, but it's a core item, we know the pack to get it
                if (!pack && id.substring(0, 7) === "L5RCore") {
                    pack = HelpersL5r5e.getPackNameForCoreItem(id);
                }

                if (pack) {
                    const tmpData = await game.packs.get(pack).getDocument(id);
                    if (tmpData) {
                        document = HelpersL5r5e.createDocumentFromCompendium({ type, data: tmpData });
                    }
                }
            }

            // Game object
            if (!document) {
                document = CONFIG[type].collection.instance.get(id);
            }

            // Unknown pack object, iterate all packs
            if (!document) {
                await Promise.all(game.packs.map(async (comp) => {
                    const tmpData = await comp.getDocument(id);
                    if (tmpData) {
                        document = HelpersL5r5e.createDocumentFromCompendium({ type, data: tmpData });
                    }
                }));
            }

            // Final
            if (document) {
                // Flag the source GUID
                if (document.uuid && !document._stats?.compendiumSource) {
                    document.updateSource({ "_stats.compendiumSource": document.uuid });
                }

                // Care to infinite loop in properties
                if (!parentId) {
                    await HelpersL5r5e.refreshItemProperties(document);
                }
                document.prepareData();
            }
        } catch (err) {
            console.warn("L5R5E | Helpers | ", err);
        }
        return document;
    }

    /**
     * Make a temporary item for compendium drag n drop
     * @param {string}          type
     * @param {ItemL5r5e|JournalL5r5e|any[]} data
     * @return {ItemL5r5e}
     */
    static createDocumentFromCompendium({ type, data }) {
        let document = null;

        switch (type) {
            case "Item":
                if (data instanceof game.l5r5e.ItemL5r5e) {
                    document = data;
                } else {
                    document = new game.l5r5e.ItemL5r5e(data);
                }
                break;

            case "JournalEntry":
                if (data instanceof game.l5r5e.JournalL5r5e) {
                    document = data;
                } else {
                    document = new game.l5r5e.JournalL5r5e(data);
                }
                break;

            default:
                console.log(`L5R5E | Helpers | createObjectFromCompendium - Unmanaged type ${type}`);
                break;
        } // swi

        return document;
    }

    /**
     * Babele and properties specific
     * @param {Document} document
     * @return {Promise<void>}
     */
    static async refreshItemProperties(document) {
        if (document.system?.properties && typeof Babele !== "undefined") {
            document.system.properties = await Promise.all(
                document.system.properties.map(async (property) => {
                    const gameProp = await HelpersL5r5e.getObjectGameOrPack({
                        id: property.id,
                        type: "Item",
                        parentId: document._id || 1,
                    });
                    if (gameProp) {
                        return { id: gameProp.id, name: gameProp.name };
                    } else {
                        console.warn(`L5R5E | Helpers | Unknown property id[${property.id}]`);
                    }
                    return property;
                })
            );
            document.updateSource({ "system.properties": document.system.properties });
        }
    }

    /**
     * Convert (op), (ex)... to associated symbols for content/descriptions
     * @param {string}  text     Input text
     * @param {boolean} toSymbol If True convert symbol to html (op), if false html to symbol
     * @return {string}
     */
    static convertSymbols(text, toSymbol) {
        CONFIG.l5r5e.symbols.forEach((cfg, tag) => {
            if (toSymbol) {
                text = text.replace(
                    new RegExp(HelpersL5r5e.escapeRegExp(tag), "g"),
                    `<i class="${cfg.class}" title="${game.i18n.localize(cfg.label)}"></i>`
                );
            } else {
                text = text.replace(new RegExp(`<i class="${cfg.class}" title(="[^"]*")?></i>`, "gi"), tag);
            }
        });
        return text;
    }

    /**
     * Escape Regx characters
     * @param {string} str
     * @return {string}
     */
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Get the associated pack for a core item (time saving)
     * @param {string} documentId
     * @return {string}
     */
    static getPackNameForCoreItem(documentId) {
        const core = new Map();

        core.set("Arm", "l5r5e.core-armors");
        core.set("Bon", "l5r5e.core-bonds");
        core.set("Boo", "l5r5e.core-celestial-implement-boons");
        core.set("Itp", "l5r5e.core-item-patterns");
        core.set("Ite", "l5r5e.core-items");
        core.set("Pro", "l5r5e.core-properties");
        core.set("Tit", "l5r5e.core-titles");
        core.set("Sig", "l5r5e.core-signature-scrolls");
        core.set("Wea", "l5r5e.core-weapons");

        core.set("Ins", "l5r5e.core-techniques-inversion");
        core.set("Inv", "l5r5e.core-techniques-invocations");
        core.set("Kat", "l5r5e.core-techniques-kata");
        core.set("Kih", "l5r5e.core-techniques-kiho");
        core.set("Mah", "l5r5e.core-techniques-maho");
        core.set("Man", "l5r5e.core-techniques-mantra");
        core.set("Mas", "l5r5e.core-techniques-mastery");
        core.set("Nin", "l5r5e.core-techniques-ninjutsu");
        core.set("Rit", "l5r5e.core-techniques-rituals");
        core.set("Shu", "l5r5e.core-techniques-shuji");
        core.set("Sch", "l5r5e.core-techniques-school");

        core.set("Adv", "l5r5e.core-peculiarities-adversities");
        core.set("Anx", "l5r5e.core-peculiarities-anxieties");
        core.set("Dis", "l5r5e.core-peculiarities-distinctions");
        core.set("Pas", "l5r5e.core-peculiarities-passions");

        core.set("Con", "l5r5e.core-journal-conditions");
        core.set("Opp", "l5r5e.core-journal-opportunities");
        core.set("Csc", "l5r5e.core-journal-school-curriculum");
        core.set("Ter", "l5r5e.core-journal-terrain-qualities");

        return core.get(documentId.replace(/L5RCore(\w{3})\d+/gi, "$1"));
    }

    /**
     * Show a confirm dialog before a deletion
     * @param {string} content
     * @param {function} callback The callback function for confirmed action
     */
    static confirmDeleteDialog(content, callback) {
        new Dialog({
            title: game.i18n.localize("Delete"),
            content,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-trash"></i>',
                    label: game.i18n.localize("Yes"),
                    callback,
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("No"),
                },
            },
        }).render(true);
    }

    /**
     * Display a dialog to choose what Item type to add
     * @param {string[]|null} types
     * @return {Promise<*>} Return the item type choice (armor, bond...)
     */
    static async showSubItemDialog(types = null) {
        // If no types, get the full list
        if (!types) {
            types = game.system.entityTypes.Item;
        }
        const title = game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize("Item") });

        // Render the template
        const html = await foundry.applications.handlebars.renderTemplate(`${CONFIG.l5r5e.paths.templates}dialogs/choose-item-type-dialog.html`, {
            type: null,
            types: types.reduce((obj, t) => {
                const label = CONFIG.Item.typeLabels[t] ?? t;
                obj[t] = game.i18n.has(label) ? game.i18n.localize(label) : t;
                return obj;
            }, {}),
        });

        // Display the dialog
        return Dialog.prompt({
            title: title,
            content: html,
            label: title,
            callback: (html) => $(html).find("[name='type'] option:selected").val(),
            rejectClose: false,
        });
    }

    static getApplication(appId) {
        const app = Object.values(ui.windows).find((e) => e.id === appId);
        if(app)
            return app;

        const appV2 = foundry.applications.instances.get(appId)
        if(appV2)
            return appV2;
    }

    /**
     * Notify Applications using Difficulty settings that the values was changed
     */
    static notifyDifficultyChange() {
        ["l5r5e-dice-picker-dialog"].forEach((appId) => {
            const app = this.getApplication(appId);
            if (app && typeof app.refresh === "function") {
                app.refresh();
            }
        });
    }

    /**
     * Send a refresh to socket, and on local windows app
     * @param {String} appId Application name
     */
    static refreshLocalAndSocket(appId) {
        game.l5r5e.sockets.refreshAppId(appId);
        this.getApplication(appId)?.refresh();
    }

    /**
     * Compute the Xp cost for cursus and total
     * @param {ItemL5r5e|ItemL5r5e[]} itemsList Item Data
     * @return {{xp_used_total: number, xp_used: number}}
     */
    static getItemsXpCost(itemsList) {
        let xp_used = 0;
        let xp_used_total = 0;

        if (!Array.isArray(itemsList)) {
            itemsList = [itemsList];
        }

        itemsList.forEach((item) => {
            let xp = parseInt(item.system.xp_used_total || item.system.xp_used || 0);

            // Full  price
            xp_used_total += xp;

            // if not in curriculum, xp spent /2 for this item
            if (!item.system.in_curriculum && xp > 0) {
                xp = Math.ceil(xp / 2);
            }

            // Halved or full
            xp_used += xp;
        });
        return { xp_used, xp_used_total };
    }

    /**
     * Subscribe to common events from the sheet.
     * @param {jQuery} html HTML content of the sheet.
     * @param {Actor} actor Actor Object
     */
    static commonListeners(html, actor = null) {
        // Toggle
        html.find(".toggle-on-click").on("click", (event) => {
            const elmt = $(event.currentTarget).data("toggle");
            const tgt = html.find("." + elmt);
            tgt.toggleClass("toggle-hidden");

            const appId = $(event.currentTarget).closest(".window-app").attr("id");
            if (appId) {
                game.l5r5e.storage.toggleKey(appId, elmt.toString());
            }
        });

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

        // Ability to drag n drop an actor
        html.find(".dragndrop-actor-uuid").on("dragstart", (event) => {
            // Compatibility actor-id (armies sheets)
            const actorId = $(event.currentTarget).data("actor-id");
            const actorUuid = $(event.currentTarget).data("actor-uuid");
            if (!actorId && !actorUuid) {
                return;
            }
            event.originalEvent.dataTransfer.setData(
                "text/plain",
                JSON.stringify({
                    type: "Actor",
                    uuid: actorUuid ? actorUuid : `Actor.${actorId}`, // TODO fix for v10 uuid required, remove use of id in futur
                })
            );
        });

        // Item detail tooltips
        new L5r5ePopupManager(
            html.find(".l5r5e-tooltip"),
            async (event) => {
                const item = await HelpersL5r5e.getEmbedItemByEvent(event, actor);
                if (!item) {
                    return;
                }
                return await item.renderTextTemplate();
            }
        );

        // Open actor sheet
        html.find(".open-sheet-from-uuid").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const uuid = $(event.currentTarget).data("uuid");
            const actorId = $(event.currentTarget).data("actor-id");
            if (!uuid && !actorId) {
                return;
            }
            if (actorId) {
                // Compatibility actor-id (armies sheets)
                game.actors.get(actorId)?.sheet?.render(true);
            }
            (await fromUuid(uuid))?.sheet?.render(true);
        });
    }

    /**
     * Get a Item from a Actor Sheet
     * @param {Event} event HTML Event
     * @param {ActorL5r5e} actor
     * @return {Promise<ItemL5r5e>}
     */
    static async getEmbedItemByEvent(event, actor) {
        const current = $(event.currentTarget);
        const itemId = current.data("item-id");
        const propertyId = current.data("property-id");
        const itemParentId = current.data("item-parent-id");

        let item;
        if (propertyId) {
            item = await HelpersL5r5e.getObjectGameOrPack({ id: propertyId, type: "Item" });
        } else if (itemParentId) {
            // Embed Item
            let parentItem;
            if (actor) {
                parentItem = actor.items?.get(itemParentId);
            } else {
                parentItem = game.items.get(itemParentId);
            }
            if (!parentItem) {
                return;
            }
            item = parentItem.items.get(itemId);
        } else {
            // Regular item
            item = actor.items.get(itemId);
        }
        if (!item) {
            return;
        }
        return item;
    }

    /**
     * Send the description of this Item to chat
     * @param {BaseSheetL5r5e|JournalL5r5e|ItemL5r5e} document
     * @return {Promise<*>}
     */
    static async sendToChat(document) {
        // Get the html
        const tpl = await document.renderTextTemplate();
        if (!tpl) {
            return;
        }

        // Get the JournalEntryPage instead of JournalEntry
        if (document.documentName === "JournalEntry") {
            document = document.getCurrentPage();
        }

        // Create the link
        let link = null;
        if (!document.actor && HelpersL5r5e.isLinkValid(document.link)) {
            link = document.link;
        }
        if (!link && document._stats?.compendiumSource) {
            link = document._stats.compendiumSource.replace(/(\w+)\.(.+)/, "@$1[$2]");
            if (!HelpersL5r5e.isLinkValid(link)) {
                link = null;
            }
        }
        if (!link && document.pack) {
            link = `@Compendium[${document.pack}.${document.id}]{${document.name}}`;
            if (!HelpersL5r5e.isLinkValid(link)) {
                link = null;
            }
        }

        // Send to Chat
        return ChatMessage.create({
            content: `<div class="l5r5e-chat-item">${tpl}${link ? `<hr>` + link : ""}</div>`,
        });
    }

    /**
     * Check if the link is valid (format "@Item[L5RCoreIte000042]{Amigasa}" / "@Compendium[l5r5e.core-peculiarities-distinctions.L5RCoreDis000002]{Ambidextrie}")
     * @param  {string} link
     * @return {boolean}
     */
    static async isLinkValid(link) {
        const [type, target] = link.replace(/@(\w+)\[([^\]]+)\].*/, "$1|$2").split("|");
        const document = await fromUuid((type === 'UUID' ? target : `${type}.${target}`));
        return !!document;
    }

    /**
     * Return the RollMode for this ChatData
     * @param  {object} chatData
     * @return {string}
     */
    static getRollMode(chatData) {
        if (chatData.whisper.length === 1 && chatData.whisper[0] === game.user.id) {
            return "selfroll";
        }
        if (chatData.blind) {
            return "blindroll";
        }
        if (chatData.whisper.length > 1) {
            return "gmroll";
        }
        return "roll";
    }

    /**
     * Isolated Debounce by Id
     *
     * Usage : game.l5r5e.HelpersL5r5e.debounce('appId', (text) => { console.log(text) })('my text');
     *
     * @param id       Named id
     * @param callback Callback function
     * @param timeout  Wait time (500ms by default)
     * @param leading  If true the callback will be executed only at the first debounced-function call,
     *                 otherwise the callback will only be executed `delay` milliseconds after the last debounced-function call
     * @return {(function(...[*]=): void)|*}
     */
    static debounce(id, callback, timeout = 500, leading = false) {
        if (!this.debounce.timeId) {
            this.debounce.timeId = {};
        }
        return (...args) => {
            if (leading) {
                // callback will be executed only at the first debounced-function call
                if (!this.debounce.timeId[id]) {
                    callback.apply(this, args);
                }
                clearTimeout(this.debounce.timeId[id]);
                this.debounce.timeId[id] = setTimeout(() => {
                    this.debounce.timeId[id] = undefined;
                }, timeout);
            } else {
                // callback will only be executed `delay` milliseconds after the last debounced-function call
                clearTimeout(this.debounce.timeId[id]);
                this.debounce.timeId[id] = setTimeout(() => {
                    callback.apply(this, args);
                }, timeout);
            }
        };
    }

    /**
     * Shortcut method to draw names to chat (private) from a table in compendium without importing it
     * @param {String} pack                Compendium name
     * @param {String} tableName           Table name/id in this compendium
     * @param {String} retrieve            How many draw we do
     * @param {object} opt                 drawMany config option object
     * @return {Promise<{RollTableDraw}>}  The drawn results
     */
    static async drawManyFromPack(pack, tableName, retrieve = 5, opt = { rollMode: "selfroll" }) {
        const comp = await game.packs.get(pack);
        if (!comp) {
            console.log(`L5R5E | Helpers | Pack not found[${pack}]`);
            return;
        }
        await comp.getDocuments();

        const table = await (/^[a-zA-Z0-9]{16}$/.test(tableName) ? comp.get(tableName) : comp.getName(tableName));
        if (!table) {
            console.log(`L5R5E | Helpers | Table not found[${tableName}]`, comp, table);
            return;
        }
        return await table.drawMany(retrieve, opt);
    }

    /**
     * Return the string simplified for comparaison
     * @param  {string} str
     * @return {string}
     */
    static normalize(str) {
        return str
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[\W]/g, " ") // remove non word things
            .toLowerCase()
            .trim();
    }

    /**
     * Autocomplete for an input, from array values
     * @param {jQuery}   html HTML content of the sheet.
     * @param {string}   name Html name of the input
     * @param {string[]} list Array of string to display
     * @param {string}   sep  Separator (optional, default "")
     */
    static autocomplete(html, name, list = [], sep = "") {
        const inp = document.getElementsByName(name)?.[0];
        if (!inp || list.length < 1) {
            return;
        }
        let currentFocus;

        // Add wrapper class to the parent node of the input
        inp.classList.add("autocomplete");
        inp.parentNode.classList.add("autocomplete-wrapper");

        const closeAllLists = (elmnt = null) => {
            const collection = document.getElementsByClassName("autocomplete-list");
            for (let item of collection) {
                if (!elmnt || (elmnt !== item && elmnt !== inp)) {
                    item.parentNode.removeChild(item);
                }
            }
        };

        // Abort submit on change in foundry form
        inp.addEventListener("change", (e) => {
            if (e.doSubmit) {
                closeAllLists();
                if (e.autoCompleteSelectedIndex) {
                    $(inp).prepend(
                        `<input type="hidden" name="autoCompleteListName" value="${name}">` +
                            `<input type="hidden" name="autoCompleteListSelectedIndex" value="${e.autoCompleteSelectedIndex}">`
                    );
                }
                $(inp).parent().submit();
                return true;
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // execute a function when someone writes in the text field
        inp.addEventListener("input", (inputEvent) => {
            closeAllLists();

            let val = inputEvent.target.value.trim();
            if (!val) {
                return false;
            }

            // separator
            let previous = [val];
            let currentIdx = 0;
            if (sep) {
                currentIdx = (
                    val.substring(0, inputEvent.target.selectionStart).match(new RegExp(`[${sep}]`, "g")) || []
                ).length;
                previous = val.split(sep);
                val = previous[currentIdx].trim();
            }

            currentFocus = -1;

            // create a DIV element that will contain the items (values)
            const listDiv = document.createElement("DIV");
            listDiv.setAttribute("id", inputEvent.target.id + "autocomplete-list");
            listDiv.setAttribute("class", "autocomplete-list");

            // append the DIV element as a child of the autocomplete container
            inputEvent.target.parentNode.appendChild(listDiv);

            list.forEach((value, index) => {
                if (HelpersL5r5e.normalize(value.substring(0, val.length)) === HelpersL5r5e.normalize(val)) {
                    const choiceDiv = document.createElement("DIV");
                    choiceDiv.setAttribute("data-id", index);
                    choiceDiv.innerHTML = `<strong>${value.substring(0, val.length)}</strong>${value.substring(
                        val.length
                    )}`;

                    choiceDiv.addEventListener("click", (clickEvent) => {
                        const selectedIndex = clickEvent.target.attributes["data-id"]?.value;
                        if (!list[selectedIndex]) {
                            return;
                        }
                        previous[currentIdx] = list[selectedIndex];
                        inp.value = previous.map((e) => e.trim()).join(sep + " ");

                        const changeEvt = new Event("change");
                        changeEvt.doSubmit = true;
                        changeEvt.autoCompleteSelectedIndex = selectedIndex;
                        inp.dispatchEvent(changeEvt);
                    });
                    listDiv.appendChild(choiceDiv);
                }
            });
        });

        // execute a function presses a key on the keyboard
        inp.addEventListener("keydown", (e) => {
            const collection = document.getElementById(e.target.id + "autocomplete-list")?.getElementsByTagName("div");
            if (!collection) {
                return;
            }
            switch (e.code) {
                case "ArrowUp":
                case "ArrowDown":
                    // focus index
                    currentFocus += e.code === "ArrowUp" ? -1 : 1;
                    if (currentFocus >= collection.length) {
                        currentFocus = 0;
                    }
                    if (currentFocus < 0) {
                        currentFocus = collection.length - 1;
                    }
                    // css classes
                    for (let item of collection) {
                        item.classList.remove("autocomplete-active");
                    }
                    collection[currentFocus]?.classList.add("autocomplete-active");
                    break;

                case "Tab":
                case "Enter":
                    e.preventDefault();
                    if (currentFocus > -1 && !!collection[currentFocus]) {
                        collection[currentFocus].click();
                    }
                    break;

                case "Escape":
                    closeAllLists();
                    break;
            } //swi
        });

        // Close all list when click in the document (1st autocomplete only)
        if (html.find(".autocomplete").length <= 1) {
            html[0].addEventListener("click", (e) => {
                const collection = document
                    .getElementById(e.target.id + "autocomplete-list")
                    ?.getElementsByTagName("div");
                if (collection !== undefined) {
                    const changeEvt = new Event("change");
                    changeEvt.doSubmit = true;
                    inp.dispatchEvent(changeEvt);
                } else {
                    closeAllLists(e.target);
                }
            });
        }
    }
}
