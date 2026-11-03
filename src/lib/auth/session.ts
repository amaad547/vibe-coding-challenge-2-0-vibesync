import { cookies } from "next/headers";
import { UserRole } from "@/models/User";
import { verifySessionToken, SessionPayload } from "./token";
import { AppError } from "@/lib/errors/api-error";

export const SESSION_COOKIE_NAME = "sportsync_session";

export interface SessionUser extends SessionPayload {
  id: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  return {
    ...payload,
    id: payload.userId,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new AppError("Authentication required.", "UNAUTHORIZED", 401);
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new AppError(
      `Access denied. Requires one of [${roles.join(", ")}] role.`,
      "FORBIDDEN",
      403
    );
  }

  return user;
}
