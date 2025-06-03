import "./SideBarElement.css";
import { DropdownMenuElement } from "./DropdownMenuElement";
import { ICON_ADD_CHAT, ICON_MENU } from "../icons";
import { SideBarSubject } from "../subjects/SideBarSubject";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../onDoubleClick";

export const SIDE_BAR_BREAKPOINT = 560;

@tag("side-bar-element")
export class SideBarElement extends HTMLElement {
  private appWindow = getCurrentWindow();
  private menuButton: HTMLButtonElement;
  private titleElement: HTMLDivElement;
  private control?: AbortController;

  constructor() {
    super();
    this.replaceChildren(
      (this.titleElement = createElement(
        "div",
        {
          className: "title",
          onmousedown: () => this.appWindow.startDragging(),
        },
        [
          createElement("div", { className: "left" }, [
            createElement("button", {
              innerHTML: ICON_ADD_CHAT,
              onmousedown: stopPropagation,
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
        ],
      )),
      createElement("div", {
        className: "shadow",
        onmousedown: () =>
          SideBarSubject.update((state) => ({ ...state, open: false })),
      }),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    SideBarSubject.update((state) => ({
      ...state,
      open: innerWidth >= SIDE_BAR_BREAKPOINT,
    }));
    SideBarSubject.subscribe(({ open }) => {
      if (open) this.classList.add("open");
      else this.classList.remove("open");
    }, this.control);
    addEventListener("resize", this.onResize.bind(this), this.control);
    onDoubleClick(
      this.titleElement,
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
          { label: "Models" },
          "div",
          {
            label: "Preferences",
            action: () => history.pushState({}, "", "#preferences"),
          },
          {
            label: "About Hollama",
            action: () => history.pushState({}, "", "#about"),
          },
        ],
      }),
    );
  }

  private previousWidth = innerWidth;
  private onResize() {
    if (
      this.previousWidth < SIDE_BAR_BREAKPOINT &&
      innerWidth >= SIDE_BAR_BREAKPOINT &&
      !SideBarSubject.current().open
    )
      SideBarSubject.update((state) => ({ ...state, open: true }));
    else if (
      this.previousWidth >= SIDE_BAR_BREAKPOINT &&
      innerWidth < SIDE_BAR_BREAKPOINT &&
      SideBarSubject.current().open
    )
      SideBarSubject.update((state) => ({ ...state, open: false }));
    this.previousWidth = innerWidth;
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
