import { type NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { authService } from "@/services/auth.service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify?error=no_token", request.url));
  }

  try {
    const user = await authService.verifyEmail(token);
    const secret = process.env.AUTH_SERVER_SECRET;
    if (!secret) throw new Error("AUTH_SERVER_SECRET is not configured");

    await signIn("server-verify", {
      userId: user.id,
      secret,
      redirect: false,
    });

    return NextResponse.redirect(new URL("/orders", request.url));
  } catch (error: unknown) {
    console.error("[verify-email] error:", error);
    return NextResponse.redirect(new URL("/auth/verify?error=invalid_token", request.url));
  }
}
