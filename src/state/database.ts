import { ChatRole } from "../fetch/ollamaClient";
import { DBSchema, openDB } from "idb";

export interface Chat {
  id: string;
  title: string;
  created: string;
  updated: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: ChatRole;
  model?: string;
  content: string;
  thinking?: string;
  images?: string[];
  created: string;
  updated: string;
}

interface Database extends DBSchema {
  chats: {
    key: string;
    value: Chat;
    indexes: {
      updated: string;
    };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: {
      chatId: string;
    };
  };
}

export const database = openDB<Database>("hollama", 3, {
  async upgrade(db, _oldVersion, _newVersion, transaction) {
    if (!db.objectStoreNames.contains("chats"))
      db.createObjectStore("chats", { keyPath: "id" });
    const chatsStore = transaction.objectStore("chats");
    if (!chatsStore.indexNames.contains("updated"))
      chatsStore.createIndex("updated", "updated");
    if (!db.objectStoreNames.contains("messages"))
      db.createObjectStore("messages", { keyPath: "id" });
    const messagesStore = transaction.objectStore("messages");
    if (!messagesStore.indexNames.contains("chatId"))
      messagesStore.createIndex("chatId", "chatId");
    const chats = (await chatsStore.getAll()) as (Chat & {
      messages?: ChatMessage[];
      locked?: boolean;
    })[];
    for (const chat of chats) {
      const { messages } = chat;
      delete chat.locked;
      delete chat.messages;
      await chatsStore.put(chat);
      if (!messages) continue;
      for (const message of messages) {
        message.chatId = chat.id;
        await messagesStore.put(message);
      }
    }
  },
});
