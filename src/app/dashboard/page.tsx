import { getCurrentUser } from "@/shared/lib/get-user";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  // Fetch categories for the widget (RSC data loading)
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Ambient Glows (Apple Style) */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

      <DashboardContent user={user} categories={categories} />
    </div>
  );
}
