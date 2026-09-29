import { NextResponse } from "next/server";
import { SSO_COOKIE } from "@/lib/api";

/**
 * POST /logout — ends this subsystem's session only, by dropping the SSO
 * cookie. The Core Hub session is untouched; signing in again goes straight
 * back through Core Hub SSO without asking for a password.
 */
export async function POST() {
  const response = new NextResponse(null, { status: 303, headers: { Location: "/" } });
  response.cookies.delete(SSO_COOKIE);
  return response;
}
