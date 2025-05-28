import "./SideBarElement.css";
import { ICON_MENU, ICON_SEARCH } from "../icons";
import { Subject } from "../Subject";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ondoubleclick } from "../ondoubleclick";

const SIDE_BAR_BREAKPOINT = 560;

export const SideBarSubject = new Subject<{ open: boolean }>({
  open: innerWidth >= SIDE_BAR_BREAKPOINT,
});

@tag("side-bar-element")
export class SideBarElement extends HTMLElement {
  private appWindow = getCurrentWindow();
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
              innerHTML: ICON_SEARCH,
              onmousedown: stopPropagation,
            }),
          ]),
          createElement("div", { className: "center" }, "Hollama"),
          createElement("div", { className: "right" }, [
            createElement("button", {
              innerHTML: ICON_MENU,
              onmousedown: stopPropagation,
            }),
          ]),
        ],
      )),
      createElement("div", {
        className: "shadow",
        onclick: () =>
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
    addEventListener(
      "resize",
      () => {
        if (innerWidth < SIDE_BAR_BREAKPOINT && SideBarSubject.current().open)
          SideBarSubject.update((state) => ({ ...state, open: false }));
        else if (
          innerWidth >= SIDE_BAR_BREAKPOINT &&
          !SideBarSubject.current().open
        )
          SideBarSubject.update((state) => ({ ...state, open: true }));
      },
      this.control,
    );
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
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}
