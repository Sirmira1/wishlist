import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

// Pages that require a valid admin session. Everything else is public-browseable
// (public visibility itself is enforced server-side against the Settings row).
const PROTECTED_PREFIXES = [
  "/settings",
  "/import",
  "/backup",
  "/items/new",
];

// Regexes for dynamic protected routes (edit screens).
const PROTECTED_PATTERNS = [/^\/items\/[^/]+\/edit$/];

function isProtected(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return PROTECTED_PATTERNS.some((re) => re.test(pathname));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload || payload.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/settings/:path*",
    "/import/:path*",
    "/backup/:path*",
    "/items/new",
    "/items/:id/edit",
  ],
};
