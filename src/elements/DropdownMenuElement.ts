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
  private margin = 8;

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
  get flipped() {
    return this.hasAttribute("flipped");
  }
  set flipped(value: boolean) {
    if (value) this.setAttribute("flipped", "");
    else this.removeAttribute("flipped");
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
    this.tryFlip();
    this.tryResize();
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
    const { left, top, bottom, width } = this.anchor.getBoundingClientRect();
    this.style.left = `${left + width / 2}px`;
    this.style.top = this.flipped ? `${top}px` : `${bottom}px`;
  }

  private tryFlip() {
    if (this.flipped || !this.anchor) return;
    const anchorRect = this.anchor.getBoundingClientRect();
    const containerRect = this.containerElement.getBoundingClientRect();
    const availableHeight = innerHeight - anchorRect.bottom;
    const availableFlippedHeight = anchorRect.top;
    if (
      containerRect.bottom > innerHeight - this.margin &&
      availableHeight < availableFlippedHeight
    ) {
      this.flipped = true;
      this.updatePosition();
    }
  }

  private tryResize() {
    if (this.flipped) {
      const { top, height } = this.containerElement.getBoundingClientRect();
      const stripped = top - this.margin;
      if (stripped < 0)
        this.containerElement.style.height = `${height + stripped}px`;
    } else {
      const { bottom, height } = this.containerElement.getBoundingClientRect();
      const stripped = bottom - (innerHeight - this.margin);
      if (stripped > 0)
        this.containerElement.style.height = `${height - stripped}px`;
    }
  }
}
