import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { VendorTaxonomyService } from "./vendor-taxonomy.service";

@ApiTags("vendor-taxonomy")
@Controller()
export class VendorTaxonomyController {
  constructor(private readonly taxonomy: VendorTaxonomyService) {}

  @Get("vendor-types")
  listTypes() {
    return this.taxonomy.listPublicTypes();
  }

  @Get("vendor-types/:slug/schema")
  typeSchema(@Param("slug") slug: string) {
    return this.taxonomy.getPublicSchema(slug);
  }
}
