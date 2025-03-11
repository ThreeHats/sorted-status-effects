# Sorted Status Effects

![Foundry v12](https://img.shields.io/badge/foundry-v12-green)

A Foundry VTT module that enhances the Token HUD by adding the ability to sort and tag status effects, making them more organized and easier to filter.

## Features

### Status Effect Sorting
- Drag and drop sorting of status effects in the Token HUD
- Hold 'T' key and hover over status effects to reorder them
- Persistent sorting that saves between sessions
- Compatible with other modules that modify the Token HUD

### Status Effect Tagging
- Add custom tags to any status effect
- Press 'Q' while hovering over a status effect to open the tagging menu
- Filter visible status effects by clicking on tags
- Customize tag icons through the module settings
- Tags are visible in the Token HUD for quick filtering

## Installation

1. Inside Foundry VTT, select the Game Modules tab in the Configuration and Setup menu
2. Click the Install Module button and enter the following URL: https://github.com/ThreeHats/sorted-status-effects/releases/latest/download/module.json
3. Click Install and wait for installation to complete

## Required Modules
- [libWrapper](https://foundryvtt.com/packages/lib-wrapper)
- [Condition Lab & Triggler](https://foundryvtt.com/packages/condition-lab-triggler)

## Recommended Modules
- [Illandril's Token HUD Scaler](https://foundryvtt.com/packages/illandril-token-hud-scale)
- [Status Icon Counters](https://foundryvtt.com/packages/statuscounter)
- [Visual Active Effects](https://foundryvtt.com/packages/visual-active-effects)

## Incompatibilities
- If [Monk's Little Details](https://foundryvtt.com/packages/monks-little-details) is active, "Alter the Token status HUD effects" must be disabled.
- Any other module that alters the token status HUD appearance may break the module.

## Usage

### Sorting Status Effects
1. Hover over the status effect you want to move
2. Hold the 'T' key (configurable in Foundry keybindings)
3. While still holding 'T', hover over the position where you want to place it
4. Release the 'T' key to drop the status effect in its new position

### Tagging Status Effects
1. Hover over a status effect
2. Press 'Q' (configurable in Foundry keybindings) to open the tagging menu
3. Check existing tags or create new ones
4. Click "Save Tags" to apply the changes

### Managing Tags
1. Open Foundry VTT settings
2. Navigate to Module Settings
3. Find "Sorted Status Effects" section
4. Click "Configure Tags"
5. Add, edit, or remove tags and their icons
6. Click "Save Changes" to apply

### Filtering by Tags
- Click on tag icons in the Token HUD to toggle visibility of associated status effects
- Status effects thats match any tag will be shown
- Status effects with no tags that are toggled on are hidden
- Status effects without any tags are shown no matter what

## Compatibility
- Tested with Foundry VTT v12
- Compatible with Token HUD Scale module

## Support

For questions, feature requests, or bug reports, please open an issue on the [GitHub repository](https://github.com/ThreeHats/sorted-status-effects).

## License

This module is licensed under [GNU General Public License v3.0](https://github.com/ThreeHats/sorted-status-effects/blob/main/LICENSE).
