import { Chat, ChatMessage, database } from "./database";

export class ChatStore extends EventTarget {
  chats: Chat[] = [];

  constructor() {
    super();
    this.laodFromDatabase();
  }

  getChat(id: string): Chat | undefined {
    return this.chats.find((chat) => chat.id === id);
  }

  createChat(title: string): Chat {
    const id = crypto.randomUUID();
    const created = new Date().toISOString();
    const updated = created;
    const chat: Chat = { id, title, created, updated, messages: [] };
    this.chats.unshift(chat);
    this.dispatchEvent(new ChatCreateEvent(chat));
    return chat;
  }

  pushMessage(
    chatId: string,
    { id, role, model, content, created, updated }: Partial<ChatMessage> = {},
  ): ChatMessage | undefined {
    const chat = this.getChat(chatId);
    if (!chat) return undefined;
    if (!id) id = crypto.randomUUID();
    if (!role) role = "user";
    if (!content) content = "";
    if (!created) created = new Date().toISOString();
    if (!updated) updated = created;
    const message = { id, role, model, content, created, updated };
    chat.updated = new Date().toISOString();
    chat.messages.push(message);
    this.moveChatToTop(chatId);
    database.then((db) => db.put("chats", chat));
    this.dispatchEvent(new ChatPushEvent(chat, message));
    return message;
  }

  appendLastMessage(chatId: string, content: string): ChatMessage | undefined {
    const chat = this.getChat(chatId);
    if (!chat) return undefined;
    const message = chat.messages[chat.messages.length - 1];
    if (!message) return undefined;
    chat.updated = new Date().toISOString();
    message.content += content;
    this.moveChatToTop(chatId);
    database.then((db) => db.put("chats", chat));
    this.dispatchEvent(new ChatAppendEvent(chat, message));
    return message;
  }

  private moveChatToTop(chatId: string) {
    const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);
    if (chatIndex === -1) return;
    const [chat] = this.chats.splice(chatIndex, 1);
    this.chats.unshift(chat);
  }

  private async laodFromDatabase() {
    const db = await database;
    const chats = await db.getAllFromIndex("chats", "updated");
    this.dispatchEvent(new ChatLoadEvent((this.chats = chats.reverse())));
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
