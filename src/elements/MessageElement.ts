import "./MessageElement.css";
import { ChatMessage } from "../state/database";
import { parseThinking } from "../parser";

@tag("message-element")
export class MessageElement extends HTMLElement {
  private thinkingElement: HTMLElement;
  private contentElement: HTMLElement;

  #message?: ChatMessage;
  get message() {
    return this.#message;
  }
  set message(message: ChatMessage | undefined) {
    this.#message = message;
    this.id = message ? `msg-${message.id}` : "";
    this.contentElement.innerText = message?.content || "";
    if (message) {
      this.setAttribute("role", message.role);
      const { thinking, content } = parseThinking(message.content);
      this.thinkingElement.innerText = thinking;
      this.contentElement.innerText = content;
    } else {
      this.thinkingElement.innerText = this.contentElement.innerText = "";
      this.removeAttribute("role");
    }
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.thinkingElement = createElement("div", { className: "thinking" })),
      (this.contentElement = createElement("div", { className: "content" })),
    );
  }
}
