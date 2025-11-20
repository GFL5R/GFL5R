# Changelog
Date format : day/month/year

> Version format : `<major>.<foundry-version>.<system-version>`
> - `major`: Big breaking changes.
> - `foundry-version`: Stick to the major version of FoundryVTT.
> - `system-version`: System functionalities and Fixes.

## 1.13.2 - 18/10/2025 - Conditions Icons & Fixes
- Fix Actor Sheet for pressing key `Enter` in input trigger `no active Encounter...` message.
- Fix Compendium `Astrolab` is duplicate with `Mantis Clan` and `Children of the Five Winds`. Renamed the `cotfw` version to `Astrolabe (Unicorn)`.
- Fix 20Q autocomplete and menu css.
- Added handmade conditions icons by Nikotka (thx to rex35game for the share).
- Spanish language updated thanks to Alejabarr.

## 1.13.1 - 21/09/2025 - Conditions & Fixes
- Fix for Clicking on items doesn't show item window (#65 Thx to Litasa)
- Fix for fade configuration (#66)
- Added some Tooltips loading optimizations (#62 Thanks to KitCat).
- Added some Properties loading optimizations (#63 Thanks to KitCat).
- Conditions changes :
  - Added basic token conditions (Thanks to Putty)
  - Added compromised condition when strife goes beyond max (Thanks to Putty).
  - Added apply incapacitated if character's fatigue goes beyond endurance (Thanks to Putty).
  - Added ability to remove condition from actor sheet and show core journal on click.
  - Added option to show all conditions (StatusEffect), default to false (show only l5R conditions).

## 1.13.0 - 24/08/2025 - Foundry v13 Compatibility (Thx to Litasa)
__! Be certain to carefully back up any critical user data before installing this update !__
- Updated the System to FoundryVTT v13.
- Compendiums
  - Added English compendium for `Children of the Five Winds`.
  - Added French translation for `Writ of the Wild`.
  - Fix Compendium Typo: "Beseech Hida's MIght" -> "Beseech Hida's Might" (#59).
- Actor sheets: Technique types are now hidden when they are not checked in locked mode.
- Fix 20Q: Technique message fixed (unallowed tech for School).
- Switched wysiwyg editor engine to `prosemirror` for text editor (`tinymce` will be removed in Foundry v14).

## 1.12.3 - 13/03/2025 - Fixes and Compendiums Filters (Thx to Litasa)
- Added Compendiums Filters (#41)
  - Separated the reference and the page number from book reference for filtering purpose.
    - Note: If you use Custom Compendiums, you need to update them to the new structure.
  - Adding filters in compendium for rarity, ring, and source.
  - Add option for GM to limit what sources is being displayed to the players in compendiums. GM can still see everything and give players items/techniques if needed.
- Fixed Npc Generator : Actor now update correctly.
- Fixed the sidebar's icons width on collapsed state.
- Fixed Left/Right Click order on Gm Tools/Monitor tooltips.
- Fixed GM Monitor now correctly update when prepared items state change.

## 1.12.2 - 16/09/2024 - Bugfixes
- Modified : The checkbox `reverseFatigueBar` is now a drop-down with `none`/`fatigue`/`strife`/`both`, and is now an client preference.
- Fixed : Character sheet errors when using a non-supported language (Thx to KitCat #56).

## 1.12.1 - 19/06/2024 - Compendium update (mostly french)
- Updated the names and pages number from the official French translation of `Celestial Realms` and `Fields of Victory`.
- Added some missing from `Celestial Realms` and `Celestial Realms - Deathly Turns`:
  - Armors: `The Golden Obi of the Sun Goddess`
  - Items: `Arrows : Fire-Blossom/Hamaya/Soul-Star`, `The horagai of Sacred Rains`, `Daikoku's Mallet` and `Candles of the Moth`.
  - Title: `Spirits hunter`.
- Fixed some English page reference:
  - `Lightning Raid` : from `219` to `218` (thx to Etherial).
  - `Tributaries of Trade` : added `221`.
- Changed the way of versioning the system: from `<major>.<minor>.<patch>` to `<major>.<foundry-version>.<system-version>`.

## 1.12.0 - 09/06/2024 - FoundryVTT v12 Compatibility
__! Be certain to carefully back up any critical user data before installing this update !__
- Updated the System to FoundryVTT v12.
- Added ability to players to set their default Item's windows height in settings (#55).
- Added item's icon on Macro hotbar on drop (#54).
- Moved `The blade with no name: Ancestral sword of the Dragon [Blessed Treasure]` from items to weapons compendium.
- Added French translation for "level zero" folders (packFolders).

## 1.11.0 - 13/12/2023 - Little fixes
- 20Q :
  - Starting techniques now have a limit of 6 techniques instead of 5 (see Celestial Realms : `Moshi Sun Sentinel School`).
  - Enable dropping on the 'drop here' label for 20Q (thk to Litasa #34).
- Compendiums : Added masteries and abilities from Deathly Turns.

## 1.10.1 - 22/08/2023 - Litasa's fixes
All these changes are thanks to Litasa.
- Roll-n-Keep dialog now waits for the DiceSoNice animation to finish before displaying the result when re-rolling or exploding dice (#28).
- Adding the ability to have a different name for the custom-compendium (needed to disable the system embedded ones).
- Fixes some CSS issues when the font size is not the default (#50, #51 and #52).

## 1.10.0 - 11/06/2023 - FoundryVTT v11 Compatibility
__! Be certain to carefully back up any critical user data before installing this update !__
- Updated the System to FoundryVTT v11.
- GM Monitor :
  - Added ability to add unlinked token to GM monitor. Drag and drop from actor's toolbar, or select tokens in scene and click on "Add selected tokens".
  - Now automatically switch to the corresponding type of the dropped character (Army/Character).
- Using the new `packFolders` in system manifest.
  - System compendiums are now in folders for more readability with others modules/worlds compendiums (ex: `L5R5e System` > `Techniques` > `Techniques Kata`).
  - Please note this is only by default, and you are free to move or rename it after the initial loading.

## 1.9.6 - 14/05/2023 - Bragma's QoL
All these changes are thanks to Bragma.
- Added effects panel to both pc and npc (#26).
- Added an underline on rings to show current stance (#25).
- Fix Lists not showing correctly in journal (#44).

## 1.9.5 - 11/01/2023 - Adding Modifiers
- Characters can now have bonus endurance/composure/focus/vigilance from conditions (thx to Perkuns).

## 1.9.4 - 31/12/2022 - Last bugfixes of the Year !
- Fix prepared settings bugs (trackers icons sometimes disappears).
- GM Toolbox : Left clic do only actors with an active player as owner.
- Compendiums : Added Celestial Realms missing Titles : `Bond with a spirit` and `Moon cultist`.

## 1.9.3 - 29/09/2022 - Combat Tracker
- Fix for L5R combat tracker bar who have disappeared.

## 1.9.2 - 09/09/2022 - Advancements Again
- Fix for advancements ownership (items in items).

## 1.9.1 - 08/09/2022 - Advancements Bugfixes
- Fix for advancements fail to add new items ("_id" readonly error. see #42).

## 1.9.0 - 01/09/2022 - FoundryVTT v10 Compatibility
__! Be certain to carefully back up any critical user data before installing this update !__
- Updated the System to FoundryVTT v10.
- Updated the initiative behaviour, he now open the DicePicker for PC and Adversaries locally or remotely.
- Added a `game.user.isFirstGM` property for some traitements (socket and migration) to prevent multiple executions with multiple GM connected.
- Added socket API `openDicePicker` to remotely open the DicePicker (see [usage on wiki](https://gitlab.com/teaml5r/l5r5e/-/wikis/dev/sockets.md#opendicepicker)).
- Added chat distinction for roll using target (`@T:`) with `min` or `max` for non disclose the target to players.
- Added a distinction when clicking on the dice icon on Chat tab :
  - Left clic, open the DP locally (as usual).
  - Right clic (GM only), now open the DP for players with all skills in list.
- Added `itemUuid`/`item` to DP and `item` in RnK/Roll for the technique or weapon used to be readable in ChatMessage.
- Replaced `targetInfos` (`name`/`img`) to `target` (`TokenDocument`) on DP/RnK/Roll for better access to the related token.
- Added `@UUID` link on target and weapon/technique in ChatMessage.
- Added `Wiki` and `Compendium` link in system tab (open wiki page).
- Removed restriction on technique types when dropping a technique (Sheet and 20Q. see #39).
- Fixed sync between GM for Combat tracker `initiative encounter type` and `initiative prepared`.
- Compendiums :
  - Added `Writ of the Wild` compendiums.
  - Updated Blessed Treasure/Concealed Horror/Nemuranai.

## 1.8.2 - 24/06/2022 - Unofficial Italian translation
- Added Unofficial Italian translation (Corebook only for compendiums), all thanks to EldritchTranslator.
- Added French translation for Tables.
- Fixed : Translated table names broke the macros. We are now using IDs to avoid that in `L5R5E Macros` compendium.

## 1.8.1 - 09/06/2022 - Small bugfixes
- Added a restriction on symbols, they are now lower-case only, ex : (air) work, (Air) will not (#36).
- Added some 20q questions in GM monitor global tooltip (q14, q15, q20) for quick access.
- Fixed css for body>background-size from auto to cover, for blank scene (Thx to Sasmira).
- Fixed css for header buttons in maximized state for `OneJournal` module.
- Updated System manifest property `manifestPlusVersion` to 1.2.0, and added screenshots in media section.

## 1.8.0 - 29/04/2022 - QoL & Compendiums Update
- Added 179 Japanese villages name table.
- Added Rōnin icon and tag symbol `(ronin)` (Thanks to TesserWract).
- Added a different view for GM and Players for hidden roll in ChatMessage.
- Fixed : Missing translation for EN and ES - `Armors, Weapons, and Items` in Npc Generator dialog.
- Compendiums :
  - Added CR missing `Agasha Pattern` Pattern and Property (Thanks to KitCat).
  - Added `Celestial Implement Boons` compendium (Thanks to TesserWract)
  - Updated Weapon Names and Grips (Thanks to TesserWract) :
    - Added `N/A` to invalid weapon grips.
    - Grips with more than one quality and/or style now use a more consistent format: `(style): Quality 1, Quality 2, ...`
    - Renamed `Tinbe-Rochin` to `Rochin` as the DB entry is for the single item rather than the item pair.
    - Added macrons to relevant weapon names.
- Refactor the way of symbols was handled, now compatible with `monks enhanced journal` module.

## 1.7.1 - 01/04/2022 - Spring fixes
- PC/NPC sheet :
  - Fixed technique with a skill set, in a title, now open the DicePicker as intended.
- Roll/DP/RnK :
  - Fixed the way an actor is lightweight and re-construct from chat message. This fix minions npc sync with multiple token (missing context).
- Added `changelog` and `readme` properties in system.json

## 1.7.0 - 28/03/2022 - Strife, DiceRoller for Techniques & Npc Generator
- NPC Sheet :
  - Added a random generator feature (Demeanor, Clan and Families names courteously authorized by Edge).
    - This is random by design, don't expect clan/school logic in values.
  - Added collapsible techniques groupes.
- PC sheet :
  - Added collapsible skill/techniques groupes.
- Army sheet :
  - Image and token now follow the commander's on drop.
- PC/NPC sheet :
  - Added a volatile storage to keep collapsible (Skills/Inventory) in theirs state on sheet update.
  - Added the ability for technique with a skill set, to open the DicePicker with presets values.
  - Some can interact with targets, but do the default difficulty if none.
  - Notes : Techniques in sheet need to be re-imported from the compendium or manually updated for this to work.
  - Trying an autocomplete on some fields : clan, family, school, roles, demeanor.
- Techniques Sheet & Compendiums :
  - Added difficulty and skill values (not to all techniques. see [usage on wiki](https://gitlab.com/teaml5r/l5r5e/-/wikis/users/techniques-syntaxe.md)).
  - Trying an autocomplete on skill field.
- DicePicker :
  - Added TN hidden difficulty visibility for GM (ex: ?2?).
  - Added a selection for techniques with skill list.
- RnK :
  - Added ability to directly apply the strife to the actor on final step. The chat message show the value taken in gray aside the total strife.
  - Changed the way the swap is handled, that now work the same as the reroll.
    - You need to keep them after the step was validated.
    - This way you can do step by step for disadvantages, advantages, techniques swaps...
- Roll chat message :
  - Added Target information.
- Properties sheet:
  - Fixed loading properties from custom compendiums.
  - Added a line strike on removed/unknown property and ability to remove them.
- Added Inversion and Mantra icon and tag symbols (thanks to TesserWract).
- Added a Changelog link in system tab.
- Fixed image following the technique_type on technique sheet.
- Fixed linked actor image compatibility with Tokenizer.
- Fixed svg height/width for firefox.
- Compendiums : Removed the Phoenix image on `Ishiken Initiate School` school techniques.

## 1.6.1 - 13/02/2022 - Little Bugfixes
- PC sheet : fixed the `Complete this rank` button who stayed hidden in experience tab.
- GmMonitor : fixed a bug with render when the list was emptied.
- Combat : fixed a null error when sometimes the combatant actor is null.

## 1.6.0 - 11/02/2022 - QoL & SoftLock
- PC/NPC/Armies sheet:
  - Added SoftLock functionality.
  - Added a new button bar for system specific buttons to reduce elements in headers.
  - Added +/- buttons to add or subtract Fatigue and Strife (PC & NPC Sheet), Casualties and Panic (Armies Sheet).
- GmMonitor :
  - Moved Honor/Glory/status in tooltip.
  - Added ability to add or subtract fatigue/strife/void/casualties/panic points on mouse clic (left/right/middle).
  - Added ability to switch between stance/prepared on mouse clic (left/right).
- Compendiums :
  - Techniques : QoL - Trying a cheap Rank filter.
  - Inversion techniques : Updated xp cost from 3 to 6.
- Spanish language updated thanks to Alejandro Barranquero.

## 1.5.0 - 09/01/2022 - FoundryVTT v9 Compatibility
- Updated the System to FoundryVTT v9.
- Thanks to Perkuns for his help with the CSS for this v9 release.
- Fixed armies in combat tracker.
- Fixed `traditional-japanese-man.svg` and `traditional-japanese-woman.svg` headers for firefox (x/y/width/height).
- Trying to fix advancements behavior, who sometime left point on the old choice.

## 1.4.0 - 19/12/2021 - Armies & French PoW
- Added Army (Actor), Cohort (Item) and Fortification (Item) sheets.
- Actor Sheet (PC, NPC, Army) : Added the ability to Drag n Drop an actor's image.
- GM monitor :
  - Added Armies view.
  - Added the ability to Drag n Drop an actor's image.
- Added real icons for Inversion and Mantra.
- Added Mantra technique type.
- Compendiums :
  - PoW:
    - Updated all French compendiums from official French translation.
    - Added missing items pattern : `Spirit of the Qamarist Pattern`, `Ghostlands Yodhaniya Pattern` and `Kökejin’s Heart of the Wind Pattern`.
    - Added missing title : `Astradhari`.
    - Added mantras : `Summon Mantra : [One Implement]` and `Countering Mantra`.
    - Fixed : `Urbane and Worldly` advantage was misspelled `Wroldly` (thx to Cernunnos).
    - Fixed : `Passion for [Foreign Performing Art Form]` from `Passion` to `Distinction` type.
    - Fixed : `Flowering Deceptions` from `Kata` to `Shuji` type.
  - Added `Hooves` (weapon) and `Arrows` (object).
  - Added two tables to draw japanese names (1500 males names and 530 females names).
  - Added some Macros.
- Standardization of `great-clans-presentation` pack name to `core-journal-great-clans-presentation`.
- SendToChat now check links validity before adding them.
- New NPC changed from `minion` to `adversary` by default.
- 20Q : Fixed line break in techniques label list.

## 1.3.5 - 11/10/2021 - DsN hotfix
- Fixed a bug introduced by DiceSoNice 4.2.1 : context in `diceSoNiceRollStart` hook rebuild data and lost what we needed. The consequence is 3d dice flood a lot in RnK.

## 1.3.4 - 15/09/2021 - Compendiums Update
- Fixed a bug with sheet item drop introduced in previous version.
- Added FoV English Opportunities usage.
- Compendiums :
  - New icon for Inversion techniques.
  - Opportunities `Conflict use` table : the Air entry for the 2 opportunities was replaced by this real text (copy-past error).
  - Added missing Mantis `Storm Fleet Tide Seer` school techniques : `Storm Surge` and `Eye of the Storm`.
  - Added PoW School Curriculum and Titles.
  - Fixed Compendiums entries :
    - `Asako Inquisitor School [Crab]` to `Asako Inquisitor School [Phoenix]`
    - FoV Title : `Elemental Guard` (duplicate) to `Elemental Legionnaire`.
    - PoW Mastery : `Divine Protection` (duplicate) to `Tower of Ivory`.

## 1.3.3 - 23/08/2021 - Send'n'Watch
- GM toolbox changes :
  - Added `Reset void point` and `Gm Monitor` buttons.
  - `Reset void point`, `Sleep` and `Scene End` now use left clic to target only assigned characters, and right clic to do all actors.
- Added `Gm Monitor`, a windows to see summaries of actors :
  - Drop any actor on it to display them.
  - By default, or if the list is empty, all assigned characters will fill it.
- Added `send to chat` header buttons on sheets for :
  - Item : Image and description
  - Actor : Image and public description
  - Journal : Image and description, or full image if no text, or only description if no image.
  - The link behavior is :
    - World items and Compendiums : Direct link
    - Actor items : Try to get the world/compendium items as actor items are not accessible to others players. If the source cannot be resolved, do not display the link.
    - Please note the target permission is not checked to display the link. So player without rights will have a permission error message on click.
- Added Opportunity usage helper in Journal Compendium (courteously authorized by Edge).
- Fixed Compendiums entries thanks to TesserWract :
  - Weapons:
      - Chair, lute, sake bottle and cups, and scroll case use the `Unarmed skill`.
      - Changed the umbrella's stab grip to be 2-handed.
  - School Cursus :
      - `Utaku Battle Maiden`: Replaced `Striking as Air` with `Courtier's Resolve`.
  - Techniques :
    - `Disappearing World Style`: Ring used changed from `air` to `fire`.
    - `Lord Hida's Grip`: Added the `(Crab)` prerequisite in title.
    - `Lord Shiba's Valor`: Added the `(Phoenix)` prerequisite in title.
- Fixes for RnK :
  - Visibility mode now should be consistent with the 1st message (public, private, gm...).
  - DiceSoNice will now not show the new dice(s) for explosive in non-public mode.
- Fixed Title's embed items tooltips.
- Rarity is now stored in string to allow range.
- Minor fixe on editable state.
- Updated compatibility to Foundry VTT v0.8.9

## 1.3.2 - 14/07/2021 - Ronin's Bubble
- Added a tooltip on hover with all information for items, and removed all these silly moving description (which made me crazy).
- Added PoW Revised 20Q (for old Ronin, just modify the template in 20Q to change the character sheet fields).
- Added Bushido tenets on Social tab in sheet for all (I think this is useful for players, and it's in Core rulebook so... why this is not by default ;) ).
- Added English/French Journal Compendiums for Conditions and Terrain Qualities (thanks to TesserWract for English and icons).
- Added English FoV Terrain Compendium.
- Added PoW Name Tables compendium : Qamarist Names, Ivory Kingdoms Names, Rokugani Names and Ujik Names (courteously authorized by Edge).
- Added ability to drop a (Curriculum) Journal to have a link in school experience tab.
- Added properties antagonists (ex : `Sacred` remove `Unholy` on drop). So now properties can have another properties in them.
- Added a little time saver : when switching between NPC types, now the prototype token is altered this way : Linked actor for Adversary, unlinked for Minion.
- Fixed roll for RollTable not showing the text in chat.
- Fixed school compendium: `Kuni Warden School` from `Scorpion` to `Crab`.
- Fixed some Pdf Copy-Paste error in school cursus that make L instead of I : Lkoma/Lsawa/Luchi...

## 1.3.1 - 16/06/2021 - Empty Sheet Scholar Helper
- Added English/French Journal Compendiums for School Curriculums.
- Added English/French Curriculums in description for Titles.
- Added English Compendiums for Field of Victory (thanks to mdosantos).
- Added English `Blessed Treasures` in items for Field of Victory (thanks to PlatFleece)
- Added English/French `Blessed Treasures` and `Concealed Horror` in items for Shadowlands.
- Added new icons for titles, links, items pattern and scroll signatures.
- QoL : Added label for grips in Weapon sheet (thanks to TesserWract).
- QoL : Added buttons to Add or Subtract money.
- Fixed the `empty sheet` bug (I hope).
- Fixed the `bought_at_rank` does not change according to the PC rank value when an Item is drop on a sheet.
- Fixed the issue #23 `Token image does not save`. Now we reflect the change on the token name/image only if it's a linked actor and if the token/sheet have the same values.
- Fixed the `unlink actor data` who still change the Actor Data when editing an unlinked token.

## 1.3.0 - 02/06/2021 - Foundry 0.8 Compatibility
__! Be certain to carefully back up any critical user data before installing this update !__
- Updated the System to the new version of Foundry VTT (a lot of things broke).
- NPC can now have strengths/weaknesses with all rings.
- Added `Title`, `Bond`, `Signature Scroll` and `Item Pattern`:
  - The item types.
  - Theirs compendiums entries.
  - A new list in experience tab to not mess with school cursus.
  - Item patterns :
    - Can be dropped on another item to add the associated property.
    - To change the linked property, drop any property on the item pattern sheet.
- Added an optional `Specificity` technique type to serve as a catch-all.
- Added Mantis clan compendium entries.
- Added a `Description` in PC/NPC sheet: this field is used in limited view (`description` are public, `notes` are private).
- PC/NPC : Removed the `titles` field in social.
- NPC : Moved the `note` field in social to gain some space, and uniformize with PC.
- Fix : rnkMessage not passing on actor object for NPCs (thanks to Bragma).
- Fix : The `Crescent Moon Style` technique rank from 4 to 2.
- Fix : Drop an advancement on a PC/NPC sheet now correctly add the bonus to the Actor (ex Air +1), and the same with remove.
- QoL : RnK button is now black in chat if no actions are left in roll (new messages only).
- QoL : Added symbols legend in RnK dialog as reminder.
- QoL : Added `(x Max)` display in RnK picker for max number of dice to keep (thanks to Bragma).
- QoL : When DiceSoNice is enabled, the display of the RnK dialog is delayed by 2s before show-up.
- Others minor optimizations (ex: 20q saving multiple item at once).

## 1.2.1 - 18/02/2021 - Praised be Firefox
- Fix dice swap on firefox that overflowed on the top and bottom of the RnK dialog
- Fix new items list on firefox who deformed the sheets

## 1.2.0 - 17/02/2021 - Roll n Keep
- Added Roll n Keep 1st iteration !
  - Ability to Keep, Discard, Re-roll and Swap:
    - Keep: Keep the die for the next step, if it's an explosive one, automatically roll a new die
    - Discard: Self explain, do not keep this die for the next step.
    - Re-roll: Replace this die by a new roll (Usually Advantage & Disadvantage stuff). When a reroll is selected, all the dice in the current step will be tag as keep by default.
    - Swap (Face): Set a desired face for this die (Some weird techniques stuff)
  - Usage:
    - All these actions are done by drag and drop a die result into a target action
    - A colored icon symbolize the choice made on the dice
    - You can always change choices for the current step until you clic next
    - Please note all dice without choice will be discarded for the next step
  - The GM has the ability to undo choices by left-clicking in the status headers
  - Limitation: The roll need to only have L5R dice in it (no mixed regular + L5R)
- Fix image's behavior on create for all items subclasses
- Click on rings in the PC/PNC sheet now open the DicePicker with the selected ring
- Added a booster for loading compendium's core items (speed up 20Q)
- Added confirm dialog on item's deletion (Hold `ctrl` on the click, if you want to bypass it)
- Added `Sleep` & `Scene End` buttons in `GM ToolBox` (old `difficulty` box)
- Token's bar:
  - The strife bar is now displayed in red if the actor is compromised
  - Added an option, off by default, to reverse the fatigue's token bar (thanks to Jzrzmy)
- Added an option, on by default, to set the TN to 1 when the encounter type is selected (Intrigue, Duel, Skirmish or Mass battle)
- Split Techniques & Items by category in actor sheet (pc & npc) for better readability
- Armor & Weapon added in the conflict tab now set the `equipped` property by default
- Added Tabs on NPC sheets
- New styles for dice results

## 1.1.2 - 28/01/2021 - One Compendium to bring them all
- Added compendiums (Thanks to Stéfano Fara for the English version !) Partial for French as PoW and CR are not translated yet
  - Shadowlands
  - Emerald Empire
  - Courts of Stone
  - Path of Waves
  - Celestial Realms
- English cleanup, thanks to Mark Zeman !
- Fix css for Spanish
- Fix js error when Advancement is not embed in a actor
- Click on a weapon show the DicePicker with the weapon skill selected
- Display Rarity in Compendiums for Items, Armors and Weapons
- Minion can now choose a stance and if they are prepared
- Other minors fix

## 1.1.1 - 21/01/2021 - The Huns War
- Fix Minion initiative
- Fix textarea ninjo/giri

## 1.1.0 - 20/01/2021 - Initiative first !
- Added initiative system :
  - Now use the score rule (the real one if you prefer)
  - Added global modifiers for Characters, Adversary and Minons in the combat tracker : Confrontation types, Prepared
  - Added sheet modifiers for Characters and Adversary: Prepared
  - Initiative buttons in character sheet now display the DicePicker and do the initiative roll
  - Change the actor stance on initiative roll in DicePicker
  - Note : Due to the lack of the Roll & Keep system, the score is computed with the full success score.
- Spanish real translation by Alejabar (thanks !)
- Added a GM Dialog Tool for setting global difficulty (TN) value / hidden (with DicePicker live refresh)
- Compendium now display Ring and Rank if any in list view
- DicePicker :
  - Fixed the initial display of `use a void point`
  - No free void point anymore
- PC/NPC Sheet :
  - Added a visual indicator for equipped / readied
  - Now only equipped armor / weapon will show in conflict tab, and all armors/weapons now show in inventory tab
  - Xp not in curriculum are now rounded up (down before, due to a translation error)
  - No more automation in stats for Npc (these cheaters !)
- 20Q Pushed the step3 item's limit to 20 (10 previous)
- Added System migration stuff

## 1.0.0 - 12/01/2021 - First public release
- Removed the 0ds if no skill point
- Added initiative roll (only tactics for the moment)
- Change color of keikogi and add on compendium
- Machine translation for ES
- Update Translation for 1.0.0 Release
- 20Q added step 7 and 17 no point rule
- Add price icon
- Set vigilance to 1 if compromised
- Seamless update for 20Q (deleted refresh button)
- Update translation for npc + fix h1
- Update compendium : Remove accent on uppercase 1st letter

## 0.9.0 - Helper & Firefox Update
- Fix for npc note
- Chat texture and status
- Fix add void point on hidden -> only if added is check
- Add icons keikogi + 4 status for equipment
- Change background Compendium and padding on windows + Svg adjustements
- Updated weapons images
- Add new svg for weapon
- Ajustement css marging/padding and float
- Update item style for flex stretch css
- Pass for number and focus on click
- Xp, added some parseInt
- Fix for babele and properties
- Add type peculiarity in item entry
- Fix for cross-loaded French compendium
- 20Q : Scroll on top on next button
- V-Align for Vlyan pleasure !

## 0.8.0 - 20Q Polish
- 20Q better refresh, stay in same tab
- Advancement: Change the name and img according to the selection
- Fix for logo on Firefox
- Visual fix for Firefox and end 20Q edit
- Fix for no actor dice picker
- Added `add a void point` checkbox, and some fixes
- Added code fr module translation on README.md
- Babele is better in setup hook ?
- Added babele french translation into system
- Removed DicePiker bulk macro as it was unnecessary now
- Fix for Q13: `skill and disadv` OR `adv`
- Added some text for 20Q 2dn dice
- Stop some missing propagation
- Fix adv tooltip
- Fix 20Q wrong var for summary
- Added a real app fo helper/info button (dialog before)
- Added next bt in 20Q
- Fix nav 20Q for all screen
- Fix marge on sheet + fix nav on 20Q + clean imgs
- 20Q added step18 status, honor and glory for modifier
- Add BG and first style for 20Q
- Added class `roll` for roll in chat
- Some styles
- Add style for skill types checkboxes
- Add roll to global game var
- Change file to md
- Added a icon for `void point used` in chat log
- Fix for 20Q: constructCache only once
- Fix EN vigilante -> vigilance
- Update actor for using/get a void point
- Fix for rounded vigilance (now ceil instead of floor)
- 20Q added a summary
- Update Compendiums
- Fix for 20Q and some warn console for debug
- Fix img for drag n drop on compendium
- Added translation for Item and Actor combobox
- Add ronin svg + font <i> for ring and skill

## 0.7.0 - Compendiums Update
- Added (ring) and (skill) symbols
- Specific case for school_ability and mastery_ability on drop
- Added convertSymbol for item's desc and actor's notes
- Fix for `search anywhere` draggable icon
- Add ul li style for editor + Adjuste stance + marge on sheets and img
- Remove effects from template.json for tech
- Update css for item attribute
- added pack for `school_ability` and `mastery_ability` techniques
- Added school_ability and mastery_ability types for techniques
- Update on compendiums
- Fix properties description
- More text for effects in techs
- Fix for Compendium when player do not have the right to create a item
- Added some check on 20Q, and now rolls fill the form
- some fix for types and effects
- Translation for peculiarities types in sheet
- Last entries of peculiarities
- Added a img for new item
- advancements now with tabs
- Money ! it's a crime

## 0.6.0 - Item Enhancement
- fix on 20q
- tab on 20q and Hide rank 0 (initial) on progession
- Some checks on 20Q
- Added a check if this macro id is already in player hotbar
- Added shortcut for initiative rolls on conflict Tab (character only)
- Add a macro creator for dice roller
- Font modif for symbols in text
- pointer error
- Added symbols converter
- Exp with img and cap have now it s own row
- 20q again, added a refresh bt and fix css
- added check adv on drop
- Basic 20Q display
- Advancements better table display
- Some automatisations on advancements
- Some progression work, and fixed start rank level to 1
- Update Sidebar UI compendium and Letter spacing
- Fix Img width
- Quantities update, add and subtract on drop same object, or delete and qty > 1
- Make compendium droppable
- Fix for babele and props
- updated packs name (plural)
- Vlyan authored 2 weeks ago
- updated packs fix ranged weapons
- updated packs
- Fix fixed word 'Nope!' to a localized word for techniques
- status -> statut
- Added translation for npc subtype

## 0.5.0 - Testbed
- Fix last bug on items and update json for 0.5.0 Pre-Release
- fix using id for toggle
- removed `for` on label
- Update item with js expanded function
- toggle hook
- forced render true on macro
- no 20Q on observer
- check on tech type on drop
- Update item for description
- Update 0.4.0 style sheet + Clean video + Update Svg for canva error
- fix formapp constructor
- Finished styles for items and change npc svg
- limited sheet for limited rights
- 20q now working, step one yaw !
- fix weapons title
- working on 20Q drag n drop
- working on 20Q
- Item first iteration style, added item infos and value
- added raw book_reference to all items sheet
- added basics in items templates, and book_reference to all items
- added techniques type list checkboxes
- Fix for actor img not linked on token when change
- use of min/max for fatigue/strife/void point for use on token bars
- default actor bar fatigue/strife
- Colored svg for default img
- Style Npc Sheet v2 + update Charac + delete old ui and add svg
- fix npc dice roll, and with category id instead of skill id
- fix roll with new helper
- added zeni and reworking identity
- Add npc sheet template + css adjustments
- working on some parts of Sheets
- add armor item
- Update Style for sheet, item list and tab + update ui + add svg dice
- const for skills map, and raw 20 questions template
- Using formApp updateObject()
- Template and raw sheet for npc
- add color for element in chat
- Update styles for dice and Vlyan dev
- Dice picker v2 localization
- Update sheet for 100% height and make editor functional
- dialog picker v2
- modified stance internal usage checkboxes->radio
- 04/12/2020 - Add Templates Html + Gulp Sass + Css + Basic Tree and Files - mise à jour des informations de contributions - Mandar.
- 03/12/2020 - Init template and Workspace for Beginning of Great Adventure - Sasmira.