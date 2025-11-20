# Sockets API
Here is the list of Socket's methods, most of them is design to be use internally by the system, but you can find some useful for your projects.


## deleteChatMessage
Delete ChatMessage by his `id`, the GM permission is required, so a GM need to be connected for this to work. Used in RnK.

Usage :
```js
game.l5r5e.sockets.deleteChatMessage(messageId);
```


## refreshAppId
Refresh an application windows by his `id` (not `appId`). Used in RnK.
<br>Ex : `l5r5e-twenty-questions-dialog-kZHczAFghMNYFRWe`, not `65`.

Usage :
```js
game.l5r5e.sockets.refreshAppId(applicationId);
```


## updateMessageIdAndRefresh
Change the message in the selected application windows, and re-render the application to force the refresh. Used in RnK.

Usage :
```js
game.l5r5e.sockets.refreshAppId(applicationId, messageId);
```


## openDicePicker
_Added in v1.9.0_

Remotely open the DicePicker (DP) on targeted Users/Actors if they are active users. Used in initiative roll.

Arguments :

| Property  | Type    | Notes / Examples                                                           |
|-----------|---------|----------------------------------------------------------------------------|
| users     | User[]  | Users list to trigger the DP (will be reduce to `id` for network perf.)    |
| actors    | Actor[] | Actors list to trigger the DP (will be reduce to `uuid` for network perf.) |
| dpOptions | Object  | Any [DicePickerDialog.options](dicepicker.md#constructor-options)          |


### Examples

#### Fitness skill roll for the all combat targets
```js
game.l5r5e.sockets.openDicePicker({
    actors: Array.from(game.user.targets).map(t => t.document.actor),
    dpOptions: {
        skillId: 'fitness',
        difficulty: 3,
    }
});
```

#### Initiative roll (skirmish) for all player's character who are in combat tracker
```js
game.l5r5e.sockets.openDicePicker({
    actors: game.combat.combatants.filter(c => c.hasPlayerOwner && !c.isDefeated && !c.initiative).map(c => c.actor),
    dpOptions: {
        skillId: 'tactics',
        difficulty: 1,
        isInitiativeRoll: true,
    }
});
```

#### Melee skill roll with "fire" ring, pre-selected for all the selected tokens
```js
game.l5r5e.sockets.openDicePicker({
    actors: canvas.tokens.controlled.map(t => t.actor),
    dpOptions: {
        ringId: 'fire',
        skillId: 'melee',
        difficulty: 2,
    }
});
```

#### Skill roll with skill list for all active players (but GM)
```js
game.l5r5e.sockets.openDicePicker({
    users: game.users.players.filter(u => u.active && u.hasPlayerOwner),
    dpOptions: {
        ringId: 'water',
        skillId: 'unarmed',
        skillsList: 'melee,ranged,unarmed',
        difficulty: 3,
        difficultyHidden: true,
    }
});
```
