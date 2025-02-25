import { registerKeybinds, onEffectKeyDown } from "./scripts/keybindings.js";
import { changeHUD } from "./scripts/change-hud.js";

export class SortedStatusEffects {
    static init() {
        console.log('Sorted Status Effects | Registering keybinding');
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
        console.log('Sorted Status Effects | Patching TokenHUD._render method');
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
        // Modify the Token HUD to include effect names
        $('#token-hud').toggleClass('sorted-status-effects');
    }

}

Hooks.once('init', async function() {
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