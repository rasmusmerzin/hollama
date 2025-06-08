import { ICON_ADD, ICON_ARROW_UPWARD, ICON_MIC } from "../icons";
import "./MessageInputElement.css";

@tag("message-input-element")
export class MessageInputElement extends HTMLElement {
  private textareaElement: HTMLTextAreaElement;
  private control?: AbortController;

  get value() {
    return this.textareaElement.value;
  }
  set value(value: string) {
    this.textareaElement.value = value;
    this.resizeTextarea();
  }

  constructor() {
    super();
    this.replaceChildren(
      createElement("div", { className: "container" }, [
        (this.textareaElement = createElement("textarea", {
          placeholder: "Ask anything",
          rows: 2,
          oninput: this.resizeTextarea.bind(this),
        })),
        createElement("div", { className: "actions" }, [
          createElement("button", { innerHTML: ICON_ADD }),
          createElement("div"),
          createElement("button", { innerHTML: ICON_MIC }),
          createElement("button", {
            className: "primary",
            innerHTML: ICON_ARROW_UPWARD,
          }),
        ]),
      ]),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    addEventListener("resize", this.resizeTextarea.bind(this), this.control);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private resizeTextarea() {
    const lineHeight = 16;
    const padding = 16 + 8;
    const minRows = 2;
    const maxRows = 6;
    this.textareaElement.rows = 1;
    const textHeight = this.textareaElement.scrollHeight - padding;
    const rows = Math.round(textHeight / lineHeight);
    this.textareaElement.rows = Math.max(minRows, Math.min(rows, maxRows));
  }
}
