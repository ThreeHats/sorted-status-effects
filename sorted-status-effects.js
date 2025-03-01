import { registerKeybinds, onEffectKeyDown, onEffectKeyUp, onTagKeyDown } from "./scripts/keybindings.js";
import { TagConfigurationDialog } from "./scripts/tag-configuration-dialog.js";

let sortedStatusEffects = {};
let shownTags = [];
let debug = false;

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
        game.settings.register('sorted-status-effects', 'statusEffectsTags', {
            name: 'Tags',
            scope: 'world',
            config: false,
            type: Object,
            default: undefined
        });
        game.settings.register('sorted-status-effects', 'tagIcons', {
            name: 'Tag Icons',
            scope: 'world',
            config: false,
            type: Object,
            default: {}
        });
        game.settings.register('sorted-status-effects', 'layoutOrientation', {
            name: 'Layout Orientation',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'horizontal': 'Horizontal',
                'vertical': 'Vertical'
            },
            default: 'horizontal'
        });
        game.settings.register('sorted-status-effects', 'debug', {
            name: 'Debug',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            requiresReload: true
        });

        // Add menu setting for the configuration dialog
        game.settings.registerMenu('sorted-status-effects', 'tagConfig', {
            name: 'Configure Tags',
            label: 'Configure Tags and Icons',
            icon: 'fas fa-tags',
            type: TagConfigurationDialog,
            restricted: true
        });

        // Register keybinding
        game.keybindings.register('sorted-status-effects', 'toggleEffect', {
            name: 'Toggle Effect',
            hint: 'Toggle the effect when hovering over a status icon',
            editable: [{ key: 'KeyT' }],
            onDown: (context) => {
                if (debug) console.log('Keybinding pressed');
                onEffectKeyDown(context);
            },
            onUp: (context) => {
                if (debug) console.log('Keybinding released');
                onEffectKeyUp(context);
            },
            restricted: true
        });
        game.keybindings.register('sorted-status-effects', 'taggingMenu', {
            name: 'Tagging Menu',
            hint: 'Open the tagging menu',
            editable: [{ key: 'KeyQ' }],
            onDown: (context) => {
                if (debug) console.log('Keybinding pressed');
                onTagKeyDown(context);
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
        debug = game.settings.get('sorted-status-effects', 'debug');
    }

    static staticAlterHUD(html) {
        if (debug) console.log('alterHUD called: ', html);
        // Add a class to the token HUD to allow for custom styling
        $('#token-hud').toggleClass('sorted-status-effects');

        // Get the status effects container and the status icons
        const statusEffectsContainer = html.find('.status-effects');
        let statusIcons = statusEffectsContainer.children().filter('.effect-control');
        if (statusIcons.length === 0) statusIcons = statusEffectsContainer.children().filter('.status-wrapper');
        if (statusIcons.length === 0) statusIcons = statusEffectsContainer.children().filter('.effect-container');

        if (debug) console.log('Sorted Status Effects | Status Effects Container:', statusEffectsContainer);
        if (debug) console.log('Sorted Status Effects | Status Icons:', statusIcons);
        
        // Get or initialize the sorted status effects object
        sortedStatusEffects = game.settings.get('sorted-status-effects', 'sortedStatusEffects');
        if (!sortedStatusEffects) {
            sortedStatusEffects = {};
            game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatusEffects);
        }

        let baseStatusEffects = [];
        // This is the only real dependancy on the Condition Lab & Triggler module.
        // Integrating with other modules is as simple as changing the way the baseStatusEffects object is populated.
        // game.clt.conditions.forEach((condition) => {
        //     baseStatusEffects.push([
        //         condition.id,
        //         condition.hidden
        //     ]);
        // });
        statusIcons.each((index, icon) => {
            let effectId = icon.dataset.statusId;
            if (!effectId) {
                effectId = icon.dataset.effectId;
            }
            if (!effectId) {
                effectId = icon.children[0].dataset.statusId;
            }
            if (!effectId) {
                effectId = icon.children[0].dataset.effectId;
            }
            if (!effectId) {
                ui.notifications.error('Sorted Status Effects | NOT SORTING. Effect ID not found. Check the console for more information.');
                console.error('Sorted Status Effects | Effect ID not found:', icon);
                return;
            }
            if (debug) console.log('Sorted Status Effects | Icon:', icon);
            baseStatusEffects.push([
                effectId,
                false
            ]);
        });

        if (debug) console.log('Sorted Status Effects | Base status effects:', baseStatusEffects);

        // Populate the sorted status effects object with the base status effects
        let effectIds = [];
        for (let i = 0; i < baseStatusEffects.length; i++) {
            if (sortedStatusEffects[baseStatusEffects[i][0]] === undefined) {
                sortedStatusEffects[baseStatusEffects[i][0]] = {
                    order: i+1,
                    hidden: baseStatusEffects[i][1] === undefined ? false : baseStatusEffects[i][1],
                    tag: []
                };
            }
            effectIds.push(baseStatusEffects[i][0]);
        }

        if (debug) console.log('Sorted Status Effects | Effect IDs:', effectIds);

        for (const [key, value] of Object.entries(sortedStatusEffects)) {
            if (!effectIds.includes(key)) {
                if (debug) console.log('Sorted Status Effects | Deleting status effect:', key);
                delete sortedStatusEffects[key];
            } 
        }

        // Check if the status icons and effect IDs match
        if (statusIcons.length !== effectIds.length) {
            ui.notifications.error('Sorted Status Effects | NOT SORTING. Status Icons and Effect IDs do not match. Check your Condition Lab settings, and try removing default status effects. Check the console for more information.');
            console.error('Sorted Status Effects | Status Icons and Effect IDs do not match:', statusIcons.length, effectIds.length);
            console.error('Sorted Status Effects | Status Icons:', statusIcons);
            console.error('Sorted Status Effects | Effect IDs:', effectIds);
            console.error('Sorted Status Effects | Sorted Status Effects:', sortedStatusEffects);
            console.error('Sorted Status Effects | Base Status Effects:', baseStatusEffects);
            return;
        }

        game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatusEffects);

        if (debug) console.log('Sorted Status Effects | Sorted status effects:', sortedStatusEffects);

        let tags = game.settings.get('sorted-status-effects', 'statusEffectsTags');
        if (!tags) {
            tags = [];
            game.settings.set('sorted-status-effects', 'statusEffectsTags', tags);
        }

        if (debug) console.log('Sorted Status Effects | Tags:', tags);

        // check for illandril-token-hud-scale and monks-little-details compatibility
        let size = 24;
        if (game.modules.get('illandril-token-hud-scale') !== undefined && game.modules.get('illandril-token-hud-scale').active && !game.settings.get('monks-little-details', 'alter-hud')) {
            size = 36;
        }

        // Make icons for the tags
        const tagIcons = game.settings.get('sorted-status-effects', 'tagIcons') || {};
        if (tags.length > 0) {
            let count = 0;
            for (let tag of tags) {
                let iconSrc = tagIcons[tag] || 'icons/svg/d20.svg';
                let tagIcon = $(`<div class="status-wrapper"><img class="" 
                    style="
                    width: ${size}px;
                    height: ${size}px;
                    margin: 0;
                    padding: 0;
                    border: none;
                    opacity: ${shownTags.includes(tag) ? 1 : 0.5};" 
                    src="${iconSrc}" 
                    data-tooltip="${tag}"></div>`);
                tagIcon.css('order', 0);
                tagIcon.on('click', function(event) {
                    const tagIndex = shownTags.indexOf(tag);
                    if (tagIndex === -1) {
                        shownTags.push(tag);
                    } else {
                        shownTags.splice(tagIndex, 1);
                    }
                    if (debug) console.log('Sorted Status Effects | Shown Tags:', shownTags);
                    // Re-render the HUD to apply the changes
                    canvas.tokens.hud.render();
                });
                statusEffectsContainer.append(tagIcon);
                if (game.settings.get('monks-little-details', 'alter-hud')) {
                    tagIcon.css('position', 'absolute');
                    tagIcon.css('top', `-${size}px`);
                    tagIcon.css('left', `${size * count}px`);
                };
                count++;
            }
        }

        // Get the selected token and its actor to check for status effects
        const selectedToken = canvas.tokens.controlled[0];
        const actor = selectedToken.actor;
        let activeEffects = actor.statuses.entries().toArray().map(entry => entry[1]);
        if (activeEffects.length > 0 && activeEffects[0] instanceof Object) {
            // If the active effects are objects, get the IDs
            activeEffects = activeEffects.map(effect => effect.id);
        }
        if (debug) console.log('Sorted Status Effects | Actor Effects:', activeEffects);

        // Create a container for the active status effects
        const activeStatusEffectsContainer = $('<div id="sse-active-status-effects-container"></div>');
        activeStatusEffectsContainer.append(`<div class="sse-active-status-effects-category" data-tag="Default"></div>`);
        for(let tag of tags) {
            activeStatusEffectsContainer.append(`<div class="sse-active-status-effects-category" data-tag="${tag}"></div>`);
        }
        const gap = 2;
        const rightMargin = 5;
        activeStatusEffectsContainer.css('gap', `${gap}px`);
        if (game.settings.get('sorted-status-effects', 'layoutOrientation') === 'vertical') {
            activeStatusEffectsContainer.css('flex-direction', 'row');
            activeStatusEffectsContainer.css('width', `${(size + gap) * (tags.length + 1)}px`);
            activeStatusEffectsContainer.css('right', `-${(size + gap) * (tags.length + 1) + rightMargin}px`);
            activeStatusEffectsContainer.find('.sse-active-status-effects-category').css('flex-direction', 'column');
        } else {
            activeStatusEffectsContainer.css('flex-direction', 'column');
            activeStatusEffectsContainer.find('.sse-active-status-effects-category').css('flex-direction', 'row');
        }

        // Sort the status icons based on the sorted status effects object
        const statusIconsArray = Array.from(statusIcons); // Convert to array to prevent modification issues
        statusIconsArray.forEach((icon, index) => {
            if (debug) console.log('Sorted Status Effects | Icon:', icon);
            const effectId = effectIds[index];
            const effect = sortedStatusEffects[effectId];
            if (debug) console.log('Sorted Status Effects | Effect and ID:', effect, effectId);
            if (effect) {
                // If the effect is on the actor, make a copy of the effect to place in the container
                if (activeEffects.find((actorEffect) => actorEffect === effectId)) {
                    const actorEffect = activeEffects.find((actorEffect) => actorEffect.id === effectId);
                    const actorEffectIcon = $(icon).clone();
                    if (effect.tags && effect.tags.length > 0) {
                        for (let tag of effect.tags) {
                            const categoryContainer = activeStatusEffectsContainer.find(`.sse-active-status-effects-category[data-tag="${tag}"]`);
                            categoryContainer.append(actorEffectIcon.clone());
                        }
                    } else {
                        const categoryContainer = activeStatusEffectsContainer.find(`.sse-active-status-effects-category[data-tag="Default"]`);
                        categoryContainer.append(actorEffectIcon);
                    }
                }

                // Set the order and visibility of the original status icons
                $(icon).css('order', effect.order);
                if (effect.hidden) {
                    $(icon).css('display', 'none');
                }
                if (effect.tags && effect.tags.length > 0) {
                    if (debug) console.log('Sorted Status Effects | Effect Tags:', effect.tags);
                    let hide = true;
                    for (let tag of effect.tags) {
                        if (shownTags.includes(tag)) {
                            hide = false;
                        }
                    }
                    if (hide) {
                        $(icon).css('display', 'none');
                    }
                }
            } else {
                console.error('Sorted Status Effects | Effect not found:', index, effectId);
            }
        });

        if (game.settings.get('sorted-status-effects', 'layoutOrientation') === 'horizontal') {
            let maxEffects = 0;
            activeStatusEffectsContainer.children().each((index, element) => {
                const category = $(element);
                if (category.children().length > maxEffects) {
                    maxEffects = category.children().length;
                }
            });
            activeStatusEffectsContainer.css('width', `${(size + gap) * maxEffects}px`);
            activeStatusEffectsContainer.css('right', `-${(size + gap) * maxEffects + rightMargin}px`);
        }
        // Add the container after processing all icons
        statusEffectsContainer.append(activeStatusEffectsContainer);
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