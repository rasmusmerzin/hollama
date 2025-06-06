import "./ModalWindowEntryElement.css";

@tag("modal-window-entry-element")
export class ModalWindowEntryElement extends HTMLElement {
  private labelElement: HTMLElement;
  private descriptionElement: HTMLElement;

  get label() {
    const { children } = this.labelElement;
    if (children.length === 1) return children[0] as HTMLElement;
    else if (children.length > 1) return Array.from(children) as HTMLElement[];
    return this.labelElement.innerText;
  }
  set label(value: string | HTMLElement | (HTMLElement | string)[]) {
    if (typeof value === "string") this.labelElement.innerText = value;
    else if (Array.isArray(value)) this.labelElement.replaceChildren(...value);
    else this.labelElement.replaceChildren(value);
  }
  get description() {
    return this.descriptionElement.innerText;
  }
  set description(value: string) {
    this.descriptionElement.innerText = value;
  }
  get join() {
    return this.getAttribute("join");
  }
  set join(value: string | null) {
    if (value == null) this.removeAttribute("join");
    else this.setAttribute("join", value);
  }
  get height() {
    return Number(this.style.getPropertyValue("--height"));
  }
  set height(value: number) {
    this.style.setProperty("--height", String(value));
  }
  get lineClamp() {
    return Number(this.style.getPropertyValue("--line-clamp"));
  }
  set lineClamp(value: number) {
    this.style.setProperty("--line-clamp", String(value));
  }

  constructor() {
    super();
    this.tabIndex = 0;
    this.height = 48;
    this.lineClamp = 1;
    this.replaceChildren(
      createElement("div", {}, [
        (this.labelElement = createElement("div", { className: "label" })),
        (this.descriptionElement = createElement("div", {
          className: "description",
        })),
      ]),
    );
  }
}
