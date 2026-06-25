"use client";

import { useSearchParams } from "next/navigation";
import MessagesTab from "../../components/MessagesTab";
import { useBreezyApp } from "../BreezyAppProvider";

export default function MessagesPage() {
  const { conversations, triggerToast } = useBreezyApp();
  const searchParams = useSearchParams();
  const activeUsername = searchParams ? searchParams.get("username") : null;

  return (
    <MessagesTab
      key="messages"
      conversations={conversations.conversations}
      onUpdateConversations={conversations.setConversations}
      triggerToast={triggerToast}
      initialActiveUsername={activeUsername || undefined}
    />
  );
}
