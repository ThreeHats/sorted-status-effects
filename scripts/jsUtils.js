/**
 * Plain JavaScript equivalent of $.on with support for event capturing.
 * Note that unlike JQuery, this method does not override the event's current target. Use delegateTarget to access the
 * first element that matched the selector.
 * @param {HTMLElement} element The element to bind the event handler on.
 * @param {string} type The event type to bind.
 * @param {string} selector The selector to match before calling the handler.
 * @param {Function} handler The handler for events matching the selector.
 * @param {boolean} capture Indicates whether the event is processed in the capturing or bubbling phase.
 */
export function on(element, type, selector, handler, capture = false) {
    element.addEventListener(type, event => {
        const actualTarget = event.target.closest(selector);
        if (actualTarget) {
            event.delegateTarget = actualTarget;
            handler(event);
        }
    }, capture);
}

/**
 * Plain JavaScript equivalent of $.wrap.
 * @param {HTMLElement} element The element to wrap.
 * @param {HTMLElement} wrapper The wrapper element.
 */
export function wrap(element, wrapper) {
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
}

/**
 * Prevents all other event listeners (including the default operation) to run.
 * @param {Event | jQuery.Event} event The event to stop.
 */
export function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
}
