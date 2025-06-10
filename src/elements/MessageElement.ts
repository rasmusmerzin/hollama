import "./MessageElement.css";
import { ChatMessage } from "../state/database";

@tag("message-element")
export class MessageElement extends HTMLElement {
  #message?: ChatMessage;
  get message() {
    return this.#message;
  }
  set message(message: ChatMessage | undefined) {
    this.#message = message;
    this.id = message ? `msg-${message.id}` : "";
    this.innerText = message?.content || "";
  }
}
