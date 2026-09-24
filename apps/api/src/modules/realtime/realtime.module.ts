import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MessagingModule } from "../messaging/messaging.module";
import { RealtimeEmitter } from "./realtime.emitter";
import { RealtimeGateway } from "./realtime.gateway";

@Module({
  imports: [AuthModule, forwardRef(() => MessagingModule)],
  providers: [RealtimeEmitter, RealtimeGateway],
  exports: [RealtimeEmitter],
})
export class RealtimeModule {}
