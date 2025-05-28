import "./DropdownMenuElement.css";

export interface DropdownMenuItem {
  label: string;
  action?: () => any;
}

@tag("dropdown-menu-element")
export class DropdownMenuElement extends HTMLElement {
  private containerElement: HTMLDivElement;
  private control?: AbortController;

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
                item.action?.();
              },
            }),
      ),
    );
  }
  get items() {
    return this.#items;
  }

  constructor() {
    super();
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
    addEventListener("resize", this.remove.bind(this), this.control);
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
