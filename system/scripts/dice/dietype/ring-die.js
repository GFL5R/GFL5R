import { L5rBaseDie } from "./l5r-base-die.js";

/**
 * L5R5e Ring Die
 */
export class RingDie extends L5rBaseDie {
    /** @override */
    static DENOMINATION = "r";

    static FACES = {
        1: { success: 0, explosive: 0, opportunity: 0, strife: 0, image: "ring_blank" },
        2: { success: 0, explosive: 0, opportunity: 1, strife: 1, image: "ring_ot" },
        3: { success: 0, explosive: 0, opportunity: 1, strife: 0, image: "ring_o" },
        4: { success: 1, explosive: 0, opportunity: 0, strife: 1, image: "ring_st" },
        5: { success: 1, explosive: 0, opportunity: 0, strife: 0, image: "ring_s" },
        6: { success: 0, explosive: 1, opportunity: 0, strife: 1, image: "ring_et" },
    };

    /** @override */
    constructor(termData) {
        super(termData);
        this.faces = 6;
    }
}
