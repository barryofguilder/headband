/**
 * Blocks pinch zoom in Safari, which ignores `user-scalable=no` in the
 * viewport tag. Safari fires its own gesture events for pinches, and
 * cancelling them stops the zoom.
 */
export function preventZoom(): void {
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (event) => event.preventDefault(), {
      passive: false,
    });
  }
}
