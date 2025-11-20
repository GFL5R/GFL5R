# DicePicker (DP)
The DicePicker is the entry point to any L5R roll (but chat command).

## Usage example
```js
new game.l5r5e.DicePickerDialog({
    skillId: 'aesthetics',
    ringId: 'water',
    actor: game.user.character
}).render(true);
```

## Constructor Options
| Property         | Type          | Notes / Examples                                                                                                                         |
|------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------|
| actor            | Actor         | Any `Actor` object instance.<br>ex : `game.user.character`, `canvas.tokens.controlled[0].actor`                                          |
| actorId          | string        | This is the `id` not the `uuid` of an actor.<br>ex : "AbYgKrNwWeAxa9jT"                                                                  |
| actorName        | string        | Careful this is case-sensitive.<br>ex : "Isawa Aki"                                                                                      |
| difficulty       | number        | `1` to `9`                                                                                                                               |
| difficultyHidden | boolean       | If `true`, hide the difficulty and lock the view for the player.                                                                         |
| isInitiativeRoll | boolean       | `true` if this is an initiative roll.                                                                                                    |
| item             | Item          | The object of technique or weapon used for this roll.<br>_Added in v1.9.0_                                                               |
| itemUuid         | string        | The `uuid` of technique or weapon used for this roll. Can be anything retrieved by `fromUuid()` or `fromUuidSync()`<br>_Added in v1.9.0_ |
| ringId           | string        | If not provided, take the current stance of the actor if any.<br>ex : "fire", "water"                                                    |
| skillId          | string        | Skill `id`<br>ex : "design", "aesthetics", "courtesy"                                                                                    |
| skillCatId       | string        | Skill category `id`<br>ex : "artisan", "scholar"                                                                                         |
| skillsList       | string[]      | `skillId`/`skillCatId` list coma separated.<br>Allow the player to select the skill used in a select<br>ex : "artisan,design"            |
| target           | TokenDocument | The targeted Token<br>_Added in v1.9.0_                                                                                                  |


All these properties are optional.

For `actor*` properties, the resolution is in this order :
1. `option.actor`
2. `option.actorId`
3. `option.actorName`
4. Try to find the first controlled token by the player (`canvas.tokens.controlled[0]?.actor`)
5. Use the assigned character if any (`game.user.character`)
6. If nothing found, then no actor are set
