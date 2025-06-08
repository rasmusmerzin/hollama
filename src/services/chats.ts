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
  const chat = chatStore.createChat(title);
  chatStore.pushMessage(chat.id, { role: "user", content });
  chatStore.lockChat(chat.id);
  const { messages } = chat;
  let message: ChatMessage | undefined;
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages,
      signal,
      callback: (part) => {
        resolve(chat);
        if (!message || message.role !== part.message.role)
          message = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
          });
        else chatStore.appendLastMessage(chat.id, part.message.content);
      },
    })
      .catch((error) => {
        if (!message) chatStore.deleteChat(chat.id);
        reject(error);
      })
      .finally(() => {
        chatStore.unlockChat(chat.id);
        reject();
      }),
  );
}
