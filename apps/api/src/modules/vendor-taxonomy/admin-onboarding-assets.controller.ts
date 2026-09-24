import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { OnboardingAssetPresignResponse, User } from "@ceylonweddings/contracts";
import { ONBOARDING_ASSET_CONTENT_TYPES } from "@ceylonweddings/contracts";
import { S3PresignService } from "../../common/s3-presign.service";
import { AdminAccessService } from "../admin/admin-access.service";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { OnboardingAssetPresignDto } from "./vendor-taxonomy.dto";

@ApiTags("admin-onboarding-assets")
@Controller("admin/onboarding-assets")
@UseGuards(JwtCookieGuard)
export class AdminOnboardingAssetsController {
  constructor(
    private readonly presigner: S3PresignService,
    private readonly access: AdminAccessService,
  ) {}

  @Post("presign")
  presign(
    @CurrentUser() user: User,
    @Body() body: OnboardingAssetPresignDto,
  ): Promise<OnboardingAssetPresignResponse> {
    this.access.assertAdmin(user);
    return this.presigner.presignObject({
      keyPrefix: "admin/onboarding",
      filename: body.filename,
      contentType: body.contentType,
      allowed: ONBOARDING_ASSET_CONTENT_TYPES,
    });
  }
}
