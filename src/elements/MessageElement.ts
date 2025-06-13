import "./MessageElement.css";
import { ChatMessage } from "../state/database";
import { md, parseThinking } from "../parser";

@tag("message-element")
export class MessageElement extends HTMLElement {
  private modelElement: HTMLElement;
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
    this.modelElement.innerText = message?.model || "";
    if (message) {
      this.setAttribute("role", message.role);
      if (message.thinking) {
        this.thinkingElement.innerHTML = md.render(message.thinking.trim());
        this.contentElement.innerHTML = md.render(message.content.trim());
      } else {
        const { thinking, content } = parseThinking(message.content);
        this.thinkingElement.innerHTML = md.render(thinking.trim());
        this.contentElement.innerHTML = md.render(content.trim());
      }
    } else {
      this.thinkingElement.innerText = this.contentElement.innerText = "";
      this.removeAttribute("role");
    }
  }

  constructor() {
    super();
    this.replaceChildren(
      (this.modelElement = createElement("div", { className: "model" })),
      (this.thinkingElement = createElement("div", { className: "thinking" })),
      (this.contentElement = createElement("div", { className: "content" })),
    );
  }
}
