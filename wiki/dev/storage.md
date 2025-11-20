# Storage API
Client side volatile storage - Store things like collapsible state (a refresh will clean it).

This is accessible anytime on `game.l5r5e.storage`.
Used in sheets to store some collapsible element state.


## getAppKeys
Get list of active keys for this app

Parameters :
```
@param {string} app application name
```

Usage examples :
```js
storeInfos = game.l5r5e.storage.getAppKeys("my-appid-namespace");

storeInfos = game.l5r5e.storage.getAppKeys("CharacterSheetL5r5e-Actor-Zca44Nv7ydMcNN9p");
// storeInfos => [
//   'toggle-skill-category-artisan',
//   'toggle-skill-category-scholar',
//   'toggle-skill-category-trade',
//   'inventory-item-list-weapon'
// ]
```
A defined key is "active", else they won't appear.


## toggleKey
Toggle a key for this app.

Parameters :
```
@param {string} app application name
@param {string} key Key name
```

Usage examples :
```js
game.l5r5e.storage.toggleKey("my-appid-namespace", "var-key-to-toggle");

game.l5r5e.storage.toggleKey("CharacterSheetL5r5e-Actor-Zca44Nv7ydMcNN9p", "toggle-skill-category-martial");
```
