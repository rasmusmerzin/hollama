import "./ChatView.css";
import { Chat, ChatMessage } from "../state/database";
import { ChatAppendEvent, ChatPushEvent, chatStore } from "../state/ChatStore";
import { MessageInputElement } from "../elements/MessageInputElement";
import { MessageElement } from "../elements/MessageElement";

@tag("chat-view")
export class ChatView extends HTMLElement {
  private bodyElement: HTMLElement;
  private messageInput: MessageInputElement;
  private chatId: string;
  private chat?: Chat;
  private control?: AbortController;

  constructor({ chatId }: Record<string, string>) {
    super();
    this.chat = chatStore.getChat((this.chatId = chatId));
    this.replaceChildren(
      (this.bodyElement = createElement("div", { className: "body" })),
      (this.messageInput = createElement(MessageInputElement)),
    );
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
      "push",
      this.onChatPush.bind(this) as any,
      this.control,
    );
    chatStore.addEventListener(
      "append",
      this.onChatAppend.bind(this) as any,
      this.control,
    );
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private onChatPush({ chat, message }: ChatPushEvent) {
    if (this.chatId !== chat.id) return;
    this.bodyElement.append(createElement(MessageElement, { message }));
  }

  private onChatAppend({ chat, message }: ChatAppendEvent) {
    if (this.chatId !== chat.id) return;
    const element = this.bodyElement.querySelector(`#msg-${message.id}`);
    if (!(element instanceof MessageElement)) return;
    element.message = message;
  }

  private initialRender() {
    if (!this.chat) this.chat = chatStore.getChat(this.chatId);
    this.bodyElement.replaceChildren(
      ...(this.chat?.messages.map((message) =>
        createElement(MessageElement, { message }),
      ) || []),
    );
  }
}
