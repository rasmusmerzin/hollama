import "./SideBarElement.css";
import { DropdownMenuElement } from "./DropdownMenuElement";
import { ICON_ADD_CHAT, ICON_MENU } from "../icons";
import { SideBarSubject } from "../state/SideBarSubject";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onDoubleClick } from "../utils/onDoubleClick";
import { stripObject } from "../utils/stripObject";

export const SIDE_BAR_BREAKPOINT = 640;

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
          onmousedown: (event) =>
            !event.button && this.appWindow.startDragging(),
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
    SideBarSubject.subscribe(({ open }, previous) => {
      if (open) this.classList.add("open");
      else this.classList.remove("open");
      const { sidebarOverlay } = history.state;
      if (!previous) return;
      if (previous.open !== open) {
        if (open && innerWidth < SIDE_BAR_BREAKPOINT && !sidebarOverlay)
          history.pushState(
            { ...stripObject(history.state), sidebarOverlay: true },
            "",
          );
        else if (!open && sidebarOverlay) history.back();
      }
    }, this.control);
    this.onStateChange();
    addEventListener("resize", this.onResize.bind(this), this.control);
    onDoubleClick(
      this.titleElement,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
    addEventListener(
      "statechange",
      this.onStateChange.bind(this),
      this.control,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onStateChange() {
    const { open } = SideBarSubject.current();
    const { sidebarOverlay } = history.state;
    if (sidebarOverlay && !open)
      SideBarSubject.update((state) => ({ ...state, open: true }));
    else if (!sidebarOverlay && innerWidth < SIDE_BAR_BREAKPOINT && open)
      SideBarSubject.update((state) => ({ ...state, open: false }));
    if (
      history.stack.index === 1 &&
      sidebarOverlay &&
      innerWidth >= SIDE_BAR_BREAKPOINT
    )
      history.back();
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
            action: () =>
              history.pushState(stripObject(history.state), "", "#models"),
          },
          "div",
          {
            label: "Preferences",
            action: () =>
              history.pushState(stripObject(history.state), "", "#preferences"),
          },
          {
            label: "About Hollama",
            action: () =>
              history.pushState(stripObject(history.state), "", "#about"),
          },
        ],
      }),
    );
  }

  private previousWidth = innerWidth;
  private onResize() {
    if (history.stack.index > 1) return;
    if (
      this.previousWidth < SIDE_BAR_BREAKPOINT &&
      innerWidth >= SIDE_BAR_BREAKPOINT
    ) {
      if (history.state.sidebarOverlay) history.back();
      if (!SideBarSubject.current().open)
        SideBarSubject.update((state) => ({ ...state, open: true }));
    } else if (
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
