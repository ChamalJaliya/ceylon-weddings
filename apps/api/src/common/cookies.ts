import type { CookieOptions } from "express";
import type { ApiEnv } from "@ceylonweddings/env";

export function authCookieOptions(env: ApiEnv, maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: maxAgeMs,
  };
}
