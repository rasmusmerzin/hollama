export function ondoubleclick(
  element: HTMLElement,
  handler: (event: MouseEvent) => any,
  signal?: AbortSignal,
): () => void {
  let lastClickTime = 0;
  element.addEventListener("mousedown", listener);
  signal?.addEventListener("abort", unsubscribe);
  function listener(event: MouseEvent) {
    if (Date.now() - lastClickTime < 300) handler(event);
    lastClickTime = Date.now();
  }
  function unsubscribe() {
    element.removeEventListener("mousedown", listener);
  }
  return unsubscribe;
}
