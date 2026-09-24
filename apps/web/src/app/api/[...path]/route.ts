import { rewriteSetCookie } from "../../../lib/rewrite-upstream-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HOP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function upstreamOrigin(): string {
  const raw = (process.env.API_UPSTREAM_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  return new URL(raw).origin;
}

async function proxy(request: Request, path: string[]) {
  const upstream = upstreamOrigin();
  if (path.some((segment) => segment === ".." || segment.includes("/") || segment.includes("\\"))) {
    return new Response("Bad gateway", { status: 400 });
  }
  const search = new URL(request.url).search;
  const target = new URL(`/${path.join("/")}${search}`, `${upstream}/`);
  if (target.origin !== upstream) {
    return new Response("Bad gateway", { status: 400 });
  }

  const headers = new Headers();
  for (const name of ["accept", "accept-language", "authorization", "content-type", "cookie"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  headers.set("x-forwarded-proto", new URL(request.url).protocol.replace(":", ""));

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstreamResponse = await fetch(target, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const out = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (HOP.has(key.toLowerCase()) || key.toLowerCase() === "set-cookie") return;
    out.set(key, value);
  });

  const secure = new URL(request.url).protocol === "https:";
  for (const cookie of upstreamResponse.headers.getSetCookie()) {
    out.append("set-cookie", rewriteSetCookie(cookie, secure));
  }

  return new Response(method === "HEAD" ? null : await upstreamResponse.arrayBuffer(), {
    status: upstreamResponse.status,
    headers: out,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
