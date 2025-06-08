import "./LandingView.css";
import { MessageInputElement } from "../elements/MessageInputElement";
import { startChat } from "../services/chats";

@tag("landing-view")
export class LandingView extends HTMLElement {
  private messageInput: MessageInputElement;

  constructor() {
    super();
    this.replaceChildren(
      createElement("h1", {}, "What's on your mind?"),
      (this.messageInput = createElement(MessageInputElement, {
        onsubmit: this.onSubmit.bind(this),
      })),
    );
  }

  private async onSubmit() {
    const { value } = this.messageInput;
    const chat = await startChat({ model: "qwen3:0.6b", userMessage: value });
    history.replaceState({}, "", `/chat/${chat.id}`);
  }
}
