/**
 * String Utility Functions
 * Helper functions for string manipulation, ID extraction, and parsing
 */

import { NODE_ID_PREFIX, INPUT_PREFIX, OUTPUT_PREFIX } from '../constants.js';

/**
 * Extract numeric node ID from full node ID string
 * @param {string} fullId - Full node ID (e.g., 'node-123')
 * @returns {string} Numeric ID (e.g., '123')
 */
export function extractNodeId(fullId) {
  if (!fullId || typeof fullId !== 'string') {
    return '';
  }
  return fullId.startsWith(NODE_ID_PREFIX)
    ? fullId.slice(NODE_ID_PREFIX.length)
    : fullId;
}

/**
 * Build full node ID from numeric ID
 * @param {string|number} id - Numeric ID
 * @returns {string} Full node ID (e.g., 'node-123')
 */
export function buildNodeId(id) {
  return `${NODE_ID_PREFIX}${id}`;
}

/**
 * Extract ID from class name with prefix
 * @param {string} className - Class name (e.g., 'node_in_node-123')
 * @param {string} prefix - Prefix to remove (e.g., 'node_in_')
 * @returns {string} Extracted ID
 */
export function extractIdFromClass(className, prefix) {
  if (!className || !prefix) {
    return '';
  }
  return className.startsWith(prefix)
    ? className.slice(prefix.length)
    : className;
}

/**
 * Extract input/output class number from class name
 * @param {string} className - Class name (e.g., 'input_1', 'output_2')
 * @param {string} prefix - 'input' or 'output'
 * @returns {string} Class number (e.g., '1', '2')
 */
export function extractIOClassNumber(className, prefix) {
  const fullPrefix = prefix === 'input' ? INPUT_PREFIX : OUTPUT_PREFIX;
  return extractIdFromClass(className, fullPrefix);
}

/**
 * Build selector string for node
 * @param {string|number} id - Node ID
 * @returns {string} Selector (e.g., '#node-123')
 */
export function buildNodeSelector(id) {
  return `#${buildNodeId(id)}`;
}

/**
 * Build selector string for connection
 * @param {string} outputId - Output node ID
 * @param {string} inputId - Input node ID
 * @param {string} outputClass - Output class
 * @param {string} inputClass - Input class
 * @returns {string} Connection selector
 */
export function buildConnectionSelector(outputId, inputId, outputClass, inputClass) {
  return `.connection.node_in_${inputId}.node_out_${outputId}.${outputClass}.${inputClass}`;
}

/**
 * Build class string for connection element
 * @param {string} outputId - Output node ID
 * @param {string} inputId - Input node ID
 * @param {string} outputClass - Output class
 * @param {string} inputClass - Input class
 * @returns {string} Class string
 */
export function buildConnectionClasses(outputId, inputId, outputClass, inputClass) {
  return `connection node_in_${inputId} node_out_${outputId} ${outputClass} ${inputClass}`;
}

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid node ID format
 * @param {string} id - ID to check
 * @returns {boolean} True if valid
 */
export function isValidNodeId(id) {
  return typeof id === 'string' && id.startsWith(NODE_ID_PREFIX);
}

/**
 * Parse data attribute value
 * @param {string} value - Data attribute value
 * @returns {*} Parsed value (string, number, boolean, object)
 */
export function parseDataAttribute(value) {
  if (!value) return '';

  // Try to parse as JSON
  try {
    return JSON.parse(value);
  } catch (e) {
    // Return as string if not valid JSON
    return value;
  }
}

/**
 * Sanitize class name
 * @param {string} className - Class name to sanitize
 * @returns {string} Sanitized class name
 */
export function sanitizeClassName(className) {
  if (!className) return '';
  return className.replace(/[^a-zA-Z0-9_-]/g, '_');
}
