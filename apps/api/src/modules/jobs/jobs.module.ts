import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { EmailProcessor } from "./email.processor";
import { EmailService } from "./email.service";

@Module({
  imports: [BullModule.registerQueue({ name: "email" })],
  providers: [EmailProcessor, EmailService],
  exports: [BullModule, EmailService],
})
export class JobsModule {}
