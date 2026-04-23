"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Глобальный слушатель гео-уведомлений.
 * Позволяет показывать Toast после полной перезагрузки страницы.
 */
export function GeoToastListener() {
  useEffect(() => {
    // Проверяем наличие отложенного уведомления
    const pendingToast = sessionStorage.getItem("geo_toast_success");
    
    if (pendingToast) {
      // Небольшая задержка, чтобы анимация страницы завершилась
      const timer = setTimeout(() => {
        toast.success(pendingToast);
        sessionStorage.removeItem("geo_toast_success");
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return null; // Компонент ничего не рендерит
}
