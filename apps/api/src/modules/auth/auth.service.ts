import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import {
  AUTH_TOTP_INVALID,
  AUTH_TOTP_REQUIRED,
  COOKIES,
  parseUserPreferences,
  type AccountSecurity,
  type ChangePasswordBody,
  type GoogleAuthBody,
  type LoginBody,
  type RegisterBody,
  type UpdatePreferencesBody,
  type UpdateProfileBody,
  type User,
} from "@ceylonweddings/contracts";
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
    private readonly notifications: NotificationsService,
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
    this.assertSecondFactor(user, body.totp);

    await this.issueCookies(user.id, response);
    return { user: this.toUser(user) };
  }

  /**
   * Once 2FA is on, every sign-in path (password and Google) needs the code.
   * The form reads `reason` to show the code step instead of a generic error.
   */
  private assertSecondFactor(user: { totpEnabled: boolean; totpSecret: string | null }, code: string | undefined) {
    if (!user.totpEnabled || !user.totpSecret) return;
    if (!code) {
      throw new UnauthorizedException({
        message: "Enter the 6-digit code from your authenticator app.",
        reason: AUTH_TOTP_REQUIRED,
      });
    }
    if (!verifyTotpCode(user.totpSecret, code)) {
      throw new UnauthorizedException({
        message: "That code didn't match. Try the newest one.",
        reason: AUTH_TOTP_INVALID,
      });
    }
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
    this.assertSecondFactor(user, body.totp);

    await this.issueCookies(user.id, response);
    return { user: this.toUser(user) };
  }

  /**
   * Rotate the refresh session: the presented refresh token is single-use.
   * Deleting by hash first makes concurrent reuse lose (count 0 → 401), so a
   * stolen-and-replayed token can't mint a second session.
   */
  async refresh(request: Request, response: Response) {
    const refresh = request.cookies?.[COOKIES.refresh] as string | undefined;
    if (!refresh) {
      throw new UnauthorizedException("Missing refresh cookie");
    }
    const refreshHash = createHash("sha256").update(refresh).digest("hex");
    const session = await this.prisma.session.findFirst({ where: { refreshTokenHash: refreshHash } });
    const { count } = await this.prisma.session.deleteMany({ where: { refreshTokenHash: refreshHash } });
    if (!session || count === 0 || session.expiresAt.getTime() <= Date.now()) {
      this.clearCookies(response);
      throw new UnauthorizedException("Session expired");
    }

    await this.issueCookies(session.userId, response);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
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
    preferences: unknown;
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
      preferences: parseUserPreferences(user.preferences),
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

  // ── Account settings ────────────────────────────────────────────────────

  async updateProfile(user: User, body: UpdateProfileBody) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.locale !== undefined ? { locale: body.locale } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
      },
    });
    return this.toUser(updated);
  }

  /** Merge appearance / notification choices into User.preferences (deep for notifications). */
  async updatePreferences(user: User, body: UpdatePreferencesBody) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const current = parseUserPreferences(dbUser.preferences);
    const notifications = { ...(current.notifications ?? {}) };
    for (const [key, channels] of Object.entries(body.notifications ?? {})) {
      const k = key as keyof typeof notifications;
      notifications[k] = { ...(notifications[k] ?? {}), ...channels };
    }
    const next = {
      ...current,
      ...(body.themeMode ? { themeMode: body.themeMode } : {}),
      ...(body.palette ? { palette: body.palette } : {}),
      ...(body.notifications ? { notifications } : {}),
    };
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { preferences: next } });
    return this.toUser(updated);
  }

  /** Changing the password signs out every other device. */
  async changePassword(user: User, body: ChangePasswordBody, request: Request) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const hasPassword = dbUser.passwordHash.startsWith("$2");
    if (!hasPassword || !(await compare(body.currentPassword, dbUser.passwordHash))) {
      throw new BadRequestException("Current password is incorrect");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(body.newPassword, 12) },
    });
    const { count } = await this.revokeOtherSessions(user, request);
    await this.notifications.notify({
      userId: user.id,
      templateId: "account.passwordChanged",
      context: { signedOut: count },
    });
    return { ok: true, signedOut: count };
  }

  async security(user: User, request: Request): Promise<AccountSecurity> {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const currentHash = this.currentRefreshHash(request);
    const sessions = await this.prisma.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return {
      twoFactorEnabled: dbUser.totpEnabled,
      hasPassword: dbUser.passwordHash.startsWith("$2"),
      sessions: sessions.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        current: row.refreshTokenHash === currentHash,
      })),
    };
  }

  async revokeSession(user: User, sessionId: string, request: Request) {
    const currentHash = this.currentRefreshHash(request);
    const { count } = await this.prisma.session.deleteMany({
      where: { id: sessionId, userId: user.id, ...(currentHash ? { NOT: { refreshTokenHash: currentHash } } : {}) },
    });
    if (count === 0) {
      throw new BadRequestException("That session is already signed out, or it is this device.");
    }
    return { ok: true };
  }

  async revokeOtherSessions(user: User, request: Request) {
    const currentHash = this.currentRefreshHash(request);
    const { count } = await this.prisma.session.deleteMany({
      where: { userId: user.id, ...(currentHash ? { NOT: { refreshTokenHash: currentHash } } : {}) },
    });
    return { ok: true, count };
  }

  private currentRefreshHash(request: Request) {
    const refresh = request.cookies?.[COOKIES.refresh] as string | undefined;
    return refresh ? createHash("sha256").update(refresh).digest("hex") : null;
  }

  async generate2Fa(user: User) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    // Regenerating would silently replace a working secret and lock the user out.
    if (dbUser.totpEnabled) {
      throw new BadRequestException("Two-factor authentication is already on. Turn it off first to reset it.");
    }
    const secret = generateTotpSecret(20);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret },
    });
    const otpauthUri = getTotpUri(dbUser.email, secret);
    return { secret, otpauthUri };
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
    await this.notifications.notify({ userId: user.id, templateId: "account.twoFactorEnabled", context: {} });
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
    await this.notifications.notify({ userId: user.id, templateId: "account.twoFactorDisabled", context: {} });
    return { ok: true, message: "Two-factor authentication disabled successfully" };
  }

  private clearCookies(response: Response) {
    response.clearCookie(COOKIES.access, { path: "/" });
    response.clearCookie(COOKIES.refresh, { path: "/" });
  }
}
