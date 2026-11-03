import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth/token";
import { SESSION_COOKIE_NAME } from "./lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isCoachRoute = pathname.startsWith("/coach");
  const isPlayerRoute = pathname.startsWith("/player");
  const isScoutRoute = pathname.startsWith("/scout");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;

  // 1. Redirect already logged-in users away from /login and /register
  if (isAuthRoute && session) {
    if (session.role === "COACH") {
      return NextResponse.redirect(new URL("/coach", request.url));
    }
    if (session.role === "PLAYER") {
      return NextResponse.redirect(new URL("/player", request.url));
    }
    if (session.role === "SCOUT") {
      return NextResponse.redirect(new URL("/scout", request.url));
    }
  }

  // 2. Protect /coach routes
  if (isCoachRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "COACH") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 3. Protect /player routes
  if (isPlayerRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "PLAYER") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 4. Protect /scout routes
  if (isScoutRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "SCOUT") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/coach/:path*", "/player/:path*", "/scout/:path*", "/login", "/register"],
};
