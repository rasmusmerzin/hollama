import { Chat, ChatMessage } from "../state/database";
import { chatStore } from "../state/ChatStore";
import { generateChatMessage } from "../fetch/ollamaClient";

export function startChat({
  model,
  userMessage: content,
  signal,
}: {
  model: string;
  userMessage: string;
  signal?: AbortSignal;
}): Promise<Chat> {
  content = content.trim();
  const delimIndex = Array.from(content).findIndex((char) =>
    ".!?\n".includes(char),
  );
  const title =
    (delimIndex === -1
      ? content
      : content.substring(0, delimIndex + 1).trim()
    ).substring(0, 128) || "New Chat";
  let chat: Chat | undefined;
  let message: ChatMessage | undefined;
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages: [{ role: "user", content }],
      signal,
      callback: (part) => {
        if (!chat) {
          chat = chatStore.createChat(title);
          chatStore.pushMessage(chat.id, { role: "user", content });
          chatStore.lockChat(chat.id);
          resolve(chat);
        }
        if (!message || message.role !== part.message.role)
          message = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
          });
        else chatStore.appendLastMessage(chat.id, part.message.content);
      },
    })
      .catch(reject)
      .finally(() => {
        if (chat) chatStore.unlockChat(chat.id);
        reject();
      }),
  );
}

export async function continueChat({
  chatId,
  model,
  userMessage: content,
  signal,
}: {
  chatId: string;
  model: string;
  userMessage: string;
  signal?: AbortSignal;
}): Promise<void> {
  const chat = chatStore.getChat(chatId);
  if (!chat) return;
  let resolved = false;
  let message: ChatMessage | undefined;
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages: [...chat.messages, { role: "user", content }],
      signal,
      callback: (part) => {
        if (!resolved) {
          resolved = true;
          resolve();
          chatStore.pushMessage(chat.id, { role: "user", content });
          chatStore.lockChat(chat.id);
        }
        if (!message || message.role !== part.message.role)
          message = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
          });
        else chatStore.appendLastMessage(chat.id, part.message.content);
      },
    })
      .catch(reject)
      .finally(() => {
        if (chat) chatStore.unlockChat(chat.id);
        reject();
      }),
  );
}
