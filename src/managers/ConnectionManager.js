/**
 * ConnectionManager - Handles connection CRUD operations
 *
 * Extracted from nodeforge.js
 * Manages connection creation, deletion, and rendering updates
 */
import { createSVGElement } from '../utils/dom.js';
import { CSS_CLASSES, EVENTS } from '../constants.js';
import { buildNodeId, extractNodeId } from '../utils/string.js';

export class ConnectionManager {
  /**
   * Creates a new ConnectionManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Draws a new connection element while dragging
   * @param {HTMLElement} ele - The output element being dragged from
   */
  drawConnection(ele) {
    const precanvas = this.context.getPrecanvas();
    const eventManager = this.context.getEventManager();

    // Clear any previous snap highlight
    if (this._lastSnapTarget) {
      this._lastSnapTarget.classList.remove('snap-hover');
      this._lastSnapTarget = null;
    }

    let connection = createSVGElement("svg");
    this.context.setConnectionElement(connection);

    let path = createSVGElement("path");
    path.classList.add("main-path");
    path.setAttributeNS(null, 'd', '');
    connection.classList.add(CSS_CLASSES.CONNECTION);
    connection.appendChild(path);
    precanvas.appendChild(connection);

    let id_output = extractNodeId(ele.parentElement.parentElement.id);
    let output_class = ele.classList[1];

    eventManager.dispatch(EVENTS.CONNECTION_START, {
      output_id: id_output,
      output_class: output_class
    });
  }

  /**
   * Updates connection path during dragging with magnetic snap
   * @param {number} eX - Mouse X position
   * @param {number} eY - Mouse Y position
   */
  updateConnection(eX, eY) {
    const precanvas = this.context.getPrecanvas();
    const zoom = this.context.getZoom();
    const connection_ele = this.context.getConnectionElement();
    const ele_selected = this.context.getElementSelected();
    const renderManager = this.context.getRenderManager();
    const connectionConfig = this.context.getConnectionConfig();
    const container = this.context.getContainer();

    if (!connection_ele || !ele_selected) return;

    let precanvasWitdhZoom = precanvas.clientWidth / (precanvas.clientWidth * zoom);
    precanvasWitdhZoom = precanvasWitdhZoom || 0;
    let precanvasHeightZoom = precanvas.clientHeight / (precanvas.clientHeight * zoom);
    precanvasHeightZoom = precanvasHeightZoom || 0;
    let path = connection_ele.children[0];

    let line_x = ele_selected.offsetWidth / 2 + (ele_selected.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWitdhZoom;
    let line_y = ele_selected.offsetHeight / 2 + (ele_selected.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom;

    let x = eX * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) - (precanvas.getBoundingClientRect().x * (precanvas.clientWidth / (precanvas.clientWidth * zoom)));
    let y = eY * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) - (precanvas.getBoundingClientRect().y * (precanvas.clientHeight / (precanvas.clientHeight * zoom)));

    // Magnetic snap: find nearest input within snap radius
    const SNAP_RADIUS = 30;
    const outputNodeId = ele_selected.parentElement.parentElement.id;
    const inputs = container.querySelectorAll('.input');
    // Clear previous snap highlight
    if (this._lastSnapTarget) {
      this._lastSnapTarget.classList.remove('snap-hover');
      this._lastSnapTarget = null;
    }

    let closestDist = SNAP_RADIUS;
    let closestInput = null;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const inputNode = input.closest('.nodeforge-node');
      if (!inputNode || inputNode.id === outputNodeId) continue;

      const inputRect = input.getBoundingClientRect();
      const inputCenterX = inputRect.x + inputRect.width / 2;
      const inputCenterY = inputRect.y + inputRect.height / 2;

      const dist = Math.sqrt(Math.pow(eX - inputCenterX, 2) + Math.pow(eY - inputCenterY, 2));
      if (dist < closestDist) {
        closestDist = dist;
        closestInput = input;
      }
    }

    if (closestInput) {
      const snapX = closestInput.offsetWidth / 2 + (closestInput.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWitdhZoom;
      const snapY = closestInput.offsetHeight / 2 + (closestInput.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom;
      x = snapX;
      y = snapY;
      closestInput.classList.add('snap-hover');
      this._lastSnapTarget = closestInput;
    }

    let lineCurve = renderManager.createCurvature(line_x, line_y, x, y, connectionConfig.curvature, connectionConfig.line_path);
    path.setAttributeNS(null, 'd', lineCurve);
  }

  /**
   * Creates a connection between two nodes
   * @param {string} id_output - Output node ID
   * @param {string} id_input - Input node ID
   * @param {string} output_class - Output class name
   * @param {string} input_class - Input class name
   * @returns {boolean} True if connection was created
   */
  addConnection(id_output, id_input, output_class, input_class) {
    const stateManager = this.context.getStateManager();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const precanvas = this.context.getPrecanvas();
    const eventManager = this.context.getEventManager();

    let nodeOneModule = stateManager.getModuleFromNodeId(id_output);
    let nodeTwoModule = stateManager.getModuleFromNodeId(id_input);

    if (nodeOneModule === nodeTwoModule) {
      let dataNode = stateManager.getNodeFromId(id_output);
      let exist = false;

      for (let checkOutput in dataNode.outputs[output_class].connections) {
        let connectionSearch = dataNode.outputs[output_class].connections[checkOutput];
        if (connectionSearch.node === id_input && connectionSearch.output === input_class) {
          exist = true;
        }
      }

      // Check connection exist
      if (exist === false) {
        //Create Connection
        nodeforgeData[nodeOneModule].data[id_output].outputs[output_class].connections.push({
          "node": id_input.toString(),
          "output": input_class
        });
        nodeforgeData[nodeOneModule].data[id_input].inputs[input_class].connections.push({
          "node": id_output.toString(),
          "input": output_class
        });

        if (module === nodeOneModule) {
          //Draw connection
          let connection = createSVGElement("svg");
          let path = createSVGElement("path");
          path.classList.add("main-path");
          path.setAttributeNS(null, 'd', '');
          connection.classList.add(CSS_CLASSES.CONNECTION);
          connection.classList.add("node_in_node-" + id_input);
          connection.classList.add("node_out_node-" + id_output);
          connection.classList.add(output_class);
          connection.classList.add(input_class);
          connection.appendChild(path);
          precanvas.appendChild(connection);
          this.updateConnectionNodes(buildNodeId(id_output));
          this.updateConnectionNodes(buildNodeId(id_input));
        }

        eventManager.dispatch(EVENTS.CONNECTION_CREATED, {
          output_id: id_output,
          input_id: id_input,
          output_class: output_class,
          input_class: input_class
        });

        return true;
      }
    }
    return false;
  }

  /**
   * Updates all connections for a specific node
   * @param {string} id - Node ID (with 'node-' prefix)
   */
  updateConnectionNodes(id) {
    const container = this.context.getContainer();
    const precanvas = this.context.getPrecanvas();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const zoomManager = this.context.getZoomManager();
    const renderManager = this.context.getRenderManager();
    const connectionConfig = this.context.getConnectionConfig();
    const rerouteConfig = this.context.getRerouteConfig();

    const idSearchOut = 'node_out_' + id;
    const idSearchIn = 'node_in_' + id;
    const elemsOut = container.querySelectorAll(`.${CSS_CLASSES.CONNECTION}.${idSearchOut}`);
    const elemsIn = container.querySelectorAll(`.${CSS_CLASSES.CONNECTION}.${idSearchIn}`);

    const zoomFactors = zoomManager.getZoomFactors();
    const nodeId = extractNodeId(id);

    // Update output connections
    Object.keys(elemsOut).forEach((item, i) => {
      const points = elemsOut[item].querySelectorAll('.point');

      const elemtsearchId_out = container.querySelector(`#${id}`);
      const elemtsearch = elemtsearchId_out.querySelectorAll('.' + elemsOut[item].classList[3])[0];
      const id_search = elemsOut[item].classList[1].replace('node_in_', '');
      const elemtsearchId = container.querySelector(`#${id_search}`);
      const elemtsearch_in = elemtsearchId.querySelectorAll('.' + elemsOut[item].classList[4])[0];

      if (points.length === 0) {
        renderManager.updateSimpleOutputConnection(
          elemsOut[item],
          elemtsearch,
          elemtsearch_in,
          zoomFactors,
          connectionConfig.curvature
        );
      } else {
        renderManager.updateReroutedOutputConnection(
          elemsOut[item],
          points,
          elemtsearch,
          elemtsearch_in,
          zoomFactors,
          rerouteConfig.curvature,
          rerouteConfig.curvature_start_end,
          rerouteConfig.width
        );
      }
    });

    // Update input connections
    Object.keys(elemsIn).forEach((item, i) => {
      const points = elemsIn[item].querySelectorAll('.point');

      const elemtsearchId_in = container.querySelector(`#${id}`);
      const elemtsearch = elemtsearchId_in.querySelectorAll('.' + elemsIn[item].classList[4])[0];
      const id_search = elemsIn[item].classList[2].replace('node_out_', '');
      const elemtsearchId = container.querySelector(`#${id_search}`);
      const elemtsearch_out = elemtsearchId.querySelectorAll('.' + elemsIn[item].classList[3])[0];

      if (points.length === 0) {
        renderManager.updateSimpleInputConnection(
          elemsIn[item],
          elemtsearch_out,
          elemtsearch,
          zoomFactors,
          connectionConfig.curvature
        );
      } else {
        renderManager.updateReroutedInputConnection(
          elemsIn[item],
          points,
          elemtsearch_out,
          elemtsearch,
          zoomFactors,
          rerouteConfig.curvature,
          rerouteConfig.curvature_start_end,
          rerouteConfig.width
        );
      }
    });
  }

  /**
   * Removes the currently selected connection
   */
  removeConnection() {
    const connection_selected = this.context.getConnectionSelected();
    const eventManager = this.context.getEventManager();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();

    if (connection_selected) {
      // connection_selected is the .main-path element; parent is the .connection SVG
      const connectionElem = connection_selected.parentElement;
      const listclass = connectionElem.classList;

      this.context.setConnectionSelected(null);
      connection_selected.classList.remove(CSS_CLASSES.SELECTED);

      const id_output = extractNodeId(listclass[2].replace('node_out_', ''));
      const id_input = extractNodeId(listclass[1].replace('node_in_', ''));
      const output_class = listclass[3];
      const input_class = listclass[4];

      // Remove from data
      const outputConnections = nodeforgeData[module].data[id_output].outputs[output_class].connections;
      const inputConnections = nodeforgeData[module].data[id_input].inputs[input_class].connections;

      const index_out = outputConnections.findIndex(item =>
        item.node === id_input && item.output === input_class
      );
      outputConnections.splice(index_out, 1);

      const index_in = inputConnections.findIndex(item =>
        item.node === id_output && item.input === output_class
      );
      inputConnections.splice(index_in, 1);

      connectionElem.remove();

      eventManager.dispatch(EVENTS.CONNECTION_REMOVED, {
        output_id: id_output,
        input_id: id_input,
        output_class: output_class,
        input_class: input_class
      });
    }
  }

  /**
   * Removes a specific connection between two nodes
   * @param {string} id_output - Output node ID
   * @param {string} id_input - Input node ID
   * @param {string} output_class - Output class name
   * @param {string} input_class - Input class name
   */
  removeSingleConnection(id_output, id_input, output_class, input_class) {
    const stateManager = this.context.getStateManager();
    const nodeforgeData = this.context.getNodeForgeData();
    const container = this.context.getContainer();
    const eventManager = this.context.getEventManager();

    const nodeOneModule = stateManager.getModuleFromNodeId(id_output);
    const nodeTwoModule = stateManager.getModuleFromNodeId(id_input);

    if (nodeOneModule === nodeTwoModule) {
      // Remove from data
      const outputConnections = nodeforgeData[nodeOneModule].data[id_output].outputs[output_class].connections;
      const inputConnections = nodeforgeData[nodeOneModule].data[id_input].inputs[input_class].connections;

      const index_out = outputConnections.findIndex(item =>
        item.node === id_input && item.output === input_class
      );
      if (index_out > -1) {
        outputConnections.splice(index_out, 1);
      }

      const index_in = inputConnections.findIndex(item =>
        item.node === id_output && item.input === output_class
      );
      if (index_in > -1) {
        inputConnections.splice(index_in, 1);
      }

      // Remove DOM element
      const selector = `.connection.node_in_node-${id_input}.node_out_node-${id_output}.${output_class}.${input_class}`;
      const ele = container.querySelector(selector);
      if (ele) {
        ele.remove();
      }

      eventManager.dispatch(EVENTS.CONNECTION_REMOVED, {
        output_id: id_output,
        input_id: id_input,
        output_class: output_class,
        input_class: input_class
      });
    }
  }

  /**
   * Removes all connections for a specific node
   * @param {string} id - Node ID
   */
  removeConnectionNodeId(id) {
    const container = this.context.getContainer();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const eventManager = this.context.getEventManager();

    const idSearchOut = 'node_out_node-' + id;
    const idSearchIn = 'node_in_node-' + id;
    const elemsOut = container.querySelectorAll(`.${CSS_CLASSES.CONNECTION}.${idSearchOut}`);
    const elemsIn = container.querySelectorAll(`.${CSS_CLASSES.CONNECTION}.${idSearchIn}`);

    // Remove output connections
    for (let i = elemsOut.length - 1; i >= 0; i--) {
      const listclass = elemsOut[i].classList;
      const id_output = extractNodeId(listclass[2].replace('node_out_', ''));
      const id_input = extractNodeId(listclass[1].replace('node_in_', ''));
      const output_class = listclass[3];
      const input_class = listclass[4];

      // Remove from input node
      const inputConnections = nodeforgeData[module].data[id_input].inputs[input_class].connections;
      const index_in = inputConnections.findIndex(item =>
        item.node === id_output && item.input === output_class
      );
      inputConnections.splice(index_in, 1);

      // Remove from output node
      const outputConnections = nodeforgeData[module].data[id_output].outputs[output_class].connections;
      const index_out = outputConnections.findIndex(item =>
        item.node === id_input && item.output === input_class
      );
      outputConnections.splice(index_out, 1);

      elemsOut[i].remove();

      eventManager.dispatch(EVENTS.CONNECTION_REMOVED, {
        output_id: id_output,
        input_id: id_input,
        output_class: output_class,
        input_class: input_class
      });
    }

    // Remove input connections
    for (let i = elemsIn.length - 1; i >= 0; i--) {
      const listclass = elemsIn[i].classList;
      const id_output = extractNodeId(listclass[2].replace('node_out_', ''));
      const id_input = extractNodeId(listclass[1].replace('node_in_', ''));
      const output_class = listclass[3];
      const input_class = listclass[4];

      // Remove from output node
      const outputConnections = nodeforgeData[module].data[id_output].outputs[output_class].connections;
      const index_out = outputConnections.findIndex(item =>
        item.node === id_input && item.output === input_class
      );
      outputConnections.splice(index_out, 1);

      // Remove from input node
      const inputConnections = nodeforgeData[module].data[id_input].inputs[input_class].connections;
      const index_in = inputConnections.findIndex(item =>
        item.node === id_output && item.input === output_class
      );
      inputConnections.splice(index_in, 1);

      elemsIn[i].remove();

      eventManager.dispatch(EVENTS.CONNECTION_REMOVED, {
        output_id: id_output,
        input_id: id_input,
        output_class: output_class,
        input_class: input_class
      });
    }
  }
}
