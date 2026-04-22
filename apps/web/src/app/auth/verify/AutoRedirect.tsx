"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AutoRedirectProps {
  to: string;
  delay?: number;
}

export function AutoRedirect({ to, delay = 3000 }: AutoRedirectProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(delay / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.push(to);
    }, delay);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router, to, delay]);

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 italic">
      <Loader2 className="w-4 h-4 animate-spin" />
      Перенаправление в личный кабинет через {secondsLeft} сек...
    </div>
  );
}
