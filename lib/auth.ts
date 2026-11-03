import { notFound, redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";
import type { Role } from "@/domain/types";
import { isRole } from "@/domain/types";

export interface HouseContext {
  user: SessionUser;
  userId: string;
  houseId: string;
  role: Role;
  house: SessionUser["membership"]["house"];
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireHouse(): Promise<HouseContext> {
  const user = await requireUser();
  const role = user.membership.role;
  if (!isRole(role)) notFound();
  return {
    user,
    userId: user.id,
    houseId: user.membership.houseId,
    role,
    house: user.membership.house,
  };
}

export function hasRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

export function assertRole(role: Role, allowed: Role[]): void {
  if (!allowed.includes(role)) {
    throw new AuthorizationError("Your role does not allow this action.");
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
