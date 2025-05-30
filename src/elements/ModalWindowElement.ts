import "./ModalWindowElement.css";
import { ICON_CLOSE } from "../icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ondoubleclick } from "../ondoubleclick";

export const MODAL_WINDOW_BREAKPOINT = 440;

@tag("modal-window-element")
export class ModalWindowElement extends HTMLElement {
  private appWindow = getCurrentWindow();
  private titleElement: HTMLDivElement;
  private titleCenterElement: HTMLDivElement;
  private contentElement: HTMLDivElement;
  private control?: AbortController;
  private timeouts: any[] = [];
  private removed = false;

  onconnect: (() => any) | null = null;
  ondisconnect: (() => any) | null = null;

  get niche() {
    return this.contentElement;
  }
  get label() {
    return this.titleCenterElement.innerText;
  }
  set label(value: string) {
    this.titleCenterElement.innerText = value;
  }

  constructor() {
    super();
    this.onmousedown = () =>
      innerWidth < MODAL_WINDOW_BREAKPOINT
        ? history.back()
        : this.appWindow.startDragging();
    this.replaceChildren(
      createElement(
        "div",
        { className: "window", onmousedown: stopPropagation },
        [
          (this.titleElement = createElement(
            "div",
            {
              className: "title",
              onmousedown: () => this.appWindow.startDragging(),
            },
            [
              createElement("div", { className: "left" }),
              (this.titleCenterElement = createElement("div", {
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
            ],
          )),
          createElement("div", { className: "container" }, [
            (this.contentElement = createElement("div", {
              className: "content",
            })),
          ]),
        ],
      ),
    );
  }

  connectedCallback() {
    this.removed = false;
    this.control?.abort();
    this.control = new AbortController();
    ondoubleclick(
      this.titleElement,
      () => this.appWindow.toggleMaximize(),
      this.control.signal,
    );
    this.setAttribute("state", "opening");
    this.timeouts.push(
      setTimeout(() => {
        this.removeAttribute("state");
      }, 200),
    );
    this.onconnect?.();
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
    this.clearTimeouts();
    this.ondisconnect?.();
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

function stopPropagation(event: Event) {
  event.stopPropagation();
}
