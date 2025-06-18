import { Chat, ChatMessage } from "../state/database";
import { chatStore } from "../state/ChatStore";
import { ChatRole, generateChatMessage } from "../fetch/ollamaClient";
import { trackGeneratorHandle } from "../state/GeneratorHandlesSubject";

export function startChat({
  model,
  message: inputMessage,
  think,
  signal,
}: {
  model: string;
  message: { role: ChatRole; content: string; images?: string[] };
  think?: boolean;
  signal?: AbortSignal;
}): Promise<Chat> {
  const content = (inputMessage.content || "").trim();
  const delimIndex = Array.from(content).findIndex((char) =>
    ".!?\n".includes(char),
  );
  const title =
    (delimIndex === -1
      ? content.trim()
      : content.substring(0, delimIndex + 1).trim()
    ).substring(0, 128) || "New Chat";
  let chat: Chat | undefined;
  let targetMessage: ChatMessage | undefined;
  const control = new AbortController();
  signal?.addEventListener("abort", () => control.abort());
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages: [inputMessage],
      think,
      signal: control.signal,
      onpart(part) {
        if (!chat) {
          chat = chatStore.createChat(title);
          chatStore.pushMessage(chat.id, inputMessage);
          chatStore.lockChat(chat.id);
          trackGeneratorHandle(chat.id, control);
          resolve(chat);
        }
        if (!targetMessage || targetMessage.role !== part.message.role)
          targetMessage = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
            thinking: part.message.thinking,
          });
        else
          chatStore.appendMessage(
            chat.id,
            targetMessage.id,
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
  message: inputMessage,
  think,
}: {
  chatId: string;
  model: string;
  message: { role: ChatRole; content: string; images?: string[] };
  think?: boolean;
}): Promise<void> {
  const chat = chatStore.getChat(chatId);
  if (!chat) return;
  let targetMessage: ChatMessage | undefined;
  chatStore.lockChat(chat.id);
  const control = new AbortController();
  trackGeneratorHandle(chat.id, control);
  return new Promise((resolve, reject) =>
    generateChatMessage({
      model,
      messages: [...chat.messages, inputMessage],
      think,
      signal: control.signal,
      onok() {
        resolve();
        chatStore.pushMessage(chat.id, inputMessage);
      },
      onpart(part) {
        resolve();
        if (!targetMessage || targetMessage.role !== part.message.role)
          targetMessage = chatStore.pushMessage(chat.id, {
            model,
            role: part.message.role,
            content: part.message.content,
            thinking: part.message.thinking,
          });
        else
          chatStore.appendMessage(
            chat.id,
            targetMessage.id,
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
