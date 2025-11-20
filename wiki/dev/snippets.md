# Snippets
This page contains some useful code snippet for macro or so.


### Foundry (core)
## Actor related
Some useful methods to get a actor document :
```js
// By uuid
actor = fromUuid("Actor.lQYEzLeDS5ndopJV"); // or `fromUuidSync()

// By id
actor = game.actors.get("lQYEzLeDS5ndopJV");

// By name (case sensitive)
actor = game.actors.getName("Soshi Yui");

// First selected on scene
actor = canvas.tokens.controlled[0]?.actor;

// First selected targets tokens
actor = game.user.targets.values().next().value?.actor;

// All selected targets tokens (get the first one if any)
actors = Array.from(game.user.targets).map(t => t.actor);

// The current actor controlled by the player
actor = game.user.character;
```


## Document open sheet
```js
<document>.sheet?.render(true);
```


## FrameViewer
Open an url in an embedded windows in FoundryVTT
```js
// url, options
new FrameViewer("https://foundryvtt.wiki/", { title: "SIDEBAR.Wiki" }).render(true);
```


## L5R5e specific
### autocomplete
A basic autocomplete for text inputs

Parameters :
```
@param {jQuery}   html HTML content of the sheet.
@param {string}   name Html name of the input
@param {string[]} list Array of string to display
@param {string}   sep  Separator (optional, default "")
```

Usage examples :
```js
game.l5r5e.HelpersL5r5e.autocomplete(
    html,
    "system.difficulty",
    [
        "@T:intrigueRank",
        "@T:focus",
        ...
    ],
    "," //
);
```

It produces two values that can be useful in some cases :
```js
formData["autoCompleteListName"];           // "system.difficulty"
formData["autoCompleteListSelectedIndex"];  // 0 <- 1st élément selected
```


### debounce
Isolated Debounce by Id

Parameters :
```
@param {String}   id       Named id (namespace)
@param {Function} callback Callback function
@param {Number}   timeout  Wait time (default 500ms)
@param {Boolean}  leading  If true the callback will be executed only at the first debounced-function call,
                  otherwise the callback will only be executed `delay` milliseconds after the last debounced-function call
```

Usage examples :
```js
// Basic usage, non leading
game.l5r5e.HelpersL5r5e.debounce('appId', (text) => { console.log(text) })('my text');

// Leading
game.l5r5e.HelpersL5r5e.debounce(
    "send2chat-" + this.actor.id,
    () => game.l5r5e.HelpersL5r5e.sendToChat(this.actor),
    2000, // 2s
    true
)();
```


### drawManyFromPack
Shortcut method to draw names to chat (private) from a table in compendium without importing it

Parameters :
```
@param  {String} pack               Compendium name
@param  {String} tableName          Table name/id in this compendium
@param  {String} retrieve           How many draw we do (default "5")
@param  {object} opt                drawMany config option object (default "selfroll")
@return {Promise<{RollTableDraw}>}  The drawn results
```

Usage examples :
```js
game.l5r5e.HelpersL5r5e.drawManyFromPack("l5r5e.core-name-tables", "Japanese names (Village)", 5);
```


### migrateWorld
You can force to trigger the system migration by using :
```js
game.l5r5e.migrations.migrateWorld({force: true});
```
This will try to normalize the actor/items in the current loaded world.


### sendToChat
Send the description of this `Document` (`BaseSheetL5r5e`, `JournalL5r5e`, `ItemL5r5e`) to chat.

Usage examples :
```js
game.l5r5e.HelpersL5r5e.sendToChat(game.actors.getName("Soshi Yui"));
```
