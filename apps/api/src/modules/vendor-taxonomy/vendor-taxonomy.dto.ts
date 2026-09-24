import { createZodDto } from "nestjs-zod";
import {
  cloneVendorTypeBodySchema,
  createAttributeDefinitionBodySchema,
  createAttributeOptionBodySchema,
  createVendorTypeBodySchema,
  importTaxonomyBodySchema,
  onboardingAssetPresignBodySchema,
  reorderIdsBodySchema,
  taxonomyPackSchema,
  updateAttributeDefinitionBodySchema,
  updateAttributeOptionBodySchema,
  updateVendorTypeBodySchema,
  upsertVendorAttributesBodySchema,
} from "@ceylonweddings/contracts";

export class CreateVendorTypeDto extends createZodDto(createVendorTypeBodySchema) {}
export class UpdateVendorTypeDto extends createZodDto(updateVendorTypeBodySchema) {}
export class CreateAttributeDefinitionDto extends createZodDto(createAttributeDefinitionBodySchema) {}
export class UpdateAttributeDefinitionDto extends createZodDto(updateAttributeDefinitionBodySchema) {}
export class CreateAttributeOptionDto extends createZodDto(createAttributeOptionBodySchema) {}
export class UpdateAttributeOptionDto extends createZodDto(updateAttributeOptionBodySchema) {}
export class ReorderIdsDto extends createZodDto(reorderIdsBodySchema) {}
export class CloneVendorTypeDto extends createZodDto(cloneVendorTypeBodySchema) {}
export class ImportTaxonomyDto extends createZodDto(importTaxonomyBodySchema) {}
export class TaxonomyPackDto extends createZodDto(taxonomyPackSchema) {}
export class UpsertVendorAttributesDto extends createZodDto(upsertVendorAttributesBodySchema) {}
export class OnboardingAssetPresignDto extends createZodDto(onboardingAssetPresignBodySchema) {}
