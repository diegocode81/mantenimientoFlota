import { NextResponse } from "next/server";
import { clearActiveSession, clearSessionCookie, getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (session) {
    await clearActiveSession(session.id);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
