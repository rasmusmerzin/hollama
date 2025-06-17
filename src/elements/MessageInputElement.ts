import "./MessageInputElement.css";
import { ICON_ADD, ICON_ARROW_UPWARD, ICON_SPINNER, ICON_STOP } from "../icons";
import { MessageInputSubject } from "../state/MessageInputSubject";
import { SelectedModelDetailsSubject } from "../state/SelectedModelSubject";
import { ToggleElement } from "./ToggleElement";

@tag("message-input-element")
export class MessageInputElement extends HTMLElement {
  private textareaElement: HTMLTextAreaElement;
  private containerElement: HTMLElement;
  private actionsElement: HTMLElement;
  private submitButton: HTMLButtonElement;
  private thinkToggle: ToggleElement;
  private control?: AbortController;

  onstop?: () => any;

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
    this.#loading = value;
    this.updateSubmitIcon();
    this.updateDisabled();
  }
  get think() {
    if (!this.categories.includes("thinking")) return undefined;
    return this.thinkToggle.checked;
  }
  get categories(): string[] {
    const value = this.getAttribute("categories");
    if (!value) return [];
    return value.split(" ").filter(Boolean);
  }
  set categories(categories: string[]) {
    if (categories?.length)
      this.setAttribute("categories", categories.join(" "));
    else this.removeAttribute("categories");
  }
  get input(): string[] {
    const value = this.getAttribute("input");
    if (!value) return [];
    return value.split(" ").filter(Boolean);
  }
  set input(input: string[]) {
    if (input?.length) this.setAttribute("input", input.join(" "));
    else this.removeAttribute("input");
  }
  get stoppable() {
    return this.hasAttribute("stoppable");
  }
  set stoppable(value: boolean) {
    if (value) this.setAttribute("stoppable", "");
    else this.removeAttribute("stoppable");
    this.updateSubmitIcon();
    this.updateDisabled();
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.containerElement = createElement(
        "div",
        { className: "container", onclick: this.onContainerClick.bind(this) },
        [
          (this.textareaElement = createElement("textarea", {
            placeholder: "Ask anything",
            rows: 2,
            oninput: this.onInput.bind(this),
            onkeydown: this.onKeydown.bind(this),
          })),
          (this.actionsElement = createElement(
            "div",
            { className: "actions" },
            [
              createElement("button", {
                className: "add",
                innerHTML: ICON_ADD,
              }),
              (this.thinkToggle = createElement(ToggleElement, {
                className: "think",
                innerText: "Think",
                onchange: () =>
                  MessageInputSubject.update((state) => ({
                    ...state,
                    think: this.thinkToggle.checked,
                  })),
              })),
              createElement("div"),
              (this.submitButton = createElement("button", {
                className: "primary",
                innerHTML: ICON_ARROW_UPWARD,
                onclick: () =>
                  this.stoppable
                    ? this.onstop?.()
                    : this.dispatchEvent(new Event("submit")),
              })),
            ],
          )),
        ],
      )),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.onInput();
    addEventListener("resize", this.resizeTextarea.bind(this), this.control);
    SelectedModelDetailsSubject.subscribe((details) => {
      this.categories = details?.categories || [];
      this.input = details?.input || [];
    }, this.control);
    MessageInputSubject.subscribe((state) => {
      this.thinkToggle.checked = state.think;
    }, this.control);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onContainerClick(event: MouseEvent) {
    if (!(event.target instanceof HTMLElement)) return;
    const containers = [this.containerElement, this.actionsElement];
    if (containers.includes(event.target)) this.textareaElement.focus();
  }

  private onInput() {
    this.updateDisabled();
    this.resizeTextarea();
  }

  private onKeydown(event: KeyboardEvent) {
    const modifiers =
      event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
    if (event.key === "Enter" && !modifiers && !this.#disabled) {
      event.preventDefault();
      if (this.value.trim()) this.dispatchEvent(new Event("submit"));
    }
  }

  private updateSubmitIcon() {
    if (this.stoppable) this.submitButton.innerHTML = ICON_STOP;
    else if (this.#loading) this.submitButton.innerHTML = ICON_SPINNER;
    else this.submitButton.innerHTML = ICON_ARROW_UPWARD;
  }

  private updateDisabled() {
    this.textareaElement.disabled = this.#loading;
    this.querySelectorAll("button").forEach(
      (button) => (button.disabled = this.#disabled || this.#loading),
    );
    this.thinkToggle.disabled = this.#disabled || this.#loading;
    this.submitButton.disabled =
      this.#disabled || this.#loading || !this.value.trim();
    if (this.stoppable) this.submitButton.disabled = false;
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
    this.dispatchEvent(new Event("resize"));
  }
}
