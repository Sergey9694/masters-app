import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { getSessionFromRequest } from "./auth";
import { SessionPayload } from "@/shared/types/auth";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function apiUnauthorized() {
  return apiError("Unauthorized", 401);
}

export function apiForbidden() {
  return apiError("Forbidden", 403);
}

/**
 * Wrapper for authenticated API handlers
 */
export function withAuth(
  handler: (request: Request, session: SessionPayload) => Promise<Response>
) {
  return async (request: Request) => {
    // We need NextRequest for cookies, but the handler might be generic.
    // In Next.js App Router, it's usually NextRequest.
    const session = await getSessionFromRequest(request as any);
    if (!session) {
      return apiUnauthorized();
    }
    return handler(request, session);
  };
}

/**
 * Wrapper for Zod validation in API handlers
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: Request, data: T, session?: SessionPayload) => Promise<Response>
) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const parsed = schema.safeParse(body);
      
      if (!parsed.success) {
        return apiError("Validation failed", 400, parsed.error.flatten());
      }

      // Check for session if available
      const session = await getSessionFromRequest(request as any);
      
      return handler(request, parsed.data, session || undefined);
    } catch (e) {
      return apiError("Invalid JSON body", 400);
    }
  };
}
