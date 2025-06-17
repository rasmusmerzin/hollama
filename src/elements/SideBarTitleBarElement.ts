import "./SideBarTitleBarElement.css";
import { DropdownMenuElement } from "./DropdownMenuElement";
import { ICON_ADD_CHAT, ICON_MENU } from "../icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../utils/onDoubleClick";

@tag("side-bar-title-bar-element")
export class SideBarTitleBarElement extends HTMLElement {
  private appWindow = getCurrentWindow();
  private menuButton: HTMLButtonElement;
  private control?: AbortController;

  constructor() {
    super();
    this.onmousedown = (event) =>
      !event.button && this.appWindow.startDragging();
    this.replaceChildren(
      createElement("div", { className: "left" }, [
        createElement("button", {
          innerHTML: ICON_ADD_CHAT,
          onmousedown: stopPropagation,
          onclick: () => {
            if (history.stack.index) history.back();
            setTimeout(() => history.replaceState({}, "", "/"));
          },
        }),
      ]),
      createElement("div", { className: "center" }, "Hollama"),
      createElement("div", { className: "right" }, [
        (this.menuButton = createElement("button", {
          innerHTML: ICON_MENU,
          onmousedown: stopPropagation,
          onclick: this.openDropdownMenu.bind(this),
        })),
      ]),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
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

  private openDropdownMenu() {
    this.menuButton.classList.add("active");
    document.body.append(
      createElement(DropdownMenuElement, {
        anchor: this.menuButton,
        ondisconnect: () => this.menuButton.classList.remove("active"),
        items: [
          {
            label: "Models",
            action: () => history.pushState(history.state, "", "#models"),
          },
          "div",
          {
            label: "Preferences",
            action: () => history.pushState(history.state, "", "#preferences"),
          },
          {
            label: "About Hollama",
            action: () => history.pushState(history.state, "", "#about"),
          },
        ],
      }),
    );
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
