import "./MessageElement.css";
import { Chat, ChatMessage } from "../state/database";
import { ContextMenuElement } from "./ContextMenuElement";
import { ICON_COPY } from "../icons";
import { ImageThumbnailElement } from "./ImageThumbnailElement";
import { chatStore } from "../state/ChatStore";
import { md, parseThinking } from "../parser";

@tag("message-element")
export class MessageElement extends HTMLElement {
  private modelElement: HTMLElement;
  private imagesElement: HTMLElement;
  private thinkingElement: HTMLElement;
  private contentElement: HTMLElement;

  chat?: Chat;
  #message?: ChatMessage;
  get message() {
    return this.#message;
  }
  set message(message: ChatMessage | undefined) {
    this.#message = message;
    this.id = message ? `msg-${message.id}` : "";
    this.contentElement.innerText = message?.content || "";
    this.modelElement.innerText = message?.model || "";
    this.imagesElement.replaceChildren(
      ...(message?.images || []).map((dataUrl) =>
        createElement(ImageThumbnailElement, { src: dataUrl }),
      ),
    );
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
      this.renderCodeHandles();
    } else {
      this.thinkingElement.innerText = this.contentElement.innerText = "";
      this.removeAttribute("role");
    }
  }

  constructor() {
    super();
    this.oncontextmenu = this.openContextMenu.bind(this);
    this.replaceChildren(
      (this.modelElement = createElement("div", { className: "model" })),
      (this.imagesElement = createElement("div", { className: "images" })),
      (this.thinkingElement = createElement("div", { className: "thinking" })),
      (this.contentElement = createElement("div", { className: "content" })),
    );
  }

  private renderCodeHandles() {
    const pres = this.contentElement.getElementsByTagName("pre");
    for (const pre of pres)
      pre.append(
        createElement("button", {
          innerHTML: ICON_COPY,
          onclick: () => navigator.clipboard.writeText(pre.innerText),
        }),
      );
  }

  private openContextMenu() {
    this.classList.add("active");
    document.body.append(
      createElement(ContextMenuElement, {
        width: 150,
        ondisconnect: () => {
          this.classList.remove("active");
        },
        items: [
          ...(this.message?.thinking && this.message.content
            ? [
                {
                  label: "Copy All",
                  action: () =>
                    this.message &&
                    navigator.clipboard.writeText(
                      [this.message.thinking, this.message.content]
                        .filter(Boolean)
                        .join("\n\n"),
                    ),
                },
                {
                  label: "Copy Content",
                  action: () =>
                    this.message &&
                    navigator.clipboard.writeText(this.message.content),
                },
                {
                  label: "Copy Thinking",
                  action: () =>
                    this.message &&
                    navigator.clipboard.writeText(this.message.thinking || ""),
                },
              ]
            : [
                {
                  label: "Copy",
                  action: () =>
                    this.message &&
                    navigator.clipboard.writeText(
                      this.message.content || this.message.thinking || "",
                    ),
                },
              ]),
          "div",
          {
            label: "Delete",
            action: () =>
              this.chat &&
              this.message &&
              chatStore.popMessage(this.chat.id, this.message.id),
          },
        ],
      }),
    );
  }
}
