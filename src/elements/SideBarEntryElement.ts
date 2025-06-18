import { ICON_MORE_HORIZ, ICON_PLAY } from "../icons";
import { chatStore } from "../state/ChatStore";
import { Chat } from "../state/database";
import { GeneratorHandlesSubject } from "../state/GeneratorHandlesSubject";
import { DropdownMenuElement } from "./DropdownMenuElement";
import "./SideBarEntryElement.css";

@tag("side-bar-entry-element")
export class SideBarEntryElement extends HTMLElement {
  private inputElement: HTMLInputElement;
  private menuButton: HTMLButtonElement;
  private control?: AbortController;
  private focusControl?: AbortController;

  #chat?: Chat;
  get chat() {
    return this.#chat;
  }
  set chat(chat: Chat | undefined) {
    this.#chat = chat;
    this.id = chat ? `chat-${chat.id}` : "";
    this.inputElement.value = chat?.title || "";
  }
  get renaming() {
    return this.hasAttribute("renaming");
  }
  set renaming(value: boolean) {
    if (value) this.setAttribute("renaming", "");
    else this.removeAttribute("renaming");
    this.inputElement.disabled = !value;
    if (value) this.inputElement.focus();
  }

  constructor() {
    super();
    this.tabIndex = 0;
    this.onclick = () => {
      if (!this.chat) return;
      if (history.stack.index) history.back();
      setTimeout(() => history.replaceState({}, "", `/chat/${this.chat!.id}`));
    };
    this.replaceChildren(
      createElement("div", { className: "icon", innerHTML: ICON_PLAY }),
      (this.inputElement = createElement("input", {
        onfocus: this.onFocus.bind(this),
        onblur: this.onBlur.bind(this),
        disabled: true,
      })),
      createElement("div", { className: "actions" }, [
        (this.menuButton = createElement("button", {
          innerHTML: ICON_MORE_HORIZ,
          onclick: (event) => {
            event.stopPropagation();
            this.openDropdownMenu();
          },
        })),
      ]),
    );
    this.renaming = false;
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.onStateChange();
    addEventListener(
      "statechange",
      this.onStateChange.bind(this),
      this.control,
    );
    GeneratorHandlesSubject.subscribe((handles) => {
      if (handles[this.chat!.id]) this.setAttribute("running", "");
      else this.removeAttribute("running");
    }, this.control);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
    this.focusControl?.abort();
    delete this.focusControl;
  }

  private onFocus() {
    this.focusControl?.abort();
    this.focusControl = new AbortController();
    addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" || event.key === "Enter")
          this.inputElement.blur();
      },
      this.focusControl,
    );
  }

  private onBlur() {
    this.focusControl?.abort();
    delete this.focusControl;
    this.renaming = false;
    chatStore.renameChat(this.chat!.id, this.inputElement.value);
  }

  private openDropdownMenu() {
    this.menuButton.classList.add("active");
    this.setAttribute("hover", "");
    document.body.append(
      createElement(DropdownMenuElement, {
        width: 100,
        anchor: this.menuButton,
        ondisconnect: () => {
          this.menuButton.classList.remove("active");
          this.removeAttribute("hover");
        },
        items: [
          {
            label: "Rename",
            action: () => (this.renaming = true),
          },
          {
            label: "Delete",
            action: () => {
              chatStore.deleteChat(this.chat!.id);
              if (this.isActive()) {
                if (history.stack.index) history.back();
                setTimeout(() => history.replaceState({}, "", "/"));
              }
            },
          },
        ],
      }),
    );
  }

  private onStateChange() {
    if (this.isActive()) this.classList.add("active");
    else this.classList.remove("active");
  }

  private isActive() {
    return location.pathname === `/chat/${this.chat?.id}`;
  }
}
