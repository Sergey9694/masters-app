import { getCurrentUser } from "@/shared/lib/get-user";
import HomeContent from "./HomeContent";

export default async function HomePage() {
  const user = await getCurrentUser();

  return <HomeContent userRole={user?.role} />;
}
