import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>("AI_SERVICE_URL", "http://localhost:8001"),
        timeout: 60_000, // 60s — streaming responses can take longer
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
