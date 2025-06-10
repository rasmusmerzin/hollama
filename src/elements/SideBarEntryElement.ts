import { Chat } from "../state/database";
import "./SideBarEntryElement.css";

@tag("side-bar-entry-element")
export class SideBarEntryElement extends HTMLElement {
  private control?: AbortController;

  #chat?: Chat;
  get chat() {
    return this.#chat;
  }
  set chat(chat: Chat | undefined) {
    this.#chat = chat;
    this.id = chat ? `chat-${chat.id}` : "";
    this.innerText = chat?.title || "";
  }

  constructor() {
    super();
    this.tabIndex = 0;
    this.onclick = () => {
      if (!this.chat) return;
      if (history.stack.index) history.back();
      setTimeout(() => history.replaceState({}, "", `/chat/${this.chat!.id}`));
    };
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
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onStateChange() {
    if (this.isActive()) this.classList.add("active");
    else this.classList.remove("active");
  }

  private isActive() {
    return location.pathname === `/chat/${this.chat?.id}`;
  }
}
