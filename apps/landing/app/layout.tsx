import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatDB — AI-Powered Database Assistant",
  description: "Open-source conversational interface for your databases. Natural language → SQL.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
