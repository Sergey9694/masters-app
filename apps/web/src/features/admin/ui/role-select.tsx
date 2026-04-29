"use client";

import { Role } from "@/shared/types/auth";
import { updateUserRoleAction } from "../api/update-user-role";
import { toast } from "sonner";
import { useTransition, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface RoleSelectProps {
  userId: string;
  currentRole: Role;
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const confirmChange = () => {
    if (!pendingRole) return;
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: pendingRole });
      
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.validationErrors) {
        toast.error("Ошибка валидации");
      } else {
        toast.success(`Роль изменена на ${pendingRole}`);
      }
      setPendingRole(null);
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={currentRole}
          disabled={isPending}
          onChange={(e) => {
            const newRole = e.target.value as Role;
            if (newRole !== currentRole) setPendingRole(newRole);
          }}
          className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          <option value="USER">USER</option>
          <option value="PROVIDER">PROVIDER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        {isPending && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
      </div>

      {/* Модалка открывается только после реального выбора */}
      <AlertDialog open={!!pendingRole} onOpenChange={(open) => { if (!open) setPendingRole(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изменить роль?</AlertDialogTitle>
            <AlertDialogDescription>
              Роль будет изменена с <strong>{currentRole}</strong> на <strong>{pendingRole}</strong>.
              Это изменит уровень доступа пользователя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" className="rounded-xl">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange} className="rounded-xl">
              Изменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
