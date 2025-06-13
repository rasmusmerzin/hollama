import { Subject } from "./Subject";

export interface MessageInput {
  think: boolean;
}

export const MESSAGE_INPUT: MessageInput = Object.freeze({
  think: false,
});

export const MessageInputSubject = new Subject<MessageInput>(
  (() => {
    const stored = localStorage.getItem("message_input");
    if (stored) return { ...MESSAGE_INPUT, ...JSON.parse(stored) };
    return { ...MESSAGE_INPUT };
  })(),
);

setTimeout(() => {
  MessageInputSubject.subscribe((messageInput) => {
    localStorage.setItem("message_input", JSON.stringify(messageInput));
  }, null);
});
