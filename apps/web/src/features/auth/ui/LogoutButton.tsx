"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { logoutAction } from "../model/actions";

interface LogoutButtonProps {
  className?: string;
  variant?: "outline" | "ghost" | "destructive" | "default";
}

export function LogoutButton({ className, variant = "outline" }: LogoutButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => logoutAction()}
      className={className}
    >
      <LogOut className="mr-2 size-4" />
      Выйти из аккаунта
    </Button>
  );
}
