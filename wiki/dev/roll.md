# Roll
The roll use the `RollL5r5e` class, who store a lot of additional variables.

Here is a view of `<roll>.l5r5e` properties :
```js
actor: null,             // actor instance
dicesTypes: {
    std: false,          // true if have a standard roll (ex : 1d6)
    l5r: false,          // true if have a l5r roll (we need the RnK)
},
difficulty: 2,
difficultyHidden: false,
history: null,           // Stored data of the RnK, can be big
initialFormula: null,    // The initial formula use in DP
item: null,              // technique or weapon object
isInitiativeRoll: false,
keepLimit: null,         // Max number of dice to keep
rnkEnded: false,         // false if the player can modify the roll.
skillAssistance: 0,      // Number of skill assistance, needed to know the number of dice keept
skillCatId: "",          // Skill category id
skillId: "",             // Skill id
stance: "",              // Ring id (fire, void...)
strifeApplied: 0,        // how many strife point the linked actor have already taken
summary: {
    totalSuccess: 0,     // = success + explosive
    totalBonus: 0,       // = totalSuccess - difficulty
    success: 0,
    explosive: 0,
    opportunity: 0,
    strife: 0,
},
target: null,            // Target object (TokenDocument)
voidPointUsed: false,    // if a void point as been used for this roll
```
