"use client";

import { Role } from "@/shared/types/auth";
import { updateUserRole } from "../api/update-user-role";
import { toast } from "sonner";
import { useTransition } from "react";

interface RoleSelectProps {
  userId: string;
  currentRole: Role;
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = async (newRole: Role) => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        toast.success(`Роль пользователя обновлена до ${newRole}`);
      } catch (error) {
        toast.error("Не удалось обновить роль");
        console.error(error);
      }
    });
  };

  return (
    <select
      value={currentRole}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50 transition-opacity"
    >
      <option value="USER">USER</option>
      <option value="MASTER">MASTER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
