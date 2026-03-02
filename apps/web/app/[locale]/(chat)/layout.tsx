import { setRequestLocale } from "next-intl/server";
import { ChatLayoutClient } from "@/components/chat/chat-layout-client";

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChatLayoutClient>{children}</ChatLayoutClient>;
}
