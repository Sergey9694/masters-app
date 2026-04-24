"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Motion } from "@/shared/lib/motion";

export default function VerifySuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-background border border-border/60 rounded-3xl p-8 text-center shadow-xl shadow-primary/5"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3 tracking-tight">Почта подтверждена!</h1>
        <p className="text-muted-foreground mb-8">
          Спасибо за регистрацию. Теперь вы можете полноценно пользоваться сервисом.
        </p>

        <div className="space-y-4">
          <Button 
            className="w-full h-12 rounded-xl text-base font-medium group" 
            onClick={() => router.push("/orders")}
          >
            Перейти к заказам
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <p className="text-xs text-muted-foreground/60 italic">
            Перенаправление в личный кабинет через {countdown} сек...
          </p>
        </div>
      </Motion.div>
    </div>
  );
}
