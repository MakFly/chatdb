export const CONVERSATION_CREATED = "conversation-created";

export function emitConversationCreated(conversation: {
  id: string;
  title: string;
}) {
  window.dispatchEvent(
    new CustomEvent(CONVERSATION_CREATED, { detail: conversation })
  );
}

export function onConversationCreated(
  callback: (conversation: { id: string; title: string }) => void
) {
  const handler = (e: Event) => callback((e as CustomEvent).detail);
  window.addEventListener(CONVERSATION_CREATED, handler);
  return () => window.removeEventListener(CONVERSATION_CREATED, handler);
}
