import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AdminModule } from "../admin/admin.module";
import { AuthModule } from "../auth/auth.module";
import { ConsultationsController } from "./consultations.controller";
import { ConsultationsService } from "./consultations.service";

@Module({
  imports: [AuthModule, AdminModule, BullModule.registerQueue({ name: "email" })],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
