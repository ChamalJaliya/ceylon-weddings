import { BullModule } from "@nestjs/bullmq";
import { Global, Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { DevEmailPreviewController } from "./dev-email-preview.controller";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

/** Global so any module can `notify()` without import cycles. */
@Global()
@Module({
  imports: [AuthModule, forwardRef(() => RealtimeModule), BullModule.registerQueue({ name: "email" })],
  controllers: [NotificationsController, DevEmailPreviewController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
