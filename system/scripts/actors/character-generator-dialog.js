import { CharacterGenerator } from "./character-generator.js";

/**
 * L5R NPC Generator form
 *
 * @extends {FormApplication}
 */
export class CharacterGeneratorDialog extends FormApplication {
    /**
     * Current actor data
     */
    actor = null;

    /**
     * Payload Object
     */
    object = {
        avgRings: 3,
        clan: "random",
        gender: "random",
        generate: {
            attributes: true,
            demeanor: true,
            identity: true,
            items: true,
            name: true,
            narrative: true,
            peculiarities: true,
            techniques: true,
        },
    };

    /**
     * Assign the default options
     * @override
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "l5r5e-character-generator-dialog",
            classes: ["l5r5e", "character-generator-dialog"],
            template: CONFIG.l5r5e.paths.templates + "actors/character-generator-dialog.html",
            title: game.i18n.localize("l5r5e.char_generator.title"),
            width: 450,
            // height: 360,
            resizable: false,
            closeOnSubmit: false,
            submitOnClose: false,
            submitOnChange: false,
        });
    }

    /**
     * Define a unique and dynamic element ID for the rendered ActorSheet application
     */
    get id() {
        return `l5r5e-npc-generator-dialog-${this.actor.id}`;
    }

    /**
     * Create dialog
     */
    constructor(actor = null, options = {}) {
        super({}, options);
        this.actor = actor;
        this.initializeFromActor();
    }

    /**
     * Try to get values from actor to initialize the generator
     */
    initializeFromActor() {
        const actorDatas = this.actor.system;

        // Identity
        this.object.clan = actorDatas.identity.clan || "random";
        this.object.gender =
            actorDatas.identity.female === null ? "random" : actorDatas.identity.female ? "female" : "male";

        // Rings
        this.object.avgRings = CharacterGenerator.sanitizeMinMax(
            Math.round(
                Object.values(actorDatas.rings).reduce((acc, ringValue) => {
                    return acc + ringValue;
                }, 0) / 5
            )
        );
    }

    /**
     * Construct and return the data object used to render the HTML template for this form application.
     * @param options
     * @return {Object}
     */
    async getData(options = null) {
        const clans = Array.from(CONFIG.l5r5e.families.keys()).map((e) => ({
            id: e,
            label: game.i18n.localize("l5r5e.clans." + e),
        }));
        return {
            ...(await super.getData(options)),
            isNpc: this.actor.type === "npc",
            clanList: [{ id: "random", label: game.i18n.localize("l5r5e.global.random") }, ...clans],
            genderList: [
                { id: "random", label: game.i18n.localize("l5r5e.global.random") },
                { id: "male", label: game.i18n.localize("l5r5e.social.gender.male") },
                { id: "female", label: game.i18n.localize("l5r5e.social.gender.female") },
            ],
            data: this.object,
        };
    }

    /**
     * This method is called upon form submission after form data is validated
     * @param event    The initial triggering submission event
     * @param formData The object of validated form data with which to update the object
     * @returns        A Promise which resolves once the update operation has completed
     * @override
     */
    async _updateObject(event, formData) {
        formData = foundry.utils.expandObject(formData);

        // Generate datas
        const generator = new CharacterGenerator({
            avgRingsValue: formData.avgRings,
            clanName: formData.clan,
            gender: formData.gender,
        });

        // Update current Object with new data to keep selection
        this.object = {
            ...formData,
        };

        // Update actor with selection
        const updatedDatas = await generator.toActor(this.actor, formData.generate);
        await this.actor.update(updatedDatas);

        this.render(false);
    }
}
