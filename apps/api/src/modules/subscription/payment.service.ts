import { Injectable, BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "@ceylonweddings/database";
import { loadApiEnv } from "@ceylonweddings/env";
import type { BillingInterval, User } from "@ceylonweddings/contracts";

export interface CreateCheckoutParams {
  vendorId: string;
  planId: string;
  interval: BillingInterval;
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
  custom_1?: string; // vendorId
  custom_2?: string; // planId
  method?: string;
  status_message?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initializes a PayHere checkout intent and produces signed checkout payload.
   */
  async createPayHereCheckout(user: User, params: CreateCheckoutParams) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: params.planId },
    });
    if (!plan || !plan.active) {
      throw new NotFoundException("Active subscription plan not found");
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: params.vendorId },
      include: { user: true },
    });
    if (!vendor) {
      throw new NotFoundException("Vendor profile not found");
    }

    const orderId = `CW_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const amount = plan.priceLkr;
    const currency = "LKR";

    const merchantId = process.env.PAYHERE_MERCHANT_ID || "1211149"; // Sandbox fallback
    const merchantSecret = process.env.PAYHERE_SECRET || "CeylonWeddingsSecret2026";

    // Format amount to 2 decimal places e.g. "4900.00"
    const formattedAmount = Number(amount).toFixed(2);
    const hashedSecret = createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawHashString = `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;
    const hash = createHash("md5").update(rawHashString).digest("hex").toUpperCase();

    // Create PaymentIntent in database
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
        },
      },
    });

    const isSandbox = process.env.NODE_ENV !== "production" || !process.env.PAYHERE_LIVE;
    const actionUrl = isSandbox
      ? "https://sandbox.payhere.lk/pay/checkout"
      : "https://www.payhere.lk/pay/checkout";

    return {
      paymentIntentId: intent.id,
      orderId,
      actionUrl,
      fields: {
        merchant_id: merchantId,
        return_url: params.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pro/billing?status=success`,
        cancel_url: params.cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pro/billing?status=cancelled`,
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
   * Processes PayHere Instant Payment Notification (IPN) webhook.
   */
  async handlePayHereWebhook(body: PayHereWebhookBody) {
    this.logger.log(`PayHere IPN received for Order: ${body.order_id} | Status: ${body.status_code}`);

    const merchantSecret = process.env.PAYHERE_SECRET || "CeylonWeddingsSecret2026";
    const hashedSecret = createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawHashString = `${body.merchant_id}${body.order_id}${body.payhere_amount}${body.payhere_currency}${body.status_code}${hashedSecret}`;
    const calculatedMd5 = createHash("md5").update(rawHashString).digest("hex").toUpperCase();

    // Verify hash integrity (allow in mock/local dev if secret not configured)
    if (process.env.NODE_ENV === "production" && body.md5sig !== calculatedMd5) {
      this.logger.error(`PayHere signature mismatch: Expected ${calculatedMd5}, received ${body.md5sig}`);
      throw new BadRequestException("Invalid payment signature");
    }

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { externalId: body.order_id },
    });

    // 2 = Success, 0 = Pending, -1 = Canceled, -2 = Failed, -3 = Chargedback
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
      const planId = body.custom_2 || (intent?.meta as any)?.planId;
      const interval = ((intent?.meta as any)?.interval as BillingInterval) || "MONTHLY";

      if (vendorId && planId) {
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (plan) {
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
              paymentRef: `PAYHERE_${body.payment_id}`,
              notes: `PayHere checkout: ${body.method || "card"}`,
            },
          });
        }
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
}
