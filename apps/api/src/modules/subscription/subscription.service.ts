import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import type { BillingInterval, SubscriptionStatus } from "@ceylonweddings/contracts";

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures default plans exist in the database.
   */
  async ensureDefaultPlans() {
    const existing = await this.prisma.subscriptionPlan.findMany();
    if (existing.length === 0) {
      await this.prisma.subscriptionPlan.createMany({
        data: [
          { name: "Monthly Pro", interval: "MONTHLY", priceLkr: 4900, active: true },
          { name: "Annual Pro", interval: "ANNUAL", priceLkr: 45000, active: true },
        ],
      });
    }
  }

  /**
   * Get all active subscription plans.
   */
  async getPlans() {
    await this.ensureDefaultPlans();
    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { priceLkr: "asc" },
    });
  }

  /**
   * Initialize 3-month free trial for a newly created vendor.
   */
  async initTrial(vendorId: string) {
    const existing = await this.prisma.vendorSubscription.findUnique({
      where: { vendorId },
    });
    if (existing) return existing;

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 3); // 3 months trial

    return this.prisma.vendorSubscription.create({
      data: {
        vendorId,
        status: "TRIAL",
        trialEndsAt,
      },
    });
  }

  /**
   * Get vendor subscription details with live computed status.
   */
  async getSubscriptionForVendor(vendorId: string) {
    let sub = await this.prisma.vendorSubscription.findUnique({
      where: { vendorId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!sub) {
      sub = (await this.initTrial(vendorId)) as any;
      sub = await this.prisma.vendorSubscription.findUnique({
        where: { vendorId },
        include: {
          plan: true,
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    }

    if (!sub) throw new NotFoundException("Vendor subscription not found");

    const now = new Date();
    let effectiveStatus: SubscriptionStatus = sub.status as SubscriptionStatus;
    let daysRemaining = 0;

    if (sub.status === "TRIAL") {
      const diffMs = sub.trialEndsAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        const graceEnd = new Date(sub.trialEndsAt.getTime() + sub.gracePeriodDays * 24 * 60 * 60 * 1000);
        if (now < graceEnd) {
          effectiveStatus = "GRACE";
          daysRemaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          effectiveStatus = "EXPIRED";
          daysRemaining = 0;
        }
      }
    } else if (sub.status === "ACTIVE" && sub.currentPeriodEnd) {
      const diffMs = sub.currentPeriodEnd.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        const graceEnd = new Date(sub.currentPeriodEnd.getTime() + sub.gracePeriodDays * 24 * 60 * 60 * 1000);
        if (now < graceEnd) {
          effectiveStatus = "GRACE";
          daysRemaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          effectiveStatus = "EXPIRED";
          daysRemaining = 0;
        }
      }
    } else if (sub.status === "COMPED") {
      if (sub.compedUntil) {
        const diffMs = sub.compedUntil.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          effectiveStatus = "EXPIRED";
          daysRemaining = 0;
        }
      } else {
        daysRemaining = 999; // Permanent comped
      }
    }

    return {
      ...sub,
      status: effectiveStatus,
      daysRemaining,
      trialEndsAt: sub.trialEndsAt.toISOString(),
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelledAt: sub.cancelledAt?.toISOString() ?? null,
      compedUntil: sub.compedUntil?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      invoices: sub.invoices.map((inv) => ({
        ...inv,
        periodStart: inv.periodStart.toISOString(),
        periodEnd: inv.periodEnd.toISOString(),
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Admin override: Change trial end date.
   */
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

    return this.prisma.vendorSubscription.upsert({
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
  }

  /**
   * Admin grant complimentary access.
   */
  async adminGrantComped(adminUserId: string, vendorId: string, compedUntilIso?: string) {
    const compedUntil = compedUntilIso ? new Date(compedUntilIso) : null;
    return this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        status: "COMPED",
        compedById: adminUserId,
        compedUntil,
      },
      create: {
        vendorId,
        status: "COMPED",
        compedById: adminUserId,
        compedUntil,
        trialEndsAt: new Date(),
      },
    });
  }

  /**
   * Admin mark subscription as active paid (manual invoice recording).
   */
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
    const periodEnd = new Date(now);
    if (interval === "MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const sub = await this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        status: "ACTIVE",
        planId: plan.id,
        interval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
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

    // Create invoice record
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

    return sub;
  }

  /**
   * Admin force suspend / expire subscription.
   */
  async adminSuspend(adminUserId: string, vendorId: string) {
    return this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      update: {
        status: "EXPIRED",
        cancelledAt: new Date(),
        cancelReason: `Suspended by admin ${adminUserId}`,
      },
      create: {
        vendorId,
        status: "EXPIRED",
        trialEndsAt: new Date(),
        cancelledAt: new Date(),
        cancelReason: `Suspended by admin ${adminUserId}`,
      },
    });
  }
}
