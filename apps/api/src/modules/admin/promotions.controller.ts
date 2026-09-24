import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PromotionsService } from "./promotions.service";
import { PromotionListQueryDto, PublicPromotionQueryDto, UpsertPromotionDto } from "./admin.dto";

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

  @Get("public/promotions")
  publicList(@Query() query: PublicPromotionQueryDto) {
    return this.promotions.publicList(query);
  }

  @Post("public/promotions/:id/impression")
  impression(@Param("id") id: string) {
    return this.promotions.track(id, "impression");
  }

  @Post("public/promotions/:id/click")
  click(@Param("id") id: string) {
    return this.promotions.track(id, "click");
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}
