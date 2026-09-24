import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { loadApiEnv } from "@ceylonweddings/env";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtCookieGuard } from "./jwt-cookie.guard";

const env = loadApiEnv();

@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_EXPIRES as "15m" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtCookieGuard],
  exports: [JwtCookieGuard, JwtModule],
})
export class AuthModule {}
