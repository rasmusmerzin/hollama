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

  getChatLastModel(chatId: string): string | undefined {
    const chat = this.getChat(chatId);
    if (!chat?.messages.length) return undefined;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      const message = chat.messages[i];
      if (message.model) return message.model;
    }
  }

  createChat(title: string): Chat {
    const id = crypto.randomUUID();
    const created = new Date().toISOString();
    const updated = created;
    const chat: Chat = { id, title, created, updated, messages: [] };
    this.chats.unshift(chat);
    database.then((db) => db.put("chats", chat));
    this.dispatchEvent(new ChatCreateEvent(chat));
    return chat;
  }

  deleteChat(chatId: string): boolean {
    const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);
    if (chatIndex === -1) return false;
    const [chat] = this.chats.splice(chatIndex, 1);
    database.then((db) => db.delete("chats", chatId));
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

  lockChat(chatId: string): boolean {
    const chat = this.getChat(chatId);
    if (!chat || chat.locked) return false;
    chat.locked = true;
    this.dispatchEvent(new ChatLockEvent(chat));
    return true;
  }

  unlockChat(chatId: string): boolean {
    const chat = this.getChat(chatId);
    if (!chat || !chat.locked) return false;
    delete chat.locked;
    this.dispatchEvent(new ChatUnlockEvent(chat));
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
      role,
      model,
      content,
      thinking,
      created,
      updated,
    };
    chat.updated = new Date().toISOString();
    chat.messages.push(message);
    this.moveChatToTop(chatId);
    database.then((db) => db.put("chats", chat));
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
    const message = chat.messages.find((msg) => msg.id === messageId);
    if (!message) return undefined;
    message.content += content;
    if (thinking) message.thinking = (message.thinking || "") + thinking;
    message.updated = chat.updated = new Date().toISOString();
    database.then((db) => db.put("chats", chat));
    this.dispatchEvent(new ChatAppendEvent(chat, message));
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
    this.dispatchEvent(
      new ChatLoadEvent(
        (this.chats = chats.reverse().map((chat) => {
          delete chat.locked;
          return chat;
        })),
      ),
    );
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

export class ChatLockEvent extends Event {
  constructor(readonly chat: Chat) {
    super("lock");
  }
}

export class ChatUnlockEvent extends Event {
  constructor(readonly chat: Chat) {
    super("unlock");
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

export class ChatMoveEvent extends Event {
  constructor(
    readonly chat: Chat,
    readonly fromIndex: number,
    readonly toIndex: number,
  ) {
    super("move");
  }
}
