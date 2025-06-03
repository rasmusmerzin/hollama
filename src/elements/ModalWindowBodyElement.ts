import "./ModalWindowBodyElement.css";

@tag("modal-window-body-element")
export class ModalWindowBodyElement extends HTMLElement {
  private contentElement: HTMLDivElement;

  get niche() {
    return this.contentElement;
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.contentElement = createElement("div", { className: "content" })),
    );
  }
}
