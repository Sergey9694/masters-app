import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

import { ProfileSync } from "@/features/auth/ui/ProfileSync";
import { GlobalHaptics } from "@/shared/lib/telegram/GlobalHaptics";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { GeoToastListener } from "@/features/geo-search/ui/GeoToastListener";
import { ChatNotificationListener } from "@/features/chat/ui/ChatNotificationListener";
import { auth } from "@/auth";
import { getSession } from "@/shared/lib/auth";

const geistSans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "УслугиРядом — услуги рядом с вами",
  description:
    "Доска объявлений услуг в вашем городе. Найдите исполнителя или предложите свои услуги.",
};

async function getRealtimeUserId() {
  try {
    const session = await auth();
    if (session?.user?.id) return session.user.id;
  } catch (error) {
    console.error("[RootLayout] Failed to read Auth.js session for realtime", error);
  }

  try {
    const session = await getSession();
    return session?.userId ?? undefined;
  } catch (error) {
    console.error("[RootLayout] Failed to read custom session for realtime", error);
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const realtimeUserId = await getRealtimeUserId();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Script
            src="https://telegram.org/js/telegram-web-app.js"
            strategy="afterInteractive"
          />
          <ProfileSync />
          <GlobalHaptics />
          <GeoToastListener />
          <ChatNotificationListener userId={realtimeUserId} />

          <main className="min-h-screen">{children}</main>

          <Toaster
            theme="system"
            closeButton
            position="bottom-right"
            toastOptions={{ duration: 4000 }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
