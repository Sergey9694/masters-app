"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { ListingStatus } from "@prisma/client";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";
import { approveListing, rejectListing, deleteListingAdminAction } from "../api/moderate-listing";

interface Props {
  listingId: string;
  status: ListingStatus;
}

export function ListingModerationActions({ listingId, status }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveListing(listingId);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Объявление одобрено");
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectListing(listingId);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Объявление отклонено");
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteListingAdminAction(listingId);
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success("Объявление удалено");
    });
  };

  return (
    <div className={`flex gap-1 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {status === "MODERATION" && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            title="Одобрить"
            onClick={handleApprove}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            title="Отклонить"
            onClick={handleReject}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </>
      )}

      {status === "ACTIVE" && (
        <ConfirmDialog
          title="Отклонить объявление?"
          description="Объявление будет скрыто из каталога и помечено как отклонённое."
          variant="warning"
          confirmText="Отклонить"
          onConfirm={handleReject}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
              title="Отклонить"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          }
        />
      )}

      {status === "REJECTED" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          title="Одобрить"
          onClick={handleApprove}
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      )}

      <ConfirmDialog
        title="Удалить объявление?"
        description="ВНИМАНИЕ! Это действие необратимо. Объявление будет удалено навсегда."
        variant="destructive"
        confirmText="Удалить навсегда"
        onConfirm={handleDelete}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        }
      />
    </div>
  );
}
