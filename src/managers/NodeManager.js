/**
 * NodeManager - Handles node CRUD operations
 *
 * Extracted from nodeforge.js
 * Manages node creation, deletion, updates, and I/O operations
 */
import {
  generateUUID,
  extractNodeId,
  buildNodeId
} from '../utils/string.js';
import { CSS_CLASSES, EVENTS } from '../constants.js';
import { createSVGElement } from '../utils/dom.js';

export class NodeManager {
  /**
   * Creates a new NodeManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Registers a node type with HTML template and properties
   * @param {string} name - Node type name
   * @param {HTMLElement|Object} html - HTML template or Vue component
   * @param {Object} props - Component properties
   * @param {Object} options - Additional options
   */
  registerNode(name, html, props = null, options = null) {
    const nodeRegister = this.context.getNodeRegister();
    nodeRegister[name] = { html: html, props: props, options: options };
  }

  /**
   * Populates node data attributes by recursively traversing data object
   * and setting values on elements with matching df-* attributes
   * @param {HTMLElement} content - The content element to query for df-* attributes
   * @param {Object} dataSource - The data object to extract values from
   * @param {Object} object - Current object being traversed (null for root level)
   * @param {string} name - Current property name
   * @param {string} completname - Complete property path (e.g., 'user-address-city')
   */
  populateNodeDataAttributes(content, dataSource, object, name, completname) {
    if (object === null) {
      object = dataSource[name];
    } else {
      object = object[name];
    }
    if (object !== null) {
      Object.entries(object).forEach((key, value) => {
        if (typeof key[1] === "object") {
          this.populateNodeDataAttributes(content, dataSource, object, key[0], completname + '-' + key[0]);
        } else {
          let elems = content.querySelectorAll('[df-' + completname + '-' + key[0] + ']');
          for (let i = 0; i < elems.length; i++) {
            elems[i].value = key[1];
            if (elems[i].isContentEditable) {
              elems[i].innerText = key[1];
            }
          }
        }
      });
    }
  }

  /**
   * Adds a new node to the editor
   * @param {string} name - The name/type of the node
   * @param {number} num_in - Number of input connectors
   * @param {number} num_out - Number of output connectors
   * @param {number} ele_pos_x - X position of the node in pixels
   * @param {number} ele_pos_y - Y position of the node in pixels
   * @param {string} classoverride - Additional CSS classes to apply to the node
   * @param {Object} data - Custom data object associated with the node
   * @param {string} html - HTML content to render inside the node
   * @param {boolean} [typenode=false] - Whether this is a special type node
   * @returns {number|string} The ID of the created node
   */
  addNode(name, num_in, num_out, ele_pos_x, ele_pos_y, classoverride, data, html, typenode = false) {
    const useuuid = this.context.isUsingUuid();
    const nodeRegister = this.context.getNodeRegister();
    const renderFunction = this.context.getRenderFunction();
    const parent_context = this.context.getParent();
    const precanvas = this.context.getPrecanvas();
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const eventManager = this.context.getEventManager();

    let newNodeId;
    if (useuuid) {
      newNodeId = generateUUID();
    } else {
      newNodeId = this.context.getNextNodeId();
    }

    const parent = document.createElement('div');
    parent.classList.add("parent-node");

    const node = document.createElement('div');
    node.innerHTML = "";
    node.setAttribute("id", buildNodeId(newNodeId));
    node.classList.add(CSS_CLASSES.NODEFORGE_NODE);
    if (classoverride !== '') {
      node.classList.add(...classoverride.split(' '));
    }

    const inputs = document.createElement('div');
    inputs.classList.add(CSS_CLASSES.INPUTS);

    const outputs = document.createElement('div');
    outputs.classList.add(CSS_CLASSES.OUTPUTS);

    const json_inputs = {};
    for (let x = 0; x < num_in; x++) {
      const input = document.createElement('div');
      input.classList.add(CSS_CLASSES.INPUT);
      input.classList.add("input_" + (x + 1));
      json_inputs["input_" + (x + 1)] = { "connections": [] };
      inputs.appendChild(input);
    }

    const json_outputs = {};
    for (let x = 0; x < num_out; x++) {
      const output = document.createElement('div');
      output.classList.add(CSS_CLASSES.OUTPUT);
      output.classList.add("output_" + (x + 1));
      json_outputs["output_" + (x + 1)] = { "connections": [] };
      outputs.appendChild(output);
    }

    const content = document.createElement('div');
    content.classList.add("nodeforge_content_node");
    if (typenode === false) {
      content.innerHTML = html;
    } else if (typenode === true) {
      content.appendChild(nodeRegister[html].html.cloneNode(true));
    } else {
      if (parseInt(renderFunction.version) === 3) {
        //Vue 3
        let wrapper = renderFunction.h(nodeRegister[html].html, nodeRegister[html].props, nodeRegister[html].options);
        wrapper.appContext = parent_context;
        renderFunction.render(wrapper, content);
      } else {
        // Vue 2
        let wrapper = new renderFunction({
          parent: parent_context,
          render: h => h(nodeRegister[html].html, { props: nodeRegister[html].props }),
          ...nodeRegister[html].options
        }).$mount();
        content.appendChild(wrapper.$el);
      }
    }

    Object.entries(data).forEach((key, value) => {
      if (typeof key[1] === "object") {
        this.populateNodeDataAttributes(content, data, null, key[0], key[0]);
      } else {
        let elems = content.querySelectorAll('[df-' + key[0] + ']');
        for (let i = 0; i < elems.length; i++) {
          elems[i].value = key[1];
          if (elems[i].isContentEditable) {
            elems[i].innerText = key[1];
          }
        }
      }
    });

    node.appendChild(inputs);
    node.appendChild(content);
    node.appendChild(outputs);
    node.style.top = ele_pos_y + "px";
    node.style.left = ele_pos_x + "px";
    parent.appendChild(node);
    precanvas.appendChild(parent);

    let json = {
      id: newNodeId,
      name: name,
      data: data,
      class: classoverride,
      html: html,
      typenode: typenode,
      inputs: json_inputs,
      outputs: json_outputs,
      pos_x: ele_pos_x,
      pos_y: ele_pos_y,
    };

    nodeforgeData[module].data[newNodeId] = json;
    eventManager.dispatch(EVENTS.NODE_CREATED, newNodeId);

    return newNodeId;
  }

  /**
   * Adds a node from imported data
   * @param {Object} dataNode - Node data object
   * @param {HTMLElement} precanvas - Precanvas element to append to
   */
  addNodeImport(dataNode, precanvas) {
    const nodeRegister = this.context.getNodeRegister();
    const renderFunction = this.context.getRenderFunction();
    const parent_context = this.context.getParent();

    const parent = document.createElement('div');
    parent.classList.add("parent-node");

    const node = document.createElement('div');
    node.innerHTML = "";
    node.setAttribute("id", buildNodeId(dataNode.id));
    node.classList.add(CSS_CLASSES.NODEFORGE_NODE);
    if (dataNode.class !== '') {
      node.classList.add(...dataNode.class.split(' '));
    }

    const inputs = document.createElement('div');
    inputs.classList.add(CSS_CLASSES.INPUTS);

    const outputs = document.createElement('div');
    outputs.classList.add(CSS_CLASSES.OUTPUTS);

    Object.keys(dataNode.inputs).map(function (input_item, index) {
      const input = document.createElement('div');
      input.classList.add(CSS_CLASSES.INPUT);
      input.classList.add(input_item);
      inputs.appendChild(input);
      Object.keys(dataNode.inputs[input_item].connections).map(function (output_item, index) {
        let connection = createSVGElement("svg");
        let path = createSVGElement("path");
        path.classList.add("main-path");
        path.setAttributeNS(null, 'd', '');
        connection.classList.add(CSS_CLASSES.CONNECTION);
        connection.classList.add("node_in_node-" + dataNode.id);
        connection.classList.add("node_out_node-" + dataNode.inputs[input_item].connections[output_item].node);
        connection.classList.add(dataNode.inputs[input_item].connections[output_item].input);
        connection.classList.add(input_item);

        connection.appendChild(path);
        precanvas.appendChild(connection);
      });
    });

    for (let x = 0; x < Object.keys(dataNode.outputs).length; x++) {
      const output = document.createElement('div');
      output.classList.add(CSS_CLASSES.OUTPUT);
      output.classList.add("output_" + (x + 1));
      outputs.appendChild(output);
    }

    const content = document.createElement('div');
    content.classList.add("nodeforge_content_node");

    if (dataNode.typenode === false) {
      content.innerHTML = dataNode.html;
    } else if (dataNode.typenode === true) {
      content.appendChild(nodeRegister[dataNode.html].html.cloneNode(true));
    } else {
      if (parseInt(renderFunction.version) === 3) {
        //Vue 3
        let wrapper = renderFunction.h(nodeRegister[dataNode.html].html, nodeRegister[dataNode.html].props, nodeRegister[dataNode.html].options);
        wrapper.appContext = parent_context;
        renderFunction.render(wrapper, content);
      } else {
        //Vue 2
        let wrapper = new renderFunction({
          parent: parent_context,
          render: h => h(nodeRegister[dataNode.html].html, { props: nodeRegister[dataNode.html].props }),
          ...nodeRegister[dataNode.html].options
        }).$mount();
        content.appendChild(wrapper.$el);
      }
    }

    Object.entries(dataNode.data).forEach((key, value) => {
      if (typeof key[1] === "object") {
        this.populateNodeDataAttributes(content, dataNode.data, null, key[0], key[0]);
      } else {
        let elems = content.querySelectorAll('[df-' + key[0] + ']');
        for (let i = 0; i < elems.length; i++) {
          elems[i].value = key[1];
          if (elems[i].isContentEditable) {
            elems[i].innerText = key[1];
          }
        }
      }
    });

    node.appendChild(inputs);
    node.appendChild(content);
    node.appendChild(outputs);
    node.style.top = dataNode.pos_y + "px";
    node.style.left = dataNode.pos_x + "px";
    parent.appendChild(node);
    precanvas.appendChild(parent);
  }

  /**
   * Updates node data value from input event
   * @param {Event} event - Input event from node content
   */
  updateNodeValue(event) {
    const nodeforgeData = this.context.getNodeForgeData();
    const module = this.context.getModule();
    const eventManager = this.context.getEventManager();

    let attr = event.target.attributes;
    for (let i = 0; i < attr.length; i++) {
      if (attr[i].nodeName.startsWith('df-')) {
        let keys = attr[i].nodeName.slice(3).split("-");
        let target = nodeforgeData[module].data[extractNodeId(event.target.closest(".nodeforge_content_node").parentElement.id)].data;
        for (let index = 0; index < keys.length - 1; index += 1) {
          if (target[keys[index]] == null) {
            target[keys[index]] = {};
          }
          target = target[keys[index]];
        }
        target[keys[keys.length - 1]] = event.target.value;
        if (event.target.isContentEditable) {
          target[keys[keys.length - 1]] = event.target.innerText;
        }
        eventManager.dispatch(EVENTS.NODE_DATA_CHANGED, extractNodeId(event.target.closest(".nodeforge_content_node").parentElement.id));
      }
    }
  }

  /**
   * Updates node data by ID
   * @param {string} id - Node ID
   * @param {Object} data - New data object
   */
  updateNodeDataFromId(id, data) {
    const stateManager = this.context.getStateManager();
    const nodeInfo = stateManager.getNodeFromId(id);
    const nodeforgeData = this.context.getNodeForgeData();
    const moduleName = stateManager.getModuleFromNodeId(id);

    nodeforgeData[moduleName].data[id].data = data;

    if (nodeInfo.html) {
      this.context.nodeforge.import({ nodeforge: nodeforgeData }, false);
    }
  }

  /**
   * Adds an input to an existing node
   * @param {string} id - Node ID
   */
  addNodeInput(id) {
    const nodeforgeData = this.context.getNodeForgeData();
    const stateManager = this.context.getStateManager();
    const moduleName = stateManager.getModuleFromNodeId(id);
    const infoNode = nodeforgeData[moduleName].data[id];

    const container = this.context.getContainer();
    const numInputs = Object.keys(infoNode.inputs).length;

    if (infoNode.name === 'telegram') {
      numInputs = numInputs - Object.keys(infoNode.outputs).length;
    }

    const input_class = 'input_' + (numInputs + 1);
    const input = document.createElement('div');
    input.classList.add(CSS_CLASSES.INPUT);
    input.classList.add(input_class);

    const parent = container.querySelector('#node-' + id);
    parent.querySelector('.inputs').appendChild(input);

    nodeforgeData[moduleName].data[id].inputs[input_class] = { "connections": [] };
  }

  /**
   * Adds an output to an existing node
   * @param {string} id - Node ID
   */
  addNodeOutput(id) {
    const nodeforgeData = this.context.getNodeForgeData();
    const stateManager = this.context.getStateManager();
    const moduleName = stateManager.getModuleFromNodeId(id);
    const infoNode = nodeforgeData[moduleName].data[id];

    const container = this.context.getContainer();
    const numOutputs = Object.keys(infoNode.outputs).length;

    if (infoNode.name === 'telegram') {
      numOutputs = numOutputs - Object.keys(infoNode.inputs).length;
    }

    const output_class = 'output_' + (numOutputs + 1);
    const output = document.createElement('div');
    output.classList.add(CSS_CLASSES.OUTPUT);
    output.classList.add(output_class);

    const parent = container.querySelector('#node-' + id);
    parent.querySelector('.outputs').appendChild(output);

    nodeforgeData[moduleName].data[id].outputs[output_class] = { "connections": [] };
  }

  /**
   * Removes an input from a node
   * @param {string} id - Node ID
   * @param {string} input_class - Input class name (e.g., 'input_1')
   */
  removeNodeInput(id, input_class) {
    const nodeforgeData = this.context.getNodeForgeData();
    const stateManager = this.context.getStateManager();
    const eventManager = this.context.getEventManager();
    const container = this.context.getContainer();
    const moduleName = stateManager.getModuleFromNodeId(id);

    const infoNode = nodeforgeData[moduleName].data[id];

    infoNode.inputs[input_class].connections.forEach((item, i) => {
      const id_output = item.node;
      const output_class = item.input;
      const targetNode = nodeforgeData[moduleName].data[id_output];
      const id_input = id;

      targetNode.outputs[output_class].connections.forEach((outputItem, j) => {
        if (outputItem.node === id_input && outputItem.output === input_class) {
          targetNode.outputs[output_class].connections.splice(j, 1);

          const ele = container.querySelector('.connection.node_in_node-' + id_input + '.node_out_node-' + id_output + '.' + output_class + '.' + input_class);
          ele.remove();

          eventManager.dispatch(EVENTS.CONNECTION_REMOVED, {
            output_id: id_output,
            input_id: id_input,
            output_class: output_class,
            input_class: input_class
          });
        }
      });
    });

    delete nodeforgeData[moduleName].data[id].inputs[input_class];

    const ele = container.querySelector('#node-' + id);
    const input = ele.querySelector('.' + input_class);
    input.remove();
  }

  /**
   * Removes an output from a node
   * @param {string} id - Node ID
   * @param {string} output_class - Output class name (e.g., 'output_1')
   */
  removeNodeOutput(id, output_class) {
    const nodeforgeData = this.context.getNodeForgeData();
    const stateManager = this.context.getStateManager();
    const eventManager = this.context.getEventManager();
    const container = this.context.getContainer();
    const moduleName = stateManager.getModuleFromNodeId(id);

    const infoNode = nodeforgeData[moduleName].data[id];

    infoNode.outputs[output_class].connections.forEach((item, i) => {
      const id_input = item.node;
      const input_class = item.output;
      const targetNode = nodeforgeData[moduleName].data[id_input];
      const id_output = id;

      targetNode.inputs[input_class].connections.forEach((inputItem, j) => {
        if (inputItem.node === id_output && inputItem.input === output_class) {
          targetNode.inputs[input_class].connections.splice(j, 1);

          const ele = container.querySelector('.connection.node_in_node-' + id_input + '.node_out_node-' + id_output + '.' + output_class + '.' + input_class);
          ele.remove();

          eventManager.dispatch(EVENTS.CONNECTION_REMOVED, {
            output_id: id_output,
            input_id: id_input,
            output_class: output_class,
            input_class: input_class
          });
        }
      });
    });

    delete nodeforgeData[moduleName].data[id].outputs[output_class];

    const ele = container.querySelector('#node-' + id);
    const output = ele.querySelector('.' + output_class);
    output.remove();
  }

  /**
   * Removes a node by ID
   * @param {string} id - Node ID to remove
   */
  removeNodeId(id) {
    // id comes in as full DOM ID "node-X", extract numeric part for data ops
    const nodeId = extractNodeId(id);

    const container = this.context.getContainer();
    const stateManager = this.context.getStateManager();
    const eventManager = this.context.getEventManager();
    const nodeforgeData = this.context.getNodeForgeData();
    const moduleName = stateManager.getModuleFromNodeId(nodeId);

    // Remove connections via ConnectionManager
    const connectionManager = this.context.getConnectionManager();
    if (connectionManager) {
      connectionManager.removeConnectionNodeId(nodeId);
    } else {
      this.context.nodeforge.removeConnectionNodeId(nodeId);
    }

    // Remove node element (id already has "node-" prefix)
    const nodeElem = container.querySelector('#' + id);
    if (nodeElem && nodeElem.parentElement) {
      nodeElem.parentElement.remove();
    }

    // Remove node data
    delete nodeforgeData[moduleName].data[nodeId];

    eventManager.dispatch(EVENTS.NODE_REMOVED, nodeId);
  }
}
