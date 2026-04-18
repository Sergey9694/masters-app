"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Link2, X, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { linkEmailToAccountAction } from "../model/actions";

export function LinkEmailBanner() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await linkEmailToAccountAction({ email, password });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Аккаунт успешно связан");
      // Re-login as the email account
      await signIn("email", { email, password, redirect: false, callbackUrl: "/dashboard" });
      router.refresh();
    } catch {
      toast.error("Ошибка при объединении аккаунтов");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-blue-300">
          <Link2 className="w-4 h-4 shrink-0" />
          <span>
            Вы вошли через Telegram. Есть email-аккаунт?{" "}
            <button
              className="underline underline-offset-2 hover:text-white transition-colors"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Скрыть" : "Привязать"}
            </button>
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <form onSubmit={handleLink} className="mt-4 flex flex-col gap-3 max-w-sm">
          <Input
            type="email"
            placeholder="Email существующего аккаунта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 bg-white/5 border-white/10 rounded-xl text-white text-sm"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10 bg-white/5 border-white/10 rounded-xl text-white text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="w-fit rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Объединить аккаунты"}
          </Button>
        </form>
      )}
    </div>
  );
}
