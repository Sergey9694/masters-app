"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Script from "next/script";

interface TWAContextType {
  ready: boolean;
}

const TWAContext = createContext<TWAContextType>({ ready: false });

export function TWAProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      setReady(true);
    }
  }, []);

  return (
    <TWAContext.Provider value={{ ready }}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      {children}
    </TWAContext.Provider>
  );
}

export const useTWA = () => useContext(TWAContext);
