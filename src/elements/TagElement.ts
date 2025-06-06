import "./TagElement.css";

@tag("tag-element")
export class TagElement extends HTMLElement {
  get height() {
    return Number(this.style.getPropertyValue("--height"));
  }
  set height(value: number) {
    this.style.setProperty("--height", String(value));
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value: boolean) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  constructor() {
    super();
    this.height = 18;
  }
}
