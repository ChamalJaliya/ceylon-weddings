import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { COOKIES, type GoogleAuthBody, type LoginBody, type RegisterBody, type User } from "@ceylonweddings/contracts";
import { PrismaService } from "@ceylonweddings/database";
import { loadApiEnv } from "@ceylonweddings/env";
import { authCookieOptions } from "../../common/cookies";
import { generateTotpSecret, getTotpUri, verifyTotpCode } from "../../common/totp";
import { uniqueVendorSlug } from "../../common/vendor-slug";

const env = loadApiEnv();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(body: RegisterBody, response: Response) {
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const businessName = body.businessName?.trim();
    if (body.role === "VENDOR" && !businessName) {
      throw new BadRequestException("Business name is required");
    }

    const vendorSlug = businessName ? await uniqueVendorSlug(this.prisma, businessName) : null;

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        phone: body.phone,
        role: body.role,
        locale: body.locale,
        currency: body.currency,
        passwordHash: await hash(body.password, 12),
        ...(body.role === "VENDOR" && businessName && vendorSlug
          ? {
              vendor: {
                create: {
                  name: businessName,
                  slug: vendorSlug,
                  categoryId: null,
                  city: "Colombo",
                  district: "Colombo",
                  description: "Update your storefront so couples can find you.",
                  priceDisplayMode: "FROM",
                  subscription: {
                    create: {
                      status: "TRIAL",
                      trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            }
          : {}),
      },
    });

    await this.issueCookies(user.id, response);
    return { user: this.toUser(user) };
  }

  async login(body: LoginBody, response: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash.startsWith("$2") || !(await compare(body.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("Account suspended");
    }

    await this.issueCookies(user.id, response);
    return { user: this.toUser(user) };
  }

  async google(body: GoogleAuthBody, response: Response) {
    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ServiceUnavailableException("Google sign-up is not configured");
    }

    const oauth = new OAuth2Client(clientId, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
    let idToken = body.idToken;

    if (!idToken && body.code) {
      if (!env.GOOGLE_CLIENT_SECRET) {
        throw new ServiceUnavailableException("Google sign-up is not configured");
      }
      try {
        const { tokens } = await oauth.getToken(body.code);
        idToken = tokens.id_token ?? undefined;
      } catch {
        throw new UnauthorizedException("Invalid Google credential");
      }
    }

    if (!idToken) {
      throw new BadRequestException("Google credential is required");
    }

    let email: string;
    let name: string;
    try {
      const ticket = await oauth.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.email || payload.email_verified === false) {
        throw new UnauthorizedException("Google email is not verified");
      }
      email = payload.email;
      name = payload.name?.trim() || payload.email.split("@")[0] || "Guest";
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid Google credential");
    }

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: name.slice(0, 80),
          role: body.role,
          locale: body.locale,
          currency: body.currency,
          passwordHash: `!google:${randomBytes(32).toString("hex")}`,
        },
      });
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("Account suspended");
    }

    await this.issueCookies(user.id, response);
    return { user: this.toUser(user) };
  }

  async logout(request: Request, response: Response) {
    const refresh = request.cookies?.[COOKIES.refresh] as string | undefined;
    if (refresh) {
      const refreshHash = createHash("sha256").update(refresh).digest("hex");
      await this.prisma.session.deleteMany({ where: { refreshTokenHash: refreshHash } });
    }
    this.clearCookies(response);
    return { ok: true };
  }

  private toUser(user: {
    id: string;
    email: string;
    phone: string | null;
    name: string;
    role: User["role"];
    locale: string;
    currency: string;
    createdAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      locale: user.locale as User["locale"],
      currency: user.currency as User["currency"],
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async issueCookies(userId: string, response: Response) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("Account suspended");
    }
    const access = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refresh = randomBytes(48).toString("hex");
    const refreshHash = createHash("sha256").update(refresh).digest("hex");

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    response.cookie(COOKIES.access, access, authCookieOptions(env, 1000 * 60 * 15));
    response.cookie(COOKIES.refresh, refresh, authCookieOptions(env, 1000 * 60 * 60 * 24 * 30));
  }

  async generate2Fa(user: User) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const secret = generateTotpSecret(20);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret },
    });
    const otpauthUri = getTotpUri(dbUser.email, secret);
    return { secret, otpauthUri, enabled: dbUser.totpEnabled };
  }

  async enable2Fa(user: User, token: string) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!dbUser.totpSecret) {
      throw new BadRequestException("2FA secret has not been generated");
    }
    const isValid = verifyTotpCode(dbUser.totpSecret, token);
    if (!isValid) {
      throw new UnauthorizedException("Invalid 2FA authentication code");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    });
    return { ok: true, message: "Two-factor authentication enabled successfully" };
  }

  async disable2Fa(user: User, token: string) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!dbUser.totpEnabled || !dbUser.totpSecret) {
      throw new BadRequestException("2FA is not currently enabled");
    }
    const isValid = verifyTotpCode(dbUser.totpSecret, token);
    if (!isValid) {
      throw new UnauthorizedException("Invalid 2FA authentication code");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null },
    });
    return { ok: true, message: "Two-factor authentication disabled successfully" };
  }

  private clearCookies(response: Response) {
    response.clearCookie(COOKIES.access, { path: "/" });
    response.clearCookie(COOKIES.refresh, { path: "/" });
  }
}

