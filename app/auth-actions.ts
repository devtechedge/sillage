"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { issueSession, clearSession } from "@/lib/session";
import { emailSchema, passwordSchema } from "@/validation/schemas";
import { failure } from "@/lib/actions";
import type { ActionState } from "@/lib/action-state";

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const email = emailSchema.parse(formData.get("email"));
    const password = passwordSchema.parse(formData.get("password"));
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "That email or password is not right." };
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { error: "That email or password is not right." };
    await issueSession(user.id);
  } catch (error) {
    return failure(error);
  }
  redirect("/desk");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/login");
}
