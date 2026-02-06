/**
 * Geometry Utility Functions
 * Helper functions for coordinate calculations and transformations
 */

/**
 * Calculate zoom-adjusted coordinates
 * @param {number} value - Original value
 * @param {number} canvasOffset - Canvas offset (x or y)
 * @param {number} zoom - Current zoom level
 * @returns {number} Adjusted coordinate
 */
export function calculateZoomCoordinate(value, canvasOffset, zoom) {
  return (value - canvasOffset) / zoom;
}

/**
 * Calculate element center position
 * @param {HTMLElement} element - DOM element
 * @param {HTMLElement} precanvas - Canvas element
 * @param {number} zoom - Current zoom level
 * @returns {{x: number, y: number}} Center coordinates
 */
export function getElementCenterPosition(element, precanvas, zoom) {
  const rect = element.getBoundingClientRect();
  const precanvasRect = precanvas.getBoundingClientRect();

  const x = rect.left + (rect.width / 2) - precanvasRect.left;
  const y = rect.top + (rect.height / 2) - precanvasRect.top;

  return {
    x: x / zoom,
    y: y / zoom
  };
}

/**
 * Get mouse position relative to canvas
 * @param {MouseEvent|TouchEvent} event - Mouse or touch event
 * @param {HTMLElement} precanvas - Canvas element
 * @param {number} zoom - Current zoom level
 * @returns {{x: number, y: number}} Mouse coordinates
 */
export function getMousePosition(event, precanvas, zoom) {
  const precanvasRect = precanvas.getBoundingClientRect();

  let clientX, clientY;

  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  return {
    x: (clientX - precanvasRect.left) / zoom,
    y: (clientY - precanvasRect.top) / zoom
  };
}

/**
 * Calculate curvature path for connection
 * @param {number} start_pos_x - Start X position
 * @param {number} start_pos_y - Start Y position
 * @param {number} end_pos_x - End X position
 * @param {number} end_pos_y - End Y position
 * @param {number} curvature - Curvature value (0-1)
 * @param {string} type - Curve type ('open', 'close', 'other')
 * @returns {string} SVG path string
 */
export function calculateCurvaturePath(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature, type) {
  const line_x = start_pos_x;
  const line_y = start_pos_y;
  const x = end_pos_x;
  const y = end_pos_y;
  const curvature_value = curvature;

  let hx1, hx2;

  switch (type) {
    case 'open':
      if (start_pos_x >= end_pos_x) {
        hx1 = line_x + Math.abs(x - line_x) * curvature_value;
        hx2 = x - Math.abs(x - line_x) * (curvature_value * -1);
      } else {
        hx1 = line_x + Math.abs(x - line_x) * curvature_value;
        hx2 = x - Math.abs(x - line_x) * curvature_value;
      }
      return `M ${line_x} ${line_y} C ${hx1} ${line_y} ${hx2} ${y} ${x}  ${y}`;

    case 'close':
      if (start_pos_x >= end_pos_x) {
        hx1 = line_x + Math.abs(x - line_x) * (curvature_value * -1);
        hx2 = x - Math.abs(x - line_x) * curvature_value;
      } else {
        hx1 = line_x + Math.abs(x - line_x) * curvature_value;
        hx2 = x - Math.abs(x - line_x) * curvature_value;
      }
      return `M ${line_x} ${line_y} C ${hx1} ${line_y} ${hx2} ${y} ${x}  ${y}`;

    case 'other':
      if (start_pos_x >= end_pos_x) {
        hx1 = line_x + Math.abs(x - line_x) * (curvature_value * -1);
        hx2 = x - Math.abs(x - line_x) * (curvature_value * -1);
      } else {
        hx1 = line_x + Math.abs(x - line_x) * curvature_value;
        hx2 = x - Math.abs(x - line_x) * curvature_value;
      }
      return `M ${line_x} ${line_y} C ${hx1} ${line_y} ${hx2} ${y} ${x}  ${y}`;

    default:
      hx1 = line_x + Math.abs(x - line_x) * curvature_value;
      hx2 = x - Math.abs(x - line_x) * curvature_value;
      return `M ${line_x} ${line_y} C ${hx1} ${line_y} ${hx2} ${y} ${x}  ${y}`;
  }
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Check if point is inside rectangle
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} rx - Rectangle X
 * @param {number} ry - Rectangle Y
 * @param {number} rw - Rectangle width
 * @param {number} rh - Rectangle height
 * @returns {boolean} True if inside
 */
export function isPointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get bounding box of multiple elements
 * @param {HTMLElement[]} elements - Array of elements
 * @returns {{x: number, y: number, width: number, height: number}} Bounding box
 */
export function getElementsBoundingBox(elements) {
  if (!elements || elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    const rect = element.getBoundingClientRect();
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
