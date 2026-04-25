"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { transition } from "@/shared/lib/motion";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId?: string;
}

export function AuthModal({ open, onOpenChange, botId }: AuthModalProps) {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setView("login"); }}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <DialogTitle>
            {view === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
          </DialogTitle>
          <DialogDescription>
            {view === "login"
              ? "Войдите через Telegram или email"
              : "Зарегистрируйтесь, чтобы размещать заказы или стать исполнителем"}
          </DialogDescription>
        </DialogHeader>

        <div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, x: view === "register" ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: view === "register" ? -10 : 10 }}
              transition={transition.base}
            >
              <Suspense>
                {view === "login" ? (
                  <LoginForm botId={botId} onSwitchToRegister={() => setView("register")} />
                ) : (
                  <RegisterForm botId={botId} onSwitchToLogin={() => setView("login")} />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Продолжая, вы соглашаетесь с{" "}
          <Link href="/docs/terms" className="text-primary hover:underline">
            условиями использования
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
