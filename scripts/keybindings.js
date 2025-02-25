import { on, stopEvent } from "./jsUtils.js";

/**
 * The currently hovered token HUD entity and status icon element.
 */
let activeEffectHud, activeEffectHudIcon;

/**
 * Applies keybinds to the given entity to change status counters. Which 
 *  methods are used depends on the configuration. Previously registered 
 *  handlers are unregistered wherever necessary.
 * @param {TokenHUD} entity The Foundry entity associated with the element.
 * @param {jQuery} html The HTML code of the element.
 */
export  function registerKeybinds(entity, html) {
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
 * Handles the keydown event for the currently active status icon HUD element. If none is active or the key is not a
 *  digit, this handler returns immediately. Otherwise, the pressed digit is set as the counter for the active status
 *  icon and the associated token is updated accordingly. Note that this handler modifies the event target and stops
 *  propagation if any counters are changed.
 * @param {jQuery.Event} event The key down event triggered by jQuery.
 */
export  function onEffectKeyDown(event) {
    if (!activeEffectHud || !activeEffectHud.object.visible) return;

    // let keyValue = parseInt(event.key);
    // if (Number.isNaN(keyValue)) return;

    event.currentTarget = activeEffectHudIcon;
    const { statusId } = event.currentTarget.dataset;

    console.log("SSE| " + statusId);

    // stopEvent(event);
}
