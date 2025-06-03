import "./ModalWindowTitleBarElement.css";
import { ICON_CLOSE } from "../icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../onDoubleClick";

@tag("modal-window-title-bar-element")
export class ModalWindowTitleBarElement extends HTMLElement {
  private appWindow = getCurrentWindow();
  private centerElement: HTMLDivElement;
  private control?: AbortController;

  get label() {
    return this.centerElement.innerText;
  }
  set label(value: string) {
    this.centerElement.innerText = value;
  }

  constructor() {
    super();
    this.replaceChildren(
      createElement("div", { className: "left" }),
      (this.centerElement = createElement("div", {
        className: "center",
      })),
      createElement("div", { className: "right" }, [
        createElement("button", {
          className: "active circle",
          innerHTML: ICON_CLOSE,
          onmousedown: stopPropagation,
          onclick: () => history.back(),
        }),
      ]),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.addEventListener(
      "mousedown",
      () => this.appWindow.startDragging(),
      this.control,
    );
    onDoubleClick(
      this,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
