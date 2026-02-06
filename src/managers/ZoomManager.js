/**
 * ZoomManager - Handles zoom controls
 *
 * Extracted from nodeforge.js
 * Manages zoom in, zoom out, zoom reset, and zoom refresh operations
 */
import { EVENTS, ZOOM_CONFIG } from '../constants.js';

export class ZoomManager {
  /**
   * Creates a new ZoomManager
   * @param {NodeForgeContext} context - The NodeForgeContext instance
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Handles zoom wheel events
   * @param {WheelEvent} event - The wheel event
   * @param {number} [delta] - Optional delta value
   */
  zoom_enter(event, delta) {
    if (event.ctrlKey) {
      event.preventDefault();
      if (event.deltaY > 0) {
        // Zoom Out
        this.zoom_out();
      } else {
        // Zoom In
        this.zoom_in();
      }
    }
  }

  /**
   * Refreshes the canvas transform after zoom change
   * Updates canvas position and scale, then dispatches zoom event
   */
  zoom_refresh() {
    const zoom = this.context.getZoom();
    const canvasPos = this.context.getCanvasPosition();
    const zoomConfig = this.context.getZoomConfig();
    const precanvas = this.context.getPrecanvas();
    const eventManager = this.context.getEventManager();

    // Dispatch zoom event
    eventManager.dispatch(EVENTS.ZOOM, zoom);

    // Adjust canvas position based on zoom change
    const canvas_x = (canvasPos.x / zoomConfig.last_value) * zoom;
    const canvas_y = (canvasPos.y / zoomConfig.last_value) * zoom;

    // Update canvas position
    this.context.setCanvasPosition(canvas_x, canvas_y);

    // Update zoom last value
    this.context.nodeforge.zoom_last_value = zoom;

    // Apply transform to canvas
    precanvas.style.transform = `translate(${canvas_x}px, ${canvas_y}px) scale(${zoom})`;
  }

  /**
   * Zooms in the canvas
   * Increases zoom level by zoom_value if not at max
   */
  zoom_in() {
    const zoom = this.context.getZoom();
    const zoomConfig = this.context.getZoomConfig();

    if (zoom < zoomConfig.max) {
      this.context.setZoom(zoom + zoomConfig.step);
      this.zoom_refresh();
    }
  }

  /**
   * Zooms out the canvas
   * Decreases zoom level by zoom_value if not at min
   */
  zoom_out() {
    const zoom = this.context.getZoom();
    const zoomConfig = this.context.getZoomConfig();

    if (zoom > zoomConfig.min) {
      this.context.setZoom(zoom - zoomConfig.step);
      this.zoom_refresh();
    }
  }

  /**
   * Resets zoom to default (1.0)
   */
  zoom_reset() {
    const zoom = this.context.getZoom();

    if (zoom !== 1) {
      this.context.setZoom(ZOOM_CONFIG.DEFAULT);
      this.zoom_refresh();
    }
  }

  /**
   * Gets current zoom factors for coordinate calculations
   * @returns {{widthZoom: number, heightZoom: number}} Zoom factors for width and height
   */
  getZoomFactors() {
    const zoom = this.context.getZoom();
    const precanvas = this.context.getPrecanvas();

    return {
      widthZoom: precanvas.clientWidth / (precanvas.clientWidth * zoom) || 0,
      heightZoom: precanvas.clientHeight / (precanvas.clientHeight * zoom) || 0
    };
  }
}
