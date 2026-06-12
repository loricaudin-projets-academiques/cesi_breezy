"use client";

import MessagesTab from "../../components/MessagesTab";
import { useBreezyApp } from "../BreezyAppProvider";

export default function MessagesPage() {
  const { conversations, triggerToast } = useBreezyApp();

  return (
    <MessagesTab
      key="messages"
      conversations={conversations.conversations}
      onUpdateConversations={conversations.setConversations}
      triggerToast={triggerToast}
    />
  );
}
