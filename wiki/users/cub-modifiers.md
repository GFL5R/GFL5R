# Using CUB for Modifiers

> ⚠ The module [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt) is required.


## Attributes modifiers
Replace `<attribute>` with actual attribute (i.e. `endurance`, `vigilance`, `focus`, `composure`) and `<number>` with actual number to be added.

When setup in CUB this would modify PC derived attributes to increase or reduce them by the number given.

Allows automating certain invocations and item effects (such as the cursed Kama from Sins of Regret supplement).


### For `character` type
Syntaxe:
> system.modifiers.character.`<attribute>` += `<number>`

Examples:
> system.modifiers.character.endurance += 1  // add 1
> <br>system.modifiers.character.focus += -2 // remove 2


### For `adversary` or `minion` types
Syntaxe:
> system.`<attribute>` += `<number>`

Exemples:
> system.vigilance += 1      // add 1
> <br>system.composure += -2 // remove 2



## Rings/Skills modifiers
Both PCs and NPCs can have their skills and rings increased as well by conditions (should you wish to ignore some of the RAW).

Syntaxe:
> system.rings.`<ring>` += `<number>`
> <br>system.skills.`<skillGroup>`.`<skill>` += `<number>` // for PCs
> <br>system.skills.`<skillGroup>`           += `<number>` // for NPCs

Exemples:
> system.rings.earth += 1
> <br>system.skills.artisan.aesthetics += 1  // for PCs
> <br>system.skills.martial            += -1 // for NPCs


The above need to be setup as conditions using CUB at the moment so that they can be added/removed as required.

Regarding skills and rings modifiers, I believe you would need to remove them temporarily for advancements as it might cause extra XP to be spent, but yet to test it fully.
