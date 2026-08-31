/**
 * EventMediator.js
 * Central Pub/Sub Event Bus facilitating decoupled communication between EduKatalyst modules.
 * Modules never directly reference or invoke each other; instead, they publish and subscribe to events.
 */

class EventMediator {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to a specific event topic.
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Handler function invoked when event is published
   * @returns {Function} Unsubscribe cleanup function
   */
  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const callbacks = this.listeners.get(eventName);
    callbacks.add(callback);

    // Return unsubscribe function for convenience
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  /**
   * Unsubscribe a handler from an event.
   * @param {string} eventName 
   * @param {Function} callback 
   */
  unsubscribe(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Publish an event to all subscribed listeners.
   * @param {string} eventName 
   * @param {any} payload 
   */
  publish(eventName, payload) {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName);
    callbacks.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`[EventMediator] Error handling event "${eventName}":`, error);
      }
    });
  }

  /**
   * Clear all active subscribers (useful for testing / resets).
   */
  clear() {
    this.listeners.clear();
  }
}

export const eventMediator = new EventMediator();
export default EventMediator;
