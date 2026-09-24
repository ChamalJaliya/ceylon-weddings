import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";

export const RATE_LIMIT_KEY = "rate_limit_meta";

export interface RateLimitOptions {
  points: number; // max requests
  duration: number; // window in seconds
  errorMessage?: string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

// In-memory sliding counter for fallback / per-instance rate limiting
const memoryHits = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup of stale memory entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryHits.entries()) {
    if (now > entry.resetAt) {
      memoryHits.delete(key);
    }
  }
}, 60_000).unref();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!options) {
      return true; // No rate limit specified
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const routeKey = `${req.method}:${req.route?.path || req.path}`;
    const key = `ratelimit:${ip}:${routeKey}`;
    const now = Date.now();
    const windowMs = options.duration * 1000;

    let hit = memoryHits.get(key);
    if (!hit || now > hit.resetAt) {
      hit = { count: 1, resetAt: now + windowMs };
      memoryHits.set(key, hit);
    } else {
      hit.count++;
    }

    const remaining = Math.max(0, options.points - hit.count);
    const resetSec = Math.ceil((hit.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", options.points);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSec);

    if (hit.count > options.points) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: options.errorMessage || "Too many requests. Please slow down and try again later.",
          retryAfter: resetSec,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
