import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { User } from "@ceylonweddings/contracts";
import { SubscriptionService } from "./subscription.service";
import { PaymentService } from "./payment.service";
import { CreateCheckoutDto, PayHereWebhookDto } from "./subscription.dto";

@ApiTags("subscription")
@Controller("subscription")
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get("plans")
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get("vendor/:vendorId")
  @UseGuards(JwtCookieGuard)
  getVendorSubscription(
    @CurrentUser() user: User,
    @Param("vendorId") vendorId: string,
  ) {
    return this.subscriptionService.getSubscriptionForVendor(vendorId);
  }

  @Post("checkout")
  @UseGuards(JwtCookieGuard)
  createCheckout(@CurrentUser() user: User, @Body() body: CreateCheckoutDto) {
    return this.paymentService.createPayHereCheckout(user, body);
  }

  @Post("payhere/webhook")
  @HttpCode(200)
  payhereWebhook(@Body() body: PayHereWebhookDto) {
    return this.paymentService.handlePayHereWebhook(body);
  }
}

