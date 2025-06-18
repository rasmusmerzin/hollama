import "./ImageModal.css";
import { ICON_CLOSE } from "../icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../utils/onDoubleClick";

@tag("image-modal")
export class ImageModal extends HTMLElement {
  static image = "";

  private appWindow = getCurrentWindow();
  private imageElement: HTMLImageElement;
  private control?: AbortController;
  private timeouts: any[] = [];
  private removed = false;

  constructor() {
    super();
    this.replaceChildren(
      (this.imageElement = createElement("img", {
        onmousedown: (e) => e.stopPropagation(),
        onclick: (e) => e.stopPropagation(),
      })),
      createElement("button", {
        className: "close",
        innerHTML: ICON_CLOSE,
        onmousedown: (e) => e.stopPropagation(),
        onclick: (e) => {
          e.stopPropagation();
          history.back();
        },
      }),
    );
  }

  connectedCallback() {
    this.removed = false;
    this.control?.abort();
    this.control = new AbortController();
    this.imageElement.src = ImageModal.image;
    this.addEventListener(
      "mousedown",
      (event) => !event.button && this.appWindow.startDragging(),
      this.control,
    );
    onDoubleClick(
      this,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
    this.setAttribute("state", "opening");
    this.timeouts.push(
      setTimeout(() => {
        this.removeAttribute("state");
      }, 200),
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
    this.clearTimeouts();
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

  private clearTimeouts() {
    this.timeouts.splice(0, this.timeouts.length).forEach(clearTimeout);
  }
}
