import "./SwitchElement.css";

@tag("switch-element")
export class SwitchElement extends HTMLElement {
  private control?: AbortController;

  #value = false;
  get value() {
    return this.#value;
  }
  set value(value: boolean) {
    const oldValue = this.#value;
    this.#value = value;
    if (value) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
    if (oldValue !== value) this.dispatchEvent(new Event("change"));
  }

  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(value: boolean) {
    this.value = value;
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.addEventListener(
      "click",
      () => (this.value = !this.value),
      this.control,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }
}
