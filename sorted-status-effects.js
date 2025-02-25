import { registerKeybinds, onEffectKeyDown } from "./scripts/keybindings.js";
import { changeHUD } from "./scripts/change-hud.js";

let sortedStatusEffects = {};

export class SortedStatusEffects {
    static init() {
        console.log('Sorted Status Effects | Initializing Sorted Status Effects module');
        // Register settings
        game.settings.register('sorted-status-effects', 'sortedStatusEffects', {
            name: 'Sorted Status Effects',
            scope: 'world',
            config: false,
            type: Object,
            default: undefined
        });
        // Register keybinding
        game.keybindings.register('sorted-status-effects', 'toggleEffect', {
            name: 'Toggle Effect',
            hint: 'Toggle the effect when hovering over a status icon',
            editable: [{ key: 'KeyT' }],
            onDown: (context) => {
                console.log('Keybinding pressed');
                onEffectKeyDown(context);
            },
            restricted: true
        });
        // Patch the TokenHUD _render method
        libWrapper.register('sorted-status-effects', 'TokenHUD.prototype._render', function (wrapped, ...args) {
            return wrapped(...args).then(() => {
                SortedStatusEffects.staticAlterHUD(this.element);
            });
        }, 'WRAPPER');
    }
    
    static ready() {
    }

    static staticAlterHUD(html) {
        console.log('alterHUD called: ', html);
        // just test the styles
        $('#token-hud').toggleClass('sorted-status-effects');

        // Replace the status icons with the sorted ones
        const statusEffectsContainer = html.find('.status-effects');
        const statusIcons = statusEffectsContainer.children('.effect-control');
        
        // Check for the sortedStatusEffects object
        sortedStatusEffects = game.settings.get('sorted-status-effects', 'sortedStatusEffects');
        if (!sortedStatusEffects) {
            sortedStatusEffects = {};
            // Initialize the sortedStatusEffects object if it doesn't exist
            const baseConditions = game.clt.conditions
            let order = 0;
            baseConditions.forEach(condition => {
                sortedStatusEffects[condition.id] = { id: condition.id, name: condition.name, order: order++ };
            });
            game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatusEffects);
        } else {
            // Filter out any conditions that are no longer in the game and add new ones
            const newConditions = game.clt.conditions;
            const newSortedStatusEffects = {};
            let order = 0;

            newConditions.forEach(condition => {
                if (sortedStatusEffects[condition.id]) {
                    newSortedStatusEffects[condition.id] = sortedStatusEffects[condition.id];
                    newSortedStatusEffects[condition.id].order = order++;
                } else {
                    newSortedStatusEffects[condition.id] = { id: condition.id, name: condition.name, order: order++ };
                }
            });

            sortedStatusEffects = newSortedStatusEffects;
            game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatusEffects);
        }

        // Create an array of status icons sorted by the order in sortedStatusEffects
        const sortedIcons = statusIcons.toArray().sort((a, b) => {
            const idA = $(a).data('status-id');
            const idB = $(b).data('status-id');
            const orderA = sortedStatusEffects[idA] ? sortedStatusEffects[idA].order : 0;
            const orderB = sortedStatusEffects[idB] ? sortedStatusEffects[idB].order : 0;
            return orderA - orderB;
        });

        console.log('Sorted Status Effects | Sorted Status Effects:', sortedStatusEffects);
        console.log('Sorted Status Effects | Sorted icons:', sortedIcons);

        // Append the sorted icons back to the container
        statusEffectsContainer.empty().append(sortedIcons);
    }

}

Hooks.once('init', async function() {
    // Check if libWrapper is installed
    if (game.modules.get('lib-wrapper') === undefined) {
        ui.notifications.error('Sorted Status Effects | Please enable the "libWrapper" module.');
        return;
    }

    if (game.modules.get('condition-lab-triggler') === undefined) {
        ui.notifications.error('Sorted Status Effects | Please enable the "Condition Lab & Triggler" module.');
        return;
    }

    console.log('Sorted Status Effects | Initializing Sorted Status Effects module');
    SortedStatusEffects.init();
});

Hooks.once('ready', async function() {
    console.log('Sorted Status Effects | Ready');
    SortedStatusEffects.ready();
});

/** Hook to apply custom keybinds to the token HUD. */
Hooks.on("renderTokenHUD", function(tokenHud, html) {
    registerKeybinds(tokenHud, html);
});