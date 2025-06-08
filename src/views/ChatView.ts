import "./ChatView.css";
import { Chat, ChatMessage } from "../state/database";
import { ChatAppendEvent, ChatPushEvent, chatStore } from "../state/ChatStore";
import { MessageInputElement } from "../elements/MessageInputElement";

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
    this.bodyElement.append(Message(message));
  }

  private onChatAppend({ chat, message }: ChatAppendEvent) {
    if (this.chatId !== chat.id) return;
    const current = this.bodyElement.querySelector(`#u-${message.id}`);
    current?.replaceWith(Message(message));
  }

  private initialRender() {
    if (!this.chat) this.chat = chatStore.getChat(this.chatId);
    this.bodyElement.replaceChildren(
      ...(this.chat?.messages.map(Message) || []),
    );
  }
}

function Message(message: ChatMessage) {
  return createElement(
    "pre",
    { id: `u-${message.id}`, style: "white-space: pre-wrap;" },
    JSON.stringify(message, null, 2),
  );
}
