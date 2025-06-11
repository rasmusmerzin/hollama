import "./MessageInputElement.css";
import { ICON_ADD, ICON_ARROW_UPWARD, ICON_MIC, ICON_SPINNER } from "../icons";

@tag("message-input-element")
export class MessageInputElement extends HTMLElement {
  private textareaElement: HTMLTextAreaElement;
  private submitButton: HTMLButtonElement;
  private control?: AbortController;

  get value() {
    return this.textareaElement.value;
  }
  set value(value: string) {
    this.textareaElement.value = value;
    this.resizeTextarea();
  }
  #disabled = false;
  get disabled() {
    return this.#disabled;
  }
  set disabled(value: boolean) {
    this.#disabled = value;
    this.updateDisabled();
  }
  #loading = false;
  get loading() {
    return this.#loading;
  }
  set loading(value: boolean) {
    if ((this.#loading = value)) this.submitButton.innerHTML = ICON_SPINNER;
    else this.submitButton.innerHTML = ICON_ARROW_UPWARD;
    this.updateDisabled();
  }

  constructor() {
    super();
    this.replaceChildren(
      createElement("div", { className: "container" }, [
        (this.textareaElement = createElement("textarea", {
          placeholder: "Ask anything",
          rows: 2,
          oninput: this.onInput.bind(this),
          onkeydown: this.onKeydown.bind(this),
        })),
        createElement("div", { className: "actions" }, [
          createElement("button", { innerHTML: ICON_ADD }),
          createElement("div"),
          createElement("button", { innerHTML: ICON_MIC }),
          (this.submitButton = createElement("button", {
            className: "primary",
            innerHTML: ICON_ARROW_UPWARD,
            onclick: () => this.dispatchEvent(new Event("submit")),
          })),
        ]),
      ]),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.onInput();
    addEventListener("resize", this.resizeTextarea.bind(this), this.control);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onInput() {
    this.updateDisabled();
    this.resizeTextarea();
  }

  private onKeydown(event: KeyboardEvent) {
    const modifiers =
      event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
    if (event.key === "Enter" && !modifiers) {
      event.preventDefault();
      if (this.value.trim()) this.dispatchEvent(new Event("submit"));
    }
  }

  private updateDisabled() {
    this.textareaElement.disabled = this.#disabled || this.#loading;
    this.querySelectorAll("button").forEach(
      (button) => (button.disabled = this.#disabled || this.#loading),
    );
    this.submitButton.disabled =
      this.#disabled || this.#loading || !this.value.trim();
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
