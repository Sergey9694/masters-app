import { NextResponse } from "next/server";
import { expireOldTasks } from "@/shared/lib/jobs/expire-tasks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const archivedCount = await expireOldTasks();
    return NextResponse.json({ 
      success: true, 
      archived: archivedCount,
      message: `Successfully processed task archiving. Total archived: ${archivedCount}` 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
