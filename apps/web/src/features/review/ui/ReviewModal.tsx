"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { ReviewForm } from "./ReviewForm";

interface Props {
  referenceId: string;
}

export function ReviewModal({ referenceId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-warning/40 bg-warning/5 px-5 py-4 text-sm font-semibold text-warning transition-colors hover:bg-warning/10"
      >
        <Star className="size-4 fill-warning text-warning" />
        Оставить отзыв об исполнителе
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оставить отзыв</DialogTitle>
            <DialogDescription>
              Оцените работу исполнителя — это поможет другим заказчикам
            </DialogDescription>
          </DialogHeader>
          <ReviewForm referenceId={referenceId} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
