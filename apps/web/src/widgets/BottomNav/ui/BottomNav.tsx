import { getCurrentUser } from "@/shared/lib/get-user";
import { BottomNavClient } from "./BottomNavClient";

export async function BottomNav() {
  const user = await getCurrentUser();
  return <BottomNavClient isAuth={Boolean(user)} />;
}
