/**
 * L5R Character generator base object
 */
export class CharacterGenerator {
    /**
     * Base age (minimal)
     */
    static baseAge = 15;

    /**
     * Payload Object
     */
    data = {
        avgApproachesValue: 3, // 1-5
        clan: "random",
        family: "",
        gender: "male",
        age: CharacterGenerator.baseAge,
        maritalStatus: "",
    };

    /**
     * Initialize the generator
     * @param {number} avgApproachesValue number between 1 and 5
     * @param {string} clanName      random|crab|crane...
     * @param {string} gender        random|male|female
     */
    constructor({ avgApproachesValue = 3, clanName = "random", gender = "random" }) {
        if (!CONFIG.l5r5e.families.has(clanName)) {
            clanName = "random";
        }
        if (clanName === "random") {
            clanName = CharacterGenerator._getRandomArrayValue(Array.from(CONFIG.l5r5e.families.keys()));
        }
        if (gender === "random" || !["male", "female"].includes(gender)) {
            gender = Math.random() > 0.5 ? "male" : "female";
        }

        this.data.avgApproachesValue = CharacterGenerator.sanitizeMinMax(avgApproachesValue);
        this.data.clan = clanName;
        this.data.family = CharacterGenerator._getRandomFamily(clanName);
        this.data.gender = gender;
    }

    /**
     * Return true if the gender is Female
     * @return {boolean}
     */
    get isFemale() {
        return this.data.gender === "female";
    }

    /**
     * Return a random value for this array
     * @param  {String[]} array
     * @return {String}
     * @private
     */
    static _getRandomArrayValue(array) {
        return array[Math.floor(Math.random() * array.length)] ?? "";
    }

    /**
     * Return a random value between min and max
     * @param  {number} min
     * @param  {number} max
     * @return {number}
     * @private
     */
    static _randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Always return a number between 1 and 5
     * @param  {number} number
     * @return {number}
     */
    static sanitizeMinMax(number) {
        return Math.min(5, Math.max(1, number));
    }

    /**
     * Return a Item from this pack (by id if provided, or random otherwise)
     * @param  {string} packName
     * @param  {string} id
     * @return {Promise<Document|undefined>}
     * @private
     */
    static async _getItemFromPack(packName, id = null) {
        const comp = await game.packs.get(packName);
        if (!comp) {
            console.log(`L5R5E | CG | Pack not found[${packName}]`);
            return;
        }
        let document;
        if (id) {
            document = await comp.getDocument(id);
        } else {
            if (!comp.indexed) {
                await comp.getDocuments();
            }
            document = comp.getDocument(CharacterGenerator._getRandomArrayValue(Array.from(comp.index.keys())));
        }
        await game.l5r5e.HelpersL5r5e.refreshItemProperties(document);
        return document;
    }

    /**
     * Generate and return a family name for this clan
     * @param  {string} clanName
     * @return {string}
     * @private
     */
    static _getRandomFamily(clanName) {
        let originClan = clanName;

        // Ronin specific, can be any other family name
        if (clanName === "ronin") {
            originClan = CharacterGenerator._getRandomArrayValue(
                Array.from(CONFIG.l5r5e.families.keys()).filter((e) => e !== "ronin")
            );
        }

        return CharacterGenerator._getRandomArrayValue(CONFIG.l5r5e.families.get(originClan));
    }

    /**
     * Generate and return a firstname
     * @return {Promise<string>}
     */
    static async getRandomizedFirstname(isFemale, clan) {
        let table = `L5RCoreTblJpNam${isFemale ? "F" : "M"}`;
        switch (clan) {
            case "ivory_kingdoms":
                table = "aTVXI5Y5t7cBfyUE";
                break;
            case "qamarist":
                table = "bXaEmt72GLUeoyzz";
                break;
            case "ujik":
                table = "d9lU98NE8G2YuN48";
                break;
        }
        const randomNames = await game.l5r5e.HelpersL5r5e.drawManyFromPack("l5r5e.core-name-tables", table, 1, {
            displayChat: false,
        });
        return randomNames?.results[0]?.text || "";
    }

    /**
     * Generate the actor age
     * @param  {number} avgApproachesValue
     * @return {number}
     */
    static genAge(avgApproachesValue) {
        return CharacterGenerator._randomInt(
            CharacterGenerator.baseAge,
            avgApproachesValue * 10 + CharacterGenerator.baseAge
        );
    }

    /**
     * Return the marriage state
     * @param  {number} age
     * @return {string} unmarried|betrothed|married|widowed
     */
    static genMaritalStatus(age) {
        const rng = Math.random();
        if (age < 20) {
            return rng < 0.1 ? "married" : rng < 0.4 ? "betrothed" : "unmarried";
        }
        if (age < 30) {
            return rng < 0.4 ? "married" : rng < 0.7 ? "betrothed" : "unmarried";
        }
        return rng < 0.8 ? "married" : rng < 0.9 ? "widowed" : "unmarried";
    }

    /**
     * Generate the marital partner
     * @param  {string}  maritalStatus unmarried|betrothed|married|widowed
     * @param  {number}  avgApproachesValue
     * @param  {string}  clan
     * @param  {string}  family
     * @param  {boolean} isFemale
     * @return {Promise<{age: number, name: string, clan: string, family: string, female: boolean}>}
     */
    static async genMaritalPartner(maritalStatus, avgApproachesValue, clan, family, isFemale) {
        const alreadyMerged = maritalStatus !== "betrothed";
        const partner = {
            age: CharacterGenerator.genAge(avgApproachesValue),
            clan: "",
            family: "",
            female: Math.random() > 0.9 ? isFemale : !isFemale,
            name: "",
        };

        partner.clan =
            alreadyMerged || Math.random() > 0.7
                ? clan
                : CharacterGenerator._getRandomArrayValue(Array.from(CONFIG.l5r5e.families.keys()));

        partner.family = alreadyMerged ? family : CharacterGenerator._getRandomFamily(partner.clan);
        partner.name = await CharacterGenerator.getRandomizedFirstname(partner.female, partner.clan);
        return partner;
    }

    /**
     * Generate children
     * @param  {number} age  Current npc age
     * @param  {string} clan Current npc clan
     * @return {Promise<string[]>}
     */
    static async genChildren(age, clan) {
        const childs = [];

        let ageLoop = Math.max(0, age - CharacterGenerator.baseAge - 1);
        while (ageLoop > 0) {
            const childAge = CharacterGenerator._randomInt(1, ageLoop);

            if (Math.random() > 0.66) {
                const childIsFemale = Math.random() > 0.5;
                const childName = await CharacterGenerator.getRandomizedFirstname(childIsFemale, clan);

                childs.push(
                    `${childName} (${childAge}, ${game.i18n.localize(
                        "l5r5e.social.gender." + (childIsFemale ? "female" : "male")
                    )})`
                );
            }

            ageLoop -= childAge + 1;
        }

        return childs;
    }

    /**
     * Generate Honor, Glory and Status values
     * @param  {number} age
     * @param  {string} clan
     * @return {{honor: number, glory: number, status: number}}
     */
    static genSocialStanding(age, clan) {
        const karma = Math.random() < 0.66 ? 1 : -1;
        const rng = (initial, variation) => {
            return initial + CharacterGenerator._randomInt(5, variation) * karma;
        };

        let honor = rng(34, age / 2);
        switch (clan) {
            case "lion":
                honor += 10;
                break;
            case "scorpion":
                honor -= 10;
                break;
        }
        return {
            honor,
            glory: rng(40, age / 3),
            status: rng(30, age / 4),
        };
    }

    /**
     * Modify the current actor datas with selected options
     *
     * @param  {ActorL5r5e} actor                 Actor object
     * @param  {Object}     generate
     * @param  {boolean}    generate.name          If true generate a new name
     * @param  {boolean}    generate.identity      If true generate Clan, Gender, Age, Marital status
     * @param  {boolean}    generate.attributes    If true generate Rings, attributes, skills and confrontation ranks
     * @param  {boolean}    generate.demeanor      If true generate Demeanor and rings affinities
     * @param  {boolean}    generate.peculiarities If true generate Advantage and Disadvantage
     * @param  {boolean}    generate.items         If true generate Armor, Weapons and Items
     * @param  {boolean}    generate.techniques    If true generate Shuji, Katas...
     * @param  {boolean}    generate.narrative     If true generate Narrative and fluff
     * @return {Promise<Object>}
     */
    async toActor(
        actor,
        generate = {
            name: true,
            attributes: true,
            identity: true,
            demeanor: true,
            peculiarities: true,
            items: true,
            techniques: true,
            narrative: true,
        }
    ) {
        const actorDatas = actor.system;
        const isNpc = actor.type === "npc";

        // Need to set some required values
        this.data.age = actorDatas.identity.age || CharacterGenerator.genAge(this.data.avgApproachesValue);
        this.data.maritalStatus =
            actorDatas.identity.marital_status || CharacterGenerator.genMaritalStatus(this.data.age);

        actorDatas.identity.clan = this.data.clan;
        actorDatas.identity.family = this.data.family;
        actorDatas.identity.female = this.isFemale;

        // Name
        let newName = actor.name;
        if (generate.name) {
            newName =
                this.data.family +
                " " +
                (await CharacterGenerator.getRandomizedFirstname(this.isFemale, this.data.clan));
        }

        // Identity
        if (generate.identity) {
            actorDatas.identity.age = CharacterGenerator.genAge(this.data.avgApproachesValue);
            actorDatas.identity.marital_status = CharacterGenerator.genMaritalStatus(this.data.age);
            await this._generateNotes(actorDatas);
        }

        // Img (only if system defaults)
        const folder = "systems/l5r5e/assets/icons/actors";
        const newImg = [
            `${folder}/npc.svg`,
            `${folder}/traditional-japanese-man.svg`,
            `${folder}/traditional-japanese-woman.svg`,
        ].includes(actor.img)
            ? `${folder}/traditional-japanese-${this.isFemale ? "woman" : "man"}.svg`
            : actor.img;

        // Generate attributes & Social Standing
        if (generate.attributes) {
            // Generate attributes (rings, attributes, skills, confrontation ranks)
            this._generateAttributes(isNpc, actorDatas);

            // Social Standing
            const social = CharacterGenerator.genSocialStanding(this.data.age, this.data.clan);
            actorDatas.social.honor = social.honor;
            actorDatas.social.glory = social.glory;
            actorDatas.social.status = social.status;
        }

        // Demeanor (npc only)
        if (isNpc && generate.demeanor) {
            this._generateDemeanor(actorDatas);
        }

        // Item types
        if (generate.peculiarities || generate.items || generate.techniques) {
            const newItemsData = [];

            // Advantage / Disadvantage
            if (generate.peculiarities) {
                await this._generatePeculiarities(actor, newItemsData);
            }

            // Items
            if (generate.items) {
                await this._generateItems(actor, newItemsData);
            }

            // Techniques
            if (generate.techniques) {
                await this._generateTechniques(actor, newItemsData);
            }

            // Add to actor
            if (newItemsData.length > 0) {
                await actor.createEmbeddedDocuments("Item", newItemsData);
            }
        }

        // Narrative
        if (generate.narrative) {
            this._generateNarrative(actorDatas);
        }

        // return actor data
        return {
            img: newImg,
            name: newName,
            system: actorDatas,
        };
    }

    //<editor-fold desc="toActor generators">
    /**
     * Generate attributes (rings, attributes, skills, confrontation ranks)
     * @param {boolean}             isNpc
     * @param {DocumentData.system} actorDatas
     * @private
     */
    _generateAttributes(isNpc, actorDatas) {
        const stats = { min: 5, max: 1 };

        // Approaches
        CONFIG.l5r5e.stances.forEach((approachName) => {
            // avgApproachesValue + (-1|0|1)
            actorDatas.approaches[approachName] = CharacterGenerator.sanitizeMinMax(
                this.data.avgApproachesValue - 1 + Math.floor(Math.random() * 3)
            );
            stats.min = Math.min(stats.min, actorDatas.approaches[approachName]);
            stats.max = Math.max(stats.max, actorDatas.approaches[approachName]);
        });

        // Attributes
        game.l5r5e.ActorL5r5e.computeDerivedAttributes(actorDatas);

        // Skills
        if (isNpc) {
            Object.keys(actorDatas.skills).forEach(
                (skillName) => (actorDatas.skills[skillName] = Math.floor(Math.random() * stats.max))
            );
        } else {
            // TODO PC skills
        }

        // Confrontation ranks (npc only)
        if (isNpc) {
            actorDatas.conflict_rank.martial = this.data.avgApproachesValue + actorDatas.skills.martial;
            actorDatas.conflict_rank.social = this.data.avgApproachesValue + actorDatas.skills.social;
        }
    }

    /**
     * Generate Demeanor (npc only)
     * @param {DocumentData.system} actorDatas
     * @private
     */
    _generateDemeanor(actorDatas) {
        // demeanor { id: "adaptable", mod: { fire: 2, earth: -2 } },
        const demeanor = CharacterGenerator._getRandomArrayValue(CONFIG.l5r5e.demeanors);
        actorDatas.attitude = game.i18n.localize("l5r5e.demeanor." + demeanor.id);
        actorDatas.rings_affinities = foundry.utils.mergeObject(
            {
                earth: 0,
                air: 0,
                water: 0,
                fire: 0,
                void: 0,
            },
            demeanor.mod
        );
    }

    /**
     * Generate Advantages and Disadvantages
     * @param  {ActorL5r5e} actor
     * @param  {DocumentData[]} newItemsData
     * @return {Promise<void>}
     * @private
     */
    async _generatePeculiarities(actor, newItemsData) {
        // Clear actor peculiarities
        const deleteIds = actor.items.filter((e) => e.type === "peculiarity").map((e) => e.id);
        if (deleteIds.length > 0) {
            await actor.deleteEmbeddedDocuments("Item", deleteIds);
        }

        // Add 1 each peculiarity
        for (const pack of ["adversities", "distinctions", "passions", "anxieties"]) {
            const item = await CharacterGenerator._getItemFromPack(`l5r5e.core-peculiarities-${pack}`);
            if (item) {
                newItemsData.push(foundry.utils.duplicate(item));
            }
        }
    }

    /**
     * Generate Armor, Weapons, Items
     * @param  {ActorL5r5e} actor
     * @param  {DocumentData[]} newItemsData
     * @return {Promise<void>}
     * @private
     */
    async _generateItems(actor, newItemsData) {
        // Clear actor items
        const deleteIds = actor.items.filter((e) => ["armor", "weapon", "item"].includes(e.type)).map((e) => e.id);
        if (deleteIds.length > 0) {
            await actor.deleteEmbeddedDocuments("Item", deleteIds);
        }

        // Items
        const itemCfg = {
            armors: [
                "L5RCoreArm000009", // Common Clothes
            ],
            weapons: [
                "L5RCoreWea000036", // Punch
                "L5RCoreWea000037", // Kick
                "L5RCoreWea000009", // Wakizashi
                "L5RCoreWea000007", // Katana
                "L5RCoreWea000019", // Knife
            ],
            items: [
                null, // Random item
            ],
        };
        if (this.data.clan === "crab") {
            itemCfg.armors.push("L5RCoreArm000001"); // Ashigaru Armor
            itemCfg.weapons.push("L5RCoreWea000017"); // Tetsubō
        }

        for (const pack in itemCfg) {
            for (const itemId of itemCfg[pack]) {
                const item = await CharacterGenerator._getItemFromPack(`l5r5e.core-${pack}`, itemId);
                if (item) {
                    newItemsData.push(foundry.utils.duplicate(item));
                }
            }
        }
    }

    /**
     * Generate Techniques
     * @param  {ActorL5r5e} actor
     * @param  {DocumentData[]} newItemsData
     * @return {Promise<void>}
     * @private
     */
    async _generateTechniques(actor, newItemsData) {
        // Clear actor items
        const deleteIds = actor.items.filter((e) => e.type === "technique").map((e) => e.id);
        if (deleteIds.length > 0) {
            await actor.deleteEmbeddedDocuments("Item", deleteIds);
        }

        const avgrv = this.data.avgApproachesValue;

        /**
         * Techs config
         *
         * example: {
         *   probability: .7,
         *     skill: {
         *     grp_name: "scholar",
         *     value_min: 1,
         *   },
         *   qty: {
         *     min: 1,
         *     max: avgrv,
         *   },
         * },
         */
        const techCfg = {
            kata: {
                probability: 1,
                skill: {
                    grp_name: "martial",
                    value_min: 1,
                },
                qty: {
                    min: 1,
                    max: avgrv,
                },
            },
            kiho: {
                probability: 0.1,
                skill: {
                    grp_name: "martial",
                    value_min: 1,
                },
            },
            ninjutsu: {
                probability: 0.1,
                skill: {
                    grp_name: "martial",
                    value_min: 1,
                },
            },
            shuji: {
                probability: 1,
                qty: {
                    min: 1,
                },
            },
            rituals: {
                probability: 0.2,
            },
            maho: {
                probability: 0.1,
            },
            invocations: {
                probability: 0.3,
                skill: {
                    grp_name: "scholar",
                    value_min: 1,
                },
                qty: {
                    min: 2,
                    max: Math.max(2, avgrv),
                },
            },
        };

        for (const pack in techCfg) {
            const cfg = techCfg[pack];

            // Minimum skill required (npc only for now)
            if (!!cfg.skill && actor.system.skills[cfg.skill.grp_name] < cfg.skill.value_min) {
                continue;
            }

            // Check probabilities to have more than min qty
            let qtyMax = cfg.qty?.min ?? 0;
            if (Math.random() < cfg.probability) {
                qtyMax = CharacterGenerator._randomInt(cfg.qty?.min ?? 0, cfg.qty?.max ?? avgrv);
            }

            for (let qty = 0; qty < qtyMax; qty++) {
                // Rank is limited by avgApproachesValue
                let item;
                do {
                    item = await CharacterGenerator._getItemFromPack(`l5r5e.core-techniques-${pack}`);
                } while (item && item.system.rank > avgrv);

                if (item) {
                    newItemsData.push(foundry.utils.duplicate(item));
                }
            } // fr qty
        } // fr techCfg
    }

    /**
     * Fill notes with some values that don't appear in sheet
     * @param  {DocumentData.system} actorDatas
     * @return {Promise<void>}
     * @private
     */
    async _generateNotes(actorDatas) {
        actorDatas.notes =
            `${game.i18n.localize("l5r5e.social.age")}: ${this.data.age}</p>` +
            `<p>${game.i18n.localize("l5r5e.social.gender.title")}: ${game.i18n.localize(
                "l5r5e.social.gender." + this.data.gender
            )}</p>` +
            `<p>${game.i18n.localize("l5r5e.clans.label")}: ${game.i18n.localize(
                "l5r5e.clans." + this.data.clan
            )}</p>` +
            `<p>${game.i18n.localize("l5r5e.social.marital_status.title")}: ${game.i18n.localize(
                "l5r5e.social.marital_status." + this.data.maritalStatus
            )}</p>`;

        // Define partner identity
        if (this.data.maritalStatus !== "unmarried") {
            const partner = await CharacterGenerator.genMaritalPartner(
                this.data.maritalStatus,
                this.data.avgApproachesValue,
                this.data.clan,
                this.data.family,
                this.isFemale
            );

            actorDatas.notes +=
                "<p>" +
                `${game.i18n.localize("l5r5e.social.marital_status.partner")}:` +
                ` ${partner.family} ${partner.name}` +
                ` (${partner.age}, ${game.i18n.localize(
                    "l5r5e.social.gender." + (partner.female ? "female" : "male")
                )})` +
                "</p>";

            // Childs
            const childs = await CharacterGenerator.genChildren(Math.min(this.data.age, partner.age), this.data.clan);
            if (childs.length > 0) {
                actorDatas.notes += `<p>${game.i18n.localize("l5r5e.social.children")}: ${childs.join(", ")}</p>`;
            }
        }
    }

    /**
     * Generate Narrative fluff
     * @param {DocumentData.system} actorDatas
     * @private
     */
    _generateNarrative(actorDatas) {
        // TODO generateNarrative
        // actorDatas.description = '';
    }
    //</editor-fold>
}
