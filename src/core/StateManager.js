/**
 * StateManager - Handles data queries and state lookups
 *
 * Extracted from nodeforge.js
 * Provides methods to query node data, module information, etc.
 */
export class StateManager {
  /**
   * Creates a new StateManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Gets a node by its ID
   * Returns a deep copy to prevent external modifications
   * @param {string} id - Node ID
   * @returns {Object} Node data object
   */
  getNodeFromId(id) {
    const moduleName = this.getModuleFromNodeId(id);
    const nodeforgeData = this.context.getNodeForgeData();
    return JSON.parse(JSON.stringify(nodeforgeData[moduleName].data[id]));
  }

  /**
   * Gets all nodes with a specific name
   * @param {string} name - Node name/type to search for
   * @returns {Array<string>} Array of node IDs matching the name
   */
  getNodesFromName(name) {
    const nodes = [];
    const nodeforgeData = this.context.getNodeForgeData();

    Object.keys(nodeforgeData).map(function(moduleName, index) {
      for (let node in nodeforgeData[moduleName].data) {
        if (nodeforgeData[moduleName].data[node].name === name) {
          nodes.push(nodeforgeData[moduleName].data[node].id);
        }
      }
    });

    return nodes;
  }

  /**
   * Gets the module name that contains a specific node ID
   * @param {string} id - Node ID
   * @returns {string} Module name
   */
  getModuleFromNodeId(id) {
    let nameModule;
    const nodeforgeData = this.context.getNodeForgeData();

    Object.keys(nodeforgeData).map(function(moduleName, index) {
      Object.keys(nodeforgeData[moduleName].data).map(function(node, index2) {
        if (node == id) {
          nameModule = moduleName;
        }
      });
    });

    return nameModule;
  }

  /**
   * Gets the current module's data
   * @returns {Object} Current module data
   */
  getCurrentModuleData() {
    const module = this.context.getModule();
    const nodeforgeData = this.context.getNodeForgeData();
    return nodeforgeData[module].data;
  }

  /**
   * Gets a specific module's data
   * @param {string} moduleName - Module name
   * @returns {Object} Module data
   */
  getModuleData(moduleName) {
    const nodeforgeData = this.context.getNodeForgeData();
    return nodeforgeData[moduleName] ? nodeforgeData[moduleName].data : null;
  }

  /**
   * Checks if a node exists in the current module
   * @param {string} id - Node ID
   * @returns {boolean} True if node exists
   */
  nodeExists(id) {
    const moduleData = this.getCurrentModuleData();
    return moduleData[id] !== undefined;
  }

  /**
   * Checks if a module exists
   * @param {string} moduleName - Module name
   * @returns {boolean} True if module exists
   */
  moduleExists(moduleName) {
    const nodeforgeData = this.context.getNodeForgeData();
    return nodeforgeData[moduleName] !== undefined;
  }

  /**
   * Gets all module names
   * @returns {Array<string>} Array of module names
   */
  getAllModuleNames() {
    const nodeforgeData = this.context.getNodeForgeData();
    return Object.keys(nodeforgeData);
  }

  /**
   * Gets all node IDs in the current module
   * @returns {Array<string>} Array of node IDs
   */
  getAllNodeIds() {
    const moduleData = this.getCurrentModuleData();
    return Object.keys(moduleData);
  }

  /**
   * Gets all node IDs across all modules
   * @returns {Object} Object mapping module names to arrays of node IDs
   */
  getAllNodeIdsAllModules() {
    const nodeforgeData = this.context.getNodeForgeData();
    const result = {};

    Object.keys(nodeforgeData).forEach((moduleName) => {
      result[moduleName] = Object.keys(nodeforgeData[moduleName].data);
    });

    return result;
  }

  /**
   * Gets the total number of nodes in the current module
   * @returns {number} Number of nodes
   */
  getNodeCount() {
    return this.getAllNodeIds().length;
  }

  /**
   * Gets the total number of nodes across all modules
   * @returns {number} Total number of nodes
   */
  getTotalNodeCount() {
    const nodeforgeData = this.context.getNodeForgeData();
    let count = 0;

    Object.keys(nodeforgeData).forEach((moduleName) => {
      count += Object.keys(nodeforgeData[moduleName].data).length;
    });

    return count;
  }
}
