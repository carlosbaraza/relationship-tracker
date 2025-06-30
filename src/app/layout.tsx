import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elector - Relationship Tracker",
  description: "Simple relationship tracker to log interactions with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-black">
      <body className="antialiased min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <SessionProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
