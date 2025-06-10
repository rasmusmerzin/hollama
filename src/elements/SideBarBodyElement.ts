import { chatStore } from "../state/ChatStore";
import "./SideBarBodyElement.css";
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
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private initialRender() {
    this.replaceChildren(
      ...chatStore.chats.map((chat) =>
        createElement(SideBarEntryElement, { chat }),
      ),
    );
  }
}
