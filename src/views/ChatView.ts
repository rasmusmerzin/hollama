import "./ChatView.css";
import {
  ChatAppendEvent,
  ChatPopEvent,
  ChatPushEvent,
  chatStore,
} from "../state/ChatStore";
import { GeneratorHandlesSubject } from "../state/GeneratorHandlesSubject";
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
  private control?: AbortController;
  private chatControl?: AbortController;
  private atBottom = true;

  constructor({ chatId }: Record<string, string>) {
    super();
    this.chatId = chatId;
    this.replaceChildren(
      (this.bodyElement = createElement("div", { className: "body" })),
      (this.messageInput = createElement(MessageInputElement, {
        onsubmit: this.onSubmit.bind(this),
        onresize: this.onResize.bind(this),
        onstop: () => this.chatControl?.abort(),
      })),
    );
  }

  connectedCallback() {
    this.control?.abort();
    this.control = new AbortController();
    this.onLoad();
    addEventListener("resize", this.onResize.bind(this), this.control);
    this.addEventListener("scroll", this.onScroll.bind(this), {
      passive: true,
      signal: this.control.signal,
    });
    chatStore.addEventListener("load", this.onLoad.bind(this), this.control);
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
      "pop",
      this.onChatPop.bind(this) as any,
      this.control,
    );
    GeneratorHandlesSubject.subscribe((handles) => {
      this.chatControl = handles[this.chatId];
      this.messageInput.stoppable = !!this.chatControl;
    }, this.control);
  }

  disconnectedCallback() {
    this.control?.abort();
    delete this.control;
  }

  private async onSubmit() {
    const { message, think } = this.messageInput;
    const { chatId } = this;
    const model = SelectedModelSubject.current()!;
    try {
      this.messageInput.loading = true;
      await continueChat({ chatId, model, message, think });
      this.messageInput.clear();
    } catch (error) {
      if (!String(error).startsWith("AbortError: "))
        alert(`Couldn't connect to Ollama instance.\n${error}`);
    } finally {
      this.messageInput.loading = false;
    }
  }

  private onChatPush({ chat, message }: ChatPushEvent) {
    if (this.chatId !== chat.id) return;
    this.bodyElement.append(createElement(MessageElement, { chat, message }));
    if (this.atBottom) this.scrollToBottom();
  }

  private onChatAppend({ chat, message }: ChatAppendEvent) {
    if (this.chatId !== chat.id) return;
    const element = this.bodyElement.querySelector(`#msg-${message.id}`);
    if (!(element instanceof MessageElement)) return;
    element.message = message;
    if (this.atBottom) this.scrollToBottom();
  }

  private onChatPop({ chat, message }: ChatPopEvent) {
    if (this.chatId !== chat.id) return;
    this.bodyElement.querySelector(`#msg-${message.id}`)?.remove();
    this.atBottom = this.getScrollBottom() < 100;
  }

  private previousScrollTop = this.scrollTop;
  private onScroll() {
    const delta = this.scrollTop - this.previousScrollTop;
    this.previousScrollTop = this.scrollTop;
    if (delta < 0) this.atBottom = false;
    else this.atBottom = this.getScrollBottom() < 100;
  }

  private onResize() {
    if (this.atBottom) this.scrollToBottom();
  }

  private onLoad() {
    this.updateModel();
    this.fullRender();
    this.scrollToBottom();
  }

  private fullRender() {
    const messages = chatStore.messages.get(this.chatId) || [];
    this.bodyElement.replaceChildren(
      ...messages.map((message) => createElement(MessageElement, { message })),
    );
  }

  private updateModel() {
    const model = chatStore.getChatLastModel(this.chatId);
    if (
      model &&
      InstalledModelsSubject.current().some(
        (instance) => instance.name === model,
      )
    )
      SelectedModelSubject.next(model);
  }

  private getScrollBottom() {
    return this.scrollHeight - this.clientHeight - this.scrollTop;
  }

  private scrollToBottom() {
    this.scrollTo({ top: this.scrollHeight });
    this.previousScrollTop = this.scrollTop;
  }
}
