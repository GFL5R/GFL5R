import { L5r5eHtmlMultiSelectElement } from "../misc/l5r5e-multiselect.js";
/**
 * A subclass of [ArrayField]{@link ArrayField} which supports a set of contained elements.
 * Elements in this set are treated as fungible and may be represented in any order or discarded if invalid.
 */
export class L5r5eSetField extends foundry.data.fields.SetField {

  // We don't get the options we expect when we convert this to input,
  // So store them here
  #savedOptions;

  constructor(options={}, context={}) {
    super(new foundry.data.fields.StringField({
      choices: options.options.map((option) => option.value)
    }), options, context);

    this.#savedOptions = options;
  }

    /** @override */
    initialize(value, model, options={}) {
      if ( !value ) return value;
      return new Set(super.initialize(value, model, options));
    }

    /** @override */
    toObject(value) {
      if ( !value ) return value;
      return Array.from(value).map(v => this.element.toObject(v));
    }

    /* -------------------------------------------- */
    /*  Form Field Integration                      */
    /* -------------------------------------------- */

    /** @override */
    _toInput(config) {
      const e = this.element;
      return L5r5eHtmlMultiSelectElement.create({
        name: config.name,
        options: this.#savedOptions.options,
        groups: this.#savedOptions.groups,
        value: config.value,
        localize: config.localize
      });
    }
  }