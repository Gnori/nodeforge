# NodeForge Examples

This directory contains interactive examples demonstrating NodeForge capabilities.

## 📂 Examples

### 🎨 node-editor.html
**Interactive Node Editor** - A complete, production-ready node-based workflow editor

**Features:**
- ✨ Modern, polished UI with gradient backgrounds
- 🎯 Drag & drop nodes from palette
- 🔗 Visual connection system
- 💾 Export/Import workflows (JSON)
- 🔒 Edit/View mode toggle
- 🔍 Zoom controls
- 📱 Responsive design
- 🎨 5 node types:
  - **Start** ▶️ - Entry point
  - **Process** ⚙️ - Data transformation
  - **Decision** ❓ - Conditional logic (2 outputs)
  - **Data** 💾 - Store & retrieve data
  - **End** 🏁 - Exit point

**How to Use:**
1. Open `node-editor.html` in your browser
2. Drag nodes from the left palette to the canvas
3. Connect nodes by dragging from output (⭕) to input (⭕)
4. Click nodes to select and edit properties
5. Use toolbar controls to export, import, or clear
6. Press `Delete` key to remove selected nodes/connections

---

## 🚀 Getting Started

### Quick Start
```bash
# Just open the HTML file in your browser
open node-editor.html

# Or use a local server
npx serve .
```

### Using in Your Project
```html
<!-- Include NodeForge CSS -->
<link rel="stylesheet" href="../dist/nodeforge.min.css">

<!-- Include NodeForge JS -->
<script src="../dist/nodeforge.min.js"></script>

<!-- Create a container -->
<div id="nodeforge-canvas"></div>

<!-- Initialize -->
<script>
  const editor = new NodeForge(document.getElementById('nodeforge-canvas'));
  editor.start();

  // Add a node
  editor.addNode(
    'mynode',    // name
    1,           // inputs
    1,           // outputs
    100,         // x position
    100,         // y position
    'custom',    // class name
    { foo: 'bar' }, // data
    '<div>My Node</div>' // HTML content
  );
</script>
```

---

**Made with ❤️ using NodeForge**
