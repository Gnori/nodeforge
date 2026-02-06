/**
 * RerouteManager - Handles reroute point management
 *
 * Extracted from nodeforge.js
 * Manages reroute point creation, deletion, and import
 */
import { createSVGElement } from '../utils/dom.js';
import { CSS_CLASSES, EVENTS } from '../constants.js';
import { extractNodeId } from '../utils/string.js';

export class RerouteManager {
  /**
   * Creates a new RerouteManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Removes reroute connection selected state
   */
  removeRerouteConnectionSelected() {
    const connection_selected = this.context.getConnectionSelected();
    if (connection_selected) {
      connection_selected.classList.remove(CSS_CLASSES.SELECTED);
    }
  }

  /**
   * Creates a new reroute point on a connection
   * @param {HTMLElement} ele - The connection path element clicked
   */
  createReroutePoint(ele) {
    const precanvas = this.context.getPrecanvas();
    const zoom = this.context.getZoom();
    const rerouteConfig = this.context.getRerouteConfig();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const eventManager = this.context.getEventManager();
    const connectionManager = this.context.getConnectionManager();

    // Get mouse position
    const nodeforge = this.context.nodeforge;
    const pos_x = nodeforge.pos_x;
    const pos_y = nodeforge.pos_y;

    // Deselect connection
    const connection_selected = this.context.getConnectionSelected();
    if (connection_selected) {
      connection_selected.classList.remove(CSS_CLASSES.SELECTED);
    }

    const nodeUpdate = ele.parentElement.classList[2].replace("node_out_", "");
    const nodeUpdateIn = extractNodeId(ele.parentElement.classList[1].replace("node_in_", ""));
    const output_class = ele.parentElement.classList[3];
    const input_class = ele.parentElement.classList[4];

    this.context.setConnectionSelected(null);

    const point = createSVGElement("circle");
    point.classList.add("point");

    let point_x = pos_x * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) -
      (precanvas.getBoundingClientRect().x * (precanvas.clientWidth / (precanvas.clientWidth * zoom)));
    let point_y = pos_y * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) -
      (precanvas.getBoundingClientRect().y * (precanvas.clientHeight / (precanvas.clientHeight * zoom)));

    point.setAttributeNS(null, 'cx', point_x);
    point.setAttributeNS(null, 'cy', point_y);
    point.setAttributeNS(null, 'r', rerouteConfig.width);

    let position_add_array_point = 0;
    if (rerouteConfig.fix_curvature) {
      const numberPoints = ele.parentElement.querySelectorAll("." + CSS_CLASSES.MAIN_PATH).length;
      let path = createSVGElement("path");
      path.classList.add("main-path");
      path.setAttributeNS(null, 'd', '');

      ele.parentElement.insertBefore(path, ele.parentElement.children[numberPoints]);
      if (numberPoints === 1) {
        ele.parentElement.appendChild(point);
      } else {
        const search_point = Array.from(ele.parentElement.children).indexOf(ele);
        position_add_array_point = search_point;
        ele.parentElement.insertBefore(point, ele.parentElement.children[search_point + numberPoints + 1]);
      }
    } else {
      ele.parentElement.appendChild(point);
    }

    const nodeId = nodeUpdate.slice(5);
    const searchConnection = nodeforgeData[module].data[nodeId].outputs[output_class].connections.findIndex(function (item, i) {
      return item.node === nodeUpdateIn && item.output === input_class;
    });

    if (nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points === undefined) {
      nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points = [];
    }

    if (rerouteConfig.fix_curvature) {
      if (position_add_array_point > 0 ||
        nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points.length !== 0) {
        nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points.splice(
          position_add_array_point, 0, { pos_x: point_x, pos_y: point_y }
        );
      } else {
        nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points.push({
          pos_x: point_x,
          pos_y: point_y
        });
      }

      ele.parentElement.querySelectorAll("." + CSS_CLASSES.MAIN_PATH).forEach((item, i) => {
        item.classList.remove(CSS_CLASSES.SELECTED);
      });
    } else {
      nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points.push({
        pos_x: point_x,
        pos_y: point_y
      });
    }

    eventManager.dispatch(EVENTS.ADD_REROUTE, nodeId);
    if (connectionManager) {
      connectionManager.updateConnectionNodes(nodeUpdate);
    }
  }

  /**
   * Removes a reroute point
   * @param {HTMLElement} ele - The reroute point element to remove
   */
  removeReroutePoint(ele) {
    const rerouteConfig = this.context.getRerouteConfig();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const eventManager = this.context.getEventManager();
    const connectionManager = this.context.getConnectionManager();

    const nodeUpdate = ele.parentElement.classList[2].replace("node_out_", "");
    const nodeUpdateIn = extractNodeId(ele.parentElement.classList[1].replace("node_in_", ""));
    const output_class = ele.parentElement.classList[3];
    const input_class = ele.parentElement.classList[4];

    let numberPointPosition = Array.from(ele.parentElement.children).indexOf(ele);
    const nodeId = nodeUpdate.slice(5);
    const searchConnection = nodeforgeData[module].data[nodeId].outputs[output_class].connections.findIndex(function (item, i) {
      return item.node === nodeUpdateIn && item.output === input_class;
    });

    if (rerouteConfig.fix_curvature) {
      const numberMainPath = ele.parentElement.querySelectorAll("." + CSS_CLASSES.MAIN_PATH).length;
      ele.parentElement.children[numberMainPath - 1].remove();
      numberPointPosition -= numberMainPath;
      if (numberPointPosition < 0) {
        numberPointPosition = 0;
      }
    }

    nodeforgeData[module].data[nodeId].outputs[output_class].connections[searchConnection].points.splice(
      numberPointPosition, 1
    );

    ele.remove();

    eventManager.dispatch(EVENTS.REMOVE_REROUTE, nodeId);
    if (connectionManager) {
      connectionManager.updateConnectionNodes(nodeUpdate);
    }
  }

  /**
   * Adds reroute points from imported data
   * @param {Object} dataNode - Node data with connection reroute points
   */
  addRerouteImport(dataNode) {
    const rerouteConfig = this.context.getRerouteConfig();
    const container = this.context.getContainer();

    Object.keys(dataNode.outputs).map(function (output_item, index) {
      Object.keys(dataNode.outputs[output_item].connections).map(function (input_item, index) {
        const points = dataNode.outputs[output_item].connections[input_item].points;
        if (points !== undefined) {
          points.forEach((item, i) => {
            const input_id = dataNode.outputs[output_item].connections[input_item].node;
            const input_class = dataNode.outputs[output_item].connections[input_item].output;
            const ele = container.querySelector('.connection.node_in_node-' + input_id + '.node_out_node-' + dataNode.id + '.' + output_item + '.' + input_class);

            if (rerouteConfig.fix_curvature) {
              if (i === 0) {
                for (let z = 0; z < points.length; z++) {
                  let path = createSVGElement("path");
                  path.classList.add("main-path");
                  path.setAttributeNS(null, 'd', '');
                  ele.appendChild(path);
                }
              }
            }

            const point = createSVGElement("circle");
            point.classList.add("point");
            let pos_x = item.pos_x;
            let pos_y = item.pos_y;

            point.setAttributeNS(null, 'cx', pos_x);
            point.setAttributeNS(null, 'cy', pos_y);
            point.setAttributeNS(null, 'r', rerouteConfig.width);

            ele.appendChild(point);
          });
        }
      });
    });
  }
}
