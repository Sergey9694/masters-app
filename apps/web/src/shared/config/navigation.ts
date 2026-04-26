import {
  LayoutGrid,
  ClipboardList,
  Briefcase,
  Bell,
  MessageSquare,
  User,
  Home,
  Plus,
  Compass,
  Star,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Видно только залогиненным */
  authRequired?: boolean;
  /** Видно только исполнителям (PROVIDER) */
  providerOnly?: boolean;
  /** Видно только тем, у кого НЕТ профиля исполнителя */
  nonProviderOnly?: boolean;
}

/**
 * SSOT навигации приложения. Используется Sidebar, BottomNav, мобильным меню Header.
 * Ссылки соответствуют целевым URL Фазы 5 (`(main)` route group). Некоторые ведут
 * на существующие `/dashboard/*` и перевесятся по мере миграции в 5.4–5.7.
 */
export const NAV_MAIN: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/orders", label: "Лента заказов", icon: ClipboardList },
  { href: "/categories", label: "Категории", icon: LayoutGrid },
];

export const NAV_USER: NavItem[] = [
  {
    href: "/my-orders",
    label: "Мои заказы",
    icon: Briefcase,
    authRequired: true,
  },
  {
    href: "/become-provider",
    label: "Стать исполнителем",
    icon: UserCheck,
    authRequired: true,
    nonProviderOnly: true,
  },
  {
    href: "/my-proposals",
    label: "Мои отклики",
    icon: MessageSquare,
    authRequired: true,
    providerOnly: true,
  },
  {
    href: "/my-listings",
    label: "Мои объявления",
    icon: Compass,
    authRequired: true,
    providerOnly: true,
  },
  {
    href: "/my-reviews",
    label: "Мои отзывы",
    icon: Star,
    authRequired: true,
    providerOnly: true,
  },
];

/** Нижний таббар для мобильных: 5 самых важных пунктов. */
export const NAV_BOTTOM: NavItem[] = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/orders", label: "Заказы", icon: ClipboardList },
  { href: "/orders/new", label: "Создать", icon: Plus, authRequired: true },
  {
    href: "/notifications",
    label: "Уведомления",
    icon: Bell,
    authRequired: true,
  },
  { href: "/profile", label: "Профиль", icon: User },
];
