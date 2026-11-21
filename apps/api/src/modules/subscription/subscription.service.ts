import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService, type Prisma } from "@ceylonweddings/database";
import {
  type BillingInterval,
  type SubscriptionStatus,
  type User,
  type UpsertSubscriptionPlanBody,
  type VendorPlanLimits,
  DEFAULT_PRICING_BASELINE_FEATURES,
  DEFAULT_VENDOR_PLAN_FEATURES,
  DEFAULT_VENDOR_PLAN_LIMITS,
  VENDOR_PLAN_SLUGS,
  TRIAL_DURATION_MONTHS,
  buildVendorPlanDisplayFeatures,
  resolveEffectiveSubscriptionStatus,
  resolveVendorPlanLimits,
  canonicalizeVendorPlanSlug,
  type PlanBillingMode,
} from "@ceylonweddings/contracts";

type PlanRow = Prisma.SubscriptionPlanGetPayload<Record<string, never>>;

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  private parseStringArrayJson(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
    return [];
  }

  private parseLimitsJson(value: unknown): VendorPlanLimits | null {
    if (!value || typeof value !== "object") return null;
    const o = value as Record<string, unknown>;
    if (
      typeof o.maxPhotos === "number" &&
      typeof o.maxVideos === "number" &&
      typeof o.maxPackages === "number" &&
      typeof o.whatsappLeads === "boolean" &&
      typeof o.analytics === "boolean" &&
      typeof o.featuredEligible === "boolean" &&
      typeof o.spotlightEligible === "boolean"
    ) {
      return o as VendorPlanLimits;
    }
    return null;
  }

  private mapPlanRow(plan: PlanRow) {
    const slug = canonicalizeVendorPlanSlug(plan.slug);
    const features = this.parseStringArrayJson(plan.features);
    const limits = this.parseLimitsJson(plan.limits);
    return {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      priceLkr: plan.priceLkr,
      features,
      limits,
      billingMode: plan.billingMode as PlanBillingMode,
      recommended: plan.recommended,
      sortOrder: plan.sortOrder,
      active: plan.active,
      stripePriceId: plan.stripePriceId ?? null,
      displayFeatures: buildVendorPlanDisplayFeatures({
        slug,
        features,
        billingMode: plan.billingMode,
      }),
    };
  }

  /**
   * Ensures default membership plans exist (Pro monthly/annual, Spotlight annual contact).
   */
  async ensureDefaultPlans() {
    const specs: Array<{
      slug: string;
      name: string;
      interval: BillingInterval;
      priceLkr: number;
      recommended: boolean;
      sortOrder: number;
      billingMode: PlanBillingMode;
    }> = [
      {
        slug: VENDOR_PLAN_SLUGS.PRO,
        name: "Pro",
        interval: "MONTHLY",
        priceLkr: 4900,
        recommended: false,
        sortOrder: 10,
        billingMode: "checkout",
      },
      {
        slug: VENDOR_PLAN_SLUGS.PRO,
        name: "Pro",
        interval: "ANNUAL",
        priceLkr: 45000,
        recommended: true,
        sortOrder: 20,
        billingMode: "checkout",
      },
      {
        slug: VENDOR_PLAN_SLUGS.SPOTLIGHT,
        name: "Spotlight",
        interval: "ANNUAL",
        priceLkr: 0,
        recommended: false,
        sortOrder: 30,
        billingMode: "contact",
      },
    ];

    for (const spec of specs) {
      const slugKey = spec.slug as keyof typeof DEFAULT_VENDOR_PLAN_FEATURES;
      const tierFeatures = DEFAULT_VENDOR_PLAN_FEATURES[slugKey] ?? [];
      const tierLimits = DEFAULT_VENDOR_PLAN_LIMITS[slugKey];

      await this.prisma.subscriptionPlan.upsert({
        where: { slug_interval: { slug: spec.slug, interval: spec.interval } },
        create: {
          ...spec,
          features: tierFeatures,
          limits: tierLimits,
        },
        update: {
          name: spec.name,
          priceLkr: spec.priceLkr,
          recommended: spec.recommended,
          sortOrder: spec.sortOrder,
          billingMode: spec.billingMode,
          features: tierFeatures,
          limits: tierLimits,
          active: true,
        },
      });
    }
  }

  async getPlans() {
    await this.ensureDefaultPlans();
    const rows = await this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { priceLkr: "asc" }],
    });
    return rows.map((row) => this.mapPlanRow(row));
  }

  async getPricingCatalog() {
    const plans = await this.getPlans();
    return {
      plans,
      baselineFeatures: [...DEFAULT_PRICING_BASELINE_FEATURES],
    };
  }

  async listAllPlans() {
    await this.ensureDefaultPlans();
    const rows = await this.prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }, { interval: "asc" }],
    });
    return rows.map((row) => this.mapPlanRow(row));
  }

  async upsertPlan(body: UpsertSubscriptionPlanBody) {
    const slug = canonicalizeVendorPlanSlug(body.slug);
    const features = body.features?.length
      ? body.features
      : (DEFAULT_VENDOR_PLAN_FEATURES[slug as keyof typeof DEFAULT_VENDOR_PLAN_FEATURES] ?? []);
    const limits =
      body.limits ??
      (slug in DEFAULT_VENDOR_PLAN_LIMITS
        ? DEFAULT_VENDOR_PLAN_LIMITS[slug as keyof typeof DEFAULT_VENDOR_PLAN_LIMITS]
        : null);

    const row = await this.prisma.subscriptionPlan.upsert({
      where: { slug_interval: { slug: String(slug), interval: body.interval } },
      create: {
        slug: String(slug),
        name: body.name,
        description: body.description ?? null,
        interval: body.interval,
        priceLkr: body.priceLkr,
        features,
        limits: limits ?? undefined,
        billingMode: body.billingMode,
        recommended: body.recommended,
        sortOrder: body.sortOrder,
        active: body.active,
        stripePriceId: body.stripePriceId ?? null,
      },
      update: {
        name: body.name,
        description: body.description ?? null,
        priceLkr: body.priceLkr,
        features,
        limits: limits ?? undefined,
        billingMode: body.billingMode,
        recommended: body.recommended,
        sortOrder: body.sortOrder,
        active: body.active,
        stripePriceId: body.stripePriceId ?? null,
      },
    });
    return this.mapPlanRow(row);
  }

  async setPlanActive(id: string, active: boolean) {
    const row = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { active },
    });
    return this.mapPlanRow(row);
  }

  async recordEvent(
    subscriptionId: string,
    vendorId: string,
    type: string,
    payload?: Record<string, unknown>,
    actorUserId?: string,
  ): Promise<void> {
    await this.prisma.vendorSubscriptionEvent.create({
      data: {
        subscriptionId,
        vendorId,
        type,
        payload: (payload ?? undefined) as Prisma.InputJsonValue | undefined,
        actorUserId: actorUserId ?? null,
      },
    });
  }

  private async assertVendorOwnedByUser(user: User, vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, userId: user.id },
      select: { id: true },
    });
    if (!vendor) {
      throw new ForbiddenException("You do not have access to this vendor profile");
    }
  }

  private addBillingPeriod(from: Date, interval: BillingInterval): Date {
    const end = new Date(from);
    if (interval === "MONTHLY") {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end;
  }

  private subscriptionInclude() {
    return {
      plan: true,
      pendingPlan: true,
      invoices: { orderBy: { createdAt: "desc" as const }, take: 10 },
      events: { orderBy: { createdAt: "desc" as const }, take: 20 },
    };
  }

  /**
   * Initialize trial for a newly created vendor.
   */
  async initTrial(vendorId: string) {
    const existing = await this.prisma.vendorSubscription.findUnique({
      where: { vendorId },
    });
    if (existing) return existing;

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + TRIAL_DURATION_MONTHS);

    return this.prisma.vendorSubscription.create({
      data: {
        vendorId,
        status: "TRIAL",
        trialEndsAt,
      },
    });
  }

  private async maybeSyncAndApplyOnRead(
    sub: Prisma.VendorSubscriptionGetPayload<{ include: ReturnType<SubscriptionService["subscriptionInclude"]> }>,
  ) {
    const now = new Date();
    const effective = resolveEffectiveSubscriptionStatus({
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      gracePeriodDays: sub.gracePeriodDays,
      compedUntil: sub.compedUntil,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      now,
    });

    const updates: Prisma.VendorSubscriptionUpdateInput = {};

    if (
      (effective.status === "GRACE" || effective.status === "EXPIRED") &&
      sub.status !== effective.status &&
      sub.status !== "CANCELLED" &&
      sub.status !== "COMPED"
    ) {
      updates.status = effective.status;
    }

    const periodEnd = sub.currentPeriodEnd;
    if (sub.pendingPlanId && sub.pendingInterval && periodEnd && now >= periodEnd) {
      const pendingPlan =
        sub.pendingPlan ??
        (await this.prisma.subscriptionPlan.findUnique({
          where: { id: sub.pendingPlanId },
        }));
      if (pendingPlan) {
        const periodStart = now;
        const newPeriodEnd = this.addBillingPeriod(periodStart, sub.pendingInterval);
        updates.plan = { connect: { id: pendingPlan.id } };
        updates.interval = sub.pendingInterval;
        updates.currentPeriodStart = periodStart;
        updates.currentPeriodEnd = newPeriodEnd;
        updates.status = "ACTIVE";
        updates.pendingPlan = { disconnect: true };
        updates.pendingInterval = null;
        updates.cancelAtPeriodEnd = false;
      }
    }

    if (sub.cancelAtPeriodEnd && periodEnd && now >= periodEnd && sub.status === "ACTIVE") {
      updates.status = "CANCELLED";
      updates.cancelledAt = now;
    }

    if (Object.keys(updates).length === 0) {
      return sub;
    }

    await this.prisma.vendorSubscription.update({
      where: { id: sub.id },
      data: updates,
    });

    return this.prisma.vendorSubscription.findUniqueOrThrow({
      where: { vendorId: sub.vendorId },
      include: this.subscriptionInclude(),
    });
  }

  /**
   * Get vendor subscription with effective status, limits, and recent events.
   */
  async getSubscriptionForVendor(vendorId: string) {
    let sub = await this.prisma.vendorSubscription.findUnique({
      where: { vendorId },
      include: this.subscriptionInclude(),
    });

    if (!sub) {
      await this.initTrial(vendorId);
      sub = await this.prisma.vendorSubscription.findUnique({
        where: { vendorId },
        include: this.subscriptionInclude(),
      });
    }

    if (!sub) throw new NotFoundException("Vendor subscription not found");

    sub = await this.maybeSyncAndApplyOnRead(sub);

    const now = new Date();
    const effective = resolveEffectiveSubscriptionStatus({
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      gracePeriodDays: sub.gracePeriodDays,
      compedUntil: sub.compedUntil,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      now,
    });

    const planSlug = sub.plan?.slug ?? null;
    const planLimits = sub.plan ? this.parseLimitsJson(sub.plan.limits) : null;
    const limits = resolveVendorPlanLimits({
      status: effective.status,
      planSlug,
      limits: planLimits,
    });

    const planMapped = sub.plan ? this.mapPlanRow(sub.plan) : null;
    const pendingPlanMapped = sub.pendingPlan ? this.mapPlanRow(sub.pendingPlan) : null;

    return {
      id: sub.id,
      vendorId: sub.vendorId,
      status: effective.status,
      trialEndsAt: sub.trialEndsAt.toISOString(),
      trialOverrideBy: sub.trialOverrideBy,
      planId: sub.planId,
      plan: planMapped,
      interval: sub.interval,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      gracePeriodDays: sub.gracePeriodDays,
      cancelledAt: sub.cancelledAt?.toISOString() ?? null,
      cancelReason: sub.cancelReason,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      pendingPlanId: sub.pendingPlanId,
      pendingInterval: sub.pendingInterval,
      pendingPlan: pendingPlanMapped,
      compedById: sub.compedById,
      compedUntil: sub.compedUntil?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      daysRemaining: effective.daysRemaining,
      billingAlert: effective.billingAlert,
      limits,
      invoices: sub.invoices.map((inv) => ({
        id: inv.id,
        subscriptionId: inv.subscriptionId,
        planId: inv.planId,
        interval: inv.interval,
        amountLkr: inv.amountLkr,
        periodStart: inv.periodStart.toISOString(),
        periodEnd: inv.periodEnd.toISOString(),
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() ?? null,
        paymentRef: inv.paymentRef,
        notes: inv.notes,
        createdAt: inv.createdAt.toISOString(),
      })),
      events: sub.events.map((ev) => ({
        id: ev.id,
        subscriptionId: ev.subscriptionId,
        vendorId: ev.vendorId,
        type: ev.type,
        payload: (ev.payload as Record<string, unknown> | null) ?? null,
        actorUserId: ev.actorUserId,
        createdAt: ev.createdAt.toISOString(),
      })),
    };
  }

  async cancelSubscription(user: User, vendorId: string, options: { reason?: string; atPeriodEnd: boolean }) {
    await this.assertVendorOwnedByUser(user, vendorId);
    const sub = await this.prisma.vendorSubscription.findUnique({ where: { vendorId } });
    if (!sub) throw new NotFoundException("Vendor subscription not found");

    const now = new Date();
    if (options.atPeriodEnd) {
      const updated = await this.prisma.vendorSubscription.update({
        where: { vendorId },
        data: {
          cancelAtPeriodEnd: true,
          cancelReason: options.reason ?? null,
        },
      });
      await this.recordEvent(
        sub.id,
        vendorId,
        "subscription.canceled",
        {
          atPeriodEnd: true,
          reason: options.reason,
        },
        user.id,
      );
      return this.getSubscriptionForVendor(updated.vendorId);
    }

    await this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        status: "EXPIRED",
        cancelledAt: now,
        cancelReason: options.reason ?? null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: now,
      },
    });
    await this.recordEvent(
      sub.id,
      vendorId,
      "subscription.canceled",
      {
        atPeriodEnd: false,
        reason: options.reason,
      },
      user.id,
    );
    return this.getSubscriptionForVendor(vendorId);
  }

  async reactivateSubscription(user: User, vendorId: string) {
    await this.assertVendorOwnedByUser(user, vendorId);
    const sub = await this.prisma.vendorSubscription.findUnique({ where: { vendorId } });
    if (!sub) throw new NotFoundException("Vendor subscription not found");

    const effective = resolveEffectiveSubscriptionStatus({
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      gracePeriodDays: sub.gracePeriodDays,
      compedUntil: sub.compedUntil,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    });

    if (!sub.cancelAtPeriodEnd) {
      throw new BadRequestException("Subscription is not scheduled for cancellation");
    }

    if (effective.status !== "ACTIVE" && effective.status !== "TRIAL") {
      throw new BadRequestException("Cannot reactivate after the billing period has ended");
    }

    await this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        cancelAtPeriodEnd: false,
        cancelReason: null,
        cancelledAt: null,
      },
    });
    await this.recordEvent(sub.id, vendorId, "subscription.reactivated", {}, user.id);
    return this.getSubscriptionForVendor(vendorId);
  }

  async changePlan(
    user: User,
    vendorId: string,
    body: { planId: string; interval: BillingInterval; scheduleForRenewal?: boolean },
  ) {
    await this.assertVendorOwnedByUser(user, vendorId);

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: body.planId } });
    if (!plan || !plan.active) throw new NotFoundException("Subscription plan not found");

    if (plan.billingMode === "contact") {
      throw new BadRequestException("This plan requires contacting sales — checkout is not available");
    }

    const sub = await this.prisma.vendorSubscription.findUnique({ where: { vendorId } });
    if (!sub) throw new NotFoundException("Vendor subscription not found");

    if (body.scheduleForRenewal) {
      await this.prisma.vendorSubscription.update({
        where: { vendorId },
        data: {
          pendingPlanId: plan.id,
          pendingInterval: body.interval,
        },
      });
      await this.recordEvent(sub.id, vendorId, "plan.scheduled", { planId: plan.id, interval: body.interval }, user.id);
      return this.getSubscriptionForVendor(vendorId);
    }

    const isAdmin = user.role === "ADMIN";
    const isPaidActive =
      sub.status === "ACTIVE" &&
      sub.planId === plan.id &&
      sub.interval === body.interval &&
      sub.currentPeriodEnd &&
      new Date() < sub.currentPeriodEnd;

    if (isPaidActive) {
      await this.prisma.vendorSubscription.update({
        where: { vendorId },
        data: {
          pendingPlanId: null,
          pendingInterval: null,
        },
      });
      return this.getSubscriptionForVendor(vendorId);
    }

    if (isAdmin) {
      const now = new Date();
      const periodEnd = this.addBillingPeriod(now, body.interval);
      await this.prisma.vendorSubscription.update({
        where: { vendorId },
        data: {
          status: "ACTIVE",
          planId: plan.id,
          interval: body.interval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          pendingPlanId: null,
          pendingInterval: null,
        },
      });
      await this.recordEvent(
        sub.id,
        vendorId,
        "plan.changed",
        { planId: plan.id, interval: body.interval, immediate: true, by: "admin" },
        user.id,
      );
      return this.getSubscriptionForVendor(vendorId);
    }

    throw new BadRequestException(
      "Checkout is required to change your plan. Complete checkout or enable scheduleForRenewal to apply at period end.",
    );
  }

  async adminOverrideTrial(adminUserId: string, vendorId: string, trialEndsAtIso: string) {
    const trialEndsAt = new Date(trialEndsAtIso);
    if (isNaN(trialEndsAt.getTime())) {
      throw new BadRequestException("Invalid date format for trialEndsAt");
    }

    const now = new Date();
    let newStatus: SubscriptionStatus = "TRIAL";
    if (trialEndsAt < now) {
      newStatus = "GRACE";
    }

    const sub = await this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        trialEndsAt,
        trialOverrideBy: adminUserId,
        status: newStatus,
      },
      create: {
        vendorId,
        trialEndsAt,
        trialOverrideBy: adminUserId,
        status: newStatus,
      },
    });
    await this.recordEvent(sub.id, vendorId, "trial.overridden", { trialEndsAt: trialEndsAtIso }, adminUserId);
    return sub;
  }

  async adminGrantComped(adminUserId: string, vendorId: string, compedUntilIso?: string) {
    const compedUntil = compedUntilIso ? new Date(compedUntilIso) : null;
    const sub = await this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        status: "COMPED",
        compedById: adminUserId,
        compedUntil,
        cancelAtPeriodEnd: false,
        pendingPlanId: null,
        pendingInterval: null,
      },
      create: {
        vendorId,
        status: "COMPED",
        compedById: adminUserId,
        compedUntil,
        trialEndsAt: new Date(),
      },
    });
    await this.recordEvent(
      sub.id,
      vendorId,
      "subscription.comped",
      { compedUntil: compedUntilIso ?? null },
      adminUserId,
    );
    return sub;
  }

  async adminActivatePaid(
    adminUserId: string,
    vendorId: string,
    planId: string,
    interval: BillingInterval,
    paymentRef?: string,
    notes?: string,
  ) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Subscription plan not found");

    const now = new Date();
    const periodEnd = this.addBillingPeriod(now, interval);

    const sub = await this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        status: "ACTIVE",
        planId: plan.id,
        interval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        pendingPlanId: null,
        pendingInterval: null,
      },
      create: {
        vendorId,
        status: "ACTIVE",
        planId: plan.id,
        interval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: now,
      },
    });

    await this.prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: sub.id,
        planId: plan.id,
        interval,
        amountLkr: plan.priceLkr,
        periodStart: now,
        periodEnd,
        status: "PAID",
        paidAt: now,
        paymentRef: paymentRef || `ADMIN_COMP_${adminUserId}`,
        notes: notes || "Manual activation by admin",
      },
    });

    await this.recordEvent(sub.id, vendorId, "invoice.paid", { planId: plan.id, interval, paymentRef }, adminUserId);
    await this.recordEvent(sub.id, vendorId, "subscription.activated", { planId: plan.id, interval }, adminUserId);

    return sub;
  }

  async adminSuspend(adminUserId: string, vendorId: string) {
    const sub = await this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        status: "EXPIRED",
        cancelledAt: new Date(),
        cancelReason: `Suspended by admin ${adminUserId}`,
        cancelAtPeriodEnd: false,
      },
      create: {
        vendorId,
        status: "EXPIRED",
        trialEndsAt: new Date(),
        cancelledAt: new Date(),
        cancelReason: `Suspended by admin ${adminUserId}`,
      },
    });
    await this.recordEvent(sub.id, vendorId, "subscription.suspended", {}, adminUserId);
    return sub;
  }
}
