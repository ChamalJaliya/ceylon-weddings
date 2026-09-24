import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "@ceylonweddings/database";
import { loadApiEnv } from "@ceylonweddings/env";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ConsultationsModule } from "./modules/consultations/consultations.module";
import { HealthModule } from "./modules/health/health.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { SearchModule } from "./modules/search/search.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { WeddingsModule } from "./modules/weddings/weddings.module";
import { VendorTaxonomyModule } from "./modules/vendor-taxonomy/vendor-taxonomy.module";
import { AiModule } from "./modules/ai/ai.module";
import { RateLimitGuard } from "./common/rate-limit.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    BullModule.forRootAsync({
      useFactory: () => {
        const env = loadApiEnv();
        return { connection: { url: env.REDIS_URL } };
      },
    }),
    HealthModule,
    AuthModule,
    JobsModule,
    RealtimeModule,
    MessagingModule,
    WeddingsModule,
    VendorTaxonomyModule,
    AdminModule,
    ConsultationsModule,
    SearchModule,
    SubscriptionModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}

