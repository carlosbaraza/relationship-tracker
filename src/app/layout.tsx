import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/components/AuthProvider";
import PWALifecycle from "@/components/PWALifecycle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elector - Relationship Tracker",
  description: "Simple relationship tracker to log interactions with friends",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [{ url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elector",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Elector",
    title: "Elector - Relationship Tracker",
    description: "Simple relationship tracker to log interactions with friends",
  },
  twitter: {
    card: "summary",
    title: "Elector - Relationship Tracker",
    description: "Simple relationship tracker to log interactions with friends",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-black">
      <head>
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Elector" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/icon-256.png" />

        {/* Additional PWA tags */}
        <meta name="application-name" content="Elector" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Preload critical resources */}
        <link rel="preload" href="/manifest.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <SessionProvider>
          <AuthProvider>
            <PWALifecycle />
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
