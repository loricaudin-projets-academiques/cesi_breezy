import { api } from "../api";
import { IStorageProvider } from "../storage/IStorageProvider";
import { IConversationService } from "./IConversationService";
import { Conversation, MessageItem } from "../../types";
import { normalizeUsername } from "../../utils/username";

const CONVERSATIONS_KEY = "breezy_conversations";

export class HttpConversationService implements IConversationService {
  constructor(private storage: IStorageProvider) {}

  getConversations(): Conversation[] {
    return this.storage.get<Conversation[]>(CONVERSATIONS_KEY) || [];
  }

  saveConversations(conversations: Conversation[]): void {
    this.storage.set<Conversation[]>(CONVERSATIONS_KEY, conversations);
  }

  createConversation(name: string, username: string, avatar?: string): Conversation {
    return {
      id: `conv-${Date.now()}`,
      name: name.trim(),
      username: normalizeUsername(username),
      avatar: avatar?.trim() || "",
      lastMessage: "Conversation demarree",
      unreadCount: 0,
      time: "A l'instant",
      online: true,
      messages: [],
    };
  }

  async fetchConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>("/conversations");
    this.saveConversations(data);
    return data;
  }

  async createRemoteConversation(payload: {
    name: string;
    username: string;
    avatar?: string;
  }): Promise<Conversation> {
    const { data } = await api.post<Conversation>("/conversations", payload);
    this.saveConversations([data, ...this.getConversations().filter((item) => item.id !== data.id)]);
    return data;
  }

  async sendMessage(conversationId: string, text: string): Promise<MessageItem> {
    const { data } = await api.post<MessageItem>(`/conversations/${conversationId}/messages`, { text });
    this.saveConversations(this.getConversations().map((conversation) => {
      if (conversation.id !== conversationId) {
        return conversation;
      }

      return {
        ...conversation,
        messages: [...conversation.messages, data],
        lastMessage: data.text,
        time: data.time,
      };
    }));
    return data;
  }

  async fetchReply(
    message: string,
    contact: Pick<Conversation, "name" | "username">
  ): Promise<string> {
    const { data } = await api.post<{ reply: string }>("/conversations/reply", {
      message,
      contact,
    });

    return data.reply;
  }

  clearData(): void {
    this.storage.remove(CONVERSATIONS_KEY);
  }
}
