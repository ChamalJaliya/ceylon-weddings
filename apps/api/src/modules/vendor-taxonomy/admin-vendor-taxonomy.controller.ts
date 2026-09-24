import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { VendorTaxonomyService } from "./vendor-taxonomy.service";
import {
  CloneVendorTypeDto,
  CreateAttributeDefinitionDto,
  CreateAttributeOptionDto,
  CreateVendorTypeDto,
  ImportTaxonomyDto,
  ReorderIdsDto,
  UpdateAttributeDefinitionDto,
  UpdateAttributeOptionDto,
  UpdateVendorTypeDto,
} from "./vendor-taxonomy.dto";

@ApiTags("admin-vendor-taxonomy")
@Controller("admin/vendor-types")
@UseGuards(JwtCookieGuard)
export class AdminVendorTaxonomyController {
  constructor(private readonly taxonomy: VendorTaxonomyService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.taxonomy.adminListTypes(user);
  }

  @Get("export")
  exportPack(@CurrentUser() user: User, @Query("slug") slug?: string) {
    return this.taxonomy.exportPack(user, slug);
  }

  @Post("import")
  importPack(
    @CurrentUser() user: User,
    @Body() body: ImportTaxonomyDto,
    @Query("dryRun") dryRun: string | undefined,
    @Req() req: Request,
  ) {
    const dry =
      dryRun === "true" || dryRun === "1" || body.dryRun === true;
    return this.taxonomy.importPack(user, body, dry, clientIp(req));
  }

  @Patch("reorder")
  reorder(@CurrentUser() user: User, @Body() body: ReorderIdsDto, @Req() req: Request) {
    return this.taxonomy.reorderTypes(user, body.ids, clientIp(req));
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreateVendorTypeDto, @Req() req: Request) {
    return this.taxonomy.createType(user, body, clientIp(req));
  }

  @Get(":id")
  get(@CurrentUser() user: User, @Param("id") id: string) {
    return this.taxonomy.adminGetType(user, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpdateVendorTypeDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.updateType(user, id, body, clientIp(req));
  }

  @Delete(":id")
  @HttpCode(200)
  remove(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.taxonomy.deleteType(user, id, clientIp(req));
  }

  @Get(":id/analytics")
  analytics(@CurrentUser() user: User, @Param("id") id: string) {
    return this.taxonomy.typeAnalytics(user, id);
  }

  @Post(":id/clone")
  clone(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: CloneVendorTypeDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.cloneType(user, id, body, clientIp(req));
  }

  @Post(":id/definitions")
  createDefinition(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: CreateAttributeDefinitionDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.createDefinition(user, id, body, clientIp(req));
  }

  @Patch(":id/definitions/reorder")
  reorderDefinitions(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: ReorderIdsDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.reorderDefinitions(user, id, body.ids, clientIp(req));
  }

  @Patch(":id/definitions/:definitionId")
  updateDefinition(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("definitionId") definitionId: string,
    @Body() body: UpdateAttributeDefinitionDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.updateDefinition(user, id, definitionId, body, clientIp(req));
  }

  @Delete(":id/definitions/:definitionId")
  @HttpCode(200)
  deleteDefinition(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("definitionId") definitionId: string,
    @Req() req: Request,
  ) {
    return this.taxonomy.deleteDefinition(user, id, definitionId, clientIp(req));
  }

  @Post(":id/definitions/:definitionId/options")
  createOption(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("definitionId") definitionId: string,
    @Body() body: CreateAttributeOptionDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.createOption(user, id, definitionId, body, clientIp(req));
  }

  @Patch(":id/definitions/:definitionId/options/reorder")
  reorderOptions(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("definitionId") definitionId: string,
    @Body() body: ReorderIdsDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.reorderOptions(user, id, definitionId, body.ids, clientIp(req));
  }

  @Patch(":id/definitions/:definitionId/options/:optionId")
  updateOption(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("definitionId") definitionId: string,
    @Param("optionId") optionId: string,
    @Body() body: UpdateAttributeOptionDto,
    @Req() req: Request,
  ) {
    return this.taxonomy.updateOption(user, id, definitionId, optionId, body, clientIp(req));
  }

  @Delete(":id/definitions/:definitionId/options/:optionId")
  @HttpCode(200)
  deleteOption(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("definitionId") definitionId: string,
    @Param("optionId") optionId: string,
    @Req() req: Request,
  ) {
    return this.taxonomy.deleteOption(user, id, definitionId, optionId, clientIp(req));
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}
