/**
 * RenderManager - Handles DOM rendering and visual updates
 *
 * Extracted from nodeforge.js
 * Manages SVG path creation, connection rendering, and node element creation
 */
import { createSVGElement } from '../utils/dom.js';
import { CSS_CLASSES } from '../constants.js';

export class RenderManager {
  /**
   * Creates a new RenderManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Creates an SVG curvature path for connections
   * @param {number} start_pos_x - Starting X position
   * @param {number} start_pos_y - Starting Y position
   * @param {number} end_pos_x - Ending X position
   * @param {number} end_pos_y - Ending Y position
   * @param {number} curvature_value - Curvature amount
   * @param {string} type - Curvature type ('open', 'close', 'other', or default)
   * @returns {string} SVG path string
   */
  createCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type) {
    let line_x = start_pos_x;
    let line_y = start_pos_y;
    let x = end_pos_x;
    let y = end_pos_y;
    let curvature = curvature_value;

    //type openclose open close other
    switch (type) {
      case 'open':
        if (start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * (curvature * -1);
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;

      case 'close':
        if (start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
          var hx2 = x - Math.abs(x - line_x) * curvature;
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;

      case 'other':
        if (start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
          var hx2 = x - Math.abs(x - line_x) * (curvature * -1);
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;

      default:
        var hx1 = line_x + Math.abs(x - line_x) * curvature;
        var hx2 = x - Math.abs(x - line_x) * curvature;

        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
    }
  }

  /**
   * Get element center coordinates relative to canvas
   * @param {HTMLElement} element - The element to calculate position for
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @returns {{x: number, y: number}}
   */
  getElementCenterCoords(element, zoomFactors) {
    const precanvas = this.context.getPrecanvas();
    const rect = element.getBoundingClientRect();
    const canvasRect = precanvas.getBoundingClientRect();

    return {
      x: element.offsetWidth / 2 + (rect.x - canvasRect.x) * zoomFactors.widthZoom,
      y: element.offsetHeight / 2 + (rect.y - canvasRect.y) * zoomFactors.heightZoom
    };
  }

  /**
   * Get reroute point coordinates relative to canvas
   * @param {HTMLElement} point - The reroute point element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} rerouteWidth - Reroute point width
   * @returns {{x: number, y: number}}
   */
  getReroutePointCoords(point, zoomFactors, rerouteWidth) {
    const precanvas = this.context.getPrecanvas();
    const rect = point.getBoundingClientRect();
    const canvasRect = precanvas.getBoundingClientRect();

    return {
      x: rerouteWidth / 2 + (rect.x - canvasRect.x) * zoomFactors.widthZoom,
      y: rerouteWidth / 2 + (rect.y - canvasRect.y) * zoomFactors.heightZoom
    };
  }

  /**
   * Updates a simple output connection (no reroute points)
   * @param {SVGElement} connectionElem - The connection SVG element
   * @param {HTMLElement} outputElem - The output element
   * @param {HTMLElement} inputElem - The input element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} curvature - Curvature value
   */
  updateSimpleOutputConnection(connectionElem, outputElem, inputElem, zoomFactors, curvature) {
    const connectionConfig = this.context.getConnectionConfig();

    const outputCoords = this.getElementCenterCoords(outputElem, zoomFactors);
    const inputCoords = this.getElementCenterCoords(inputElem, zoomFactors);

    const lineCurve = this.createCurvature(
      outputCoords.x,
      outputCoords.y,
      inputCoords.x,
      inputCoords.y,
      curvature,
      connectionConfig.line_path
    );

    connectionElem.children[0].setAttributeNS(null, 'd', lineCurve);
  }

  /**
   * Updates a simple input connection (no reroute points)
   * @param {SVGElement} connectionElem - The connection SVG element
   * @param {HTMLElement} outputElem - The output element
   * @param {HTMLElement} inputElem - The input element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} curvature - Curvature value
   */
  updateSimpleInputConnection(connectionElem, outputElem, inputElem, zoomFactors, curvature) {
    const connectionConfig = this.context.getConnectionConfig();

    const outputCoords = this.getElementCenterCoords(outputElem, zoomFactors);
    const inputCoords = this.getElementCenterCoords(inputElem, zoomFactors);

    const lineCurve = this.createCurvature(
      outputCoords.x,
      outputCoords.y,
      inputCoords.x,
      inputCoords.y,
      curvature,
      connectionConfig.line_path
    );

    connectionElem.children[0].setAttributeNS(null, 'd', lineCurve);
  }

  /**
   * Updates a rerouted output connection (with reroute points)
   * @param {SVGElement} connectionElem - The connection SVG element
   * @param {NodeList} points - Reroute point elements
   * @param {string} nodeId - Output node ID
   * @param {HTMLElement} container - Container element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Zoom factors
   * @param {number} reroute_curvature - Reroute curvature value
   * @param {number} reroute_curvature_start_end - Start/end curvature value
   * @param {number} rerouteWidth - Reroute point width
   */
  updateReroutedOutputConnection(connectionElem, points, outputElem, inputElem, zoomFactors, reroute_curvature, reroute_curvature_start_end, rerouteWidth) {
    const connectionConfig = this.context.getConnectionConfig();

    if (!outputElem || !inputElem) return;

    const outputCoords = this.getElementCenterCoords(outputElem, zoomFactors);
    const inputCoords = this.getElementCenterCoords(inputElem, zoomFactors);
    let lineCurve = '';

    const pointsArray = Array.from(points);
    pointsArray.forEach((point, i) => {
      const pointCoords = this.getReroutePointCoords(point, zoomFactors, rerouteWidth);

      if (i === 0) {
        lineCurve += this.createCurvature(
          outputCoords.x, outputCoords.y,
          pointCoords.x, pointCoords.y,
          reroute_curvature_start_end, 'open'
        );
      } else {
        const prevCoords = this.getReroutePointCoords(pointsArray[i - 1], zoomFactors, rerouteWidth);
        lineCurve += this.createCurvature(
          prevCoords.x, prevCoords.y,
          pointCoords.x, pointCoords.y,
          reroute_curvature, 'other'
        );
      }
    });

    // Last point → input
    const lastCoords = this.getReroutePointCoords(pointsArray[pointsArray.length - 1], zoomFactors, rerouteWidth);
    lineCurve += this.createCurvature(
      lastCoords.x, lastCoords.y,
      inputCoords.x, inputCoords.y,
      reroute_curvature_start_end, 'close'
    );

    connectionElem.children[0].setAttributeNS(null, 'd', lineCurve);
  }

  /**
   * Updates a rerouted input connection (with reroute points)
   * @param {SVGElement} connectionElem - The connection SVG element
   * @param {NodeList} points - Reroute point elements
   * @param {string} nodeId - Input node ID
   * @param {HTMLElement} container - Container element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Zoom factors
   * @param {number} reroute_curvature - Reroute curvature value
   * @param {number} reroute_curvature_start_end - Start/end curvature value
   * @param {number} rerouteWidth - Reroute point width
   */
  updateReroutedInputConnection(connectionElem, points, outputElem, inputElem, zoomFactors, reroute_curvature, reroute_curvature_start_end, rerouteWidth) {
    const connectionConfig = this.context.getConnectionConfig();

    if (!outputElem || !inputElem) return;

    const outputCoords = this.getElementCenterCoords(outputElem, zoomFactors);
    const inputCoords = this.getElementCenterCoords(inputElem, zoomFactors);
    let lineCurve = '';

    const pointsArray = Array.from(points);
    pointsArray.forEach((point, i) => {
      const pointCoords = this.getReroutePointCoords(point, zoomFactors, rerouteWidth);

      if (i === 0) {
        lineCurve += this.createCurvature(
          outputCoords.x, outputCoords.y,
          pointCoords.x, pointCoords.y,
          reroute_curvature_start_end, 'open'
        );
      } else {
        const prevCoords = this.getReroutePointCoords(pointsArray[i - 1], zoomFactors, rerouteWidth);
        lineCurve += this.createCurvature(
          prevCoords.x, prevCoords.y,
          pointCoords.x, pointCoords.y,
          reroute_curvature, 'other'
        );
      }
    });

    // Last point → input
    const lastCoords = this.getReroutePointCoords(pointsArray[pointsArray.length - 1], zoomFactors, rerouteWidth);
    lineCurve += this.createCurvature(
      lastCoords.x, lastCoords.y,
      inputCoords.x, inputCoords.y,
      reroute_curvature_start_end, 'close'
    );

    connectionElem.children[0].setAttributeNS(null, 'd', lineCurve);
  }

  /**
   * Creates a connection SVG element
   * @returns {SVGElement} The created connection element
   */
  createConnectionElement() {
    const connection = createSVGElement("svg");
    const path = createSVGElement("path");

    path.classList.add("main-path");
    path.setAttributeNS(null, 'd', '');
    connection.classList.add(CSS_CLASSES.CONNECTION);
    connection.appendChild(path);

    return connection;
  }
}
