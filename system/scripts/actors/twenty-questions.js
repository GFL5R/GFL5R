/**
 * L5R Twenty Questions Base object
 */
export class TwentyQuestions {
    /**
     * Shortcut for all rings Id in data
     */
    static ringList = ["step1.ring", "step2.ring", "step3.ring1", "step3.ring2", "step4.ring"];

    /**
     * Shortcut for all skills Id in data
     */
    static skillList = [
        "step1.skill",
        "step2.skill1",
        "step2.skill2",
        "step3.skill1",
        "step3.skill2",
        "step3.skill3",
        "step3.skill4",
        "step3.skill5",
        "step7.skill",
        "step8.skill",
        "step13.skill",
        "step17.skill",
        "step18.skill",
    ];

    /**
     * Shortcut for all Items to build cache
     */
    static itemsList = [
        "step3.techniques",
        "step3.school_ability",
        "step3.equipment",
        "step9.distinction",
        "step8.item",
        "step10.adversity",
        "step11.passion",
        "step12.anxiety",
        "step13.advantage",
        "step13.disadvantage",
        "step14.special_features",
        "step16.item",
        "step17.bond",
        "step18.heritage_item",
    ];

    /**
     * All this object data (Steps)
     */
    data = {
        template: "core",
        generated: false,
        step1: {
            clan: "",
            ring: "",
            skill: "",
            social_status: 30,
        },
        step2: {
            family: "",
            ring: "",
            skill1: "",
            skill2: "",
            wealth: 3,
            social_glory: 39,
        },
        step3: {
            school: "",
            roles: "",
            ring1: "",
            ring2: "",
            skill1: "",
            skill2: "",
            skill3: "",
            skill4: "",
            skill5: "",
            allowed_techniques: {
                kata: false,
                kiho: false,
                inversion: false,
                invocation: false,
                ritual: false,
                shuji: false,
                maho: false,
                ninjutsu: false,
                mantra: false,
                specificity: true,
            },
            techniques: [],
            school_ability: [],
            equipment: [],
            social_honor: 30,
        },
        step4: {
            stand_out: "",
            ring: "",
        },
        step5: {
            social_giri: "",
        },
        step6: {
            social_ninjo: "",
        },
        step7: {
            clan_relations: "",
            skill: "",
            social_add_glory: 5,
        },
        step8: {
            bushido: "",
            skill: "",
            social_add_honor: 10,
            tenet_paramount: "",
            tenet_less_significant: "",
            item: [],
        },
        step9: {
            success: "",
            distinction: [],
        },
        step10: {
            difficulty: "",
            adversity: [],
        },
        step11: {
            calms: "",
            passion: [],
        },
        step12: {
            worries: "",
            anxiety: [],
        },
        step13: {
            most_learn: "",
            skill: "",
            advantage: [],
            disadvantage: [],
        },
        step14: {
            first_sight: "",
            special_features: [],
        },
        step15: {
            stress: "",
        },
        step16: {
            relations: "",
            item: [],
        },
        step17: {
            parents_pov: "",
            skill: "",
            bond: [],
        },
        step18: {
            heritage_name: "",
            heritage_1: null,
            heritage_2: null,
            heritage_item: [],
            heritage_add_honor: 0,
            heritage_add_glory: 0,
            heritage_add_status: 0,
        },
        step19: {
            firstname: "",
        },
        step20: {
            death: "",
        },
    };

    /**
     * Create
     */
    constructor(actor = null) {
        if (actor instanceof Actor) {
            this.fromActor(actor);
        }
    }

    /**
     * Update object with form data
     */
    updateFromForm(formData) {
        this.data = foundry.utils.mergeObject(this.data, foundry.utils.expandObject(formData));
    }

    /**
     * Initialize data from a actor
     */
    fromActor(actor) {
        const actorDatas = actor.system;

        // already 20q struct ?
        if (!foundry.utils.isEmpty(actorDatas.twenty_questions)) {
            this.data = {
                ...this.data,
                ...actorDatas.twenty_questions,
            };
            return;
        }

        // If not fill some values
        this.data.step1.clan = actorDatas.identity.clan;
        this.data.step2.family = actorDatas.identity.family;
        this.data.step3.school = actorDatas.identity.school;
        this.data.step3.roles = actorDatas.identity.roles;
        this.data.step3.allowed_techniques.kata = actorDatas.techniques.kata;
        this.data.step3.allowed_techniques.kiho = actorDatas.techniques.kiho;
        this.data.step3.allowed_techniques.inversion = actorDatas.techniques.inversion;
        this.data.step3.allowed_techniques.invocation = actorDatas.techniques.invocation;
        this.data.step3.allowed_techniques.ritual = actorDatas.techniques.ritual;
        this.data.step3.allowed_techniques.shuji = actorDatas.techniques.shuji;
        this.data.step3.allowed_techniques.maho = actorDatas.techniques.maho;
        this.data.step3.allowed_techniques.ninjutsu = actorDatas.techniques.ninjutsu;
        this.data.step3.allowed_techniques.mantra = actorDatas.techniques.mantra;
        this.data.step5.social_giri = actorDatas.social.giri;
        this.data.step6.social_ninjo = actorDatas.social.ninjo;
        this.data.step8.tenet_paramount = actorDatas.social.bushido_tenets.paramount;
        this.data.step8.tenet_less_significant = actorDatas.social.bushido_tenets.less_significant;
        this.data.step19.firstname = actor.name.replace(/^(?:\w+\s+)?(.+)$/gi, "$1") || "";
    }

    /**
     * Fill a actor data from this object
     */
    async toActor(actor, itemsCache) {
        const actorDatas = actor.system;
        const formData = this.data;

        this.data.generated = true;

        const status = parseInt(formData.step1.social_status) + parseInt(formData.step18.heritage_add_status);

        const glory =
            parseInt(formData.step2.social_glory) +
            parseInt(formData.step7.social_add_glory) +
            parseInt(formData.step18.heritage_add_glory);

        const honor =
            parseInt(formData.step3.social_honor) +
            parseInt(formData.step8.social_add_honor) +
            parseInt(formData.step18.heritage_add_honor);

        // Update the actor
        actorDatas.soft_locked = true;
        actorDatas.template = formData.template;
        actorDatas.zeni = Math.floor(formData.step2.wealth * 50);
        actorDatas.identity = {
            ...actorDatas.identity,
            clan: formData.step1.clan,
            family: formData.step2.family,
            school: formData.step3.school,
            roles: formData.step3.roles,
        };

        actorDatas.social = {
            ...actorDatas.social,
            status: status,
            glory: glory,
            honor: honor,
            giri: formData.step5.social_giri,
            ninjo: formData.step6.social_ninjo,
            bushido_tenets: {
                paramount: formData.step8.tenet_paramount,
                less_significant: formData.step8.tenet_less_significant,
            },
        };

        actorDatas.techniques = {
            ...actorDatas.techniques,
            kata: !!formData.step3.allowed_techniques.kata,
            kiho: !!formData.step3.allowed_techniques.kiho,
            inversion: !!formData.step3.allowed_techniques.inversion,
            invocation: !!formData.step3.allowed_techniques.invocation,
            ritual: !!formData.step3.allowed_techniques.ritual,
            shuji: !!formData.step3.allowed_techniques.shuji,
            maho: !!formData.step3.allowed_techniques.maho,
            ninjutsu: !!formData.step3.allowed_techniques.ninjutsu,
            mantra: !!formData.step3.allowed_techniques.mantra,
        };

        // Rings - Reset to 1, and apply modifiers
        CONFIG.l5r5e.stances.forEach((ring) => (actorDatas.rings[ring] = 1));
        TwentyQuestions.ringList.forEach((formName) => {
            const ring = foundry.utils.getProperty(this.data, formName);
            if (ring !== "none") {
                actorDatas.rings[ring] = actorDatas.rings[ring] + 1;
            }
        });

        // Skills - Reset to 0, and apply modifiers
        Array.from(CONFIG.l5r5e.skills).forEach(([skillId, skillCat]) => {
            actorDatas.skills[skillCat][skillId] = 0;
        });
        TwentyQuestions.skillList.forEach((formName) => {
            const skillId = foundry.utils.getProperty(this.data, formName);
            const skillCat = CONFIG.l5r5e.skills.get(skillId);
            if (skillId !== "none") {
                actorDatas.skills[skillCat][skillId] = actorDatas.skills[skillCat][skillId] + 1;
            }
        });

        // Clear and add items to actor
        const deleteIds = actor.items.map((e) => e.id);
        if (deleteIds.length > 0) {
            await actor.deleteEmbeddedDocuments("Item", deleteIds);
        }

        // Add items in 20Q to actor
        const newItemsData = [];
        Object.values(itemsCache).forEach((types) => {
            types.forEach((item) => {
                const itemData = foundry.utils.duplicate(item);
                if (itemData.system?.bought_at_rank) {
                    itemData.system.bought_at_rank = 0;
                }
                if (itemData.system?.xp_spent) {
                    itemData.system.xp_spent = 0;
                }
                newItemsData.push(itemData);
            });
        });
        if (newItemsData.length > 0) {
            await actor.createEmbeddedDocuments("Item", newItemsData);
        }

        // Update actor
        await actor.update({
            name: ((formData.template !== "pow" ? formData.step2.family + " " : "") + formData.step19.firstname).trim(),
            system: actorDatas,
        });
    }

    /**
     * Return summary and errors if any
     */
    validateForm() {
        const out = {
            errors: [],
            summary: {
                rings: [],
                skills: [],
                status: 0,
                glory: 0,
                honor: 0,
            },
        };

        // Rings & Skills, 3pt max for each
        const rings = this.summariesRingsOrSkills("ringList");
        for (const key in rings) {
            // ring start at 1
            rings[key] = rings[key] + 1;
            const label = `${game.i18n.localize("l5r5e.rings." + key)} (${rings[key]})`;
            if (rings[key] > 3) {
                out.errors.push(label);
            }
            out.summary.rings.push(label);
        }

        const skills = this.summariesRingsOrSkills("skillList");
        for (const key in skills) {
            // skill start at 0
            const label = `${game.i18n.localize("l5r5e.skills." + CONFIG.l5r5e.skills.get(key) + "." + key)} (${
                skills[key]
            })`;
            if (skills[key] > 3) {
                out.errors.push(label);
            }
            out.summary.skills.push(label);
        }

        out.summary.rings.sort((a, b) => {
            return a.localeCompare(b);
        });
        out.summary.skills.sort((a, b) => {
            return a.localeCompare(b);
        });

        out.summary.status = parseInt(this.data.step1.social_status) + parseInt(this.data.step18.heritage_add_status);

        out.summary.glory =
            parseInt(this.data.step2.social_glory) +
            parseInt(this.data.step7.social_add_glory) +
            parseInt(this.data.step18.heritage_add_glory);

        out.summary.honor =
            parseInt(this.data.step3.social_honor) +
            parseInt(this.data.step8.social_add_honor) +
            parseInt(this.data.step18.heritage_add_honor);

        return out;
    }

    /**
     * Return a list of ring/skill
     */
    summariesRingsOrSkills(listName) {
        const store = {};
        TwentyQuestions[listName].forEach((formName) => {
            const id = foundry.utils.getProperty(this.data, formName);
            if (!id || id === "none") {
                return;
            }
            if (!store[id]) {
                store[id] = 0;
            }
            store[id] = store[id] + 1;
        });
        return store;
    }
}
