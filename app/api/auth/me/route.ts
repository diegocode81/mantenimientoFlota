import { NextResponse } from "next/server";
import { getSession, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  return NextResponse.json({ user: session });
}
