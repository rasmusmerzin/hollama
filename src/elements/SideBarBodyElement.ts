import "./SideBarBodyElement.css";
import {
  ChatCreateEvent,
  ChatDeleteEvent,
  ChatMoveEvent,
  chatStore,
} from "../state/ChatStore";
import { SideBarEntryElement } from "./SideBarEntryElement";

@tag("side-bar-body-element")
export class SideBarBodyElement extends HTMLElement {
  private control?: AbortController;

  constructor() {
    super();
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.initialRender();
    chatStore.addEventListener(
      "load",
      this.initialRender.bind(this),
      this.control,
    );
    chatStore.addEventListener(
      "create",
      this.onCreate.bind(this) as any,
      this.control,
    );
    chatStore.addEventListener(
      "delete",
      this.onDelete.bind(this) as any,
      this.control,
    );
    chatStore.addEventListener(
      "move",
      this.onMove.bind(this) as any,
      this.control,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onCreate({ chat }: ChatCreateEvent) {
    this.prepend(createElement(SideBarEntryElement, { chat }));
  }

  private onDelete({ chat }: ChatDeleteEvent) {
    this.querySelector(`#chat-${chat.id}`)?.remove();
  }

  private onMove({ chat, toIndex }: ChatMoveEvent) {
    const element = this.querySelector(`#chat-${chat.id}`);
    if (!element) return;
    element.remove();
    const target = this.children[toIndex];
    if (target) target.before(element);
    else this.append(element);
  }

  private initialRender() {
    this.replaceChildren(
      ...chatStore.chats.map((chat) =>
        createElement(SideBarEntryElement, { chat }),
      ),
    );
  }
}
