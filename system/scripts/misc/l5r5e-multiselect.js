const { AbstractMultiSelectElement } = foundry.applications.elements;

/**
 * Provide a multi-select workflow using a select element as the input mechanism.
 * It is a expanded copy of the HTMLMultiselect with support for disabling options
 * and a clear all button. Also have support for hover-over information using titlea
 *
 * @example Multi-Select HTML Markup
 * ```html
 * <l5r5e-multi-select name="select-many-things">
 *   <optgroup label="Basic Options">
 *     <option value="foo">Foo</option>
 *     <option value="bar">Bar</option>
 *     <option value="baz">Baz</option>
 *   </optgroup>
 *   <optgroup label="Advanced Options">
 *    <option value="fizz">Fizz</option>
 *     <option value="buzz">Buzz</option>
 *   </optgroup>
 * </l5r5e-multi-select>
 * ```
 */
export class L5r5eHtmlMultiSelectElement extends AbstractMultiSelectElement {

    constructor() {
        super();
        this.#setup();
    }

    /** @override */
    static tagName = "l5r5e-multi-select";

    /**
    * A select element used to choose options.
    * @type {HTMLSelectElement}
    */
    #select;

    /**
     * A display element which lists the chosen options.
     * @type {HTMLDivElement}
     */
    #tags;

    /**
     * A button element which clear all the options.
     * @type {HTMLButtonElement}
     */
    #clearAll;

    /**
     * A Set containing the values that should always be disabled.
     * @type {Set}
     */
    #disabledValues;

    /* -------------------------------------------- */

    // We will call initialize twice (one in the parent constructor) then one in #setup
    // required since when we want to build the elements we should to an initialize first
    // and we cannot override _initialize since we don't have access to #disabledValues  there
    #setup() {
        super._initialize();
        this.#disabledValues = new Set();
        for (const option of this.querySelectorAll("option")) {
            if (option.value === "") {
                option.label = game.i18n.localize("l5r5e.multiselect.empty_tag");
                this._choices[option.value] = game.i18n.localize("l5r5e.multiselect.empty_tag");
            }
            if (option.disabled) {
                this.#disabledValues.add(option.value);
            }
        }
    }

    /** @override */
    _buildElements() {
        this.#setup();

        // Create select element
        this.#select = this._primaryInput = document.createElement("select");
        this.#select.insertAdjacentHTML("afterbegin", `<option id="l5r5e-multiselect-placeholder" value="" disabled selected hidden>${game.i18n.localize("l5r5e.multiselect.placeholder")}</option>`);
        this.#select.append(...this._options);
        this.#select.disabled = !this.editable;

        // Create a div element for display
        this.#tags = document.createElement("div");
        this.#tags.className = "tags input-element-tags";

        // Create a clear all button
        this.#clearAll = document.createElement("button");
        this.#clearAll.textContent = "X";
        return [this.#select, this.#clearAll, this.#tags];
    }

    /* -------------------------------------------- */

    /** @override */
    _refresh() {
        // Update the displayed tags
        const tags = Array.from(this._value).map(id => {
            return foundry.applications.elements.HTMLStringTagsElement.renderTag(id, this._choices[id], this.editable);
        });
        this.#tags.replaceChildren(...tags);

        // Figure out if we are overflowing the tag div.
        if($(this.#tags).css("max-height")) {
            const numericMaxHeight = parseInt($(this.#tags).css("max-height"), 10);
            if(numericMaxHeight) {
                if($(this.#tags).prop("scrollHeight") > numericMaxHeight) {
                    this.#tags.classList.add("overflowing");
                }
                else {
                    this.#tags.classList.remove("overflowing");
                }
            }
        }

        // Disable selected options
        const hideDisabled = game.settings.get(CONFIG.l5r5e.namespace, "compendium-hide-disabled-sources");
        for (const option of this.#select) {
            if (this._value.has(option.value)) {
                option.disabled = true;
                option.title = game.i18n.localize("l5r5e.multiselect.already_in_filter");
                continue;
            }
            if (this.#disabledValues.has(option.value)) {
                option.disabled = true;
                option.hidden = hideDisabled;
                continue;
            }
            option.disabled = false;
            option.removeAttribute("title");
        }
    }

    /* -------------------------------------------- */

    /** @override */
    _activateListeners() {
        this.#select.addEventListener("change", this.#onChangeSelect.bind(this));
        this.#clearAll.addEventListener("click", this.#onClickClearAll.bind(this));
        this.#tags.addEventListener("click", this.#onClickTag.bind(this));

        this.#tags.addEventListener("mouseleave", this.#onMouseLeave.bind(this));
    }

    #onMouseLeave(event) {
        // Figure out if we are overflowing the tag div.
        if($(this.#tags).css("max-height")) {
            const numericMaxHeight = parseInt($(this.#tags).css("max-height"), 10);

            if($(this.#tags).prop("scrollHeight") > numericMaxHeight) {
                this.#tags.classList.add("overflowing");
            }
            else {
                this.#tags.classList.remove("overflowing");
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle changes to the Select input, marking the selected option as a chosen value.
     * @param {Event} event         The change event on the select element
     */
    #onChangeSelect(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const select = event.currentTarget;
        if (select.valueIndex === 0)
            return; // Ignore placeholder
        this.select(select.value);
        select.value = "";
    }

    /* -------------------------------------------- */

    /**
     * Handle click events on a tagged value, removing it from the chosen set.
     * @param {PointerEvent} event    The originating click event on a chosen tag
     */
    #onClickTag(event) {
        event.preventDefault();
        if (!event.target.classList.contains("remove"))
            return;
        if (!this.editable)
            return;
        const tag = event.target.closest(".tag");
        this.unselect(tag.dataset.key);
    }

    /* -------------------------------------------- */

    /**
     * Handle clickling the clear all button
     * @param {Event} event         The originating click event on the clear all button
     */
    #onClickClearAll(event) {
        event.preventDefault();
        var _this = this;
        $(this.#tags).children().each(function () {
            _this.unselect($(this).data("key"));
        })
    }

    /* -------------------------------------------- */
    /** @override */
    _toggleDisabled(disabled) {
        this.#select.toggleAttribute("disabled", disabled);
    }

    /* -------------------------------------------- */

    /**
     * Create a HTML_l5r5e_MultiSelectElement using provided configuration data.
     * @param {FormInputConfig<string[]> & Omit<SelectInputConfig, "blank">} config
     * @returns {L5r5eHtmlMultiSelectElement}
     */
    static create(config) {
        // Foundry creates either a select with tag multi-select or multi-checkboxes. We want a l5r5e-multi-select
        // Copied the implementation from foundry.applications.fields.createMultiSelectInput with our required changes.
        const groups = prepareSelectOptionGroups(config);

        //Setup the HTML
        const select = document.createElement(L5r5eHtmlMultiSelectElement.tagName);
        select.name = config.name;
        foundry.applications.fields.setInputAttributes(select, config);
        for (const group_entry of groups) {
            let parent = select;
            if (group_entry.group) {
                parent = _appendOptgroupHtml(group_entry.group, select);
            }
            for (const option_entry of group_entry.options) {
                _appendOptionHtml(option_entry, parent);
            }
        }
        return select;
    }
}

/** Stolen from foundry.applications.fields.prepareSelectOptionGroups: Needed to add support for tooltips
 *
 */
function prepareSelectOptionGroups(config) {
    const result = foundry.applications.fields.prepareSelectOptionGroups(config);

    // Disable options based on input
    config.options.filter((option) => option?.disabled || option?.tooltip).forEach((SpecialOption) => {
        result.forEach((group) => {
            group.options.forEach((option) => {
                if (SpecialOption.value === option.value) {
                    option.disabled = SpecialOption.disabled;
                    option.tooltip = SpecialOption?.tooltip;
                }
            })
        })
    })
    return result;
}

/** Stolen from foundry.applications.fields
 * Create and append an optgroup element to a parent select.
 * @param {string} label
 * @param {HTMLSelectElement} parent
 * @returns {HTMLOptGroupElement}
 * @internal
 */
function _appendOptgroupHtml(label, parent) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = label;
    parent.appendChild(optgroup);
    return optgroup;
}

/** Stolen from foundry.applications.fields
 * Create and append an option element to a parent select or optgroup.
 * @param {FormSelectOption} option
 * @param {HTMLSelectElement|HTMLOptGroupElement} parent
 * @internal
 */
function _appendOptionHtml(option, parent) {
    const { value, label, selected, disabled, rule, tooltip } = option;
    if ((value !== undefined) && (label !== undefined)) {
        const option_html = document.createElement("option");
        option_html.value = value;
        option_html.innerText = label;
        if (selected) {
            option_html.toggleAttribute("selected", true);
        }
        if (disabled) {
            option_html.toggleAttribute("disabled", true);
        }
        if (tooltip) {
            option_html.setAttribute("title", tooltip);
        }
        parent.appendChild(option_html);
    }
    if (rule) {
        parent.insertAdjacentHTML("beforeend", "<hr>");
    }
}