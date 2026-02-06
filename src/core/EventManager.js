/**
 * EventManager - Handles event registration, removal, and dispatching
 *
 * Extracted from nodeforge.js
 * Manages the event system for the NodeForge editor
 */
export class EventManager {
  /**
   * Creates a new EventManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
    this.events = {};
  }

  /**
   * Registers an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to execute when event is triggered
   * @returns {boolean} False if validation fails, undefined otherwise
   */
  on(event, callback) {
    // Check if the callback is not a function
    if (typeof callback !== 'function') {
      console.error(`The listener callback must be a function, the given type is ${typeof callback}`);
      return false;
    }
    // Check if the event is not a string
    if (typeof event !== 'string') {
      console.error(`The event name must be a string, the given type is ${typeof event}`);
      return false;
    }
    // Check if this event not exists
    if (this.events[event] === undefined) {
      this.events[event] = {
        listeners: []
      };
    }
    this.events[event].listeners.push(callback);
  }

  /**
   * Removes an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   * @returns {boolean} False if event doesn't exist
   */
  removeListener(event, callback) {
    // Check if this event not exists
    if (!this.events[event]) return false;

    const listeners = this.events[event].listeners;
    const listenerIndex = listeners.indexOf(callback);
    const hasListener = listenerIndex > -1;
    if (hasListener) listeners.splice(listenerIndex, 1);
  }

  /**
   * Dispatches an event to all registered listeners
   * @param {string} event - Event name
   * @param {*} details - Event details to pass to listeners
   * @returns {boolean} False if event doesn't exist
   */
  dispatch(event, details) {
    // Check if this event not exists
    if (this.events[event] === undefined) {
      // console.error(`This event: ${event} does not exist`);
      return false;
    }
    this.events[event].listeners.forEach((listener) => {
      listener(details);
    });
  }

  /**
   * Gets all registered events
   * @returns {Object} Events object with all listeners
   */
  getEvents() {
    return this.events;
  }

  /**
   * Clears all event listeners for a specific event
   * @param {string} event - Event name
   */
  clearEvent(event) {
    if (this.events[event]) {
      this.events[event].listeners = [];
    }
  }

  /**
   * Clears all event listeners
   */
  clearAllEvents() {
    this.events = {};
  }
}
