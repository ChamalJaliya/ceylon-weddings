import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeClient {
  private readonly logger = new Logger(StripeClient.name);
  private stripe: Stripe | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }

  getClient(): Stripe {
    if (!this.stripe) {
      const key = process.env.STRIPE_SECRET_KEY?.trim();
      if (!key) {
        throw new ServiceUnavailableException("Stripe is not configured");
      }
      this.stripe = new Stripe(key, {
        apiVersion: "2025-02-24.acacia",
        typescript: true,
      });
      this.logger.log("Stripe client initialized");
    }
    return this.stripe;
  }

  getWebhookSecret(): string {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException("Stripe webhook secret is not configured");
    }
    return secret;
  }
}
