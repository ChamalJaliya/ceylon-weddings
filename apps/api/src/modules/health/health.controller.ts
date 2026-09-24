import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";
import Redis from "ioredis";
import { HealthResponseDto } from "../auth/auth.dto";
import { PrismaService } from "@ceylonweddings/database";
import { loadApiEnv } from "@ceylonweddings/env";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ZodResponse({ type: HealthResponseDto })
  async check() {
    const env = loadApiEnv();
    const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });

    let redisStatus: "up" | "down" = "down";
    let postgresStatus: "up" | "down" = "down";

    try {
      await redis.connect();
      const pong = await redis.ping();
      redisStatus = pong === "PONG" ? "up" : "down";
    } catch {
      redisStatus = "down";
    } finally {
      redis.disconnect();
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      postgresStatus = "up";
    } catch {
      postgresStatus = "down";
    }

    return {
      status: "ok" as const,
      service: "ceylon-weddings-api" as const,
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      postgres: postgresStatus,
    };
  }
}
