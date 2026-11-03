import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDemoEmail } from "@/lib/demo";
import { env } from "@/lib/env";
import { issueSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!env.demoMode) {
    return NextResponse.json({ error: "Demo mode is closed." }, { status: 404 });
  }
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!isDemoEmail(email)) {
    return NextResponse.json({ error: "Use a seeded demo account." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "That demo account is not seeded." }, { status: 404 });
  }
  await issueSession(user.id);
  return NextResponse.redirect(new URL("/desk", request.url), 303);
}
