import "./LandingView.css";
import { MessageInputElement } from "../elements/MessageInputElement";
import { SelectedModelSubject } from "../state/SelectedModelSubject";
import { startChat } from "../services/chats";

@tag("landing-view")
export class LandingView extends HTMLElement {
  private messageInput: MessageInputElement;
  private chatControl?: AbortController;

  constructor() {
    super();
    this.replaceChildren(
      createElement("h1", {}, "What's on your mind?"),
      (this.messageInput = createElement(MessageInputElement, {
        onsubmit: this.onSubmit.bind(this),
      })),
    );
  }

  disconnectedCallback() {
    this.chatControl?.abort();
    delete this.chatControl;
  }

  private async onSubmit() {
    this.chatControl?.abort();
    this.chatControl = new AbortController();
    const { message, think } = this.messageInput;
    const model = SelectedModelSubject.current();
    if (!model) return alert("No model selected.");
    try {
      this.messageInput.loading = true;
      const chat = await startChat({
        model,
        message,
        think,
        signal: this.chatControl.signal,
      });
      const { aborted } = this.chatControl.signal;
      delete this.chatControl;
      if (!aborted) history.replaceState({}, "", `/chat/${chat.id}`);
    } catch (error) {
      if (!String(error).startsWith("AbortError: "))
        alert(`Couldn't connect to Ollama instance.\n${error}`);
    } finally {
      this.messageInput.loading = false;
    }
  }
}
