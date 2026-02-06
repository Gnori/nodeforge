/**
 * DOM Utility Functions
 * Helper functions for DOM manipulation and element creation
 */

import { SVG_NAMESPACE, CSS_CLASSES } from '../constants.js';
import { buildConnectionClasses } from './string.js';

/**
 * Create SVG element with namespace
 * @param {string} tagName - SVG tag name
 * @returns {SVGElement} SVG element
 */
export function createSVGElement(tagName) {
  return document.createElementNS(SVG_NAMESPACE, tagName);
}

/**
 * Create connection SVG element
 * @param {string} outputId - Output node ID
 * @param {string} inputId - Input node ID
 * @param {string} outputClass - Output class
 * @param {string} inputClass - Input class
 * @returns {SVGElement} Connection SVG element
 */
export function createConnectionElement(outputId, inputId, outputClass, inputClass) {
  const svg = createSVGElement('svg');
  svg.classList.add(...buildConnectionClasses(outputId, inputId, outputClass, inputClass).split(' '));
  svg.style.zIndex = '1000';

  const path = createSVGElement('path');
  path.classList.add(CSS_CLASSES.MAIN_PATH);
  path.setAttributeNS(null, 'd', '');

  svg.appendChild(path);
  return svg;
}

/**
 * Create reroute point element
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} radius - Point radius
 * @returns {SVGCircleElement} Reroute point element
 */
export function createReroutePoint(x, y, radius = 6) {
  const point = createSVGElement('circle');
  point.classList.add(CSS_CLASSES.POINT);
  point.setAttributeNS(null, 'cx', x);
  point.setAttributeNS(null, 'cy', y);
  point.setAttributeNS(null, 'r', radius);
  return point;
}

/**
 * Create node element
 * @param {string} id - Node ID
 * @param {string} className - Additional class name
 * @returns {HTMLDivElement} Node element
 */
export function createNodeElement(id, className = '') {
  const div = document.createElement('div');
  div.id = id;
  div.classList.add(CSS_CLASSES.NODEFORGE_NODE);

  if (className) {
    const classes = className.split(' ').filter(c => c.trim());
    div.classList.add(...classes);
  }

  return div;
}

/**
 * Create input/output container element
 * @param {string} type - 'input' or 'output'
 * @param {number} count - Number of inputs/outputs
 * @returns {HTMLDivElement} Container element
 */
export function createIOContainer(type, count) {
  const container = document.createElement('div');
  container.classList.add(type === 'input' ? CSS_CLASSES.INPUTS : CSS_CLASSES.OUTPUTS);

  for (let i = 0; i < count; i++) {
    const io = document.createElement('div');
    io.classList.add(type === 'input' ? CSS_CLASSES.INPUT : CSS_CLASSES.OUTPUT);
    io.classList.add(`${type}_${i + 1}`);
    container.appendChild(io);
  }

  return container;
}

/**
 * Create delete button element
 * @returns {HTMLDivElement} Delete button element
 */
export function createDeleteButton() {
  const deleteBtn = document.createElement('div');
  deleteBtn.classList.add(CSS_CLASSES.NODEFORGE_DELETE);
  deleteBtn.innerHTML = 'x';
  return deleteBtn;
}

/**
 * Get element's class at specific index
 * @param {HTMLElement} element - DOM element
 * @param {number} index - Class index
 * @returns {string} Class name
 */
export function getClassAtIndex(element, index) {
  return element?.classList?.[index] || '';
}

/**
 * Check if element has class
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to check
 * @returns {boolean} True if has class
 */
export function hasClass(element, className) {
  return element?.classList?.contains(className) || false;
}

/**
 * Get closest parent with class
 * @param {HTMLElement} element - Starting element
 * @param {string} className - Class name to find
 * @returns {HTMLElement|null} Parent element or null
 */
export function getClosestByClass(element, className) {
  return element?.closest(`.${className}`) || null;
}

/**
 * Get data attribute value
 * @param {HTMLElement} element - DOM element
 * @param {string} attributeName - Data attribute name (without 'df-' prefix)
 * @returns {string} Attribute value
 */
export function getDataAttribute(element, attributeName) {
  return element?.getAttribute(`df-${attributeName}`) || '';
}

/**
 * Set data attribute value
 * @param {HTMLElement} element - DOM element
 * @param {string} attributeName - Data attribute name (without 'df-' prefix)
 * @param {*} value - Value to set
 */
export function setDataAttribute(element, attributeName, value) {
  if (element) {
    element.setAttribute(`df-${attributeName}`, String(value));
  }
}

/**
 * Remove all children from element
 * @param {HTMLElement} element - Parent element
 */
export function removeAllChildren(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Get all elements with attribute
 * @param {HTMLElement} parent - Parent element
 * @param {string} attribute - Attribute name
 * @returns {HTMLElement[]} Array of elements
 */
export function getAllElementsWithAttribute(parent, attribute) {
  return Array.from(parent?.querySelectorAll(`[${attribute}]`) || []);
}

/**
 * Get element offset position
 * @param {HTMLElement} element - DOM element
 * @returns {{x: number, y: number}} Offset position
 */
export function getElementOffset(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY
  };
}

/**
 * Set element position
 * @param {HTMLElement} element - DOM element
 * @param {number} x - X position
 * @param {number} y - Y position
 */
export function setElementPosition(element, x, y) {
  if (element) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }
}

/**
 * Set element transform
 * @param {HTMLElement} element - DOM element
 * @param {number} x - Translate X
 * @param {number} y - Translate Y
 * @param {number} scale - Scale value
 */
export function setElementTransform(element, x, y, scale = 1) {
  if (element) {
    element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }
}

/**
 * Query selector with null safety
 * @param {HTMLElement|Document} parent - Parent element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} Element or null
 */
export function safeQuerySelector(parent, selector) {
  try {
    return parent?.querySelector(selector) || null;
  } catch (e) {
    console.warn(`Invalid selector: ${selector}`, e);
    return null;
  }
}

/**
 * Query all with null safety
 * @param {HTMLElement|Document} parent - Parent element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement[]} Array of elements
 */
export function safeQuerySelectorAll(parent, selector) {
  try {
    return Array.from(parent?.querySelectorAll(selector) || []);
  } catch (e) {
    console.warn(`Invalid selector: ${selector}`, e);
    return [];
  }
}
