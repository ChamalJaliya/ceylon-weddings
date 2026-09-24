import { Module, forwardRef } from "@nestjs/common";
import { StorageModule } from "../../common/storage.module";
import { AuthModule } from "../auth/auth.module";
import { AdminModule } from "../admin/admin.module";
import { VendorTaxonomyService } from "./vendor-taxonomy.service";
import { VendorTaxonomyController } from "./vendor-taxonomy.controller";
import { AdminVendorTaxonomyController } from "./admin-vendor-taxonomy.controller";
import { AdminOnboardingAssetsController } from "./admin-onboarding-assets.controller";

@Module({
  imports: [AuthModule, StorageModule, forwardRef(() => AdminModule)],
  controllers: [
    VendorTaxonomyController,
    AdminVendorTaxonomyController,
    AdminOnboardingAssetsController,
  ],
  providers: [VendorTaxonomyService],
  exports: [VendorTaxonomyService],
})
export class VendorTaxonomyModule {}
