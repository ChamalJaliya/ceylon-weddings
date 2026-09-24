import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { COOKIES } from "@ceylonweddings/contracts";
import type { Request } from "express";
import { PrismaService } from "@ceylonweddings/database";

type AccessPayload = {
  sub: string;
  email: string;
  role: "COUPLE" | "VENDOR" | "ADMIN" | "FAMILY";
};

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = request.cookies?.[COOKIES.access] as string | undefined;
    if (!token) {
      throw new UnauthorizedException("Missing access cookie");
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException();
      }
      if (user.status === "SUSPENDED") {
        throw new UnauthorizedException("Account suspended");
      }

      request.user = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        locale: user.locale as "en" | "si" | "ta",
        currency: user.currency as "LKR" | "USD" | "AUD" | "GBP" | "EUR",
        createdAt: user.createdAt.toISOString(),
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid access cookie");
    }
  }
}
