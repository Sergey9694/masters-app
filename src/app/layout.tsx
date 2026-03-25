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
          expand={false} 
          visibleToasts={1} 
          toastOptions={{
            duration: 5000,
            style: {
              background: 'linear-gradient(to top right, #0891b2, #4f46e5)', 
              borderRadius: '24px',
              fontFamily: 'var(--font-outfit)',
              fontSize: '15px',
              fontWeight: '800',
              padding: '18px 28px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 30px 70px -15px rgba(34, 211, 238, 0.65)', 
            },
            classNames: {
              toast: "glass-premium !text-white !rounded-[24px] overflow-hidden !transition-none", 
              success: 
                "!bg-gradient-to-tr !from-cyan-600 !to-indigo-600 !border-white/40 !text-white " +
                "!shadow-[0_20px_50px_-10px_rgba(34,211,238,0.5)]",
              info: "!bg-gradient-to-tr !from-cyan-600 !to-indigo-600 !border-white/40 !text-white",
              error: "!bg-red-600 !border-white/30 !text-white !shadow-[0_15px_40px_-5px_rgba(239,68,68,0.5)]",
            }
          }}
        />
        {/* Global CSS override for dynamic mobile position & premium animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 640px) {
            [data-sonner-toaster] {
              top: 64px !important; 
              left: 50% !important;
              transform: translateX(-50%) !important;
              bottom: auto !important;
            }
            [data-sonner-toast] {
              width: calc(100vw - 40px) !important;
              margin: 0 auto !important;
            }
          }
          [data-sonner-toast][data-mounted="true"] {
            animation: toast-luxury-in 0.7s cubic-bezier(0.19, 1, 0.22, 1);
          }
          @keyframes toast-luxury-in {
            from { opacity: 0; transform: translateY(50px) scale(0.85); filter: blur(20px); }
            to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }
          [data-sonner-toast] {
            --toast-transition-duration: 0ms !important;
          }
        `}} />
      </body>
    </html>
  );
}
