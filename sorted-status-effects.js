import { registerKeybinds, onEffectKeyDown, onEffectKeyUp } from "./scripts/keybindings.js";
import { changeHUD } from "./scripts/change-hud.js";
import { on } from "./scripts/jsUtils.js";

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
            onUp: (context) => {
                console.log('Keybinding released');
                onEffectKeyUp(context);
            },
            restricted: true
        });
        // Patch the TokenHUD _render method using libWrapper for compatibility with other modules
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
        const statusIcons = statusEffectsContainer.children();

        console.log('Sorted Status Effects | Status Effects Container:', statusEffectsContainer);
        console.log('Sorted Status Effects | Status Icons:', statusIcons);
        
        // Get or initialize the sorted status effects object
        sortedStatusEffects = game.settings.get('sorted-status-effects', 'sortedStatusEffects');
        if (!sortedStatusEffects) {
            sortedStatusEffects = {};
            game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatusEffects);
        }

        let baseStatusEffects = [];
        // This is the only real dependancy on the Condition Lab & Triggler module.
        // Integrating with other modules is as simple as changing the way the baseStatusEffects object is populated.
        game.clt.conditions.forEach((condition) => {
            baseStatusEffects.push([
                condition.id,
                condition.hidden
            ]);
        });

        console.log('Sorted Status Effects | Base status effects:', baseStatusEffects);

        // Populate the sorted status effects object with the base status effects
        let effectIds = [];
        for (let i = 0; i < baseStatusEffects.length; i++) {
            if (sortedStatusEffects[baseStatusEffects[i][0]] === undefined) {
                sortedStatusEffects[baseStatusEffects[i][0]] = {
                    order: i,
                    hidden: baseStatusEffects[i][1] === undefined ? false : baseStatusEffects[i][1]
                };
            }
            effectIds.push(baseStatusEffects[i][0]);
        }

        for (const [key, value] of Object.entries(sortedStatusEffects)) {
            if (!effectIds.includes(key)) {
                console.log('Sorted Status Effects | Deleting status effect:', key);
                delete sortedStatusEffects[key];
            } 
        }

        game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatusEffects);

        console.log('Sorted Status Effects | Sorted status effects:', sortedStatusEffects);

        // Apply order and hidden styling to the status icons
        statusIcons.each((index, icon) => {
            console.log('Sorted Status Effects | Icon:', icon);
            const effectId = effectIds[index];
            const effect = sortedStatusEffects[effectId];
            if (effect) {
                $(icon).css('order', effect.order);
                if (effect.hidden) {
                    $(icon).css('display', 'none');
                }
            }
        });

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