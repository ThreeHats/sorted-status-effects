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
        game.settings.register('sorted-status-effects', 'statusHudSidebarMode', {
            name: 'Status HUD Sidebar Mode',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'tags': 'Tagged Effects',
                'active': 'Active Effects'
            },
            default: 'tags'
        });
        game.settings.register('sorted-status-effects', 'sidebarOpacity', {
            name: 'Sidebar Opacity',
            hint: 'Controls the opacity of the status effects sidebar (0.1-1.0)',
            scope: 'world',
            config: true,
            type: Number,
            range: {
                min: 0.1,
                max: 1.0,
                step: 0.1
            },
            default: 1.0
        });
        game.settings.register('sorted-status-effects', 'showAboveMonksLittleDetails', {
            name: 'Move the status effect tag icons above the HUD with Monks Little Details alter-hud enabled',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
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

        // Add reset buttons in settings
        game.settings.registerMenu('sorted-status-effects', 'resetOptions', {
            name: 'Reset Options',
            label: 'Reset Sorting and Tags',
            icon: 'fas fa-cog',
            type: class ResetOptionsDialog extends FormApplication {
            static get defaultOptions() {
                return mergeObject(super.defaultOptions, {
                title: 'Reset Options',
                id: 'reset-options',
                template: "modules/sorted-status-effects/templates/reset-options.html",
                width: 400
                });
            }
            async _updateObject(event, formData) {
                const confirmed = await Dialog.confirm({
                title: "Reset Options",
                content: "Are you sure you want to reset the selected options?",
                yes: () => {
                    if (formData.resetSort) {
                    game.settings.set('sorted-status-effects', 'sortedStatusEffects', {});
                    ui.notifications.info('Status effect sorting has been reset');
                    }
                    if (formData.resetTags) {
                    game.settings.set('sorted-status-effects', 'statusEffectsTags', []);
                    game.settings.set('sorted-status-effects', 'tagIcons', {});
                    ui.notifications.info('Tags and icons have been reset');
                    }
                },
                no: () => {},
                defaultYes: false
                });
            }
            getData() {
                return {
                resetSort: false,
                resetTags: false
                };
            }
            },
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
        let sizeW = 24;
        if (game.modules.get('illandril-token-hud-scale') !== undefined && 
        game.modules.get('illandril-token-hud-scale').active && 
        !(game.modules.get('monks-little-details') !== undefined && 
        game.modules.get('monks-little-details').active && 
        game.settings.get('monks-little-details', 'alter-hud'))) {
            size = 36;
            sizeW = 36;
        }
        if (!game.settings.get('sorted-status-effects', 'showAboveMonksLittleDetails') &&
        game.modules.get('monks-little-details') !== undefined && 
        game.modules.get('monks-little-details').active && 
        game.settings.get('monks-little-details', 'alter-hud')) {
            sizeW = 126;
        }

        // Make icons for the tags
        const tagIcons = game.settings.get('sorted-status-effects', 'tagIcons') || {};
        if (tags.length > 0) {
            let count = 0;
            for (let tag of tags) {
                let iconSrc = tagIcons[tag] || 'icons/svg/d20.svg';
                let tagIcon = $(`<div class="status-wrapper" data-tag-id="${tag}" style="
                    ${shownTags.includes(tag) ? 'border: 1px solid green;' : 'border: 1px solid #fff;'} 
                    border-radius: 4px;
                    width: ${sizeW}px;
                    height: ${size}px;">
                    <img class="" style="
                    width: ${size}px;
                    height: ${size}px;
                    margin: 0;
                    padding: 0;
                    border: none;
                    opacity: ${shownTags.includes(tag) ? 1 : 0.5};" 
                    src="${iconSrc}" 
                    data-tooltip="${tag}"
                    data-is-tag="true"></div>`);
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
                if (game.modules.get('monks-little-details') !== undefined && 
                game.modules.get('monks-little-details').active && 
                game.settings.get('monks-little-details', 'alter-hud')) {
                    if (game.settings.get('sorted-status-effects', 'showAboveMonksLittleDetails')) {
                        tagIcon.css('position', 'absolute');
                        tagIcon.css('top', `-${size}px`);
                        tagIcon.css('left', `${size * count}px`);
                        tagIcon.css('width', `${size}px`)
                        tagIcon.css('border-bottom', 'none');
                        tagIcon.css('border-radius', '4px 4px 0px 0px')
                        tagIcon.css('border-color', '#bbb')
                        tagIcon.css('background', '#333')
                    } else {
                        // Add a text label to the tag icons
                        tagIcon.append(`<div class="effect-name" style="${shownTags.includes(tag) ? 'opacity: 1' : ''}">${tag}</div>`);
                    }
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
        const gap = 1;
        const rightMargin = 5;
        // Remove the gap from the container level
        if (game.settings.get('sorted-status-effects', 'layoutOrientation') === 'vertical') {
            activeStatusEffectsContainer.css('flex-direction', 'row');
            activeStatusEffectsContainer.css('width', `${(size + gap) * (tags.length + 1)}px`);
            activeStatusEffectsContainer.css('right', `-${(size + gap) * (tags.length + 1) + rightMargin}px`);
            // Apply gap only within categories
            activeStatusEffectsContainer.find('.sse-active-status-effects-category').css({
                'flex-direction': 'column',
                'gap': `${gap}px`
            });
        } else {
            activeStatusEffectsContainer.css('flex-direction', 'column');
            // Apply gap only within categories
            activeStatusEffectsContainer.find('.sse-active-status-effects-category').css({
                'flex-direction': 'row',
                'gap': `${gap}px`
            });
        }
        
        // Add opacity setting
        const opacity = game.settings.get('sorted-status-effects', 'sidebarOpacity');
        // Sort the status icons based on the sorted status effects object
        const statusIconsArray = Array.from(statusIcons); // Convert to array to prevent modification issues
        statusIconsArray.forEach((icon, index) => {
            if (debug) console.log('Sorted Status Effects | Icon:', icon);
            const effectId = effectIds[index];
            const effect = sortedStatusEffects[effectId];
            if (debug) console.log('Sorted Status Effects | Effect and ID:', effect, effectId);
            if (effect) {
                // If sidebar is in 'active' mode, then if the effect is on the actor, make a copy of the effect to place in the container
                if (game.settings.get('sorted-status-effects', 'statusHudSidebarMode') === 'active') {
                    if (activeEffects.find((actorEffect) => actorEffect === effectId)) {
                        const actorEffect = activeEffects.find((actorEffect) => actorEffect.id === effectId);
                        const actorEffectIcon = $(icon).clone();
                        actorEffectIcon.css('height', `${size}px`);
                        actorEffectIcon.css('width', `${size}px`);
                        const effectName = $(icon).find('.effect-name').text();
                        actorEffectIcon.attr('data-tooltip', effectName);
                        actorEffectIcon.css('order', `${effect.order}`);
                        actorEffectIcon.css('opacity', opacity);
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
                } else {
                    // If the effect is not hidden, clone the icon and add it to the container
                    if (!effect.hidden) {
                        const effectIcon = $(icon).clone();
                        effectIcon.css('height', `${size}px`);
                        effectIcon.css('width', `${size}px`);
                        let effectName = effectIcon.find('.effect-name').text();
                        if (!effectName) {
                            const statusId = effectIcon.data('statusId') || effectIcon.data('effectId');
                            if (game.clt && game.clt.conditions) {
                                const condition = game.clt.conditions.find(cond => cond.id === statusId);
                                if (condition) {
                                    effectName = condition.name;
                                }
                            }
                        }
                        if (debug) console.log(`Sorted Status Effects | Adding ${effectName} to sidebar`, effectIcon)
                        effectIcon.attr('data-tooltip', effectName);
                        effectIcon.css('order', `${effect.order}`);
                        let activeOpacity = activeEffects.find((actorEffect) => actorEffect === effectId) ? 1 : opacity;
                        effectIcon.css('opacity', activeOpacity);
                        if (effect.tags && effect.tags.length > 0) {
                            for (let tag of effect.tags) {
                                if (shownTags.includes(tag)) {
                                    const categoryContainer = activeStatusEffectsContainer.find(`.sse-active-status-effects-category[data-tag="${tag}"]`);
                                    categoryContainer.append(effectIcon.clone());
                                }
                            }
                        }
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
                    // Only show effects with tags in the sidebar if in 'tags' mode
                    if (game.settings.get('sorted-status-effects', 'statusHudSidebarMode') === 'active') {
                        for (let tag of effect.tags) {
                            if (shownTags.includes(tag)) {
                                hide = false;
                            }
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
            let nonEmptyCategories = 0;
            activeStatusEffectsContainer.children().each((index, element) => {
                const category = $(element);
                if (category.children().length > 0) {
                    nonEmptyCategories++;
                    if (category.children().length > maxEffects) {
                        maxEffects = category.children().length;
                    }
                }
            });
            if (maxEffects > 0) {
                activeStatusEffectsContainer.css('width', `${(size + gap) * maxEffects}px`);
                activeStatusEffectsContainer.css('right', `-${(size + gap) * maxEffects + rightMargin}px`);
            } else {
                // If no effects are shown, collapse the container
                activeStatusEffectsContainer.css('width', '0');
                activeStatusEffectsContainer.css('right', '0');
            }
        } else {
            // For vertical layout, adjust width based on non-empty categories
            let nonEmptyCategories = 0;
            activeStatusEffectsContainer.children().each((index, element) => {
                if ($(element).children().length > 0) {
                    nonEmptyCategories++;
                }
            });
            if (nonEmptyCategories > 0) {
                activeStatusEffectsContainer.css('width', `${(size + gap) * nonEmptyCategories}px`);
                activeStatusEffectsContainer.css('right', `-${(size + gap) * nonEmptyCategories + rightMargin}px`);
            } else {
                // If no effects are shown, collapse the container
                activeStatusEffectsContainer.css('width', '0');
                activeStatusEffectsContainer.css('right', '0');
            }
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