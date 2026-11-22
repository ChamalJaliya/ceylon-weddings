import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PromotionsService } from "./promotions.service";
import {
  PromotionListQueryDto,
  PublicPromotionQueryDto,
  TrackPromotionDto,
  UpsertPromotionDto,
  UpsertPromotionPackageDto,
  UpsertPromotionSlotConfigDto,
} from "./admin.dto";

@ApiTags("promotions")
@Controller()
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get("admin/promotions")
  @UseGuards(JwtCookieGuard)
  adminList(@CurrentUser() user: User, @Query() query: PromotionListQueryDto) {
    return this.promotions.adminList(user, query);
  }

  @Get("admin/promotions/:id")
  @UseGuards(JwtCookieGuard)
  adminGet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.promotions.adminGet(user, id);
  }

  @Post("admin/promotions")
  @UseGuards(JwtCookieGuard)
  adminCreate(@CurrentUser() user: User, @Body() body: UpsertPromotionDto, @Req() req: Request) {
    return this.promotions.adminUpsert(user, body, undefined, clientIp(req));
  }

  @Put("admin/promotions/:id")
  @UseGuards(JwtCookieGuard)
  adminUpdate(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpsertPromotionDto,
    @Req() req: Request,
  ) {
    return this.promotions.adminUpsert(user, body, id, clientIp(req));
  }

  @Delete("admin/promotions/:id")
  @UseGuards(JwtCookieGuard)
  adminDelete(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.promotions.adminDelete(user, id, clientIp(req));
  }

  @Get("admin/promotion-slots")
  @UseGuards(JwtCookieGuard)
  listSlots(@CurrentUser() user: User) {
    return this.promotions.listSlotConfigs(user);
  }

  @Put("admin/promotion-slots")
  @UseGuards(JwtCookieGuard)
  upsertSlot(@CurrentUser() user: User, @Body() body: UpsertPromotionSlotConfigDto, @Req() req: Request) {
    return this.promotions.upsertSlotConfig(user, body, clientIp(req));
  }

  @Get("admin/promotion-packages")
  @UseGuards(JwtCookieGuard)
  listPackages(@CurrentUser() user: User) {
    return this.promotions.listPackages(user);
  }

  @Post("admin/promotion-packages")
  @UseGuards(JwtCookieGuard)
  createPackage(@CurrentUser() user: User, @Body() body: UpsertPromotionPackageDto, @Req() req: Request) {
    return this.promotions.createPackage(user, body, clientIp(req));
  }

  @Put("admin/promotion-packages/:id")
  @UseGuards(JwtCookieGuard)
  updatePackage(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpsertPromotionPackageDto,
    @Req() req: Request,
  ) {
    return this.promotions.updatePackage(user, id, body, clientIp(req));
  }

  @Delete("admin/promotion-packages/:id")
  @UseGuards(JwtCookieGuard)
  deletePackage(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.promotions.deletePackage(user, id, clientIp(req));
  }

  @Get("admin/promotion-analytics/slots")
  @UseGuards(JwtCookieGuard)
  slotAnalytics(@CurrentUser() user: User) {
    return this.promotions.slotAnalytics(user);
  }

  @Get("vendors/me/promotions")
  @UseGuards(JwtCookieGuard)
  vendorList(@CurrentUser() user: User) {
    return this.promotions.vendorList(user);
  }

  @Get("vendors/me/promotions/:id")
  @UseGuards(JwtCookieGuard)
  vendorGet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.promotions.vendorGet(user, id);
  }

  @Post("vendors/me/promotions")
  @UseGuards(JwtCookieGuard)
  vendorCreate(@CurrentUser() user: User, @Body() body: UpsertPromotionDto) {
    return this.promotions.vendorUpsert(user, body);
  }

  @Put("vendors/me/promotions/:id")
  @UseGuards(JwtCookieGuard)
  vendorUpdate(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpsertPromotionDto) {
    return this.promotions.vendorUpsert(user, body, id);
  }

  @Get("vendors/me/promotion-packages")
  @UseGuards(JwtCookieGuard)
  vendorPackages(@CurrentUser() user: User) {
    return this.promotions.vendorListPackages(user);
  }

  @Post("vendors/me/promotion-packages/:id/activate")
  @UseGuards(JwtCookieGuard)
  vendorActivatePackage(@CurrentUser() user: User, @Param("id") id: string) {
    return this.promotions.vendorActivatePackage(user, id);
  }

  @Get("public/promotions")
  publicList(@Query() query: PublicPromotionQueryDto) {
    return this.promotions.publicList(query);
  }

  @Get("public/promotion-slots")
  publicSlots() {
    return this.promotions.publicSlotConfigs();
  }

  @Post("public/promotions/:id/impression")
  impression(@Param("id") id: string, @Body() body: TrackPromotionDto) {
    return this.promotions.track(id, "impression", body);
  }

  @Post("public/promotions/:id/click")
  click(@Param("id") id: string, @Body() body: TrackPromotionDto) {
    return this.promotions.track(id, "click", body);
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}
