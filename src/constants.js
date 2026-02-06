/**
 * NodeForge Constants
 * Centralized configuration and magic values
 */

// Node and Connection Prefixes
export const NODE_ID_PREFIX = 'node-';
export const NODE_IN_PREFIX = 'node_in_';
export const NODE_OUT_PREFIX = 'node_out_';
export const INPUT_PREFIX = 'input_';
export const OUTPUT_PREFIX = 'output_';

// CSS Class Names
export const CSS_CLASSES = {
  PARENT_NODEFORGE: 'parent-nodeforge',
  NODEFORGE: 'nodeforge',
  NODEFORGE_NODE: 'nodeforge-node',
  NODEFORGE_DELETE: 'nodeforge-delete',
  SELECTED: 'selected',
  CONNECTION: 'connection',
  MAIN_PATH: 'main-path',
  POINT: 'point',
  INPUTS: 'inputs',
  OUTPUTS: 'outputs',
  INPUT: 'input',
  OUTPUT: 'output',
  NODEFORGE_CONTENT_NODE: 'nodeforge_content_node'
};

// Zoom Configuration
export const ZOOM_CONFIG = {
  DEFAULT: 1,
  MIN: 0.5,
  MAX: 1.6,
  STEP: 0.1,
  LAST_VALUE: 1
};

// Editor Modes
export const EDITOR_MODES = {
  EDIT: 'edit',
  FIXED: 'fixed',
  VIEW: 'view'
};

// Reroute Configuration
export const REROUTE_CONFIG = {
  DEFAULT_CURVATURE: 0.5,
  CURVATURE_START_END: 0.5,
  DEFAULT_WIDTH: 6,
  FIX_CURVATURE: false
};

// Connection Configuration
export const CONNECTION_CONFIG = {
  DEFAULT_CURVATURE: 0.5,
  LINE_PATH: 5
};

// Mobile Gesture Thresholds
export const MOBILE_CONFIG = {
  PINCH_THRESHOLD: 100,
  PREV_DIFF_INITIAL: -1
};

// Default Module
export const DEFAULT_MODULE = 'Home';

// String Slice Indices (for backward compatibility)
export const SLICE_INDICES = {
  NODE_ID: 5,          // 'node-'.length
  NODE_IN: 13,         // Length varies
  NODE_OUT: 14,        // Length varies
  INPUT_CLASS: 6,      // 'input_'.length
  OUTPUT_CLASS: 7      // 'output_'.length
};

// Mouse Buttons
export const MOUSE_BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};

// Key Codes
export const KEY_CODES = {
  DELETE: 'Delete',
  BACKSPACE: 'Backspace'
};

// SVG Namespace
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Node ID Generation
export const NODE_ID_CONFIG = {
  START_ID: 1,
  USE_UUID: false
};

// Event Names
export const EVENTS = {
  // Node Events
  NODE_CREATED: 'nodeCreated',
  NODE_REMOVED: 'nodeRemoved',
  NODE_MOVED: 'nodeMoved',
  NODE_SELECTED: 'nodeSelected',
  NODE_UNSELECTED: 'nodeUnselected',
  NODE_DATA_CHANGED: 'nodeDataChanged',

  // Connection Events
  CONNECTION_START: 'connectionStart',
  CONNECTION_CANCEL: 'connectionCancel',
  CONNECTION_CREATED: 'connectionCreated',
  CONNECTION_REMOVED: 'connectionRemoved',
  CONNECTION_SELECTED: 'connectionSelected',
  CONNECTION_UNSELECTED: 'connectionUnselected',

  // Reroute Events
  ADD_REROUTE: 'addReroute',
  REMOVE_REROUTE: 'removeReroute',
  REROUTE_MOVED: 'rerouteMoved',

  // Module Events
  MODULE_CREATED: 'moduleCreated',
  MODULE_CHANGED: 'moduleChanged',
  MODULE_REMOVED: 'moduleRemoved',

  // General Events
  CLICK: 'click',
  CLICK_END: 'clickEnd',
  CONTEXT_MENU: 'contextmenu',
  MOUSE_MOVE: 'mouseMove',
  MOUSE_UP: 'mouseUp',
  KEY_DOWN: 'keydown',
  ZOOM: 'zoom',
  TRANSLATE: 'translate',
  IMPORT: 'import',
  EXPORT: 'export'
};

// Vue Version Detection
export const VUE_VERSIONS = {
  VUE2: 2,
  VUE3: 3
};
