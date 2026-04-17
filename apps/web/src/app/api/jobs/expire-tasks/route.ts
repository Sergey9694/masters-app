import { NextResponse } from "next/server";
import { expireOldTasks } from "@/shared/lib/jobs/expire-orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 16) {
    return new Response("CRON_SECRET is not configured", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const archivedCount = await expireOldTasks();
    return NextResponse.json({ 
      success: true, 
      archived: archivedCount,
      message: `Successfully processed order archiving. Total archived: ${archivedCount}` 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
