import "./ModalWindowEntryElement.css";

@tag("modal-window-entry-element")
export class ModalWindowEntryElement extends HTMLElement {
  private labelElement: HTMLElement;

  get label() {
    return this.labelElement.innerText;
  }
  set label(value: string) {
    this.labelElement.innerText = value;
  }
  get join() {
    return this.getAttribute("join");
  }
  set join(value: string | null) {
    if (value == null) this.removeAttribute("join");
    else this.setAttribute("join", value);
  }

  constructor() {
    super();
    this.tabIndex = 0;
    this.replaceChildren(
      (this.labelElement = createElement("div", { className: "label" })),
    );
  }
}
