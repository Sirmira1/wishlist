import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

// Any signed-in user may reach these (they can manage their own wishlist).
const USER_PREFIXES = ["/items/new", "/settings"];
const USER_PATTERNS = [/^\/items\/[^/]+\/edit$/];

// Admin-only areas.
const ADMIN_PREFIXES = ["/import", "/backup"];

function matches(pathname: string, prefixes: string[], patterns: RegExp[] = []): boolean {
  if (prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return patterns.some((re) => re.test(pathname));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsUser = matches(pathname, USER_PREFIXES, USER_PATTERNS);
  const needsAdmin = matches(pathname, ADMIN_PREFIXES);
  if (!needsUser && !needsAdmin) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  const redirectToLogin = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  };

  if (!payload) return redirectToLogin();
  if (needsAdmin && payload.role !== "ADMIN") {
    // Signed in but not an admin — send home rather than to login.
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*", "/import/:path*", "/backup/:path*", "/items/new", "/items/:id/edit"],
};
