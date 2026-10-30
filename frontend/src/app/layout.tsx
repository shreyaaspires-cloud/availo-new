import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusShare — Institutional & Community Resource Sharing",
  description:
    "A trusted, auditable platform that helps institutions safely share underused spaces, equipment, and technical resources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
