import { api } from "../api";
import { Conversation, MessageItem } from "../../types";

export class HttpConversationService {
  async fetchConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>("/conversations");
    return data;
  }

  async createConversation(payload: {
    name: string;
    username: string;
    avatar?: string;
  }): Promise<Conversation> {
    const { data } = await api.post<Conversation>("/conversations", payload);
    return data;
  }

  async sendMessage(conversationId: string, text: string): Promise<MessageItem> {
    const { data } = await api.post<MessageItem>(`/conversations/${conversationId}/messages`, { text });
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
}
