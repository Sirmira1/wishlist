import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Wrap a route handler with uniform error handling (Zod + auth + generic). */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e instanceof ZodError) {
        return fail("Validation failed", 422, { issues: e.flatten() });
      }
      if (e?.status === 401) return fail("Unauthorized", 401);
      if (e?.status === 403) return fail("Forbidden", 403);
      console.error("[api]", e);
      return fail(e?.message || "Internal server error", e?.status ?? 500);
    }
  };
}
