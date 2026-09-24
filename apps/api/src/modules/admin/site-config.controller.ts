import { Controller, Get, Param, Put, Body, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SiteConfigService } from "./site-config.service";
import { UpdateSiteConfigDto, UpsertCmsPageDto } from "./admin.dto";

@ApiTags("site-config")
@Controller()
export class SiteConfigController {
  constructor(private readonly site: SiteConfigService) {}

  @Get("admin/settings/site")
  @UseGuards(JwtCookieGuard)
  getSite(@CurrentUser() user: User) {
    return this.site.getSiteConfig(user);
  }

  @Put("admin/settings/site")
  @UseGuards(JwtCookieGuard)
  updateSite(@CurrentUser() user: User, @Body() body: UpdateSiteConfigDto, @Req() req: Request) {
    return this.site.updateSiteConfig(user, body, clientIp(req));
  }

  @Get("admin/settings/pages")
  @UseGuards(JwtCookieGuard)
  listPages(@CurrentUser() user: User) {
    return this.site.listCmsPages(user);
  }

  @Get("admin/settings/pages/:slug")
  @UseGuards(JwtCookieGuard)
  getPage(@CurrentUser() user: User, @Param("slug") slug: string) {
    return this.site.getCmsPage(user, slug);
  }

  @Put("admin/settings/pages/:slug")
  @UseGuards(JwtCookieGuard)
  upsertPage(
    @CurrentUser() user: User,
    @Param("slug") slug: string,
    @Body() body: UpsertCmsPageDto,
    @Req() req: Request,
  ) {
    return this.site.upsertCmsPage(user, slug, body, clientIp(req));
  }

  @Get("public/site-config")
  publicSiteConfig() {
    return this.site.publicSiteConfig();
  }

  @Get("public/pages/:slug")
  publicPage(@Param("slug") slug: string) {
    return this.site.publicPage(slug);
  }

  @Get("public/flags")
  publicFlags() {
    return this.site.publicFlags();
  }

  @Get("public/awards")
  publicAwards(@Query("year") year?: string) {
    const parsed = year ? Number.parseInt(year, 10) : undefined;
    return this.site.publicAwards(Number.isFinite(parsed) ? parsed : undefined);
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}
