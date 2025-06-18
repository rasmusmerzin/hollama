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
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }
}
