"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { MotionToast } from "@/shared/ui/motion-toast";
import { acceptProposalAction } from "../api/actions";

interface Props {
  responseId: string;
}

export function AcceptResponseButton({ responseId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const res = await acceptProposalAction(responseId);
      if ("success" in res) {
        toast.custom(() => (
          <MotionToast type="success">Исполнитель выбран</MotionToast>
        ));
        router.refresh();
        return;
      }
      toast.error(res.error);
    });
  };

  return (
    <Button
      type="button"
      variant="premium"
      size="sm"
      disabled={isPending}
      onClick={onClick}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Check className="w-4 h-4 mr-1.5" />
          Выбрать мастера
        </>
      )}
    </Button>
  );
}
