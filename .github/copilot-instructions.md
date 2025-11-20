# L5R5e Foundry VTT System - AI Coding Guidelines

## Architecture Overview

This is a Foundry Virtual Tabletop (FVTT) system module for Legend of the Five Rings 5th Edition by Edge Studio. The system extends Foundry's core classes with L5R-specific mechanics.

**Core Structure:**
- `system/scripts/main-l5r5e.js` - Main entry point importing all modules
- `system/scripts/config.js` - Game configuration (stances, XP costs, conditions)
- `system/scripts/hooks.js` - System initialization and event handling
- `system/templates/` - Handlebars templates for UI components
- `system/styles/` - SCSS styles compiled to `l5r5e.css`

## Key Components

### Actors (`system/scripts/actor.js`, `system/scripts/actors/`)
- `ActorL5r5e` extends Foundry's Actor class
- Three actor types: character, npc, army
- Custom sheets: `CharacterSheetL5r5e`, `NpcSheetL5r5e`, `ArmySheetL5r5e`
- Token bars: fatigue (bar1), strife (bar2) for characters

### Items (`system/scripts/item.js`, `system/scripts/items/`)
- `ItemL5r5e` extends Foundry's Item class
- Multiple item types: armor, weapon, technique, property, etc.
- Items can contain embedded items (system.items)
- Custom sheets for each item type

### Dice System (`system/scripts/dice/`)
- `RollL5r5e` extends Foundry's Roll class
- Custom dice: `RingDie` (exploding), `AbilityDie` (standard)
- Roll-and-keep mechanics with difficulty checks
- Chat templates: `dice/chat-roll.html`, `dice/tooltip.html`

### Journals (`system/scripts/journal.js`, `system/scripts/journals/`)
- `JournalL5r5e` extends JournalEntry
- Custom journal sheets for game content

## Development Workflow

### Setup
```bash
npm ci  # Install dependencies
npm run watch  # Start SCSS compilation watcher
```
Create symlink: `system/` → Foundry data directory (`%localappdata%/FoundryVTT/Data/systems/l5r5e`)

### Build Commands
- `npm run compile` - Compile SCSS to CSS
- `npm run watch` - Watch SCSS changes
- `npm run prettier` - Format code

### Code Quality
- ESLint with Prettier integration
- Rules relaxed for Foundry compatibility (no-underscore-dangle, etc.)
- Pre-commit hooks via lint-staged

## Coding Patterns

### Configuration Access
```javascript
// Global config
CONFIG.l5r5e.stances  // ["earth", "air", "water", "fire", "void"]
CONFIG.l5r5e.roles   // ["artisan", "bushi", "courtier", ...]

// Runtime access
game.l5r5e.storage
game.l5r5e.sockets
```

### Class Registration
```javascript
// In main-l5r5e.js init hook
CONFIG.Actor.documentClass = ActorL5r5e;
CONFIG.Item.documentClass = ItemL5r5e;
CONFIG.Dice.rolls.unshift(RollL5r5e);
```

### Sheet Registration
```javascript
// Register custom sheets
fdc.Actors.registerSheet(L5R5E.namespace, CharacterSheetL5r5e, {
    types: ["character"],
    makeDefault: true,
});
```

### Handlebars Helpers
- Registered in `system/scripts/handlebars.js`
- Used in templates for L5R-specific logic
- Preloaded in `system/scripts/preloadTemplates.js`

### Socket Communication
- `SocketHandlerL5r5e` for real-time updates
- Available as `game.l5r5e.sockets`

### Localization
- Translation files in `system/lang/`
- Keys follow `l5r5e.` namespace
- Babele integration for compendium translations

## File Organization

### Scripts Directory Structure
```
system/scripts/
├── main-l5r5e.js      # Entry point
├── config.js          # Game constants
├── hooks.js           # System hooks
├── actor.js           # Actor class
├── item.js            # Item class
├── journal.js         # Journal class
├── combat.js          # Combat system
├── migration.js       # Data migration
├── actors/            # Actor sheets
├── items/             # Item sheets
├── dice/              # Dice system
├── gm/                # GM tools
└── misc/              # Utilities
```

### Template Structure
```
system/templates/
├── actors/     # Character/NPC sheets
├── items/      # Item sheets
├── dice/       # Roll displays
├── dialogs/    # Modal dialogs
├── gm/         # GM interfaces
└── settings/   # Config pages
```

## Common Patterns

### Status Effects
- Custom conditions in `CONFIG.l5r5e.conditions`
- Ring-aligned wound conditions (fire, water, air, earth, void)
- Toggle via `show-all-status-effects` setting

### XP System
- Rank-based costs in `CONFIG.l5r5e.xp`
- Bond costs separate from character XP
- Ring/skill multipliers applied

### Migration System
- `MigrationL5r5e` handles data updates
- Runs automatically for first GM on world load
- Version checking via `needUpdate()`

### Storage System
- `Storage` class for persistent data
- Available as `game.l5r5e.storage`

## Testing & Validation

Run Foundry VTT with the system loaded to test changes. Key areas to validate:
- Character sheet calculations
- Dice rolling mechanics
- Item embedding
- Journal rendering
- Socket synchronization

## Deployment

- GitLab CI builds zip artifact on tags
- Excludes dotfiles from build
- Version managed in `system/system.json`