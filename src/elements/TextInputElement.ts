import "./TextInputElement.css";

@tag("text-input-element")
export class TextInputElement extends HTMLElement {
  private iconElement: HTMLElement;
  private inputElement: HTMLInputElement;

  get icon() {
    return this.iconElement.innerHTML;
  }
  set icon(value: string) {
    this.iconElement.innerHTML = value;
    if (value) this.setAttribute("icon", "");
    else this.removeAttribute("icon");
  }
  get placeholder() {
    return this.inputElement.placeholder;
  }
  set placeholder(value: string) {
    this.inputElement.placeholder = value;
  }
  get value() {
    return this.inputElement.value;
  }
  set value(value: string) {
    this.inputElement.value = value;
  }
  get onblur() {
    return this.inputElement.onblur;
  }
  set onblur(
    value: ((this: GlobalEventHandlers, ev: FocusEvent) => any) | null,
  ) {
    this.inputElement.onblur = value;
  }
  get onfocus() {
    return this.inputElement.onfocus;
  }
  set onfocus(
    value: ((this: GlobalEventHandlers, ev: FocusEvent) => any) | null,
  ) {
    this.inputElement.onfocus = value;
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.iconElement = createElement("div", { className: "icon" })),
      (this.inputElement = createElement("input")),
    );
  }

  focus() {
    this.inputElement.focus();
  }
}
