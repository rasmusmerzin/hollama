import { ChatRole } from "../fetch/ollamaClient";
import { DBSchema, openDB } from "idb";

export interface Chat {
  id: string;
  title: string;
  created: string;
  updated: string;
  messages: ChatMessage[];
  locked?: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  model?: string;
  content: string;
  thinking?: string;
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
}

export const database = openDB<Database>("hollama", 1, {
  upgrade(db, _oldVersion, _newVersion, transaction) {
    if (!db.objectStoreNames.contains("chats"))
      db.createObjectStore("chats", { keyPath: "id" });
    const chatsStore = transaction.objectStore("chats");
    if (!chatsStore.indexNames.contains("updated"))
      chatsStore.createIndex("updated", "updated");
  },
});
