import type { NextRequest } from "next/server";
import { handle, type ApiRequest } from "@/booking/server/api";
import { config } from "@/booking/server/config";

/**
 * The booking API. One catch-all, adapting a Next request into the plain shape
 * `src/booking/server/api.ts` is written against, so every booking rule has
 * exactly one implementation and none of it depends on the framework.
 */

// node:crypto and the file store; and the diary is never a static answer.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function serve(
  request: NextRequest,
  ctx: { params: Promise<{ route: string[] }> },
) {
  const { route } = await ctx.params;

  let body: unknown;
  if (request.method !== "GET" && request.method !== "DELETE") {
    const raw = await request.text();
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        return Response.json({ error: "Body must be JSON." }, { status: 400 });
      }
    }
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const apiRequest: ApiRequest = {
    method: request.method,
    path: `/${(route ?? []).join("/")}`,
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: { cookie: request.headers.get("cookie") ?? undefined },
    body,
    ip: forwarded?.split(",")[0]?.trim() ?? "unknown",
  };

  const out = await handle(apiRequest, config());

  const headers = new Headers(out.headers);
  if (out.body === undefined) return new Response(null, { status: out.status, headers });

  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(out.body), { status: out.status, headers });
}

export const GET = serve;
export const POST = serve;
export const PATCH = serve;
export const DELETE = serve;
