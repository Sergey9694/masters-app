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
            className: "glass-premium !border-white/10 !rounded-[20px] !p-5 !font-outfit",
            style: {
               background: 'linear-gradient(135deg, rgba(8,145,178,0.9), rgba(79,70,229,0.9))',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }
          }}
        />
      </body>
    </html>
  );
}
