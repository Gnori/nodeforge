# NodeForge

A lightweight, dependency-free JavaScript library for building interactive node-based flow editors. Create visual workflows with drag-and-drop nodes, dynamic connections, reroute points, and a fully customizable theme system.

## Features

- **Drag & Drop Nodes** - Create and position nodes on an infinite canvas
- **Dynamic Connections** - Connect outputs to inputs with smooth bezier curves
- **Reroute Points** - Double-click connections to add bend points for cleaner layouts
- **Magnetic Snap** - Connections auto-snap to the nearest input within range
- **Zoom & Pan** - Mouse wheel zoom and canvas dragging
- **Module System** - Organize workflows into multiple independent modules
- **Data Binding** - Bind input fields to node data with `df-*` attributes
- **Import / Export** - Save and restore entire workflows as JSON
- **Dark Mode** - Built-in light and dark themes via CSS variables
- **Mobile Support** - Touch events and pinch-to-zoom
- **Vue Integration** - Use Vue 2/3 components as node content
- **Zero Dependencies** - No runtime dependencies (core-js optional for legacy browsers)

## Installation

### CDN / Direct Download

```html
<link rel="stylesheet" href="nodeforge.min.css">
<script src="nodeforge.min.js"></script>
```

### npm

```bash
npm install nodeforge
```

```javascript
import NodeForge from 'nodeforge';
```

## Quick Start

```html
<div id="canvas" style="width: 100%; height: 600px;"></div>

<link rel="stylesheet" href="nodeforge.min.css">
<script src="nodeforge.min.js"></script>

<script>
  // 1. Create editor
  const editor = new NodeForge(document.getElementById('canvas'));

  // 2. Configure (optional)
  editor.reroute = true;
  editor.reroute_fix_curvature = true;

  // 3. Start
  editor.start();

  // 4. Add nodes
  editor.addNode(
    'greeting',       // name
    1,                // number of inputs
    1,                // number of outputs
    100,              // x position
    200,              // y position
    'greeting',       // CSS class
    { message: 'Hello' },  // data
    `<div>
       <strong>Greeting</strong>
       <input type="text" df-message>
     </div>`
  );

  // 5. Connect nodes
  editor.addConnection(1, 2, 'output_1', 'input_1');
</script>
```

## API Reference

### Initialization

```javascript
const editor = new NodeForge(container);
editor.start();
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | The DOM element to mount the editor |

### Configuration

Set these properties **before** calling `start()`:

```javascript
editor.reroute = true;                  // Enable reroute points (default: false)
editor.reroute_fix_curvature = true;    // Separate SVG paths per segment (default: false)
editor.curvature = 0.5;                 // Connection curve amount (default: 0.5)
editor.force_first_input = false;       // Auto-connect to first input (default: false)
editor.draggable_inputs = true;         // Allow drag on input fields (default: true)
editor.useuuid = false;                 // Use UUID for node IDs (default: false)
editor.editor_mode = 'edit';            // 'edit' | 'fixed' | 'view'
editor.zoom_min = 0.5;                  // Minimum zoom level
editor.zoom_max = 1.6;                  // Maximum zoom level
```

| Mode | Description |
|------|-------------|
| `edit` | Full editing capabilities |
| `fixed` | Nodes are locked, connections still visible |
| `view` | Read-only, pan/zoom disabled |

### Node Operations

#### addNode

```javascript
const nodeId = editor.addNode(name, inputs, outputs, posX, posY, cssClass, data, html);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Node type name |
| `inputs` | `number` | Number of input handles |
| `outputs` | `number` | Number of output handles |
| `posX` | `number` | X position on canvas |
| `posY` | `number` | Y position on canvas |
| `cssClass` | `string` | CSS class added to the node element |
| `data` | `object` | Data object bound to the node |
| `html` | `string` | HTML content for the node |

Returns: `number | string` - The new node's ID.

#### Other Node Methods

```javascript
editor.removeNodeId('node-1');                     // Remove a node by DOM ID
editor.getNodeFromId(1);                           // Get node data (deep copy)
editor.getNodesFromName('process');                 // Get all node IDs by name
editor.updateNodeDataFromId(1, { key: 'value' });  // Update node data
editor.addNodeInput(1);                            // Add input to existing node
editor.addNodeOutput(1);                           // Add output to existing node
editor.removeNodeInput(1, 'input_2');              // Remove specific input
editor.removeNodeOutput(1, 'output_2');            // Remove specific output
```

### Connection Operations

```javascript
// Create a connection
editor.addConnection(1, 2, 'output_1', 'input_1');

// Remove currently selected connection
editor.removeConnection();

// Remove a specific connection
editor.removeSingleConnection(1, 2, 'output_1', 'input_1');

// Remove all connections for a node
editor.removeConnectionNodeId('node-1');
```

### Module Operations

Modules let you organize nodes into separate workspaces. The default module is `Home`.

```javascript
editor.addModule('Settings');           // Create a new module
editor.changeModule('Settings');        // Switch to module
editor.changeModule('Home');            // Switch back
editor.removeModule('Settings');        // Delete a module
editor.clearModuleSelected();           // Clear all nodes in current module
```

### Zoom Operations

```javascript
editor.zoom_in();       // Zoom in by one step
editor.zoom_out();      // Zoom out by one step
editor.zoom_reset();    // Reset to 100%
```

### Import / Export

```javascript
// Export entire workflow as JSON
const data = editor.export();

// Import workflow from JSON
editor.import(data);

// Clear everything
editor.clear();
```

#### Export Data Format

```json
{
  "nodeforge": {
    "Home": {
      "data": {
        "1": {
          "id": 1,
          "name": "start",
          "data": { "name": "Start Node" },
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
                { "node": "3", "output": "input_1" }
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

### Events

Listen for editor events with `editor.on(event, callback)`:

```javascript
editor.on('nodeCreated', function(id) {
  console.log('Node created:', id);
});

editor.on('connectionCreated', function(connection) {
  console.log('Connected:', connection.output_id, '->', connection.input_id);
});
```

#### Available Events

| Event | Callback Parameter | Description |
|-------|-------------------|-------------|
| **Node Events** | | |
| `nodeCreated` | `id` | Node was created |
| `nodeRemoved` | `id` | Node was deleted |
| `nodeMoved` | `id` | Node was dragged |
| `nodeSelected` | `id` | Node was clicked |
| `nodeUnselected` | `true` | Node was deselected |
| `nodeDataChanged` | `id` | Node data was modified |
| **Connection Events** | | |
| `connectionCreated` | `{ output_id, input_id, output_class, input_class }` | Connection was made |
| `connectionRemoved` | `{ output_id, input_id, output_class, input_class }` | Connection was deleted |
| `connectionSelected` | `element` | Connection was clicked |
| `connectionUnselected` | `true` | Connection was deselected |
| `connectionStart` | `{ output_id, output_class }` | Connection drag started |
| `connectionCancel` | `true` | Connection drag cancelled |
| **Reroute Events** | | |
| `addReroute` | `id` | Reroute point was added |
| `removeReroute` | `id` | Reroute point was removed |
| `rerouteMoved` | `id` | Reroute point was dragged |
| **Module Events** | | |
| `moduleCreated` | `name` | Module was created |
| `moduleChanged` | `name` | Switched to module |
| `moduleRemoved` | `name` | Module was deleted |
| **General Events** | | |
| `zoom` | `zoom_level` | Zoom level changed |
| `translate` | `{ x, y }` | Canvas was panned |
| `import` | `'import'` | Data was imported |
| `export` | `data` | Data was exported |
| `mouseMove` | `{ x, y }` | Mouse moved on canvas |
| `click` | `event` | Canvas was clicked |
| `contextmenu` | `event` | Right-click on canvas |
| `keydown` | `event` | Key was pressed |

### Data Binding

Use `df-*` attributes in node HTML to automatically bind input values to node data:

```html
<input type="text" df-name>              <!-- Binds to data.name -->
<select df-datatype>                     <!-- Binds to data.datatype -->
<textarea df-description>                <!-- Binds to data.description -->
<div df-notes contenteditable>           <!-- Binds to data.notes -->
```

When the user edits these fields, the node's data object is automatically updated and a `nodeDataChanged` event is fired.

## Theming

NodeForge uses CSS custom properties for full theme control. Override them on the `.parent-nodeforge` selector:

```css
.parent-nodeforge {
  /* Node */
  --nf-node-bg: #ffffff;
  --nf-node-bg-hover: #f8f9fa;
  --nf-node-bg-selected: #e3f2fd;
  --nf-node-border: #cbd5e1;
  --nf-node-border-selected: #3b82f6;
  --nf-node-border-radius: 8px;
  --nf-node-color: #1e293b;
  --nf-node-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  /* Handles (input/output circles) */
  --nf-handle-bg: #3b82f6;
  --nf-handle-bg-hover: #2563eb;
  --nf-handle-border: #ffffff;
  --nf-handle-size: 12px;

  /* Connections */
  --nf-edge-stroke: #94a3b8;
  --nf-edge-stroke-hover: #3b82f6;
  --nf-edge-stroke-selected: #10b981;
  --nf-edge-width: 2px;

  /* Reroute Points */
  --nf-point-fill: #ffffff;
  --nf-point-fill-hover: #3b82f6;
  --nf-point-stroke: #64748b;

  /* Delete Button */
  --nf-delete-bg: #ef4444;
  --nf-delete-color: #ffffff;

  /* Selection Box */
  --nf-selection-bg: rgba(59, 130, 246, 0.08);
  --nf-selection-border: rgba(59, 130, 246, 0.5);

  /* Background */
  --nf-background-color: transparent;
}
```

### Dark Mode

Add the `dark` class to the container to enable the built-in dark theme:

```javascript
document.getElementById('canvas').classList.add('dark');
```

Or define your own:

```css
.parent-nodeforge.my-theme {
  --nf-background-color: #1a1a2e;
  --nf-node-bg: #16213e;
  --nf-node-border: #0f3460;
  --nf-edge-stroke: #533483;
  /* ... */
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` | Delete selected node or connection |
| `Cmd/Ctrl + Backspace` | Delete selected node or connection |

## Mouse Interactions

| Action | Result |
|--------|--------|
| Click node | Select node |
| Drag node | Move node |
| Drag from output | Create connection |
| Click connection | Select connection |
| Double-click connection | Add reroute point |
| Double-click reroute point | Remove reroute point |
| Drag reroute point | Bend the connection |
| Scroll wheel | Zoom in/out |
| Drag canvas | Pan the view |

## DOM Structure

```html
<div class="parent-nodeforge">
  <div class="nodeforge">
    <!-- Nodes -->
    <div class="parent-node">
      <div id="node-1" class="nodeforge-node start">
        <div class="inputs">
          <div class="input input_1"></div>
        </div>
        <div class="nodeforge_content_node">
          <!-- your HTML content -->
        </div>
        <div class="outputs">
          <div class="output output_1"></div>
        </div>
      </div>
    </div>

    <!-- Connections (SVG) -->
    <svg class="connection node_in_node-2 node_out_node-1 output_1 input_1">
      <path class="main-path" d="M ... C ..."></path>
      <!-- Reroute points (if enabled) -->
      <circle class="point" cx="350" cy="200" r="6"></circle>
    </svg>
  </div>
</div>
```

## Building from Source

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production build
npm run build
```

Build output:
- `dist/nodeforge.min.js` - UMD bundle (ES5 compatible)
- `dist/nodeforge.min.css` - Minified CSS
- `dist/nodeforge.style.js` - CSS-in-JS for lit-element

## Vue Integration

Register Vue components as node templates:

```javascript
// Vue 2
editor.registerNode('MyComponent', MyVueComponent, props, options);

// Vue 3
const editor = new NodeForge(element, render, parent);
editor.registerNode('MyComponent', MyVueComponent, props, options);
```

Then use them in `addNode` with `typenode` set to `true`:

```javascript
editor.addNode('myNode', 1, 1, 100, 200, 'my-class', {}, 'MyComponent', true);
```

## Browser Support

NodeForge targets ES5 via Babel transpilation. Works in all modern browsers and IE11+ (with core-js polyfills).

## License

[MIT](LICENSE)
