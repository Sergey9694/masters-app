"use client";

import { cn } from "@/shared/lib/cn";
import { BackButton } from "./back-button";
import { StaggerItem } from "./stagger-item";

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  showBack?: boolean;
  fallbackUrl?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Переиспользуемый компонент заголовка страницы.
 * Обеспечивает единообразный отступ, выравнивание по левому краю и структуру с кнопкой назад.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  showBack = true,
  fallbackUrl,
  rightAction,
  className,
}: PageHeaderProps) {
  return (
    <StaggerItem className={cn("flex items-center gap-4 mb-8", className)}>
      {showBack && <BackButton fallbackUrl={fallbackUrl} />}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-white truncate flex items-center gap-2">
          {title}
          {icon && <span className="opacity-80 flex-shrink-0">{icon}</span>}
        </h1>
        {subtitle && (
          <div className="mt-1">
            {typeof subtitle === "string" ? (
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none">
                {subtitle}
              </p>
            ) : (
              subtitle
            )}
          </div>
        )}
      </div>
      {rightAction && (
        <div className="flex-shrink-0">
          {rightAction}
        </div>
      )}
    </StaggerItem>
  );
}
