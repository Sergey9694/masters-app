import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker healthcheck
 * Used by docker-compose.yml: curl -f http://localhost:3000/api/health
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
