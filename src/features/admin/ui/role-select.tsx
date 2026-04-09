"use client";

import { Role } from "@/shared/types/auth";
import { updateUserRole } from "../api/update-user-role";
import { toast } from "sonner";
import { useTransition, useState } from "react";
import { ConfirmDialog } from "@/shared/ui/custom/confirm-dialog";

interface RoleSelectProps {
  userId: string;
  currentRole: Role;
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const handleRoleChange = (newRole: Role) => {
    if (newRole === currentRole) return;
    setPendingRole(newRole);
  };

  const confirmChange = () => {
    if (!pendingRole) return;
    
    startTransition(async () => {
      try {
        await updateUserRole(userId, pendingRole);
        toast.success("Роль успешно изменена", {
          description: `Новый статус пользователя: ${pendingRole}`,
        });
      } catch (error) {
        toast.error("Ошибка обновления");
      } finally {
        setPendingRole(null);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <ConfirmDialog
        title="Изменить роль пользователя?"
        description={`Вы собираетесь назначить роль ${pendingRole} для этого пользователя. Это может изменить уровень его доступа к системе.`}
        confirmText="Изменить"
        onConfirm={confirmChange}
        trigger={
          <select
            value={currentRole}
            disabled={isPending}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            <option value="USER">USER</option>
            <option value="MASTER">MASTER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        }
      />
      {isPending && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
    </div>
  );
}
