import "./ToggleElement.css";

@tag("toggle-element")
export class ToggleElement extends HTMLElement {
  private control?: AbortController;

  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(value: boolean) {
    if (this.checked === value) return;
    if (value) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  constructor() {
    super();
    this.tabIndex = 0;
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.addEventListener("click", this.onClick.bind(this), this.control);
    this.addEventListener("keydown", this.onKeydown.bind(this), this.control);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onClick() {
    this.checked = !this.checked;
  }

  private onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      this.checked = !this.checked;
    }
  }
}
