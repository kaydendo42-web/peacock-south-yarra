import type { NextRequest } from "next/server";
import { handleDinners, type DinnersRequest } from "@/dinners/server/api";
import { dinnersConfig } from "@/dinners/server/config";

/**
 * The $5 dinners API, adapted from a Next request the same way the booking API
 * is. The raw body is kept alongside the parsed one: Square signs the bytes.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function serve(
  request: NextRequest,
  ctx: { params: Promise<{ route: string[] }> },
) {
  const { route } = await ctx.params;

  let body: unknown;
  let rawBody: string | undefined;
  if (request.method !== "GET") {
    rawBody = await request.text();
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return Response.json({ error: "Body must be JSON." }, { status: 400 });
      }
    }
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const dinnersRequest: DinnersRequest = {
    method: request.method,
    path: `/${(route ?? []).join("/")}`,
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: {
      authorization: request.headers.get("authorization") ?? undefined,
      "x-square-hmacsha256-signature":
        request.headers.get("x-square-hmacsha256-signature") ?? undefined,
    },
    body,
    rawBody,
    ip: forwarded?.split(",")[0]?.trim() ?? "unknown",
    origin: request.nextUrl.origin,
  };

  const out = await handleDinners(dinnersRequest, dinnersConfig());

  const headers = new Headers(out.headers);
  headers.set("Cache-Control", "no-store");
  if (out.body === undefined) return new Response(null, { status: out.status, headers });
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(out.body), { status: out.status, headers });
}

export const GET = serve;
export const POST = serve;
