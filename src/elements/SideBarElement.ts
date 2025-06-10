import "./SideBarElement.css";
import { SideBarBodyElement } from "./SideBarBodyElement";
import { SideBarSubject } from "../state/SideBarSubject";
import { SideBarTitleBarElement } from "./SideBarTitleBarElement";
import { stripObject } from "../utils/stripObject";

export const SIDE_BAR_BREAKPOINT = 640;

@tag("side-bar-element")
export class SideBarElement extends HTMLElement {
  private control?: AbortController;

  constructor() {
    super();
    this.replaceChildren(
      createElement(SideBarTitleBarElement),
      createElement(SideBarBodyElement),
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
