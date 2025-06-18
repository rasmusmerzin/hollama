import { Chat, ChatMessage, database } from "./database";

export class ChatStore extends EventTarget {
  chats: Chat[] = [];
  messages = new Map<string, ChatMessage[]>();

  constructor() {
    super();
    this.laodFromDatabase();
  }

  getChat(id: string): Chat | undefined {
    return this.chats.find((chat) => chat.id === id);
  }

  getChatLastModel(chatId: string): string | undefined {
    const messages = this.messages.get(chatId);
    if (!messages?.length) return undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.model) return message.model;
    }
  }

  createChat(title: string): Chat {
    const id = crypto.randomUUID();
    const created = new Date().toISOString();
    const updated = created;
    const chat: Chat = { id, title, created, updated };
    this.chats.unshift(chat);
    database.then((db) => db.put("chats", chat));
    this.dispatchEvent(new ChatCreateEvent(chat));
    return chat;
  }

  deleteChat(chatId: string): boolean {
    const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);
    if (chatIndex === -1) return false;
    const [chat] = this.chats.splice(chatIndex, 1);
    const messages = this.messages.get(chatId);
    this.messages.delete(chatId);
    database.then((db) => {
      const transaction = db.transaction(["chats", "messages"], "readwrite");
      transaction.objectStore("chats").delete(chatId);
      messages?.forEach((msg) =>
        transaction.objectStore("messages").delete(msg.id),
      );
    });
    this.dispatchEvent(new ChatDeleteEvent(chat, chatIndex));
    return true;
  }

  renameChat(chatId: string, title: string): boolean {
    const chat = this.getChat(chatId);
    if (!chat) return false;
    if (chat.title.trim() === title.trim()) return false;
    chat.title = title.trim();
    chat.updated = new Date().toISOString();
    this.moveChatToTop(chatId);
    database.then((db) => db.put("chats", chat));
    this.dispatchEvent(new ChatRenameEvent(chat));
    return true;
  }

  pushMessage(
    chatId: string,
    {
      id,
      role,
      model,
      content,
      thinking,
      images,
      created,
      updated,
    }: Partial<ChatMessage> = {},
  ): ChatMessage | undefined {
    const chat = this.getChat(chatId);
    if (!chat) return undefined;
    if (!id) id = crypto.randomUUID();
    if (!role) role = "user";
    if (!content) content = "";
    if (!created) created = new Date().toISOString();
    if (!updated) updated = created;
    const message: ChatMessage = {
      id,
      chatId,
      role,
      model,
      content,
      thinking,
      images,
      created,
      updated,
    };
    chat.updated = new Date().toISOString();
    const messages = this.messages.get(chatId) || [];
    messages.push(message);
    this.messages.set(chatId, messages);
    this.moveChatToTop(chatId);
    database.then((db) => {
      const transaction = db.transaction(["chats", "messages"], "readwrite");
      transaction.objectStore("chats").put(chat);
      transaction.objectStore("messages").put(message);
    });
    this.dispatchEvent(new ChatPushEvent(chat, message));
    return message;
  }

  appendMessage(
    chatId: string,
    messageId: string,
    content: string,
    thinking?: string,
  ): ChatMessage | undefined {
    const chat = this.getChat(chatId);
    if (!chat) return undefined;
    const messages = this.messages.get(chatId);
    const message = messages?.find((msg) => msg.id === messageId);
    if (!message) return undefined;
    message.content += content;
    if (thinking) message.thinking = (message.thinking || "") + thinking;
    message.updated = chat.updated = new Date().toISOString();
    database.then((db) => {
      const transaction = db.transaction(["chats", "messages"], "readwrite");
      transaction.objectStore("chats").put(chat);
      transaction.objectStore("messages").put(message);
    });
    this.dispatchEvent(new ChatAppendEvent(chat, message));
    return message;
  }

  popMessage(chatId: string, messageId: string): ChatMessage | undefined {
    const chat = this.getChat(chatId);
    if (!chat) return undefined;
    const messages = this.messages.get(chatId);
    if (!messages?.length) return undefined;
    const fromIndex = messages.findIndex((msg) => msg.id === messageId);
    if (fromIndex < 0) return undefined;
    const [message] = messages.splice(fromIndex, 1);
    if (!messages.length) this.messages.delete(chatId);
    chat.updated = new Date().toISOString();
    database.then((db) => {
      const transaction = db.transaction(["chats", "messages"], "readwrite");
      transaction.objectStore("chats").put(chat);
      transaction.objectStore("messages").delete(message.id);
    });
    this.dispatchEvent(new ChatPopEvent(chat, message, fromIndex));
    return message;
  }

  private moveChatToTop(chatId: string) {
    const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);
    if (chatIndex === -1 || chatIndex === 0) return;
    const [chat] = this.chats.splice(chatIndex, 1);
    this.chats.unshift(chat);
    this.dispatchEvent(new ChatMoveEvent(chat, chatIndex, 0));
  }

  private async laodFromDatabase() {
    const db = await database;
    const chats = await db.getAllFromIndex("chats", "updated");
    this.chats = chats.reverse();
    for (const chat of this.chats) {
      const messages = await db.getAllFromIndex("messages", "chatId", chat.id);
      this.messages.set(
        chat.id,
        messages.sort((a, b) => {
          if (a.created < b.created) return -1;
          if (a.created > b.created) return 1;
          return 0;
        }),
      );
    }
    this.dispatchEvent(new ChatLoadEvent(this.chats));
  }
}

export const chatStore = new ChatStore();

export class ChatLoadEvent extends Event {
  constructor(readonly chats: Chat[]) {
    super("load");
  }
}

export class ChatCreateEvent extends Event {
  constructor(readonly chat: Chat) {
    super("create");
  }
}

export class ChatRenameEvent extends Event {
  constructor(readonly chat: Chat) {
    super("rename");
  }
}

export class ChatDeleteEvent extends Event {
  constructor(
    readonly chat: Chat,
    readonly fromIndex: number,
  ) {
    super("delete");
  }
}

export class ChatPushEvent extends Event {
  constructor(
    readonly chat: Chat,
    readonly message: ChatMessage,
  ) {
    super("push");
  }
}

export class ChatAppendEvent extends Event {
  constructor(
    readonly chat: Chat,
    readonly message: ChatMessage,
  ) {
    super("append");
  }
}

export class ChatPopEvent extends Event {
  constructor(
    readonly chat: Chat,
    readonly message: ChatMessage,
    readonly fromIndex: number,
  ) {
    super("pop");
  }
}

export class ChatMoveEvent extends Event {
  constructor(
    readonly chat: Chat,
    readonly fromIndex: number,
    readonly toIndex: number,
  ) {
    super("move");
  }
}
