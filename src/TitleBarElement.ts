import "./TitleBarElement.css";
import { ICON_CLOSE, ICON_DOCK_TO_RIGHT } from "./icons";
import { getCurrentWindow } from "@tauri-apps/api/window";

@tag("title-bar-element")
export class TitleBarElement extends HTMLElement {
  appWindow = getCurrentWindow();

  constructor() {
    super();
    this.onmousedown = () => this.appWindow.startDragging();
    this.replaceChildren(
      createElement("div", { className: "left" }, [
        createElement("button", {
          innerHTML: ICON_DOCK_TO_RIGHT,
          onmousedown: stopPropagation,
        }),
      ]),
      createElement("div", { className: "center" }, "Hollama"),
      createElement("div", { className: "right" }, [
        createElement("button", {
          className: "active circle",
          innerHTML: ICON_CLOSE,
          onmousedown: stopPropagation,
          onclick: () => this.appWindow.close(),
        }),
      ]),
    );
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
