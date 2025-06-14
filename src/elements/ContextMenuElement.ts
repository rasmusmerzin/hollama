import { cursor } from "../state/cursor";
import "./ContextMenuElement.css";
import { onBack } from "@merzin/router";

export interface ContextMenuItem {
  label: string;
  action?: () => any;
}

@tag("context-menu-element")
export class ContextMenuElement extends HTMLElement {
  private containerElement: HTMLDivElement;
  private control?: AbortController;
  private margin = 8;

  onconnect: (() => any) | null = null;
  ondisconnect: (() => any) | null = null;

  #items: (ContextMenuItem | "div")[] = [];
  set items(items: (ContextMenuItem | "div")[]) {
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
  get flippedX() {
    return this.hasAttribute("flipped-x");
  }
  set flippedX(value: boolean) {
    if (value) this.setAttribute("flipped-x", "");
    else this.removeAttribute("flipped-x");
  }
  get flippedY() {
    return this.hasAttribute("flipped-y");
  }
  set flippedY(value: boolean) {
    if (value) this.setAttribute("flipped-y", "");
    else this.removeAttribute("flipped-y");
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
    this.style.left = `${cursor.x}px`;
    this.style.top = `${cursor.y}px`;
  }

  private tryFlip() {
    const { right, bottom } = this.containerElement.getBoundingClientRect();
    if (right + this.margin > innerWidth) this.flippedX = true;
    if (bottom + this.margin > innerHeight) this.flippedY = true;
  }
}
