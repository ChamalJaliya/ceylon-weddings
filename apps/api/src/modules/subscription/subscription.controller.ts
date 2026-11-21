import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { User } from "@ceylonweddings/contracts";
import { SubscriptionService } from "./subscription.service";
import { PaymentService } from "./payment.service";
import {
  CancelSubscriptionDto,
  ChangeSubscriptionPlanDto,
  CreateCheckoutDto,
  PayHereWebhookDto,
} from "./subscription.dto";

@ApiTags("subscription")
@Controller("subscription")
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get("pricing")
  getPricing() {
    return this.subscriptionService.getPricingCatalog();
  }

  @Get("plans")
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get("providers")
  getProviders() {
    return this.paymentService.getAvailableProviders();
  }

  @Get("vendor/:vendorId")
  @UseGuards(JwtCookieGuard)
  getVendorSubscription(@CurrentUser() user: User, @Param("vendorId") vendorId: string) {
    return this.subscriptionService.getSubscriptionForVendor(vendorId);
  }

  @Post("vendor/:vendorId/cancel")
  @UseGuards(JwtCookieGuard)
  cancelVendorSubscription(
    @CurrentUser() user: User,
    @Param("vendorId") vendorId: string,
    @Body() body: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancelSubscription(user, vendorId, {
      reason: body.reason,
      atPeriodEnd: body.atPeriodEnd,
    });
  }

  @Post("vendor/:vendorId/reactivate")
  @UseGuards(JwtCookieGuard)
  reactivateVendorSubscription(@CurrentUser() user: User, @Param("vendorId") vendorId: string) {
    return this.subscriptionService.reactivateSubscription(user, vendorId);
  }

  @Post("vendor/:vendorId/change-plan")
  @UseGuards(JwtCookieGuard)
  changeVendorPlan(
    @CurrentUser() user: User,
    @Param("vendorId") vendorId: string,
    @Body() body: ChangeSubscriptionPlanDto,
  ) {
    return this.subscriptionService.changePlan(user, vendorId, body);
  }

  @Post("checkout")
  @UseGuards(JwtCookieGuard)
  createCheckout(@CurrentUser() user: User, @Body() body: CreateCheckoutDto) {
    return this.paymentService.createCheckout(user, body);
  }

  @Post("payhere/webhook")
  @HttpCode(200)
  payhereWebhook(@Body() body: PayHereWebhookDto) {
    return this.paymentService.handlePayHereWebhook(body);
  }

  @Post("stripe/webhook")
  @HttpCode(200)
  stripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers("stripe-signature") signature: string) {
    const raw = req.rawBody;
    if (!raw?.length || !signature) {
      throw new BadRequestException("Missing Stripe raw body or signature");
    }
    return this.paymentService.handleStripeWebhook(raw, signature);
  }
}
