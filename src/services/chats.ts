import { Chat, ChatMessage } from "../state/database";
import { chatStore } from "../state/ChatStore";
import { generateChatMessage } from "../fetch/ollamaClient";
import { trackGeneratorHandle } from "../state/GeneratorHandlesSubject";

export function startChat({
  model,
  userMessage: content,
  think,
  signal,
}: {
  model: string;
  userMessage: string;
  think?: boolean;
  signal?: AbortSignal;
}): Promise<Chat> {
  content = content.trim();
  const delimIndex = Array.from(content).findIndex((char) =>
    ".!?\n".includes(char),
  );
  const title =
    (delimIndex === -1
      ? content.trim()
      : content.substring(0, delimIndex + 1).trim()
    ).substring(0, 128) || "New Chat";
  let chat: Chat | undefined;
  let message: ChatMessage | undefined;
  const control = new AbortController();
  signal?.addEventListener("abort", () => control.abort());
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages: [{ role: "user", content }],
      think,
      signal: control.signal,
      onpart(part) {
        if (!chat) {
          chat = chatStore.createChat(title);
          chatStore.pushMessage(chat.id, { role: "user", content });
          chatStore.lockChat(chat.id);
          trackGeneratorHandle(chat.id, control);
          resolve(chat);
        }
        if (!message || message.role !== part.message.role)
          message = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
            thinking: part.message.thinking,
          });
        else
          chatStore.appendMessage(
            chat.id,
            message.id,
            part.message.content,
            part.message.thinking,
          );
      },
    })
      .catch(reject)
      .finally(() => {
        control.abort();
        if (chat?.locked) chatStore.unlockChat(chat.id);
        reject();
      }),
  );
}

export async function continueChat({
  chatId,
  model,
  userMessage: content,
  think,
}: {
  chatId: string;
  model: string;
  userMessage: string;
  think?: boolean;
}): Promise<void> {
  const chat = chatStore.getChat(chatId);
  if (!chat) return;
  let message: ChatMessage | undefined;
  chatStore.lockChat(chat.id);
  const control = new AbortController();
  trackGeneratorHandle(chat.id, control);
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages: [...chat.messages, { role: "user", content }],
      think,
      signal: control.signal,
      onok() {
        resolve();
        chatStore.pushMessage(chat.id, { role: "user", content });
      },
      onpart(part) {
        resolve();
        if (!message || message.role !== part.message.role)
          message = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
            thinking: part.message.thinking,
          });
        else
          chatStore.appendMessage(
            chat.id,
            message.id,
            part.message.content,
            part.message.thinking,
          );
      },
    })
      .catch(reject)
      .finally(() => {
        control.abort();
        if (chat.locked) chatStore.unlockChat(chat.id);
        reject();
      }),
  );
}
