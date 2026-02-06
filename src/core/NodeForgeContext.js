/**
 * NodeForgeContext - Central interface for shared state access
 *
 * This class provides a central access point for all managers to access
 * the shared NodeForge state without creating circular dependencies.
 *
 * All managers receive a context instance and use it to:
 * 1. Access shared state (nodeforge data, zoom, selected nodes, etc.)
 * 2. Access other managers through getter methods
 * 3. Communicate via events
 */
export class NodeForgeContext {
  /**
   * Creates a new NodeForgeContext
   * @param {NodeForge} nodeforge - The main NodeForge instance
   */
  constructor(nodeforge) {
    this.nodeforge = nodeforge;
    this.managers = {};
  }

  // ============================================================
  // Manager Registration
  // ============================================================

  /**
   * Registers a manager instance
   * @param {string} name - Manager name (e.g., 'eventManager', 'nodeManager')
   * @param {Object} manager - Manager instance
   */
  registerManager(name, manager) {
    this.managers[name] = manager;
  }

  /**
   * Gets a registered manager
   * @param {string} name - Manager name
   * @returns {Object} Manager instance
   */
  getManager(name) {
    return this.managers[name];
  }

  // ============================================================
  // Core State Accessors
  // ============================================================

  /**
   * Gets the complete nodeforge data structure
   * @returns {Object} The nodeforge data object
   */
  getNodeForgeData() {
    return this.nodeforge.nodeforge.nodeforge;
  }

  /**
   * Gets the current module name
   * @returns {string} Current module name
   */
  getModule() {
    return this.nodeforge.module;
  }

  /**
   * Gets the container DOM element
   * @returns {HTMLElement} Container element
   */
  getContainer() {
    return this.nodeforge.container;
  }

  /**
   * Gets the precanvas DOM element
   * @returns {HTMLElement} Precanvas element
   */
  getPrecanvas() {
    return this.nodeforge.precanvas;
  }

  /**
   * Gets the current zoom level
   * @returns {number} Current zoom value
   */
  getZoom() {
    return this.nodeforge.zoom;
  }

  /**
   * Sets the zoom level
   * @param {number} zoom - New zoom value
   */
  setZoom(zoom) {
    this.nodeforge.zoom = zoom;
  }

  /**
   * Gets the zoom configuration
   * @returns {Object} Zoom config with min, max, step, last_value
   */
  getZoomConfig() {
    return {
      min: this.nodeforge.zoom_min,
      max: this.nodeforge.zoom_max,
      step: this.nodeforge.zoom_value,
      last_value: this.nodeforge.zoom_last_value
    };
  }

  /**
   * Gets the current editor mode
   * @returns {string} Editor mode ('edit' or 'fixed')
   */
  getEditorMode() {
    return this.nodeforge.editor_mode;
  }

  /**
   * Gets the currently selected node ID
   * @returns {string|null} Selected node ID or null
   */
  getNodeSelected() {
    return this.nodeforge.node_selected;
  }

  /**
   * Sets the selected node ID
   * @param {string|null} nodeId - Node ID to select or null to deselect
   */
  setNodeSelected(nodeId) {
    this.nodeforge.node_selected = nodeId;
  }

  /**
   * Gets the currently selected connection element
   * @returns {HTMLElement|null} Selected connection element or null
   */
  getConnectionSelected() {
    return this.nodeforge.connection_selected;
  }

  /**
   * Sets the selected connection element
   * @param {HTMLElement|null} element - Connection element to select or null
   */
  setConnectionSelected(element) {
    this.nodeforge.connection_selected = element;
  }

  /**
   * Gets the currently selected element
   * @returns {HTMLElement|null} Selected element or null
   */
  getElementSelected() {
    return this.nodeforge.ele_selected;
  }

  /**
   * Sets the selected element
   * @param {HTMLElement|null} element - Element to select or null
   */
  setElementSelected(element) {
    this.nodeforge.ele_selected = element;
  }

  /**
   * Gets the canvas position
   * @returns {Object} Canvas position with x and y
   */
  getCanvasPosition() {
    return {
      x: this.nodeforge.canvas_x,
      y: this.nodeforge.canvas_y
    };
  }

  /**
   * Sets the canvas position
   * @param {number} x - Canvas X position
   * @param {number} y - Canvas Y position
   */
  setCanvasPosition(x, y) {
    this.nodeforge.canvas_x = x;
    this.nodeforge.canvas_y = y;
  }

  /**
   * Gets the current mouse position
   * @returns {Object} Mouse position with x and y
   */
  getMousePosition() {
    return {
      x: this.nodeforge.mouse_x,
      y: this.nodeforge.mouse_y
    };
  }

  /**
   * Gets connection configuration
   * @returns {Object} Connection config with curvature, line_path, etc.
   */
  getConnectionConfig() {
    return {
      curvature: this.nodeforge.curvature,
      line_path: this.nodeforge.line_path,
      force_first_input: this.nodeforge.force_first_input,
      draggable_inputs: this.nodeforge.draggable_inputs
    };
  }

  /**
   * Gets reroute configuration
   * @returns {Object} Reroute config with curvature, width, etc.
   */
  getRerouteConfig() {
    return {
      curvature: this.nodeforge.reroute_curvature,
      curvature_start_end: this.nodeforge.reroute_curvature_start_end,
      width: this.nodeforge.reroute_width,
      fix_curvature: this.nodeforge.reroute_fix_curvature
    };
  }

  /**
   * Gets the node register (registered node types)
   * @returns {Object} Node register
   */
  getNodeRegister() {
    return this.nodeforge.noderegister;
  }

  /**
   * Gets the render function
   * @returns {Function|null} Custom render function or null
   */
  getRenderFunction() {
    return this.nodeforge.render;
  }

  /**
   * Gets the parent context (for nested editors)
   * @returns {Object|null} Parent context or null
   */
  getParent() {
    return this.nodeforge.parent;
  }

  /**
   * Checks if UUID mode is enabled
   * @returns {boolean} True if using UUIDs for node IDs
   */
  isUsingUuid() {
    return this.nodeforge.useuuid;
  }

  /**
   * Gets and increments the node ID counter
   * @returns {number} Next node ID
   */
  getNextNodeId() {
    return this.nodeforge.nodeId++;
  }

  /**
   * Gets drag state
   * @returns {boolean} True if currently dragging
   */
  isDragging() {
    return this.nodeforge.drag;
  }

  /**
   * Sets drag state
   * @param {boolean} dragging - Drag state
   */
  setDragging(dragging) {
    this.nodeforge.drag = dragging;
  }

  /**
   * Gets connection state
   * @returns {boolean} True if currently making a connection
   */
  isConnecting() {
    return this.nodeforge.connection;
  }

  /**
   * Sets connection state
   * @param {boolean} connecting - Connection state
   */
  setConnecting(connecting) {
    this.nodeforge.connection = connecting;
  }

  /**
   * Gets the connection element being drawn
   * @returns {HTMLElement|null} Connection element or null
   */
  getConnectionElement() {
    return this.nodeforge.connection_ele;
  }

  /**
   * Sets the connection element being drawn
   * @param {HTMLElement|null} element - Connection element or null
   */
  setConnectionElement(element) {
    this.nodeforge.connection_ele = element;
  }

  // ============================================================
  // Manager Accessors (Set after managers are created)
  // ============================================================

  getEventManager() {
    return this.managers.eventManager;
  }

  getStateManager() {
    return this.managers.stateManager;
  }

  getRenderManager() {
    return this.managers.renderManager;
  }

  getZoomManager() {
    return this.managers.zoomManager;
  }

  getModuleManager() {
    return this.managers.moduleManager;
  }

  getNodeManager() {
    return this.managers.nodeManager;
  }

  getConnectionManager() {
    return this.managers.connectionManager;
  }

  getRerouteManager() {
    return this.managers.rerouteManager;
  }

  getSelectionHandler() {
    return this.managers.selectionHandler;
  }

  getDragHandler() {
    return this.managers.dragHandler;
  }

  getInteractionHandler() {
    return this.managers.interactionHandler;
  }
}
