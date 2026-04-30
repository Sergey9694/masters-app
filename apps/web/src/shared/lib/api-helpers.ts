import { NextResponse, type NextRequest } from "next/server";
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
  handler: (request: NextRequest, session: SessionPayload) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const session = await getSessionFromRequest(request);
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
  handler: (request: NextRequest, data: T, session?: SessionPayload) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const parsed = schema.safeParse(body);
      
      if (!parsed.success) {
        return apiError("Validation failed", 400, parsed.error.flatten());
      }

      // Check for session if available
      const session = await getSessionFromRequest(request);
      
      return handler(request, parsed.data, session || undefined);
    } catch {
      return apiError("Invalid JSON body", 400);
    }
  };
}
