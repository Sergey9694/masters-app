"use client";

import { useEffect } from "react";
import { syncProfileAction } from "../api/sync-action";

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

const SYNC_COOKIE = "last_profile_sync";
const SYNC_INTERVAL_MS = 1000 * 60 * 60; // 1 hour

function getLastSync(): number {
  const match = document.cookie.match(/(?:^|; )last_profile_sync=([^;]*)/);
  return match ? parseInt(match[1], 10) : 0;
}

function setLastSync(ts: number) {
  document.cookie = `${SYNC_COOKIE}=${ts};path=/;max-age=86400;SameSite=Lax`;
}

export function ProfileSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // Wait for TG to be ready
    tg.ready();

    const tgUser = tg.initDataUnsafe?.user;
    if (!tgUser) return;

    // Sync profile on mount
    const sync = async () => {
      const lastSync = getLastSync();
      const now = Date.now();

      // Sync at most once every hour to reduce server load
      if (lastSync && now - lastSync < SYNC_INTERVAL_MS) {
        return;
      }

      await syncProfileAction({
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        avatar: tgUser.photo_url,
      });

      setLastSync(now);
    };

    // Delay slightly to not interfere with initial load
    const timer = setTimeout(sync, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
