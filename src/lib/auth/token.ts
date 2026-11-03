import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { UserRole, AccountStatus } from "@/models/User";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  playerId?: string;
  accountStatus: AccountStatus;
}

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "development_fallback_secret_at_least_32_characters_long_for_local_env";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      playerId: payload.playerId as string | undefined,
      accountStatus: payload.accountStatus as AccountStatus,
    };
  } catch {
    return null;
  }
}
