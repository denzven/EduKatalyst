/**
 * ModuleRegistry.js
 * Registry manager for pluggable EduKatalyst feature modules.
 * Handles dynamic module registration, route matching, and lifecycle invocation.
 */

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  /**
   * Register a new feature module into the EduKatalyst App Shell.
   * @param {Object} moduleDefinition 
   * @param {string} moduleDefinition.id - Unique ID (e.g., 'quiz', 'video')
   * @param {string} moduleDefinition.name - Display Name
   * @param {Array<string>} [moduleDefinition.routes] - Array of route tabs handled
   * @param {Object} [moduleDefinition.navItem] - Optional nav configuration
   * @param {Function} [moduleDefinition.init] - Lifecycle init handler
   * @param {Function} moduleDefinition.render - Component renderer function
   */
  register(moduleDefinition) {
    if (!moduleDefinition || !moduleDefinition.id) {
      throw new Error('[ModuleRegistry] Invalid module definition: id is required.');
    }

    if (this.modules.has(moduleDefinition.id)) {
      console.warn(`[ModuleRegistry] Module "${moduleDefinition.id}" is already registered. Overwriting.`);
    }

    this.modules.set(moduleDefinition.id, {
      routes: [],
      ...moduleDefinition,
    });
  }

  /**
   * Unregister a feature module by ID.
   * @param {string} moduleId 
   */
  unregister(moduleId) {
    const module = this.modules.get(moduleId);
    if (module && typeof module.destroy === 'function') {
      try {
        module.destroy();
      } catch (err) {
        console.error(`[ModuleRegistry] Error destroying module "${moduleId}":`, err);
      }
    }
    this.modules.delete(moduleId);
  }

  /**
   * Get a registered module by ID.
   * @param {string} moduleId 
   * @returns {Object|null}
   */
  getModule(moduleId) {
    return this.modules.get(moduleId) || null;
  }

  /**
   * Get all registered feature modules.
   * @returns {Array<Object>}
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * Find the module responsible for a given tab route.
   * @param {string} tab 
   * @returns {Object|null}
   */
  getModuleForRoute(tab) {
    for (const module of this.modules.values()) {
      if (module.routes && module.routes.includes(tab)) {
        return module;
      }
    }
    return null;
  }

  /**
   * Get all registered navigation items for building dynamic navigation UI.
   * @returns {Array<Object>}
   */
  getNavItems() {
    return this.getAllModules()
      .filter((m) => m.navItem)
      .map((m) => m.navItem);
  }

  /**
   * Initialize all registered modules.
   * @param {Object} orchestratorApi 
   */
  initAll(orchestratorApi) {
    this.modules.forEach((module) => {
      if (typeof module.init === 'function') {
        try {
          module.init(orchestratorApi);
        } catch (err) {
          console.error(`[ModuleRegistry] Error initializing module "${module.id}":`, err);
        }
      }
    });
  }
}

export const moduleRegistry = new ModuleRegistry();
export default ModuleRegistry;
