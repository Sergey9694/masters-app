import * as React from "react";
import { cn } from "@/shared/lib/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ширина контейнера. По умолчанию — `xl` (1280px) */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const sizeMap: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-2xl",    // 672px  — длинный текст, статьи
  md: "max-w-4xl",    // 896px  — формы
  lg: "max-w-6xl",    // 1152px — стандартные страницы
  xl: "max-w-7xl",    // 1280px — основной десктопный layout
  "2xl": "max-w-[1440px]",
  full: "max-w-none",
};

/**
 * Стандартный враппер страницы: центровка, ограничение ширины,
 * боковые отступы (16px mobile → 32px desktop).
 */
export function Container({
  className,
  size = "xl",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeMap[size],
        className
      )}
      {...props}
    />
  );
}
