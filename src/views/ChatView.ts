import "./ChatView.css";
import { Chat } from "../state/database";
import { ChatAppendEvent, ChatPushEvent, chatStore } from "../state/ChatStore";
import { InstalledModelsSubject } from "../state/ModelsSubject";
import { MessageElement } from "../elements/MessageElement";
import { MessageInputElement } from "../elements/MessageInputElement";
import { SelectedModelSubject } from "../state/SelectedModelSubject";
import { continueChat } from "../services/chats";

@tag("chat-view")
export class ChatView extends HTMLElement {
  private bodyElement: HTMLElement;
  private messageInput: MessageInputElement;
  private chatId: string;
  private chat?: Chat;
  private control?: AbortController;
  private chatControl?: AbortController;
  private atBottom = true;

  constructor({ chatId }: Record<string, string>) {
    super();
    this.chat = chatStore.getChat((this.chatId = chatId));
    this.replaceChildren(
      (this.bodyElement = createElement("div", { className: "body" })),
      (this.messageInput = createElement(MessageInputElement, {
        onsubmit: this.onSubmit.bind(this),
        oninput: this.onInput.bind(this),
      })),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.initialRender();
    this.addEventListener("scroll", this.onScroll.bind(this), {
      passive: true,
      signal: this.control.signal,
    });
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
    chatStore.addEventListener(
      "lock",
      this.updateDisabled.bind(this),
      this.control,
    );
    chatStore.addEventListener(
      "unlock",
      this.updateDisabled.bind(this),
      this.control,
    );
    const model = chatStore.getChatLastModel(this.chatId);
    if (
      model &&
      InstalledModelsSubject.current().some(
        (instance) => instance.name === model,
      )
    )
      SelectedModelSubject.next(model);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
    this.chatControl?.abort();
    delete this.chatControl;
  }

  private async onSubmit() {
    this.chatControl?.abort();
    this.chatControl = new AbortController();
    const { value } = this.messageInput;
    const model = SelectedModelSubject.current()!;
    try {
      this.messageInput.loading = true;
      await continueChat({
        chatId: this.chatId,
        model,
        userMessage: value,
        signal: this.chatControl.signal,
      });
      delete this.chatControl;
      this.messageInput.value = "";
    } catch (error) {
      // TODO: Alert
    } finally {
      this.messageInput.loading = false;
    }
  }

  private onChatPush({ chat, message }: ChatPushEvent) {
    if (this.chatId !== chat.id) return;
    this.bodyElement.append(createElement(MessageElement, { message }));
    if (this.atBottom) this.scrollTo({ top: this.scrollHeight });
  }

  private onChatAppend({ chat, message }: ChatAppendEvent) {
    if (this.chatId !== chat.id) return;
    const element = this.bodyElement.querySelector(`#msg-${message.id}`);
    if (!(element instanceof MessageElement)) return;
    element.message = message;
    if (this.atBottom) this.scrollTo({ top: this.scrollHeight });
  }

  private previousScrollTop = this.scrollTop;
  private onScroll() {
    const delta = this.scrollTop - this.previousScrollTop;
    this.previousScrollTop = this.scrollTop;
    if (delta < 0) this.atBottom = false;
    else this.atBottom = this.getScrollBottom() < 100;
  }

  private onInput() {
    if (this.atBottom) this.scrollTo({ top: this.scrollHeight });
  }

  private initialRender() {
    if (!this.chat) this.chat = chatStore.getChat(this.chatId);
    this.updateDisabled();
    this.bodyElement.replaceChildren(
      ...(this.chat?.messages.map((message) =>
        createElement(MessageElement, { message }),
      ) || []),
    );
    this.scrollTo({ top: this.scrollHeight });
  }

  private updateDisabled() {
    this.messageInput.disabled = !this.chat || this.chat.locked || false;
  }

  private getScrollBottom() {
    return this.scrollHeight - this.clientHeight - this.scrollTop;
  }
}
