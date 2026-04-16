import type { Metadata } from "next";
import { Roboto_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin", "cyrillic"],
  variable: "--font-roboto-condensed",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "УслугиРядом — услуги рядом с вами",
  description: "Доска объявлений услуг в вашем городе. Найдите исполнителя или предложите свои услуги.",
};

import { ProfileSync } from "@/features/auth/ui/ProfileSync";
import { GlobalHaptics } from "@/shared/lib/telegram/GlobalHaptics";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${robotoCondensed.variable} ${jetbrainsMono.variable} font-sans`}>
        <script 
          src="https://telegram.org/js/telegram-web-app.js" 
          defer
        />
        <ProfileSync />
        <GlobalHaptics />
        {/*
           GLOBAL APP ROOT:
           All layout paddings are moved to .container-standard utility 
           to prevent double-padding conflicts.
        */}
        <main className="min-h-screen overflow-visible">
          {children}
        </main>

        <Toaster 
          theme="dark" 
          closeButton
          position="bottom-right" 
          toastOptions={{
            duration: 4000,
            className: "!border-none !rounded-[24px] !p-4 !font-sans",
            style: {
               background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.4), rgba(79, 70, 229, 0.4))',
               backdropFilter: 'blur(32px) saturate(200%)',
               WebkitBackdropFilter: 'blur(32px) saturate(200%)',
               border: '1px solid rgba(255, 255, 255, 0.15)',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }
          }}
        />
      </body>
    </html>
  );
}
