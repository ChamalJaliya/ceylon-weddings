import { createZodDto } from "nestjs-zod";
import {
  adminActivatePaidBodySchema,
  adminAuditListQuerySchema,
  adminBulkVendorBodySchema,
  adminGrantCompedBodySchema,
  adminOverrideTrialBodySchema,
  adminPatchUserBodySchema,
  adminPatchVendorBodySchema,
  adminUserListQuerySchema,
  adminVendorListQuerySchema,
  adminWeddingListQuerySchema,
  createReportBodySchema,
  impersonateBodySchema,
  promotionListQuerySchema,
  publicPromotionQuerySchema,
  resolveReportBodySchema,
  upsertAdminArticleBodySchema,
  upsertAwardNominationBodySchema,
  upsertFeatureFlagBodySchema,
  upsertFeaturedPlacementBodySchema,
  upsertPromotionBodySchema,
  updateSiteConfigBodySchema,
  upsertCmsPageBodySchema,
} from "@ceylonweddings/contracts";

export class AdminVendorListQueryDto extends createZodDto(adminVendorListQuerySchema) {}
export class AdminPatchVendorDto extends createZodDto(adminPatchVendorBodySchema) {}
export class AdminBulkVendorDto extends createZodDto(adminBulkVendorBodySchema) {}
export class AdminUserListQueryDto extends createZodDto(adminUserListQuerySchema) {}
export class AdminPatchUserDto extends createZodDto(adminPatchUserBodySchema) {}
export class AdminAuditListQueryDto extends createZodDto(adminAuditListQuerySchema) {}
export class CreateReportDto extends createZodDto(createReportBodySchema) {}
export class ResolveReportDto extends createZodDto(resolveReportBodySchema) {}
export class UpsertAdminArticleDto extends createZodDto(upsertAdminArticleBodySchema) {}
export class AdminWeddingListQueryDto extends createZodDto(adminWeddingListQuerySchema) {}
export class UpsertFeaturedPlacementDto extends createZodDto(upsertFeaturedPlacementBodySchema) {}
export class UpsertFeatureFlagDto extends createZodDto(upsertFeatureFlagBodySchema) {}
export class UpsertAwardNominationDto extends createZodDto(upsertAwardNominationBodySchema) {}
export class ImpersonateDto extends createZodDto(impersonateBodySchema) {}
export class UpsertPromotionDto extends createZodDto(upsertPromotionBodySchema) {}
export class PromotionListQueryDto extends createZodDto(promotionListQuerySchema) {}
export class UpdateSiteConfigDto extends createZodDto(updateSiteConfigBodySchema) {}
export class UpsertCmsPageDto extends createZodDto(upsertCmsPageBodySchema) {}
export class PublicPromotionQueryDto extends createZodDto(publicPromotionQuerySchema) {}
export class AdminOverrideTrialDto extends createZodDto(adminOverrideTrialBodySchema) {}
export class AdminGrantCompedDto extends createZodDto(adminGrantCompedBodySchema) {}
export class AdminActivatePaidDto extends createZodDto(adminActivatePaidBodySchema) {}

