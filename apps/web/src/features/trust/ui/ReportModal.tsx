"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { reportTargetAction } from "../api/actions";
import type { reportReasonSchema, reportTargetTypeSchema } from "../model/schema";
import type { z } from "zod";

type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;
type ReportReason = z.infer<typeof reportReasonSchema>;

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string;
  conversationId?: string;
  messageId?: string;
  orderId?: string | null;
  triggerClassName?: string;
}

const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: "SPAM", label: "Спам" },
  { value: "HARASSMENT", label: "Оскорбления" },
  { value: "FRAUD", label: "Мошенничество" },
  { value: "INAPPROPRIATE_CONTENT", label: "Неприемлемый контент" },
  { value: "CONTACT_EXCHANGE", label: "Попытка увести общение" },
  { value: "SAFETY_THREAT", label: "Угроза безопасности" },
  { value: "OTHER", label: "Другое" },
];

export function ReportModal({
  targetType,
  targetId,
  targetUserId,
  conversationId,
  messageId,
  orderId,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("HARASSMENT");
  const [description, setDescription] = useState("");
  const { execute, isPending } = useAction(reportTargetAction, {
    onSuccess: () => {
      toast.success("Жалоба отправлена на модерацию");
      setDescription("");
      setOpen(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Не удалось отправить жалобу");
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={triggerClassName}
        onClick={() => setOpen(true)}
        aria-label="Пожаловаться"
        title="Пожаловаться"
      >
        <Flag className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пожаловаться</DialogTitle>
            <DialogDescription>
              Жалоба попадет в очередь модерации.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-1.5 text-sm font-medium">
              <span>Причина</span>
              <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
                <SelectTrigger className="h-12 rounded-[var(--ui-radius-premium)] border-white/10 bg-white/5 px-4 text-sm normal-case tracking-normal text-[var(--ui-input-text)] shadow-inner-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="normal-case tracking-normal">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="grid gap-1.5 text-sm font-medium">
              Комментарий
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Коротко опишите ситуацию"
                className="min-h-[120px] text-sm font-medium"
              />
            </label>

            <Button
              type="button"
              className="w-full"
              disabled={isPending}
              onClick={() => execute({
                targetType,
                targetId,
                reason,
                description: description.trim() || undefined,
                targetUserId,
                conversationId,
                messageId,
                orderId: orderId ?? undefined,
              })}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Отправить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
