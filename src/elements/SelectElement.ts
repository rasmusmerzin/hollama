import { ICON_CHEVRON_DOWN } from "../icons";
import { DropdownMenuElement } from "./DropdownMenuElement";
import "./SelectElement.css";

export interface SelectOption {
  label: string;
  value: string;
}

@tag("select-element")
export class SelectElement extends HTMLElement {
  private selectedElement: HTMLElement;
  private iconElement: HTMLElement;
  private control?: AbortController;

  #selected: SelectOption | null = null;
  get selected() {
    return this.#selected?.value || null;
  }
  set selected(value: string | null) {
    if (value === null) {
      if (!this.#selected) return;
      this.#selected = null;
      this.selectedElement.innerText = "";
      this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
      return;
    }
    if (this.#selected?.value === value) return;
    const option = this.options.find(({ value: v }) => v === value);
    if (!option) return;
    this.#selected = option;
    this.selectedElement.innerText = option.label;
    this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
  }

  #options: SelectOption[] = [];
  get options() {
    return this.#options;
  }
  set options(options: SelectOption[]) {
    this.#options = options;
    let option: SelectOption | undefined;
    if (
      this.#selected &&
      (option = options.find(({ value }) => value === this.#selected?.value))
    ) {
      this.selectedElement.innerText = this.#selected.label = option.label;
    } else if (options.length) {
      this.selectedElement.innerText = options[0].label;
      this.#selected = options[0];
      this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    } else if (this.#selected) {
      this.selectedElement.innerText = "";
      this.#selected = null;
      this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    }
    if (options.length) this.setAttribute("has-options", "");
    else this.removeAttribute("has-options");
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.selectedElement = createElement("div", { className: "selected" })),
      (this.iconElement = createElement("div", {
        className: "icon",
        innerHTML: ICON_CHEVRON_DOWN,
      })),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.addEventListener("click", this.openDropdown.bind(this), {
      signal: this.control.signal,
    });
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private openDropdown() {
    document.body.append(
      createElement(DropdownMenuElement, {
        anchor: this.iconElement,
        items: this.options.map((option) => ({
          label: option.label,
          action: () => (this.selected = option.value),
        })),
      }),
    );
  }
}
