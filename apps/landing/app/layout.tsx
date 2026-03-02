import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased manga-halftone overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
