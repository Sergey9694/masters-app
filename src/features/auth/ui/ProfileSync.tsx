"use client";

import { useEffect } from "react";
import { syncProfileAction } from "../api/sync-action";

export function ProfileSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Wait for TG to be ready
    tg.ready();

    const tgUser = tg.initDataUnsafe?.user;
    if (!tgUser) return;

    // Sync profile on mount
    const sync = async () => {
      const lastSync = localStorage.getItem("last_profile_sync");
      const now = Date.now();
      
      // Sync at most once every hour to reduce server load
      if (lastSync && now - parseInt(lastSync) < 1000 * 60 * 60) {
        return;
      }

      await syncProfileAction({
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        avatar: tgUser.photo_url,
      });

      localStorage.setItem("last_profile_sync", now.toString());
    };

    // Delay slightly to not interfere with initial load
    const timer = setTimeout(sync, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
