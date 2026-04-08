"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface BackButtonProps {
  className?: string;
  fallbackUrl?: string;
}

/**
 * Глобальный компонент кнопки "Назад".
 * Использует router.back() для перехода на предыдущую страницу.
 * Если истории нет, переходит по fallbackUrl (по умолчанию /dashboard).
 */
export function BackButton({ className, fallbackUrl = "/dashboard" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0",
        className
      )}
    >
      <ChevronLeft className="w-5 h-5 text-white" />
    </button>
  );
}
