/**
 * Custom Handlebars for L5R5e
 */
export const RegisterHandlebars = function () {
    const sanitizeIfFail = (str) => {
        return str.indexOf("l5r5e.") !== -1 && str.indexOf("undefined") ? "" : str;
    };

    /* ------------------------------------ */
    /* Localizations                        */
    /* ------------------------------------ */
    Handlebars.registerHelper("localizeSkill", function (categoryId, skillId) {
        const key = "l5r5e.skills." + categoryId.toLowerCase() + "." + skillId.toLowerCase();
        return sanitizeIfFail(game.i18n.localize(key));
    });

    Handlebars.registerHelper("localizeSkillId", function (skillId) {
        const key = "l5r5e.skills." + CONFIG.l5r5e.skills.get(skillId.toLowerCase()) + "." + skillId.toLowerCase();
        return sanitizeIfFail(game.i18n.localize(key));
    });

    Handlebars.registerHelper("localizeRing", function (ringId) {
        const key = "l5r5e.rings." + ringId.toLowerCase();
        return sanitizeIfFail(game.i18n.localize(key));
    });

    Handlebars.registerHelper("localizeStanceTip", function (ringId) {
        const key = "l5r5e.conflict.stances." + ringId.toLowerCase() + "tip";
        return sanitizeIfFail(game.i18n.localize(key));
    });

    Handlebars.registerHelper("localizeTechnique", function (techniqueName) {
        return sanitizeIfFail(game.i18n.localize("l5r5e.techniques." + techniqueName.toLowerCase()));
    });

    Handlebars.registerHelper("localizeYesNo", function (isYes) {
        return sanitizeIfFail(game.i18n.localize(isYes ? "Yes" : "No"));
    });

    /* ------------------------------------ */
    /* Dice                                 */
    /* ------------------------------------ */
    Handlebars.registerHelper("getDiceFaceUrl", function (diceClass, faceId) {
        return sanitizeIfFail(game.l5r5e[diceClass].getResultSrc(faceId));
    });

    /* ------------------------------------ */
    /* Utility                              */
    /* ------------------------------------ */
    // Json - Display an object in textarea (for debug)
    Handlebars.registerHelper("json", function (...objects) {
        objects.pop(); // remove this function call
        return new Handlebars.SafeString(objects.map((e) => `<textarea>${JSON.stringify(e)}</textarea>`));
    });

    // Add props "checked" if a and b are equal ({{radioChecked a b}}
    Handlebars.registerHelper("radioChecked", function (a, b) {
        return a === b ? new Handlebars.SafeString('checked="checked"') : "";
    });

    // Concatenation
    Handlebars.registerHelper("concat", function (...objects) {
        objects.pop(); // remove this function call
        return objects.join("");
    });

    // Add a setter
    Handlebars.registerHelper("setVar", function (varName, varValue, options) {
        options.data.root[varName] = varValue;
    });

    /**
     * Utility conditional, usable in nested expression
     * {{#ifCond (ifCond advancement.type '==' 'technique') '||' (ifCond item.system.technique_type '==' 'kata')}}
     * {{#ifCond '["distinction","passion"]' 'includes' item.system.peculiarity_type}}
     */
    Handlebars.registerHelper("ifCond", function (a, operator, b, options) {
        let result = false;
        switch (operator) {
            case "==":
                result = a == b;
                break;
            case "===":
                result = a === b;
                break;
            case "!=":
                result = a != b;
                break;
            case "!==":
                result = a !== b;
                break;
            case "<":
                result = +a < +b;
                break;
            case "<=":
                result = +a <= +b;
                break;
            case ">":
                result = +a > +b;
                break;
            case ">=":
                result = +a >= +b;
                break;
            case "&&":
                result = a && b;
                break;
            case "||":
                result = a || b;
                break;
            case "includes":
                result = a && b && a.includes(b);
                break;
            default:
                break;
        }
        if (typeof options.fn === "function") {
            return result ? options.fn(this) : options.inverse(this);
        }
        return result;
    });
};
