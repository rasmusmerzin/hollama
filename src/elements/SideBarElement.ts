import "./SideBarElement.css";
import { DropdownMenuElement } from "./DropdownMenuElement";
import { ICON_ADD_CHAT, ICON_MENU } from "../icons";
import { Subject } from "../Subject";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onBack } from "@merzin/router";
import { ondoubleclick } from "../ondoubleclick";

export const SIDE_BAR_BREAKPOINT = 560;

export const SideBarSubject = new Subject<{ open: boolean }>({
  open: innerWidth >= SIDE_BAR_BREAKPOINT,
});

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
              onclick: () => {
                this.menuButton.classList.add("active");
                const dropdownMenuElement = createElement(DropdownMenuElement, {
                  anchor: this.menuButton,
                  ondisconnect: () =>
                    this.menuButton.classList.remove("active"),
                  items: [
                    // { label: "New Window" },
                    // { label: "New Tab" },
                    // "div",
                    { label: "Preferences" },
                    { label: "About Hollama" },
                  ],
                });
                document.body.append(dropdownMenuElement);
                onBack(() => dropdownMenuElement.remove());
              },
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
    SideBarSubject.subscribe(({ open }) => {
      if (open) this.classList.add("open");
      else this.classList.remove("open");
    }, this.control);
    addEventListener("resize", this.onResize.bind(this), this.control);
    ondoubleclick(
      this.titleElement,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onResize() {
    if (innerWidth < SIDE_BAR_BREAKPOINT && SideBarSubject.current().open)
      SideBarSubject.update((state) => ({ ...state, open: false }));
    else if (
      innerWidth >= SIDE_BAR_BREAKPOINT &&
      !SideBarSubject.current().open
    )
      SideBarSubject.update((state) => ({ ...state, open: true }));
  }
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
