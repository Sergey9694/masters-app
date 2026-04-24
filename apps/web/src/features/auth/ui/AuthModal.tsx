"use client";

import { Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { LoginForm } from "./LoginForm";
import Link from "next/link";

type AuthMode = "social" | "email" | "register" | "forgot-password";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
  botId?: string;
}

const titles: Record<AuthMode, string> = {
  social: "Войти в аккаунт",
  email: "Войти через Email",
  register: "Создать аккаунт",
  "forgot-password": "Восстановление пароля",
};

const subtitles: Record<AuthMode, string> = {
  social: "Войдите, чтобы найти исполнителя или откликаться на заказы",
  email: "Введите email и пароль для входа",
  register: "Зарегистрируйтесь, чтобы размещать заказы или стать исполнителем",
  "forgot-password": "Введите email — пришлём ссылку для восстановления пароля",
};

export function AuthModal({ open, onOpenChange, initialMode = "social", botId }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <DialogTitle>{titles[initialMode]}</DialogTitle>
          <DialogDescription>{subtitles[initialMode]}</DialogDescription>
        </DialogHeader>
        <Suspense>
          <LoginForm botId={botId} initialMode={initialMode} />
        </Suspense>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Продолжая, вы соглашаетесь с{" "}
          <Link href="/docs/terms" className="text-primary hover:underline">
            условиями использования
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
