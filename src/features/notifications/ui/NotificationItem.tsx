"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markReadAction } from "../api/actions";
import { Card } from "@/shared/ui/card";
import { formatSmartDate } from "@/shared/lib/date";
import { MessageSquare, CheckCheck, Briefcase, XCircle, Star, PlusCircle } from "lucide-react";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    taskId: string | null;
    read: boolean;
    createdAt: Date;
  };
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  NEW_RESPONSE: {
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-blue-400 bg-blue-500/10",
  },
  RESPONSE_ACCEPTED: {
    icon: <CheckCheck className="w-4 h-4" />,
    color: "text-emerald-400 bg-emerald-500/10",
  },
  TASK_COMPLETED: {
    icon: <Briefcase className="w-4 h-4" />,
    color: "text-emerald-400 bg-emerald-500/10",
  },
  TASK_CANCELED: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-400 bg-red-500/10",
  },
  NEW_REVIEW: {
    icon: <Star className="w-4 h-4" />,
    color: "text-amber-400 bg-amber-500/10",
  },
  NEW_TASK: {
    icon: <PlusCircle className="w-4 h-4" />,
    color: "text-indigo-400 bg-indigo-500/10",
  },
};

export function NotificationItem({ notification: n }: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!n.read) {
      startTransition(async () => {
        await markReadAction(n.id);
      });
    }
    
    if (n.taskId) {
      router.push(`/dashboard/task/${n.taskId}`);
    }
  };

  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.NEW_TASK;

  return (
    <div 
      onClick={handleClick}
      className={`block transition-all cursor-pointer ${isPending ? "opacity-70" : "hover:opacity-90"}`}
    >
      <Card
        className={`glass border-none p-4 rounded-[20px] transition-all ${
          n.read
            ? "opacity-60"
            : "border-l-2 border-l-blue-500 bg-white/5"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${config.color} flex-shrink-0 mt-0.5`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="text-base font-black text-white leading-tight mb-1">
              {n.title}
            </p>
            <p className="text-xs font-normal text-slate-400 leading-snug">{n.body}</p>
            <p className="text-[10px] font-medium text-slate-500 mt-2">
              {formatSmartDate(n.createdAt)}
            </p>
          </div>
          {!n.read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
          )}
        </div>
      </Card>
    </div>
  );
}
