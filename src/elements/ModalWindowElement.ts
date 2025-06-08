import "./ModalWindowElement.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../utils/onDoubleClick";

export const MODAL_WINDOW_BREAKPOINT = 440;

@tag("modal-window-element")
export class ModalWindowElement extends HTMLElement {
  private appWindow = getCurrentWindow();
  private windowElement: HTMLDivElement;
  private control?: AbortController;
  private timeouts: any[] = [];
  private removed = false;

  onconnect: (() => any) | null = null;
  ondisconnect: (() => any) | null = null;

  get niche() {
    return this.windowElement;
  }
  get width(): number {
    return Number(this.style.getPropertyValue("--width"));
  }
  set width(value: number) {
    this.style.setProperty("--width", String(value));
  }
  get height(): number {
    return Number(this.style.getPropertyValue("--height"));
  }
  set height(value: number) {
    this.style.setProperty("--height", String(value));
  }

  constructor() {
    super();
    this.width = 640;
    this.height = 480;
    this.replaceChildren(
      (this.windowElement = createElement("div", {
        className: "window",
        onmousedown: (e) => e.stopPropagation(),
        onclick: (e) => e.stopPropagation(),
      })),
    );
  }

  connectedCallback() {
    this.removed = false;
    this.control?.abort();
    this.control = new AbortController();
    this.addEventListener(
      "mousedown",
      this.onMousedown.bind(this),
      this.control,
    );
    onDoubleClick(
      this,
      () => !this.removed && this.appWindow.toggleMaximize(),
      this.control.signal,
    );
    this.setAttribute("state", "opening");
    this.timeouts.push(
      setTimeout(() => {
        this.removeAttribute("state");
      }, 200),
    );
    this.onconnect?.();
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
    this.clearTimeouts();
    this.ondisconnect?.();
  }

  remove() {
    if (this.removed) return;
    this.removed = true;
    this.clearTimeouts();
    this.setAttribute("state", "closing");
    this.timeouts.push(
      setTimeout(() => {
        super.remove();
        this.removeAttribute("state");
      }, 200),
    );
  }

  private onMousedown(event: MouseEvent) {
    if (event.button !== 0) return;
    if (innerWidth < MODAL_WINDOW_BREAKPOINT)
      history.go(-1 - (history.state.modalIndex || 0));
    else this.appWindow.startDragging();
  }

  private clearTimeouts() {
    this.timeouts.splice(0, this.timeouts.length).forEach(clearTimeout);
  }
}
