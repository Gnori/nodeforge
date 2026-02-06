/**
 * ModuleManager - Handles module management
 *
 * Extracted from nodeforge.js
 * Manages module creation, switching, removal, and clearing
 */
import { EVENTS, ZOOM_CONFIG } from '../constants.js';

export class ModuleManager {
  /**
   * Creates a new ModuleManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Adds a new module
   * @param {string} name - Module name
   */
  addModule(name) {
    const nodeforgeData = this.context.getNodeForgeData();
    nodeforgeData[name] = { "data": {} };

    const eventManager = this.context.getEventManager();
    eventManager.dispatch(EVENTS.MODULE_CREATED, name);
  }

  /**
   * Changes to a different module
   * Clears the canvas and loads the new module's data
   * @param {string} name - Module name to switch to
   */
  changeModule(name) {
    const eventManager = this.context.getEventManager();
    const precanvas = this.context.getPrecanvas();

    // Dispatch module changed event
    eventManager.dispatch(EVENTS.MODULE_CHANGED, name);

    // Update current module
    this.context.nodeforge.module = name;

    // Clear canvas
    precanvas.innerHTML = "";

    // Reset canvas position
    this.context.setCanvasPosition(0, 0);

    // Reset mouse position
    this.context.nodeforge.pos_x = 0;
    this.context.nodeforge.pos_y = 0;
    this.context.nodeforge.mouse_x = 0;
    this.context.nodeforge.mouse_y = 0;

    // Reset zoom
    this.context.setZoom(ZOOM_CONFIG.DEFAULT);
    this.context.nodeforge.zoom_last_value = ZOOM_CONFIG.LAST_VALUE;
    precanvas.style.transform = '';

    // Import the module data (reload the new module)
    // Note: This calls the main NodeForge.import() method
    this.context.nodeforge.import(this.context.nodeforge.nodeforge, false);
  }

  /**
   * Removes a module
   * If the module being removed is currently active, switches to 'Home' module first
   * @param {string} name - Module name to remove
   */
  removeModule(name) {
    const currentModule = this.context.getModule();
    const nodeforgeData = this.context.getNodeForgeData();
    const eventManager = this.context.getEventManager();

    // If removing current module, switch to Home first
    if (currentModule === name) {
      this.changeModule('Home');
    }

    // Delete the module
    delete nodeforgeData[name];

    // Dispatch module removed event
    eventManager.dispatch(EVENTS.MODULE_REMOVED, name);
  }

  /**
   * Clears all nodes in the currently selected module
   * Does not remove the module itself, just empties its data
   */
  clearModuleSelected() {
    const precanvas = this.context.getPrecanvas();
    const currentModule = this.context.getModule();
    const nodeforgeData = this.context.getNodeForgeData();

    // Clear canvas
    precanvas.innerHTML = "";

    // Clear module data
    nodeforgeData[currentModule] = { "data": {} };
  }

  /**
   * Clears all modules and resets to default state
   * Resets the entire nodeforge to a fresh state with only the Home module
   */
  clear() {
    const precanvas = this.context.getPrecanvas();
    const DEFAULT_MODULE = 'Home'; // Or import from constants

    // Clear canvas
    precanvas.innerHTML = "";

    // Reset to default nodeforge structure
    this.context.nodeforge.nodeforge = {
      "nodeforge": {
        [DEFAULT_MODULE]: { "data": {} }
      }
    };
  }
}
