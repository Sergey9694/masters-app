import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "District Master | Гиперлокальный Двигатель Тендеров",
  description: "Экосистема для поиска мастеров в вашем районе (Академический). Быстро, надежно, рядом.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
        {/*
           DESKTOP: bottom-right (Global default)
           MOBILE: top-center (Handled by Sonner's internal responsive logic where possible or override)
        */}
        <Toaster 
          theme="dark" 
          closeButton
          // Desktop requirement: bottom-right
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'rgba(13, 15, 22, 0.95)',
              backdropFilter: 'blur(32px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              fontFamily: 'var(--font-outfit)',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            },
            className: "premium-toast",
          }}
          // Success styling with our Emerald accent
          classNames={{
            toast: "glass-premium font-sans",
            success: "![border-color:var(--ui-accent-emerald)] ![color:var(--ui-accent-emerald)] bg-emerald-950/40",
            info: "!border-blue-500/50 text-blue-400",
            error: "!border-red-500/50 text-red-500",
          }}
        />
        {/* Global CSS override for mobile position since Sonner is client-side */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 640px) {
            [data-sonner-toaster] {
              top: 20px !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              bottom: auto !important;
            }
            [data-sonner-toast] {
              width: 90% !important;
              margin: 0 auto !important;
            }
          }
        `}} />
      </body>
    </html>
  );
}
