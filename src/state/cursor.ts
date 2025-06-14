export const cursor = { x: 0, y: 0 };

addEventListener("mousemove", onMouseEvent, { passive: true });
addEventListener("mousedown", onMouseEvent, { passive: true });

function onMouseEvent(event: MouseEvent) {
  cursor.x = event.clientX;
  cursor.y = event.clientY;
}
