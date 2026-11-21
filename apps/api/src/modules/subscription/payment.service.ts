import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { PrismaService } from "@ceylonweddings/database";
import {
  type BillingInterval,
  type PaymentProvider,
  type User,
  buildVendorPlanDisplayFeatures,
  canonicalizeVendorPlanSlug,
} from "@ceylonweddings/contracts";
import { SubscriptionService } from "./subscription.service";
import { StripeClient } from "./stripe.client";

export interface CreateCheckoutParams {
  vendorId: string;
  planId: string;
  interval: BillingInterval;
  provider?: PaymentProvider;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayHereWebhookBody {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
  status_message?: string;
}

type CheckoutPlan = {
  id: string;
  slug: string;
  name: string;
  priceLkr: number;
  billingMode: string;
  features: unknown;
  stripePriceId: string | null;
  active: boolean;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeClient: StripeClient,
  ) {}

  isPayHereConfigured(): boolean {
    return (
      Boolean(process.env.PAYHERE_MERCHANT_ID?.trim() && process.env.PAYHERE_SECRET?.trim()) ||
      process.env.NODE_ENV !== "production"
    );
  }

  isStripeConfigured(): boolean {
    return this.stripeClient.isConfigured();
  }

  getAvailableProviders(): {
    payhere: boolean;
    stripe: boolean;
    defaultProvider: PaymentProvider;
  } {
    const payhere = this.isPayHereConfigured();
    const stripe = this.isStripeConfigured();
    return {
      payhere,
      stripe,
      defaultProvider: payhere ? "payhere" : stripe ? "stripe" : "payhere",
    };
  }

  async createCheckout(user: User, params: CreateCheckoutParams) {
    const provider = params.provider ?? this.getAvailableProviders().defaultProvider;
    if (provider === "stripe") {
      return this.createStripeCheckout(user, params);
    }
    return this.createPayHereCheckout(user, params);
  }

  /**
   * Initializes a PayHere checkout intent and produces signed checkout payload.
   */
  async createPayHereCheckout(user: User, params: CreateCheckoutParams) {
    const { plan, vendor } = await this.resolveCheckoutContext(user, params);

    const planFeatures = Array.isArray(plan.features)
      ? (plan.features as string[]).filter((item) => typeof item === "string")
      : [];
    const displayFeatures = buildVendorPlanDisplayFeatures({
      slug: canonicalizeVendorPlanSlug(plan.slug),
      features: planFeatures,
      billingMode: plan.billingMode,
    });

    const orderId = `CW_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const amount = plan.priceLkr;
    const currency = "LKR";

    const merchantId = process.env.PAYHERE_MERCHANT_ID || "1211149";
    const merchantSecret = process.env.PAYHERE_SECRET || "CeylonWeddingsSecret2026";

    const formattedAmount = Number(amount).toFixed(2);
    const hashedSecret = createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawHashString = `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;
    const hash = createHash("md5").update(rawHashString).digest("hex").toUpperCase();

    const intent = await this.prisma.paymentIntent.create({
      data: {
        vendorId: vendor.id,
        userId: user.id,
        provider: "PAYHERE",
        externalId: orderId,
        amountLkr: amount,
        currency,
        status: "PENDING",
        purpose: `Subscription ${plan.name} (${params.interval})`,
        meta: {
          planId: plan.id,
          interval: params.interval,
          planSlug: plan.slug,
          displayFeatures,
          provider: "payhere",
        },
      },
    });

    const isSandbox = process.env.NODE_ENV !== "production" || !process.env.PAYHERE_LIVE;
    const actionUrl = isSandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";

    return {
      provider: "payhere" as const,
      paymentIntentId: intent.id,
      orderId,
      actionUrl,
      fields: {
        merchant_id: merchantId,
        return_url:
          params.returnUrl ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pro/billing?status=success`,
        cancel_url:
          params.cancelUrl ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pro/billing?status=cancelled`,
        notify_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/subscription/payhere/webhook`,
        order_id: orderId,
        items: `Ceylon Weddings Pro: ${plan.name}`,
        currency,
        amount: formattedAmount,
        first_name: vendor.name.split(" ")[0] || "Vendor",
        last_name: vendor.name.split(" ").slice(1).join(" ") || "Partner",
        email: user.email || vendor.user?.email || "billing@ceylonweddings.com",
        phone: vendor.whatsapp || user.phone || "0771234567",
        address: vendor.city,
        city: vendor.city,
        country: "Sri Lanka",
        hash,
        custom_1: vendor.id,
        custom_2: plan.id,
      },
    };
  }

  /**
   * Stripe Checkout Session (hosted). Charges USD converted from LKR unless stripePriceId is set.
   */
  async createStripeCheckout(user: User, params: CreateCheckoutParams) {
    if (!this.stripeClient.isConfigured()) {
      throw new ServiceUnavailableException("Stripe is not configured. Set STRIPE_SECRET_KEY or use PayHere.");
    }

    const { plan, vendor } = await this.resolveCheckoutContext(user, params);
    const stripe = this.stripeClient.getClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const returnUrl = params.returnUrl || `${siteUrl}/pro/billing?status=success&provider=stripe`;
    const cancelUrl = params.cancelUrl || `${siteUrl}/pro/billing?status=cancelled&provider=stripe`;

    const amountUsdCents = this.lkrToUsdCents(plan.priceLkr);
    const orderId = `CW_STRIPE_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const intent = await this.prisma.paymentIntent.create({
      data: {
        vendorId: vendor.id,
        userId: user.id,
        provider: "STRIPE",
        externalId: orderId,
        amountLkr: plan.priceLkr,
        currency: "USD",
        status: "PENDING",
        purpose: `Subscription ${plan.name} (${params.interval}) via Stripe`,
        meta: {
          planId: plan.id,
          interval: params.interval,
          planSlug: plan.slug,
          provider: "stripe",
          amountUsdCents,
        },
      },
    });

    let customerId: string | undefined;
    const existingSub = await this.prisma.vendorSubscription.findUnique({
      where: { vendorId: vendor.id },
    });
    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email || vendor.user?.email || undefined,
        name: vendor.name,
        metadata: { vendorId: vendor.id, userId: user.id },
      });
      customerId = customer.id;
      await this.prisma.vendorSubscription.upsert({
        where: { vendorId: vendor.id },
        update: { stripeCustomerId: customerId },
        create: {
          vendorId: vendor.id,
          status: "TRIAL",
          trialEndsAt: new Date(),
          stripeCustomerId: customerId,
        },
      });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = plan.stripePriceId
      ? [{ price: plan.stripePriceId, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountUsdCents,
              product_data: {
                name: `Ceylon Weddings ${plan.name}`,
                description: `${params.interval === "ANNUAL" ? "Annual" : "Monthly"} vendor Pro membership`,
              },
            },
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: vendor.id,
      success_url: returnUrl.includes("?")
        ? `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`
        : `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      line_items: lineItems,
      metadata: {
        vendorId: vendor.id,
        planId: plan.id,
        interval: params.interval,
        paymentIntentId: intent.id,
        orderId,
      },
      payment_intent_data: {
        metadata: {
          vendorId: vendor.id,
          planId: plan.id,
          interval: params.interval,
          paymentIntentId: intent.id,
        },
      },
    });

    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        externalId: session.id,
        meta: {
          ...(intent.meta as object),
          stripeSessionId: session.id,
          stripeCustomerId: customerId,
        },
      },
    });

    if (!session.url) {
      throw new BadRequestException("Stripe did not return a checkout URL");
    }

    return {
      provider: "stripe" as const,
      paymentIntentId: intent.id,
      orderId: session.id,
      actionUrl: session.url,
      fields: null,
    };
  }

  async handlePayHereWebhook(body: PayHereWebhookBody) {
    this.logger.log(`PayHere IPN received for Order: ${body.order_id} | Status: ${body.status_code}`);

    const merchantSecret = process.env.PAYHERE_SECRET || "CeylonWeddingsSecret2026";
    const hashedSecret = createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawHashString = `${body.merchant_id}${body.order_id}${body.payhere_amount}${body.payhere_currency}${body.status_code}${hashedSecret}`;
    const calculatedMd5 = createHash("md5").update(rawHashString).digest("hex").toUpperCase();

    if (process.env.NODE_ENV === "production" && body.md5sig !== calculatedMd5) {
      this.logger.error(`PayHere signature mismatch: Expected ${calculatedMd5}, received ${body.md5sig}`);
      throw new BadRequestException("Invalid payment signature");
    }

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { externalId: body.order_id },
    });

    if (body.status_code === "2") {
      if (intent) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: "PAID",
            meta: {
              ...(intent.meta as object),
              payherePaymentId: body.payment_id,
              method: body.method,
            },
          },
        });
      }

      const vendorId = body.custom_1 || intent?.vendorId;
      const planId = body.custom_2 || (intent?.meta as { planId?: string } | null)?.planId;
      const interval =
        ((intent?.meta as { interval?: BillingInterval } | null)?.interval as BillingInterval) || "MONTHLY";

      if (vendorId && planId) {
        await this.activatePaidMembership({
          vendorId,
          planId,
          interval,
          paymentRef: `PAYHERE_${body.payment_id}`,
          notes: `PayHere checkout: ${body.method || "card"}`,
          source: "payhere",
          amountLkr: intent?.amountLkr,
        });
      }
    } else if (body.status_code === "-1" || body.status_code === "-2") {
      if (intent) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: "FAILED" },
        });
      }
    }

    return { status: "OK" };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripeClient.isConfigured()) {
      throw new ServiceUnavailableException("Stripe is not configured");
    }
    const stripe = this.stripeClient.getClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, this.stripeClient.getWebhookSecret());
    } catch (err) {
      this.logger.error(`Stripe webhook signature failed: ${(err as Error).message}`);
      throw new BadRequestException("Invalid Stripe signature");
    }

    this.logger.log(`Stripe webhook: ${event.type} (${event.id})`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid" && session.status !== "complete") {
        return { received: true };
      }

      const vendorId = session.metadata?.vendorId || session.client_reference_id;
      const planId = session.metadata?.planId;
      const interval = (session.metadata?.interval as BillingInterval) || "MONTHLY";
      const paymentIntentId = session.metadata?.paymentIntentId;

      if (paymentIntentId) {
        await this.prisma.paymentIntent.updateMany({
          where: { id: paymentIntentId },
          data: {
            status: "PAID",
            externalId: session.id,
            meta: {
              stripeSessionId: session.id,
              stripePaymentIntent:
                typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
              stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
            },
          },
        });
      } else if (session.id) {
        await this.prisma.paymentIntent.updateMany({
          where: { externalId: session.id },
          data: { status: "PAID" },
        });
      }

      if (vendorId && planId) {
        const intent = paymentIntentId
          ? await this.prisma.paymentIntent.findUnique({ where: { id: paymentIntentId } })
          : null;
        await this.activatePaidMembership({
          vendorId,
          planId,
          interval,
          paymentRef: `STRIPE_${session.id}`,
          notes: "Stripe Checkout",
          source: "stripe",
          amountLkr: intent?.amountLkr,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        });
      }
    }

    return { received: true };
  }

  private async activatePaidMembership(input: {
    vendorId: string;
    planId: string;
    interval: BillingInterval;
    paymentRef: string;
    notes: string;
    source: "payhere" | "stripe";
    amountLkr?: number;
    stripeCustomerId?: string | null;
  }) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    if (!plan) return;

    const now = new Date();
    const periodEnd = new Date(now);
    if (input.interval === "MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const sub = await this.prisma.vendorSubscription.upsert({
      where: { vendorId: input.vendorId },
      update: {
        status: "ACTIVE",
        planId: plan.id,
        interval: input.interval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        pendingPlanId: null,
        pendingInterval: null,
        cancelledAt: null,
        cancelReason: null,
        ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
      },
      create: {
        vendorId: input.vendorId,
        status: "ACTIVE",
        planId: plan.id,
        interval: input.interval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: now,
        stripeCustomerId: input.stripeCustomerId ?? null,
      },
    });

    await this.prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: sub.id,
        planId: plan.id,
        interval: input.interval,
        amountLkr: input.amountLkr ?? plan.priceLkr,
        periodStart: now,
        periodEnd,
        status: "PAID",
        paidAt: now,
        paymentRef: input.paymentRef,
        notes: input.notes,
      },
    });

    await this.subscriptionService.recordEvent(sub.id, input.vendorId, "invoice.paid", {
      paymentRef: input.paymentRef,
      planId: plan.id,
      interval: input.interval,
      amountLkr: input.amountLkr ?? plan.priceLkr,
      source: input.source,
    });
    await this.subscriptionService.recordEvent(sub.id, input.vendorId, "subscription.activated", {
      planId: plan.id,
      interval: input.interval,
      source: input.source,
    });
  }

  private async resolveCheckoutContext(user: User, params: CreateCheckoutParams) {
    const plan = (await this.prisma.subscriptionPlan.findUnique({
      where: { id: params.planId },
    })) as CheckoutPlan | null;
    if (!plan || !plan.active) {
      throw new NotFoundException("Active subscription plan not found");
    }
    if (plan.billingMode === "contact" || plan.priceLkr <= 0) {
      throw new BadRequestException("This plan requires contacting sales");
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: params.vendorId },
      include: { user: true },
    });
    if (!vendor) {
      throw new NotFoundException("Vendor profile not found");
    }
    if (vendor.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("You do not have access to this vendor profile");
    }

    return { plan, vendor };
  }

  /** Convert LKR list price to Stripe USD cents. Override with STRIPE_LKR_PER_USD. */
  private lkrToUsdCents(priceLkr: number): number {
    const lkrPerUsd = Number(process.env.STRIPE_LKR_PER_USD || "300");
    const rate = Number.isFinite(lkrPerUsd) && lkrPerUsd > 0 ? lkrPerUsd : 300;
    return Math.max(50, Math.round((priceLkr / rate) * 100));
  }
}
