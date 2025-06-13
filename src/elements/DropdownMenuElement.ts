import "./DropdownMenuElement.css";
import { onBack } from "@merzin/router";

export interface DropdownMenuItem {
  label: string;
  action?: () => any;
}

@tag("dropdown-menu-element")
export class DropdownMenuElement extends HTMLElement {
  private containerElement: HTMLDivElement;
  private control?: AbortController;

  onconnect: (() => any) | null = null;
  ondisconnect: (() => any) | null = null;

  #anchor: HTMLElement | null = null;
  set anchor(element: HTMLElement | null) {
    this.#anchor = element;
    this.updatePosition();
  }
  get anchor() {
    return this.#anchor;
  }
  #items: (DropdownMenuItem | "div")[] = [];
  set items(items: (DropdownMenuItem | "div")[]) {
    this.#items = items;
    this.containerElement.replaceChildren(
      ...items.map((item) =>
        item === "div"
          ? createElement("div")
          : createElement("button", {
              innerText: item.label,
              onclick: () => {
                history.back();
                if (item.action) setTimeout(item.action);
              },
            }),
      ),
    );
  }
  get items() {
    return this.#items;
  }
  get width() {
    return Number(this.style.getPropertyValue("--width"));
  }
  set width(value: number) {
    this.style.setProperty("--width", value.toString());
  }

  constructor() {
    super();
    this.width = 200;
    this.replaceChildren(
      (this.containerElement = createElement("div", {
        className: "container",
      })),
      createElement("div", {
        className: "shadow",
        onmousedown: () => history.back(),
      }),
    );
  }

  connectedCallback() {
    this.updatePosition();
    this.control?.abort();
    this.control = new AbortController();
    onBack(this.remove.bind(this));
    addEventListener("resize", () => history.back(), this.control);
    this.onconnect?.();
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
    this.ondisconnect?.();
  }

  private updatePosition() {
    if (!this.anchor) return;
    const { left, top, height, width } = this.anchor.getBoundingClientRect();
    this.style.left = `${left + width / 2}px`;
    this.style.top = `${top + height}px`;
  }
}
