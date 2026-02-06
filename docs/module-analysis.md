# NodeForge Developer Documentation

## 1. Overview

NodeForge is a vanilla JavaScript node editor library for building interactive node-based flowcharts.

- **Version**: 1.0.0
- **Author**: JackyLim
- **License**: MIT
- **Dependencies**: core-js (polyfills only)
- **Build**: Rollup + Babel (ES5 UMD output)
- **Framework Support**: Vanilla JS, Vue 2, Vue 3

---

## 2. Quick Start

### Installation

```html
<link rel="stylesheet" href="dist/nodeforge.min.css">
<script src="dist/nodeforge.min.js"></script>
```

### Basic Usage

```javascript
const container = document.getElementById('editor');
const editor = new NodeForge(container);
editor.start();

// Add a node
const nodeId = editor.addNode(
  'myNode',     // name
  1,            // inputs count
  1,            // outputs count
  100,          // pos_x
  200,          // pos_y
  'my-class',   // CSS class
  { key: 'val' }, // custom data
  '<div>Node Content</div>' // HTML
);

// Connect nodes
editor.addConnection(1, 2, 'output_1', 'input_1');
```

### Build Commands

```bash
npm run build    # Production build -> dist/
npm run dev      # Watch mode with auto-rebuild
```

### Local Testing

```bash
python3 -m http.server 8888
# Open http://localhost:8888/examples/node-editor.html
```

---

## 3. Architecture

Manager Pattern + Context Pattern to prevent circular dependencies.

```
NodeForge (Facade - nodeforge.js)
  |
  +-- NodeForgeContext (Central State Access)
  |     |
  |     +-- EventManager       - Custom event pub/sub
  |     +-- StateManager       - Read-only data queries
  |     +-- ZoomManager        - Zoom controls
  |     +-- ModuleManager      - Module CRUD
  |     +-- RenderManager      - SVG path rendering
  |     +-- NodeManager        - Node CRUD
  |     +-- ConnectionManager  - Connection CRUD
  |     +-- RerouteManager     - Reroute point management
  |     +-- InteractionHandler - (placeholder for future use)
```

### Design Principles

1. **NodeForge (Facade)**: All public API methods. Handles mouse/touch/keyboard events directly. Delegates operations to managers.
2. **NodeForgeContext**: Central interface. All managers access shared state through context, never directly referencing each other.
3. **Managers**: Stateless logic units. Receive context in constructor. Access other managers via `this.context.getXxxManager()`.

---

## 4. Directory Structure

```
src/
  nodeforge.js              # Main facade: constructor, event handlers, public API
  nodeforge.css             # CSS variables, themes, all visual styles
  constants.js              # Configuration constants, event names, CSS classes
  core/
    NodeForgeContext.js      # Central state access (prevents circular deps)
    EventManager.js          # Custom event system (on/dispatch/removeListener)
    StateManager.js          # Read-only data queries (getNodeFromId, etc.)
  managers/
    RenderManager.js         # SVG cubic bezier paths, coordinate calculations
    NodeManager.js           # Node CRUD, template registration, data binding
    ConnectionManager.js     # Connection CRUD, path updates, magnetic snap
    RerouteManager.js        # Reroute point create/remove/import
    ZoomManager.js           # Zoom in/out/reset, zoom factors
    ModuleManager.js         # Module add/change/remove/clear
  handlers/
    InteractionHandler.js    # Placeholder for future interaction refactoring
  utils/
    dom.js                   # createSVGElement()
    string.js                # extractNodeId(), buildNodeId(), generateUUID()
    geometry.js              # Coordinate calculation utilities
dist/
  nodeforge.min.js           # UMD bundle (ES5)
  nodeforge.min.css          # Minified CSS
  nodeforge.bundle.js        # CSS-in-JS bundle
examples/
  node-editor.html           # Interactive demo with drag-and-drop
```

---

## 5. Public API

### Constructor

```javascript
const editor = new NodeForge(container, render?, parent?)
```

| Param | Type | Description |
|-------|------|-------------|
| `container` | HTMLElement | DOM element for the editor |
| `render` | Function\|null | Vue render function (for Vue components) |
| `parent` | Object\|null | Vue parent context (for nested editors) |

### Configuration Properties

```javascript
editor.reroute = true;                  // Enable reroute points (default: false)
editor.reroute_fix_curvature = false;   // Separate SVG paths per segment (default: false)
editor.curvature = 0.5;                 // Connection curve amount (default: 0.5)
editor.force_first_input = false;       // Auto-connect to first input (default: false)
editor.draggable_inputs = true;         // Allow drag on input fields (default: true)
editor.editor_mode = 'edit';            // 'edit' | 'fixed' | 'view'
editor.zoom_min = 0.5;                  // Minimum zoom (default: 0.5)
editor.zoom_max = 1.6;                  // Maximum zoom (default: 1.6)
editor.useuuid = false;                 // Use UUID for node IDs (default: false)
```

### Lifecycle

| Method | Description |
|--------|-------------|
| `start()` | Initialize editor, create canvas, attach event listeners |
| `import(data, notify?)` | Import full data structure, replace current state |
| `export()` | Export full data structure (deep copy) |
| `clear()` | Reset to empty state with default module |

### Node Operations

| Method | Returns | Description |
|--------|---------|-------------|
| `addNode(name, num_in, num_out, pos_x, pos_y, class, data, html, typenode?)` | `number\|string` | Create a new node |
| `removeNodeId(id)` | void | Remove node by DOM ID (`"node-1"`) |
| `getNodeFromId(id)` | Object | Get deep copy of node data |
| `getNodesFromName(name)` | Array | Get all node IDs with given name |
| `updateNodeDataFromId(id, data)` | void | Update node's custom data |
| `addNodeInput(id)` | void | Add input handle to existing node |
| `addNodeOutput(id)` | void | Add output handle to existing node |
| `removeNodeInput(id, input_class)` | void | Remove input handle |
| `removeNodeOutput(id, output_class)` | void | Remove output handle |

### Connection Operations

| Method | Returns | Description |
|--------|---------|-------------|
| `addConnection(id_output, id_input, output_class, input_class)` | boolean | Create connection between nodes |
| `removeConnection()` | void | Remove currently selected connection |
| `removeSingleConnection(id_output, id_input, output_class, input_class)` | void | Remove specific connection |
| `removeConnectionNodeId(id)` | void | Remove all connections for a node |

### Module Operations

| Method | Description |
|--------|-------------|
| `addModule(name)` | Create a new module |
| `changeModule(name)` | Switch to a different module |
| `removeModule(name)` | Delete a module |
| `clearModuleSelected()` | Clear current module's data |

### Zoom Operations

| Method | Description |
|--------|-------------|
| `zoom_in()` | Increase zoom by step (0.1) |
| `zoom_out()` | Decrease zoom by step (0.1) |
| `zoom_reset()` | Reset zoom to 1.0 |

### Events

```javascript
editor.on('eventName', callback);
editor.removeListener('eventName', callback);
```

| Event | Callback Param | When |
|-------|----------------|------|
| `nodeCreated` | `nodeId` | Node added |
| `nodeRemoved` | `nodeId` | Node deleted |
| `nodeMoved` | `nodeId` | Node drag ended |
| `nodeSelected` | `nodeId` | Node clicked |
| `nodeUnselected` | `true` | Node deselected |
| `nodeDataChanged` | `nodeId` | df-* input value changed |
| `connectionCreated` | `{output_id, input_id, output_class, input_class}` | Connection made |
| `connectionRemoved` | `{output_id, input_id, output_class, input_class}` | Connection deleted |
| `connectionSelected` | `{output_id, input_id, output_class, input_class}` | Connection clicked |
| `connectionUnselected` | `true` | Connection deselected |
| `connectionStart` | `{output_id, output_class}` | Start dragging connection |
| `connectionCancel` | `true` | Connection drag cancelled |
| `addReroute` | `nodeId` | Reroute point added |
| `removeReroute` | `nodeId` | Reroute point removed |
| `rerouteMoved` | `nodeId` | Reroute point dragged |
| `moduleCreated` | `moduleName` | Module added |
| `moduleChanged` | `moduleName` | Module switched |
| `moduleRemoved` | `moduleName` | Module deleted |
| `zoom` | `zoomLevel` | Zoom changed |
| `translate` | `{x, y}` | Canvas panned |
| `import` | `'import'` | Data imported |
| `export` | `data` | Data exported |
| `click` | `event` | Mouse/touch down |
| `clickEnd` | `event` | Click handler finished |
| `mouseMove` | `{x, y}` | Mouse moved |
| `mouseUp` | `event` | Mouse/touch up |
| `keydown` | `event` | Key pressed |
| `contextmenu` | `event` | Right click |

---

## 6. Data Structure

### Full Export Format

```javascript
{
  "nodeforge": {             // Root key (fixed)
    "Home": {                // Module name
      "data": {
        "1": {               // Node ID (string key)
          "id": 1,           // Node ID (number)
          "name": "start",
          "data": { "name": "Start" },
          "class": "start",
          "html": "<div>...</div>",
          "typenode": false,
          "inputs": {
            "input_1": {
              "connections": [
                { "node": "2", "input": "output_1" }
              ]
            }
          },
          "outputs": {
            "output_1": {
              "connections": [
                { "node": "3", "output": "input_1", "points": [...] }
              ]
            }
          },
          "pos_x": 100,
          "pos_y": 150
        }
      }
    }
  }
}
```

### Internal Access Path

```javascript
// From NodeForge instance:
this.nodeforge                           // { "nodeforge": { "Home": { "data": {...} } } }
this.nodeforge.nodeforge                 // { "Home": { "data": {...} } }
this.nodeforge.nodeforge[module].data    // { "1": {...}, "2": {...} }

// From Context (used by all managers):
context.getNodeForgeData()               // returns this.nodeforge.nodeforge.nodeforge
                                         // = { "Home": { "data": {...} } }
```

> **Important**: `getNodeForgeData()` returns 3 levels deep: `this.nodeforge.nodeforge.nodeforge`

### Connection Data

Connections are stored in BOTH nodes:

```javascript
// Output node stores:
outputs.output_1.connections = [
  { "node": "3", "output": "input_1" }     // target node ID, target input class
]

// Input node stores:
inputs.input_1.connections = [
  { "node": "1", "input": "output_1" }     // source node ID, source output class
]
```

### Reroute Points

When reroute is enabled, connections can have `points`:

```javascript
outputs.output_1.connections = [
  {
    "node": "3",
    "output": "input_1",
    "points": [
      { "pos_x": 350, "pos_y": 200 },
      { "pos_x": 500, "pos_y": 180 }
    ]
  }
]
```

---

## 7. DOM Structure

```html
<div class="parent-nodeforge">                <!-- container -->
  <div class="nodeforge">                     <!-- precanvas (CSS transform: translate + scale) -->

    <!-- Nodes -->
    <div class="parent-node">                 <!-- wrapper -->
      <div id="node-1" class="nodeforge-node start" style="top:150px; left:100px">
        <div class="inputs">
          <div class="input input_1"></div>
        </div>
        <div class="nodeforge_content_node">
          <!-- User HTML content -->
        </div>
        <div class="outputs">
          <div class="output output_1"></div>
        </div>
      </div>
    </div>

    <!-- Connections (SVG) -->
    <svg class="connection node_in_node-2 node_out_node-1 output_1 input_1">
      <path class="main-path" d="M ... C ..."></path>
      <!-- If reroute enabled: -->
      <circle class="point" cx="350" cy="200" r="6"></circle>
    </svg>

  </div>
</div>
```

### Connection classList Index Map

| Index | Class | Description |
|-------|-------|-------------|
| 0 | `connection` | Base class |
| 1 | `node_in_node-X` | Target (input) node |
| 2 | `node_out_node-Y` | Source (output) node |
| 3 | `output_1` | Output class on source |
| 4 | `input_1` | Input class on target |

---

## 8. CSS Theming

### CSS Variables (Light Mode)

```css
.parent-nodeforge {
  --nf-background-color: transparent;
  --nf-node-bg: #ffffff;
  --nf-node-bg-hover: #f8f9fa;
  --nf-node-bg-selected: #e3f2fd;
  --nf-node-border: #cbd5e1;
  --nf-node-border-selected: #3b82f6;
  --nf-node-border-radius: 8px;
  --nf-node-color: #1e293b;
  --nf-node-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --nf-node-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
  --nf-node-shadow-selected: 0 0 0 2px var(--nf-node-border-selected);
  --nf-handle-bg: #3b82f6;
  --nf-handle-bg-hover: #2563eb;
  --nf-handle-border: #ffffff;
  --nf-handle-size: 12px;
  --nf-edge-stroke: #94a3b8;
  --nf-edge-stroke-hover: #3b82f6;
  --nf-edge-stroke-selected: #10b981;
  --nf-edge-width: 2px;
  --nf-edge-width-hover: 3px;
  --nf-point-fill: #ffffff;
  --nf-point-fill-hover: #3b82f6;
  --nf-point-stroke: #64748b;
  --nf-delete-bg: #ef4444;
  --nf-delete-bg-hover: #dc2626;
  --nf-delete-color: #ffffff;
  --nf-selection-bg: rgba(59, 130, 246, 0.08);
  --nf-selection-border: rgba(59, 130, 246, 0.5);
}
```

### Dark Mode

Add the `dark` class to the `.parent-nodeforge` container to activate dark mode:

```javascript
// Toggle via JavaScript
const parentNodeforge = canvasElement.closest('.parent-nodeforge');
parentNodeforge.classList.add('dark');    // Enable dark mode
parentNodeforge.classList.remove('dark'); // Back to light mode
parentNodeforge.classList.toggle('dark'); // Toggle
```

```css
.parent-nodeforge.dark {
  /* Background */
  --nf-background-color: #0f172a;

  /* Nodes */
  --nf-node-bg: #1e293b;
  --nf-node-bg-hover: #334155;
  --nf-node-bg-selected: #1e3a5f;
  --nf-node-border: #475569;
  --nf-node-border-selected: #60a5fa;
  --nf-node-color: #f1f5f9;
  --nf-node-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --nf-node-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.5);

  /* Handles */
  --nf-handle-bg: #60a5fa;
  --nf-handle-bg-hover: #3b82f6;
  --nf-handle-border: #1e293b;

  /* Connections */
  --nf-edge-stroke: #475569;
  --nf-edge-stroke-hover: #60a5fa;
  --nf-edge-stroke-selected: #34d399;

  /* Reroute Points */
  --nf-point-fill: #334155;
  --nf-point-fill-hover: #60a5fa;
  --nf-point-stroke: #64748b;

  /* Delete Button */
  --nf-delete-bg: #dc2626;
  --nf-delete-bg-hover: #b91c1c;

  /* Selection */
  --nf-selection-bg: rgba(96, 165, 250, 0.12);
  --nf-selection-border: rgba(96, 165, 250, 0.4);
}
```

### Custom Theme

Override CSS variables on `.parent-nodeforge` to create a custom theme:

```css
.parent-nodeforge.my-theme {
  --nf-background-color: #1a1a2e;
  --nf-node-bg: #16213e;
  --nf-node-border: #0f3460;
  --nf-edge-stroke: #533483;
  --nf-handle-bg: #e94560;
  /* ... override any variable ... */
}
```

### Theming Host Application UI

NodeForge CSS variables only apply to the editor canvas. If your application has surrounding UI (sidebar, toolbar, modals, etc.), you need to style those separately. The example `node-editor.html` demonstrates this with `body.dark` selectors:

```css
/* Dark mode for surrounding UI */
body.dark .toolbar {
  background: #1e293b;
  border-bottom-color: #334155;
}

body.dark .sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
}

body.dark .node-body {
  background: #1e293b;
  color: #f1f5f9;
}

body.dark .node-body input,
body.dark .node-body select,
body.dark .node-body textarea {
  background: #0f172a;
  border-color: #475569;
  color: #f1f5f9;
}

body.dark .modal-content {
  background: #1e293b;
}
```

Theme toggle example:

```javascript
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  const parentNodeforge = canvasElement.closest('.parent-nodeforge');
  if (parentNodeforge) {
    parentNodeforge.classList.toggle('dark', isDark);
  }
}
```

### Node States

| Class | State |
|-------|-------|
| `.selected` | Node/connection selected |
| `.dragging` | Node being dragged (transition: none) |
| `.inactive` | Non-interactive (opacity: 0.5) |
| `.loading` | Loading spinner |
| `.error` | Error border |
| `.snap-hover` | Magnetic snap target |

### Data Binding (df-* attributes)

Node HTML can include `df-*` attributes for two-way data binding:

```html
<input type="text" df-name>           <!-- Binds to data.name -->
<select df-datatype>                   <!-- Binds to data.datatype -->
<textarea df-description>              <!-- Binds to data.description -->
<div df-nested-key contenteditable>    <!-- Binds to data.nested.key -->
```

---

## 9. Event Flow Details

### Node Drag

```
mousedown on .nodeforge-node
  -> click(): drag = true, add 'dragging' class
mousemove
  -> position(): calc delta with zoom, update style.top/left + data.pos_x/pos_y
  -> updateConnectionNodes(): redraw all connections for this node
mouseup
  -> dragEnd(): remove 'dragging' class, dispatch 'nodeMoved'
```

### Connection Creation

```
mousedown on .output
  -> click(): connection = true
  -> drawConnection(): create temp SVG path
mousemove
  -> position() -> updateConnection():
     - calc path from output to mouse cursor
     - magnetic snap: find nearest .input within 30px
     - if close enough: snap endpoint + add 'snap-hover' class
mouseup on .input
  -> dragEnd(): validate, add to data (both nodes), update paths
mouseup elsewhere
  -> dragEnd(): cancel, remove temp SVG
```

### Canvas Pan

```
mousedown on .nodeforge or .parent-nodeforge
  -> click(): editor_selected = true
mousemove
  -> position(): update precanvas CSS transform (translate)
mouseup
  -> dragEnd(): save canvas_x, canvas_y
```

### Delete (Keyboard)

```
keydown Delete or Cmd+Backspace
  -> key():
     - if node_selected: removeNodeId() -> removeConnectionNodeId() + remove DOM
     - if connection_selected: removeConnection() -> remove data + remove DOM
     - null out node_selected / connection_selected
```

### Reroute Point

```
double-click on selected .main-path
  -> dblclick() -> createReroutePoint():
     - add <circle class="point"> to connection SVG
     - add point data to connection.points[]
     - redraw connection path through all points

drag .point
  -> position() drag_point:
     - update circle cx/cy
     - update data points[]
     - redraw connection path

double-click on .point
  -> dblclick() -> removeReroutePoint():
     - remove circle from SVG
     - splice from data points[]
     - redraw connection path
```

---

## 10. Module System

Modules allow multiple separate canvases within one editor instance.

```javascript
editor.addModule('Settings');
editor.changeModule('Settings');   // Clears canvas, loads Settings module
editor.changeModule('Home');       // Switch back to Home
editor.removeModule('Settings');
```

Each module has independent `data` (nodes + connections). The default module is `"Home"`.

---

## 11. Vue Integration

### Vue 2

```javascript
import Vue from 'vue';
import NodeForge from 'nodeforge';
import MyComponent from './MyComponent.vue';

const editor = new NodeForge(container, Vue);
editor.registerNode('myComp', MyComponent, { prop1: 'value' });
editor.start();

editor.addNode('myComp', 1, 1, 100, 200, '', {}, 'myComp', 'vue');
```

### Vue 3

```javascript
import { h, render, getCurrentInstance } from 'vue';
import NodeForge from 'nodeforge';

const vueRender = { version: 3, h, render };
const editor = new NodeForge(container, vueRender, getCurrentInstance().appContext.app._context);
```

---

## 12. Key Implementation Notes

### ID Format Conventions

| Context | Format | Example |
|---------|--------|---------|
| DOM element ID | `"node-X"` | `"node-1"` |
| Data object key | `"X"` (string) | `"1"` |
| Connection data `node` field | `"X"` (string) | `"1"` |
| `addNode()` return value | `X` (number) | `1` |
| `removeNodeId()` parameter | `"node-X"` | `"node-1"` |

Use `extractNodeId("node-1")` -> `"1"` and `buildNodeId("1")` -> `"node-1"` for conversion.

### Coordinate System

All positions are relative to the precanvas element, adjusted for zoom:

```javascript
// Screen coords -> Canvas coords:
canvasX = screenX * (1 / zoom) - precanvas.getBoundingClientRect().x * (1 / zoom);
canvasY = screenY * (1 / zoom) - precanvas.getBoundingClientRect().y * (1 / zoom);
```

### Performance Notes

- CSS `transition: all` on interactive elements causes drag lag. Only transition visual properties (fill, stroke, etc.), never positional properties (top, left, cx, cy).
- The `.dragging` class sets `transition: none` on nodes during drag.
- `getBoundingClientRect()` forces layout reflow - minimize calls in hot paths.

---

## 13. Bug Fix History

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | `getNodeForgeData()` wrong depth | Returned 1 level too shallow | Access `this.nodeforge.nodeforge.nodeforge` (3 levels) |
| 2 | `updateConnectionNodes` classList mismatch | Swapped indices [3]<->[4] and [1]<->[2] | Corrected to match classList order |
| 3 | CSS `transition: all` on nodes | Animated top/left changes (200ms lag) | Added `.dragging` class with `transition: none` |
| 4 | CSS `transition: all` on `.main-path` | Animated SVG path changes | Narrowed to `stroke, stroke-width` only |
| 5 | `position()` double data adjust | `offsetLeft` read after style set | Cached computed values before setting style |
| 6 | `drawConnection` wrong parent level | `parentElement` pointed to `.outputs` div | Changed to `parentElement.parentElement` |
| 7 | `dragEnd` reroute syntax error | `extractNodeId` called as method | Fixed to standalone function call |
| 8 | `getModuleFromNodeId` type mismatch | `===` compared string keys with number IDs | Changed to `==` (loose equality) |
| 9 | `removeNodeId` wrong ID format | Received `"node-X"`, used directly for data ops | Added `extractNodeId()` at entry point |
| 10 | `removeConnection` wrong element | Accessed classList on `.main-path` | Used `.parentElement` to get `.connection` SVG |
| 11 | `key()` missing state cleanup | `node_selected`/`connection_selected` not nulled | Added null + dispatch after delete |
| 12 | Reroute `findIndex` format mismatch | `nodeUpdateIn` was `"node-X"`, data stores `"X"` | Applied `extractNodeId()` in RerouteManager + position() |
| 13 | `updateReroutedConnection` element lookup | Queried `.node-1` (class) instead of `#node-1` (ID) | Pass actual elements from `updateConnectionNodes` |
| 14 | CSS `transition: all` on `.point` | Animated cx/cy (reroute drag lag) | Narrowed to `fill, stroke, stroke-width` only |
| 15 | `dblclick` reroute order | `createReroutePoint` ran before point check | Reordered: check point removal first with early return |
| 16 | `click` 'point' case missing cleanup | `connection_selected` not cleared | Added connection_selected cleanup in point case |

### Feature: Magnetic Snap

- 30px detection radius around input handles during connection drag
- Auto-snaps connection endpoint to nearest input center
- Green highlight via `.snap-hover` CSS class
- Cleanup on drag end and connection start
