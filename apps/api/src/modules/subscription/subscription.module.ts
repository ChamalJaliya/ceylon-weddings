import { Module } from "@nestjs/common";
import { PrismaModule } from "@ceylonweddings/database";
import { AuthModule } from "../auth/auth.module";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { PaymentService } from "./payment.service";
import { StripeClient } from "./stripe.client";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PaymentService, StripeClient],
  exports: [SubscriptionService, PaymentService],
})
export class SubscriptionModule {}
