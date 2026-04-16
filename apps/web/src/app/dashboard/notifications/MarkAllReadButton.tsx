"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { markAllReadAction } from "@/features/notifications";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-xs font-bold text-blue-400 hover:text-blue-300 gap-1.5"
      onClick={() => startTransition(async () => { await markAllReadAction(); })}
    >
      <CheckCheck className="w-4 h-4" />
      {pending ? "..." : "Прочитать всё"}
    </Button>
  );
}
