// Import constants (only what's actually used)
import {
  CSS_CLASSES,
  ZOOM_CONFIG,
  EDITOR_MODES,
  REROUTE_CONFIG,
  CONNECTION_CONFIG,
  MOBILE_CONFIG,
  DEFAULT_MODULE,
  MOUSE_BUTTONS,
  KEY_CODES,
  NODE_ID_CONFIG,
  EVENTS
} from './constants.js';

// Import core managers
import { NodeForgeContext } from './core/NodeForgeContext.js';
import { EventManager } from './core/EventManager.js';
import { StateManager } from './core/StateManager.js';

// Import simple managers
import { ZoomManager } from './managers/ZoomManager.js';
import { ModuleManager } from './managers/ModuleManager.js';

// Import rendering manager
import { RenderManager } from './managers/RenderManager.js';

// Import core operation managers
import { NodeManager } from './managers/NodeManager.js';
import { ConnectionManager } from './managers/ConnectionManager.js';
import { RerouteManager } from './managers/RerouteManager.js';

// Import interaction handlers
import { InteractionHandler } from './handlers/InteractionHandler.js';

// Import utilities (only what's actually used)
import {
  extractNodeId,
  buildNodeId
} from './utils/string.js';

/**
 * NodeForge - Main class using Manager Pattern
 *
 * Architecture:
 * - Delegates all operations to specialized managers
 * - Maintains 100% backward compatibility with original API
 * - All public methods delegate to appropriate managers
 *
 * Managers:
 * - EventManager: Event handling and dispatching
 * - StateManager: Data queries and state access
 * - ZoomManager: Zoom controls
 * - ModuleManager: Module management
 * - RenderManager: DOM rendering and SVG generation
 * - NodeManager: Node CRUD operations
 * - ConnectionManager: Connection CRUD operations
 * - RerouteManager: Reroute point management
 * - InteractionHandler: User interaction coordination
 */

export default class NodeForge {
  /**
   * Creates a new NodeForge editor instance
   * @param {HTMLElement} container - The DOM element to attach the editor to
   * @param {Function} [render=null] - Optional custom render function for node content
   * @param {Object} [parent=null] - Optional parent context for nested editors
   */
  constructor(container, render = null, parent = null) {
  // Constructor: Now uses constants from constants.js for all configuration values
  // This ensures consistency and makes the codebase easier to maintain

    // Phase 1: Initialize core managers
    this.context = new NodeForgeContext(this);
    this.eventManager = new EventManager(this.context);
    this.stateManager = new StateManager(this.context);

    // Phase 2: Initialize simple managers
    this.zoomManager = new ZoomManager(this.context);
    this.moduleManager = new ModuleManager(this.context);

    // Phase 3: Initialize rendering manager
    this.renderManager = new RenderManager(this.context);

    // Phase 4: Initialize core operation managers
    this.nodeManager = new NodeManager(this.context);
    this.connectionManager = new ConnectionManager(this.context);
    this.rerouteManager = new RerouteManager(this.context);

    // Phase 5: Initialize interaction handler
    this.interactionHandler = new InteractionHandler(this.context);

    // Register managers in context
    this.context.registerManager('eventManager', this.eventManager);
    this.context.registerManager('stateManager', this.stateManager);
    this.context.registerManager('zoomManager', this.zoomManager);
    this.context.registerManager('moduleManager', this.moduleManager);
    this.context.registerManager('renderManager', this.renderManager);
    this.context.registerManager('nodeManager', this.nodeManager);
    this.context.registerManager('connectionManager', this.connectionManager);
    this.context.registerManager('rerouteManager', this.rerouteManager);
    this.context.registerManager('interactionHandler', this.interactionHandler);

    this.events = this.eventManager.events; // Backward compatibility
    this.container = container;
    this.precanvas = null;
    this.nodeId = NODE_ID_CONFIG.START_ID;
    this.ele_selected = null;
    this.node_selected = null;
    this.drag = false;
    this.reroute = false;
    this.reroute_fix_curvature = false;
    this.curvature = CONNECTION_CONFIG.DEFAULT_CURVATURE;
    this.reroute_curvature_start_end = REROUTE_CONFIG.CURVATURE_START_END;
    this.reroute_curvature = REROUTE_CONFIG.DEFAULT_CURVATURE;
    this.reroute_width = REROUTE_CONFIG.DEFAULT_WIDTH;
    this.drag_point = false;
    this.editor_selected = false;
    this.connection = false;
    this.connection_ele = null;
    this.connection_selected = null;
    this.canvas_x = 0;
    this.canvas_y = 0;
    this.pos_x = 0;
    this.pos_x_start = 0;
    this.pos_y = 0;
    this.pos_y_start = 0;
    this.mouse_x = 0;
    this.mouse_y = 0;
    this.line_path = CONNECTION_CONFIG.LINE_PATH;
    this.first_click = null;
    this.force_first_input = false;
    this.draggable_inputs = true;
    this.useuuid = false;
    this.parent = parent;

    this.noderegister = {};
    this.render = render;
    this.nodeforge = { "nodeforge": { [DEFAULT_MODULE]: { "data": {} }}};
    // Configurable options
    this.module = DEFAULT_MODULE;
    this.editor_mode = EDITOR_MODES.EDIT;
    this.zoom = ZOOM_CONFIG.DEFAULT;
    this.zoom_max = ZOOM_CONFIG.MAX;
    this.zoom_min = ZOOM_CONFIG.MIN;
    this.zoom_value = ZOOM_CONFIG.STEP;
    this.zoom_last_value = ZOOM_CONFIG.LAST_VALUE;

    // Mobile
    this.evCache = new Array();
    this.prevDiff = MOBILE_CONFIG.PREV_DIFF_INITIAL;
  }

  /**
   * Initializes the NodeForge editor
   * Sets up the canvas, attaches event listeners for mouse/touch interactions,
   * keyboard shortcuts, zoom controls, and loads existing nodes
   */
  start () {
    // console.info("Start NodeForge!!");
    this.container.classList.add(CSS_CLASSES.PARENT_NODEFORGE);
    this.container.tabIndex = 0;
    this.precanvas = document.createElement('div');
    this.precanvas.classList.add(CSS_CLASSES.NODEFORGE);
    this.container.appendChild(this.precanvas);

    /* Mouse and Touch Actions */
    this.container.addEventListener('mouseup', this.dragEnd.bind(this));
    this.container.addEventListener('mousemove', this.position.bind(this));
    this.container.addEventListener('mousedown', this.click.bind(this) );

    this.container.addEventListener('touchend', this.dragEnd.bind(this));
    this.container.addEventListener('touchmove', this.position.bind(this));
    this.container.addEventListener('touchstart', this.click.bind(this));

    /* Context Menu */
    this.container.addEventListener('contextmenu', this.contextmenu.bind(this));
    /* Delete */
    this.container.addEventListener('keydown', this.key.bind(this));

    /* Zoom Mouse */
    this.container.addEventListener('wheel', this.zoom_enter.bind(this));
    /* Update data Nodes */
    this.container.addEventListener('input', this.updateNodeValue.bind(this));

    this.container.addEventListener('dblclick', this.dblclick.bind(this));
    /* Mobile zoom */
    this.container.onpointerdown = this.pointerdown_handler.bind(this);
    this.container.onpointermove = this.pointermove_handler.bind(this);
    this.container.onpointerup = this.pointerup_handler.bind(this);
    this.container.onpointercancel = this.pointerup_handler.bind(this);
    this.container.onpointerout = this.pointerup_handler.bind(this);
    this.container.onpointerleave = this.pointerup_handler.bind(this);

    this.load();
  }

  /* Mobile zoom */
  pointerdown_handler(ev) {
   this.evCache.push(ev);
  }

  pointermove_handler(ev) {
   for (let i = 0; i < this.evCache.length; i++) {
     if (ev.pointerId === this.evCache[i].pointerId) {
        this.evCache[i] = ev;
     break;
     }
   }

   if (this.evCache.length === 2) {
     // Calculate the distance between the two pointers
     let curDiff = Math.abs(this.evCache[0].clientX - this.evCache[1].clientX);

     if (this.prevDiff > MOBILE_CONFIG.PINCH_THRESHOLD) {
       if (curDiff > this.prevDiff) {
         // The distance between the two pointers has increased

         this.zoom_in();
       }
       if (curDiff < this.prevDiff) {
         // The distance between the two pointers has decreased
         this.zoom_out();
       }
     }
     this.prevDiff = curDiff;
   }
  }

  pointerup_handler(ev) {
    this.remove_event(ev);
    if (this.evCache.length < 2) {
      this.prevDiff = MOBILE_CONFIG.PREV_DIFF_INITIAL;
    }
  }
  remove_event(ev) {
   // Remove this event from the target's cache
   for (let i = 0; i < this.evCache.length; i++) {
     if (this.evCache[i].pointerId === ev.pointerId) {
       this.evCache.splice(i, 1);
       break;
     }
   }
  }
  /* End Mobile Zoom */
  load() {
    for (let key in this.nodeforge.nodeforge[this.module].data) {
      this.addNodeImport(this.nodeforge.nodeforge[this.module].data[key], this.precanvas);
    }

    if(this.reroute) {
      for (let key in this.nodeforge.nodeforge[this.module].data) {
        this.addRerouteImport(this.nodeforge.nodeforge[this.module].data[key]);
      }
    }

    for (let key in this.nodeforge.nodeforge[this.module].data) {
      this.updateConnectionNodes(buildNodeId(key));
    }

    const editor = this.nodeforge.nodeforge;
    let number = 1;
    Object.keys(editor).map(function(moduleName, index) {
      Object.keys(editor[moduleName].data).map(function(id, index2) {
        if(parseInt(id) >= number) {
          number = parseInt(id)+1;
        }
      });
    });
    this.nodeId = number;
  }

  removeReouteConnectionSelected(){
    this.dispatch(EVENTS.CONNECTION_UNSELECTED, true);
    if(this.reroute_fix_curvature) {
      this.connection_selected.parentElement.querySelectorAll("." + CSS_CLASSES.MAIN_PATH).forEach((item, i) => {
        item.classList.remove(CSS_CLASSES.SELECTED);
      });
    }
  }

  click(e) {
    this.dispatch(EVENTS.CLICK, e);
    if(this.editor_mode === EDITOR_MODES.FIXED) {
      //return false;
       if(e.target.classList[0] === CSS_CLASSES.PARENT_NODEFORGE || e.target.classList[0] === CSS_CLASSES.NODEFORGE) {
         this.ele_selected = e.target.closest("." + CSS_CLASSES.PARENT_NODEFORGE);
         e.preventDefault();
       } else {
         return false;
       }
    } else if(this.editor_mode === EDITOR_MODES.VIEW) {
      if(e.target.closest("." + CSS_CLASSES.NODEFORGE) !== null || e.target.matches('.parent-nodeforge')) {
        this.ele_selected = e.target.closest("." + CSS_CLASSES.PARENT_NODEFORGE);
        e.preventDefault();
      }
    } else {
      this.first_click = e.target;
      this.ele_selected = e.target;
      if(e.button === MOUSE_BUTTONS.LEFT) {
        this.contextmenuDel();
      }

      if(e.target.closest("." + CSS_CLASSES.NODEFORGE_CONTENT_NODE) !== null) {
        this.ele_selected = e.target.closest("." + CSS_CLASSES.NODEFORGE_CONTENT_NODE).parentElement;
      }
    }
    switch (this.ele_selected.classList[0]) {
      case 'nodeforge-node':
        if(this.node_selected !== null) {
          this.node_selected.classList.remove(CSS_CLASSES.SELECTED);
          if(this.node_selected !== this.ele_selected) {
            this.dispatch(EVENTS.NODE_UNSELECTED, true);
          }
        }
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        if(this.node_selected !== this.ele_selected) {
          this.dispatch(EVENTS.NODE_SELECTED, extractNodeId(this.ele_selected.id));
        }
        this.node_selected = this.ele_selected;
        this.node_selected.classList.add(CSS_CLASSES.SELECTED);
        if(!this.draggable_inputs) {
          if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT' && e.target.hasAttribute('contenteditable') !== true) {
            this.drag = true;
          }
        } else {
          if(e.target.tagName !== 'SELECT') {
            this.drag = true;
          }
        }
        if(this.drag) {
          this.ele_selected.classList.add("dragging");
        }
        break;
      case 'output':
        this.connection = true;
        if(this.node_selected !== null) {
          this.node_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.node_selected = null;
          this.dispatch(EVENTS.NODE_UNSELECTED, true);
        }
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.drawConnection(e.target);
        break;
      case 'parent-nodeforge':
        if(this.node_selected !== null) {
          this.node_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.node_selected = null;
          this.dispatch(EVENTS.NODE_UNSELECTED, true);
        }
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.editor_selected = true;
        break;
      case 'nodeforge':
        if(this.node_selected !== null) {
          this.node_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.node_selected = null;
          this.dispatch(EVENTS.NODE_UNSELECTED, true);
        }
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.editor_selected = true;
        break;
      case 'main-path':
        if(this.node_selected !== null) {
          this.node_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.node_selected = null;
          this.dispatch(EVENTS.NODE_UNSELECTED, true);
        }
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.connection_selected = this.ele_selected;
        this.connection_selected.classList.add(CSS_CLASSES.SELECTED);
        const listclassConnection = this.connection_selected.parentElement.classList;
        if(listclassConnection.length > 1){
          this.dispatch(EVENTS.CONNECTION_SELECTED, { output_id: extractNodeId(listclassConnection[2].replace("node_out_", "")), input_id: extractNodeId(listclassConnection[1].replace("node_in_", "")), output_class: listclassConnection[3], input_class: listclassConnection[4] });
          if(this.reroute_fix_curvature) {
            this.connection_selected.parentElement.querySelectorAll("." + CSS_CLASSES.MAIN_PATH).forEach((item, i) => {
              item.classList.add(CSS_CLASSES.SELECTED);
            });
          }
        }
      break;
      case 'point':
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.drag_point = true;
        this.ele_selected.classList.add(CSS_CLASSES.SELECTED);
      break;
      case 'nodeforge-delete':
        if(this.node_selected ) {
          this.removeNodeId(this.node_selected.id);
        }

        if(this.connection_selected) {
          this.removeConnection();
        }

        if(this.node_selected !== null) {
          this.node_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.node_selected = null;
          this.dispatch(EVENTS.NODE_UNSELECTED, true);
        }
        if(this.connection_selected !== null) {
          this.connection_selected.classList.remove(CSS_CLASSES.SELECTED);
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }

      break;
      default:
    }
    if (e.type === "touchstart") {
      this.pos_x = e.touches[0].clientX;
      this.pos_x_start = e.touches[0].clientX;
      this.pos_y = e.touches[0].clientY;
      this.pos_y_start = e.touches[0].clientY;
      this.mouse_x = e.touches[0].clientX;
      this.mouse_y = e.touches[0].clientY;
    } else {
      this.pos_x = e.clientX;
      this.pos_x_start = e.clientX;
      this.pos_y = e.clientY;
      this.pos_y_start = e.clientY;
    }
    if ([CSS_CLASSES.INPUT, CSS_CLASSES.OUTPUT, CSS_CLASSES.MAIN_PATH].includes(this.ele_selected.classList[0])) {
      e.preventDefault();
    }
    this.dispatch(EVENTS.CLICK_END, e);
  }

  position(e) {
    let e_pos_x;
    let e_pos_y;

    if (e.type === "touchmove") {
      e_pos_x = e.touches[0].clientX;
      e_pos_y = e.touches[0].clientY;
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
    }

    if(this.connection) {
      this.updateConnection(e_pos_x, e_pos_y);
    }
    if(this.editor_selected) {
      let x =  this.canvas_x + (-(this.pos_x - e_pos_x))
      let y = this.canvas_y + (-(this.pos_y - e_pos_y))
      this.dispatch(EVENTS.TRANSLATE, { x: x, y: y});
      this.precanvas.style.transform = "translate("+x+"px, "+y+"px) scale("+this.zoom+")";
    }
    if(this.drag) {
      e.preventDefault();
      let x = (this.pos_x - e_pos_x) * this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom);
      let y = (this.pos_y - e_pos_y) * this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom);
      this.pos_x = e_pos_x;
      this.pos_y = e_pos_y;

      let newLeft = this.ele_selected.offsetLeft - x;
      let newTop = this.ele_selected.offsetTop - y;

      this.ele_selected.style.top = newTop + "px";
      this.ele_selected.style.left = newLeft + "px";

      this.nodeforge.nodeforge[this.module].data[extractNodeId(this.ele_selected.id)].pos_x = newLeft;
      this.nodeforge.nodeforge[this.module].data[extractNodeId(this.ele_selected.id)].pos_y = newTop;

      this.updateConnectionNodes(this.ele_selected.id)
    }

    if(this.drag_point) {

      let x = (this.pos_x - e_pos_x) * this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom);
      let y = (this.pos_y - e_pos_y) * this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom);
      this.pos_x = e_pos_x;
      this.pos_y = e_pos_y;

      let pos_x = this.pos_x * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) - (this.precanvas.getBoundingClientRect().x * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)));
      let pos_y = this.pos_y * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) - (this.precanvas.getBoundingClientRect().y * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)));

      this.ele_selected.setAttributeNS(null, 'cx', pos_x);
      this.ele_selected.setAttributeNS(null, 'cy', pos_y);

      const nodeUpdate = this.ele_selected.parentElement.classList[2].replace("node_out_", "") /* Extract from node_out_ prefix */;
      const nodeUpdateIn = extractNodeId(this.ele_selected.parentElement.classList[1].replace("node_in_", ""));
      const output_class = this.ele_selected.parentElement.classList[3];
      const input_class = this.ele_selected.parentElement.classList[4];

      let numberPointPosition = Array.from(this.ele_selected.parentElement.children).indexOf(this.ele_selected)-1;

      if(this.reroute_fix_curvature) {
        const numberMainPath = this.ele_selected.parentElement.querySelectorAll("." + CSS_CLASSES.MAIN_PATH).length-1;
        numberPointPosition -= numberMainPath;
        if(numberPointPosition < 0) {
          numberPointPosition = 0;
        }
      }

      const nodeId = nodeUpdate.slice(5);
      const searchConnection = this.nodeforge.nodeforge[this.module].data[nodeId].outputs[output_class].connections.findIndex(function(item,i) {
        return item.node ===  nodeUpdateIn && item.output === input_class;
      });

      this.nodeforge.nodeforge[this.module].data[nodeId].outputs[output_class].connections[searchConnection].points[numberPointPosition] = { pos_x: pos_x, pos_y: pos_y };

      const parentSelected = this.ele_selected.parentElement.classList[2].replace("node_out_", "") /* Extract from node_out_ prefix */;

      this.updateConnectionNodes(parentSelected);
    }

    if (e.type === "touchmove") {
      this.mouse_x = e_pos_x;
      this.mouse_y = e_pos_y;
    }
    this.dispatch(EVENTS.MOUSE_MOVE, {x: e_pos_x,y: e_pos_y });
  }

  dragEnd(e) {
    let e_pos_x;
    let e_pos_y;
    let ele_last;

    if (e.type === "touchend") {
      e_pos_x = this.mouse_x;
      e_pos_y = this.mouse_y;
      ele_last = document.elementFromPoint(e_pos_x, e_pos_y);
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
      ele_last = e.target;
    }

    if(this.drag) {
      if(this.pos_x_start !== e_pos_x || this.pos_y_start !== e_pos_y) {
        this.dispatch(EVENTS.NODE_MOVED, extractNodeId(this.ele_selected.id));
      }
    }

    if(this.drag_point) {
      this.ele_selected.classList.remove(CSS_CLASSES.SELECTED);
        if(this.pos_x_start !== e_pos_x || this.pos_y_start !== e_pos_y) {
          this.dispatch(EVENTS.REROUTE_MOVED, extractNodeId(this.ele_selected.parentElement.classList[2].replace("node_out_", "")));
        }
    }

    if(this.editor_selected) {
      this.canvas_x = this.canvas_x + (-(this.pos_x - e_pos_x));
      this.canvas_y = this.canvas_y + (-(this.pos_y - e_pos_y));
      this.editor_selected = false;
    }
    if(this.connection === true) {
      // Use snap target if available (magnetic snap connected visually but mouse wasn't exactly on input)
      if(this.connectionManager._lastSnapTarget) {
        ele_last = this.connectionManager._lastSnapTarget;
        this.connectionManager._lastSnapTarget.classList.remove('snap-hover');
        this.connectionManager._lastSnapTarget = null;
      }
      if(ele_last.classList[0] === CSS_CLASSES.INPUT || (this.force_first_input && (ele_last.closest("." + CSS_CLASSES.NODEFORGE_CONTENT_NODE) !== null || ele_last.classList[0] === CSS_CLASSES.NODEFORGE_NODE))) {

        let input_id;
        let input_class;

        if(this.force_first_input && (ele_last.closest("." + CSS_CLASSES.NODEFORGE_CONTENT_NODE) !== null || ele_last.classList[0] === CSS_CLASSES.NODEFORGE_NODE)) {
          if(ele_last.closest("." + CSS_CLASSES.NODEFORGE_CONTENT_NODE) !== null) {
            input_id = ele_last.closest("." + CSS_CLASSES.NODEFORGE_CONTENT_NODE).parentElement.id;
          } else {
            input_id = ele_last.id;
          }
         if(Object.keys(this.getNodeFromId(input_id.slice(5)).inputs).length === 0) {
           input_class = false;
         } else {
          input_class = "input_1";
         }


       } else {
         // Fix connection;
         input_id = ele_last.parentElement.parentElement.id;
         input_class = ele_last.classList[1];
       }
       let output_id = this.ele_selected.parentElement.parentElement.id;
       let output_class = this.ele_selected.classList[1];

        if(output_id !== input_id && input_class !== false) {

          if(this.container.querySelectorAll('.connection.node_in_'+input_id+'.node_out_'+output_id+'.'+output_class+'.'+input_class).length === 0) {
          // Conection no exist save connection

          this.connection_ele.classList.add("node_in_"+input_id);
          this.connection_ele.classList.add("node_out_"+output_id);
          this.connection_ele.classList.add(output_class);
          this.connection_ele.classList.add(input_class);
          let id_input = extractNodeId(input_id);
          let id_output = extractNodeId(output_id);

          this.nodeforge.nodeforge[this.module].data[id_output].outputs[output_class].connections.push( {"node": id_input, "output": input_class});
          this.nodeforge.nodeforge[this.module].data[id_input].inputs[input_class].connections.push( {"node": id_output, "input": output_class});
          this.updateConnectionNodes(buildNodeId(id_output));
          this.updateConnectionNodes(buildNodeId(id_input));
          this.dispatch(EVENTS.CONNECTION_CREATED, { output_id: id_output, input_id: id_input, output_class:  output_class, input_class: input_class});

        } else {
          this.dispatch(EVENTS.CONNECTION_CANCEL, true);
          this.connection_ele.remove();
        }

          this.connection_ele = null;
      } else {
        // Connection exists Remove Connection;
        this.dispatch(EVENTS.CONNECTION_CANCEL, true);
        this.connection_ele.remove();
        this.connection_ele = null;
      }

      } else {
        // Remove Connection;
        this.dispatch(EVENTS.CONNECTION_CANCEL, true);
        this.connection_ele.remove();
        this.connection_ele = null;
      }
    }

    if(this.drag && this.ele_selected) {
      this.ele_selected.classList.remove("dragging");
    }
    this.drag = false;
    this.drag_point = false;
    this.connection = false;
    this.ele_selected = null;
    this.editor_selected = false;

    this.dispatch(EVENTS.MOUSE_UP, e);
  }
  contextmenu(e) {
    this.dispatch(EVENTS.CONTEXT_MENU, e);
    e.preventDefault();
    if(this.editor_mode === EDITOR_MODES.FIXED || this.editor_mode === EDITOR_MODES.VIEW) {
      return false;
    }
    if(this.precanvas.getElementsByClassName(CSS_CLASSES.NODEFORGE_DELETE).length) {
      this.precanvas.getElementsByClassName(CSS_CLASSES.NODEFORGE_DELETE)[0].remove()
    };
    if(this.node_selected || this.connection_selected) {
      let deletebox = document.createElement('div');
      deletebox.classList.add(CSS_CLASSES.NODEFORGE_DELETE);
      deletebox.innerHTML = "x";
      if(this.node_selected) {
        this.node_selected.appendChild(deletebox);

      }
      if(this.connection_selected && (this.connection_selected.parentElement.classList.length > 1)) {
        deletebox.style.top = e.clientY * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) - (this.precanvas.getBoundingClientRect().y *  ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) ) + "px";
        deletebox.style.left = e.clientX * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) - (this.precanvas.getBoundingClientRect().x *  ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) ) + "px";

        this.precanvas.appendChild(deletebox);

      }

    }

  }
  contextmenuDel() {
    if(this.precanvas.getElementsByClassName(CSS_CLASSES.NODEFORGE_DELETE).length) {
      this.precanvas.getElementsByClassName(CSS_CLASSES.NODEFORGE_DELETE)[0].remove()
    };
  }

  key(e) {
    this.dispatch(EVENTS.KEY_DOWN, e);
    if(this.editor_mode === EDITOR_MODES.FIXED || this.editor_mode === EDITOR_MODES.VIEW) {
      return false;
    }
    if (e.key === KEY_CODES.DELETE || (e.key === KEY_CODES.BACKSPACE && e.metaKey)) {
      if(this.node_selected !== null) {
        if(this.first_click.tagName !== 'INPUT' && this.first_click.tagName !== 'TEXTAREA' && this.first_click.hasAttribute('contenteditable') !== true) {
          this.removeNodeId(this.node_selected.id);
          this.node_selected = null;
          this.dispatch(EVENTS.NODE_UNSELECTED, true);
        }
      }
      if(this.connection_selected !== null) {
        this.removeConnection();
        this.connection_selected = null;
      }
    }
  }

  zoom_enter(event, delta) {
    return this.zoomManager.zoom_enter(event, delta);
  }
  zoom_refresh(){
    return this.zoomManager.zoom_refresh();
  }
  zoom_in() {
    return this.zoomManager.zoom_in();
  }
  zoom_out() {
    return this.zoomManager.zoom_out();
  }
  zoom_reset(){
    return this.zoomManager.zoom_reset();
  }

  createCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type) {
    return this.renderManager.createCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type);
  }

  drawConnection(ele) {
    return this.connectionManager.drawConnection(ele);
  }

  updateConnection(eX, eY) {
    return this.connectionManager.updateConnection(eX, eY);
  }

  /**
   * Creates a connection between two nodes
   * @param {string|number} id_output - The ID of the output node
   * @param {string|number} id_input - The ID of the input node
   * @param {string} output_class - The output connector class (e.g., 'output_1')
   * @param {string} input_class - The input connector class (e.g., 'input_1')
   * @returns {boolean} True if connection was created, false if connection already exists or nodes are in different modules
   */
  addConnection(id_output, id_input, output_class, input_class) {
    return this.connectionManager.addConnection(id_output, id_input, output_class, input_class);
  }

  /**
   * Calculate current zoom factors for coordinate transformations
   * @private
   * @returns {{widthZoom: number, heightZoom: number}}
   */
  getZoomFactors() {
    return this.zoomManager.getZoomFactors();
  }

  /**
   * Get element center coordinates relative to canvas
   * @private
   * @param {HTMLElement} element - The element to calculate position for
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @returns {{x: number, y: number}}
   */
  getElementCenterCoords(element, zoomFactors) {
    return this.renderManager.getElementCenterCoords(element, zoomFactors);
  }

  /**
   * Get reroute point coordinates relative to canvas
   * @private
   * @param {HTMLElement} point - The reroute point element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} rerouteWidth - Half width of reroute point
   * @returns {{x: number, y: number}}
   */
  getReroutePointCoords(point, zoomFactors, rerouteWidth) {
    return this.renderManager.getReroutePointCoords(point, zoomFactors, rerouteWidth);
  }

  /**
   * Update a simple connection (no reroute points) between output and input
   * @private
   * @param {HTMLElement} connectionElem - The connection SVG element
   * @param {HTMLElement} outputElem - The output element
   * @param {HTMLElement} inputElem - The input element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} curvature - Curvature value for the connection
   */
  updateSimpleOutputConnection(connectionElem, outputElem, inputElem, zoomFactors, curvature) {
    return this.renderManager.updateSimpleOutputConnection(connectionElem, outputElem, inputElem, zoomFactors, curvature);
  }

  /**
   * Update a simple connection (no reroute points) between output and input
   * @private
   * @param {HTMLElement} connectionElem - The connection SVG element
   * @param {HTMLElement} outputElem - The output element
   * @param {HTMLElement} inputElem - The input element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} curvature - Curvature value for the connection
   */
  updateSimpleInputConnection(connectionElem, outputElem, inputElem, zoomFactors, curvature) {
    return this.renderManager.updateSimpleInputConnection(connectionElem, outputElem, inputElem, zoomFactors, curvature);
  }

  /**
   * Update an output connection with reroute points
   * @private
   * @param {HTMLElement} connectionElem - The connection SVG element
   * @param {NodeList} points - The reroute points
   * @param {string} nodeId - The node ID
   * @param {HTMLElement} container - The container element
   * @param {{widthZoom: number, heightZoom: number}} zoomFactors - Current zoom factors
   * @param {number} reroute_curvature - Curvature for middle segments
   * @param {number} reroute_curvature_start_end - Curvature for start/end segments
   * @param {number} rerouteWidth - Half width of reroute point
   */
  updateReroutedOutputConnection(connectionElem, points, nodeId, container, zoomFactors, reroute_curvature, reroute_curvature_start_end, rerouteWidth) {
    return this.renderManager.updateReroutedOutputConnection(connectionElem, points, nodeId, container, zoomFactors, reroute_curvature, reroute_curvature_start_end, rerouteWidth);
  }

  updateReroutedInputConnection(connectionElem, points, nodeId, container, zoomFactors, reroute_curvature, reroute_curvature_start_end, rerouteWidth) {
    return this.renderManager.updateReroutedInputConnection(connectionElem, points, nodeId, container, zoomFactors, reroute_curvature, reroute_curvature_start_end, rerouteWidth);
  }

  updateConnectionNodes(id) {
    return this.connectionManager.updateConnectionNodes(id);
  }

  dblclick(e) {
    if(e.target.classList[0] === CSS_CLASSES.POINT) {
        this.removeReroutePoint(e.target);
        return;
    }

    if(this.connection_selected !== null && this.reroute) {
        this.createReroutePoint(this.connection_selected);
    }
  }

  createReroutePoint(ele) {
    return this.rerouteManager.createReroutePoint(ele);
  }

  removeReroutePoint(ele) {
    return this.rerouteManager.removeReroutePoint(ele);
  }

  registerNode(name, html, props = null, options = null) {
    return this.nodeManager.registerNode(name, html, props, options);
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
    return this.nodeManager.populateNodeDataAttributes(content, dataSource, object, name, completname);
  }

  getNodeFromId(id) {
    return this.stateManager.getNodeFromId(id);
  }
  getNodesFromName(name) {
    return this.stateManager.getNodesFromName(name);
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
  addNode (name, num_in, num_out, ele_pos_x, ele_pos_y, classoverride, data, html, typenode = false) {
    return this.nodeManager.addNode(name, num_in, num_out, ele_pos_x, ele_pos_y, classoverride, data, html, typenode);
  }

  addNodeImport (dataNode, precanvas) {
    return this.nodeManager.addNodeImport(dataNode, precanvas);
  }

  addRerouteImport(dataNode) {
    return this.rerouteManager.addRerouteImport(dataNode);
  }

  updateNodeValue(event) {
    return this.nodeManager.updateNodeValue(event);
  }

  updateNodeDataFromId(id, data) {
    return this.nodeManager.updateNodeDataFromId(id, data);
  }

  addNodeInput(id) {
    return this.nodeManager.addNodeInput(id);
  }

  addNodeOutput(id) {
    return this.nodeManager.addNodeOutput(id);
  }

  removeNodeInput(id, input_class) {
    return this.nodeManager.removeNodeInput(id, input_class);
  }

  removeNodeOutput(id, output_class) {
    return this.nodeManager.removeNodeOutput(id, output_class);
  }

  /**
   * Removes a node from the editor by its ID
   * @param {string} id - The full node ID (e.g., 'node-1')
   */
  removeNodeId(id) {
    return this.nodeManager.removeNodeId(id);
  }

  /**
   * Removes the currently selected connection
   * Removes the connection from both nodes' connection lists and the DOM
   */
  removeConnection() {
    return this.connectionManager.removeConnection();
  }

  removeSingleConnection(id_output, id_input, output_class, input_class) {
    return this.connectionManager.removeSingleConnection(id_output, id_input, output_class, input_class);
  }

  removeConnectionNodeId(id) {
    return this.connectionManager.removeConnectionNodeId(id);
  }

  getModuleFromNodeId(id) {
    return this.stateManager.getModuleFromNodeId(id);
  }

  addModule(name) {
    return this.moduleManager.addModule(name);
  }
  changeModule(name) {
    return this.moduleManager.changeModule(name);
  }

  removeModule(name) {
    return this.moduleManager.removeModule(name);
  }

  clearModuleSelected() {
    return this.moduleManager.clearModuleSelected();
  }

  clear () {
    return this.moduleManager.clear();
  }
  /**
   * Exports the entire nodeforge data structure
   * @returns {Object} A deep copy of the nodeforge data including all modules, nodes, and connections
   */
  export () {
    const dataExport = JSON.parse(JSON.stringify(this.nodeforge));
    this.dispatch(EVENTS.EXPORT, dataExport);
    return dataExport;
  }

  /**
   * Imports nodeforge data and replaces the current editor state
   * @param {Object} data - The nodeforge data structure to import
   * @param {boolean} [notifi=true] - Whether to dispatch an import event
   */
  import (data, notifi = true) {
    this.clear();
    this.nodeforge = JSON.parse(JSON.stringify(data));
    this.load();
    if(notifi) {
      this.dispatch(EVENTS.IMPORT, 'import');
    }
  }

  /* Events */
  /**
   * Registers an event listener for a specific event
   * @param {string} event - The name of the event to listen for
   * @param {Function} callback - The callback function to execute when the event is triggered
   * @returns {boolean} False if validation fails, undefined otherwise
   */
  on (event, callback) {
    return this.eventManager.on(event, callback);
  }

  removeListener (event, callback) {
    return this.eventManager.removeListener(event, callback);
  }

  dispatch (event, details) {
    return this.eventManager.dispatch(event, details);
  }

   // Note: getUuid() method has been removed and replaced with generateUUID() from utils/string.js
   // This provides better code reusability and maintainability
}
