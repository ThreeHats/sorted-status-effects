import { on, stopEvent } from "./jsUtils.js";

/**
 * The currently hovered token HUD entity and status icon element.
 */
let activeEffectHud, activeEffectHudIcon, targetStatusId;
let statusEffectsTags = [];

/**
 * Applies keybinds to the given entity to change status counters. Which 
 *  methods are used depends on the configuration. Previously registered 
 *  handlers are unregistered wherever necessary.
 * @param {TokenHUD} entity The Foundry entity associated with the element.
 * @param {jQuery} html The HTML code of the element.
 */
export function registerKeybinds(entity, html) {
    let effectHud = html[0].querySelector(".status-effects");
    if (!effectHud) return;

    on(effectHud, "mouseover", ".effect-control", onEffectMouseOver.bind(entity));
    on(effectHud, "mouseout", ".effect-control", onEffectMouseOut.bind(entity));
}

/**
 * Handles the mouseover event onto a status icon to store the active entity so that it can be accessed by the global
 *  key event handler.
 * @param {PointerEvent} event The mouse over event.
 */
function onEffectMouseOver(event) {
    activeEffectHud = this;
    activeEffectHudIcon = event.delegateTarget;
}

/**
 * Handles the mouseout event off a status icon to reset the active entity so that it can no longer be accessed by the
 *  global key event handler.
 */
function onEffectMouseOut() {
    if (activeEffectHud === this) {
        activeEffectHud = activeEffectHudIcon = null;
    }
}

/**
 * Handles the keydown sorting event for the currently active status icon HUD element. If none is active
 *  this handler returns immediately. Otherwise, we store the statusId.
 * @param {jQuery.Event} event The key down event triggered by jQuery.
 */
export function onEffectKeyDown(event) {
    if (!activeEffectHud || !activeEffectHud.object.visible) return;

    // let keyValue = parseInt(event.key);
    // if (Number.isNaN(keyValue)) return;

    event.currentTarget = activeEffectHudIcon;
    const { statusId } = event.currentTarget.dataset;

    console.log("SSE| " + statusId);

    targetStatusId = statusId;

    // stopEvent(event);
}

/**
 * Handles the keyup sorting event for the currently active status icon HUD element. If none is active
 *  this handler returns immediately. Otherwise, we change the order of the sorted effects if not the same target.
 * @param {jQuery.Event} event The key down event triggered by jQuery.
 */
export function onEffectKeyUp(event) {
    if (!activeEffectHud || !activeEffectHud.object.visible) return;

    event.currentTarget = activeEffectHudIcon;
    const { statusId } = event.currentTarget.dataset;

    console.log("SSE| " + statusId);

    if (targetStatusId === statusId) return;

    let sortedStatus = game.settings.get('sorted-status-effects', 'sortedStatusEffects');
    console.log("SSE| Presorted:", sortedStatus);

    // Get the orders of the statusId and targetStatusId
    const statusOrder = sortedStatus[statusId].order;
    const targetOrder = sortedStatus[targetStatusId].order;

    // Determine the starting order for reordering
    const startOrder = Math.min(statusOrder, targetOrder);

    // Create a list of status effects to reorder
    const statusList = Object.entries(sortedStatus)
        .map(([key, value]) => ({ id: key, order: value.order }))
        .sort((a, b) => a.order - b.order);

    // Reorder the status effects
    let count = startOrder;
    for (const status of statusList) {
        if (status.order >= startOrder) {
            sortedStatus[status.id].order = ++count;
        }
    }

    // Move the targetStatusId to the order of the statusId
    sortedStatus[targetStatusId].order = statusOrder;

    game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatus);

    console.log("SSE| Postsorted:", sortedStatus);

    // Force a refresh of the status icons
    activeEffectHud.render();
}

/**
 * Handles the keydown tagger menu event for the currently active status icon HUD element. If none is active
 *  this handler returns immediately. Otherwise, we display the tagging menu dialog.
 * @param {jQuery.Event} event The key down event triggered by jQuery.
 */
export function onTagKeyDown(event) {
    if (!activeEffectHud || !activeEffectHud.object.visible) return;

    event.currentTarget = activeEffectHudIcon;
    const { statusId } = event.currentTarget.dataset;

    console.log("SSE| " + statusId);

    let sortedStatus = game.settings.get('sorted-status-effects', 'sortedStatusEffects');
    let tags = sortedStatus[statusId].tags || [];

    if (statusEffectsTags.length === 0) {
        statusEffectsTags = game.settings.get('sorted-status-effects', 'statusEffectsTags') || [];
    }

    // Create the tagging menu dialog with checkboxes
    let content = `<div><label>Available Tags:</label><ul>`;
    for (let tag of statusEffectsTags) {
        let checked = tags.includes(tag) ? 'checked' : '';
        content += `<li><input type="checkbox" data-tag="${tag}" ${checked}/> ${tag}</li>`;
    }
    content += `</ul><label>Add Tag:</label><input type="text" id="new-status-tag" /></div>`;

    new Dialog({
        title: "Tagging Menu",
        content: content,
        buttons: {
            save: {
                label: "Save Tags",
                callback: (html) => {
                    let newTag = html.find('#new-status-tag').val();
                    if (newTag && !statusEffectsTags.includes(newTag)) {
                        statusEffectsTags.push(newTag);
                        game.settings.set('sorted-status-effects', 'statusEffectsTags', statusEffectsTags);
                    }
                    let selectedTags = [];
                    html.find('input[type="checkbox"]:checked').each(function() {
                        selectedTags.push($(this).data('tag'));
                    });
                    sortedStatus[statusId].tags = selectedTags;
                    if (newTag) selectedTags.push(newTag);
                    game.settings.set('sorted-status-effects', 'sortedStatusEffects', sortedStatus);
                }
            },
            close: {
                label: "Close"
            }
        },
        default: "save"
    }).render(true);
}