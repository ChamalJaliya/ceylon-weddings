import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { WeddingsModule } from "../weddings/weddings.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { AdminAccessService } from "./admin-access.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { SiteConfigController } from "./site-config.controller";
import { SiteConfigService } from "./site-config.service";

@Module({
  imports: [AuthModule, WeddingsModule, SubscriptionModule, BullModule.registerQueue({ name: "email" })],
  controllers: [AdminController, PromotionsController, SiteConfigController],
  providers: [AdminAccessService, AdminService, PromotionsService, SiteConfigService],
  exports: [AdminAccessService, PromotionsService, SiteConfigService],
})
export class AdminModule {}
