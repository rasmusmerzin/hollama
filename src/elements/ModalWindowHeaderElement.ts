import "./ModalWindowHeaderElement.css";

@tag("modal-window-header-element")
export class ModalWindowHeaderElement extends HTMLElement {
  private titleElement: HTMLDivElement;
  private descriptionElement: HTMLDivElement;

  get title() {
    return this.titleElement.innerText;
  }
  set title(value: string) {
    this.titleElement.innerText = value;
  }
  get description() {
    return this.descriptionElement.innerText;
  }
  set description(value: string) {
    this.descriptionElement.innerText = value;
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.titleElement = createElement("div", { className: "title" })),
      (this.descriptionElement = createElement("div", {
        className: "description",
      })),
    );
  }

  get label() {
    return this.titleElement.innerText;
  }

  set label(value: string) {
    this.titleElement.innerText = value;
  }
}
