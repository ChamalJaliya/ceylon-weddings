import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
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
import { AdminService } from "./admin.service";
import {
  AdminAuditListQueryDto,
  AdminBulkVendorDto,
  AdminPatchUserDto,
  AdminPatchVendorDto,
  AdminUserListQueryDto,
  AdminVendorListQueryDto,
  AdminWeddingListQueryDto,
  AdminOverrideTrialDto,
  AdminGrantCompedDto,
  AdminActivatePaidDto,
  CreateReportDto,
  ImpersonateDto,
  ResolveReportDto,
  UpsertAdminArticleDto,
  UpsertAwardNominationDto,
  UpsertFeatureFlagDto,
  UpsertFeaturedPlacementDto,
} from "./admin.dto";

@ApiTags("admin")
@Controller("admin")
@UseGuards(JwtCookieGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  stats(@CurrentUser() user: User) {
    return this.admin.stats(user);
  }

  @Get("vendors")
  listVendors(@CurrentUser() user: User, @Query() query: AdminVendorListQueryDto) {
    return this.admin.listVendors(user, query);
  }

  @Post("vendors/bulk")
  bulkVendors(@CurrentUser() user: User, @Body() body: AdminBulkVendorDto, @Req() req: Request) {
    return this.admin.bulkVendors(user, body, clientIp(req));
  }

  @Get("vendors/:id")
  getVendor(@CurrentUser() user: User, @Param("id") id: string) {
    return this.admin.getVendor(user, id);
  }

  @Patch("vendors/:id")
  patchVendor(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: AdminPatchVendorDto,
    @Req() req: Request,
  ) {
    return this.admin.patchVendor(user, id, body, clientIp(req));
  }

  @Get("vendors/:id/subscription")
  getVendorSubscription(@CurrentUser() user: User, @Param("id") id: string) {
    return this.admin.getVendorSubscription(user, id);
  }

  @Patch("vendors/:id/subscription/trial")
  overrideVendorTrial(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: AdminOverrideTrialDto,
  ) {
    return this.admin.overrideVendorTrial(user, id, body.trialEndsAt);
  }

  @Patch("vendors/:id/subscription/comp")
  grantVendorComped(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: AdminGrantCompedDto,
  ) {
    return this.admin.grantVendorComped(user, id, body.compedUntil);
  }

  @Patch("vendors/:id/subscription/activate")
  activateVendorSubscription(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: AdminActivatePaidDto,
  ) {
    return this.admin.activateVendorSubscription(
      user,
      id,
      body.planId,
      body.interval,
      body.paymentRef,
      body.notes,
    );
  }

  @Patch("vendors/:id/subscription/suspend")
  suspendVendorSubscription(@CurrentUser() user: User, @Param("id") id: string) {
    return this.admin.suspendVendorSubscription(user, id);
  }

  @Get("users")
  listUsers(@CurrentUser() user: User, @Query() query: AdminUserListQueryDto) {
    return this.admin.listUsers(user, query);
  }

  @Get("users/:id")
  getUser(@CurrentUser() user: User, @Param("id") id: string) {
    return this.admin.getUser(user, id);
  }

  @Patch("users/:id")
  patchUser(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: AdminPatchUserDto,
    @Req() req: Request,
  ) {
    return this.admin.patchUser(user, id, body, clientIp(req));
  }

  @Post("users/:id/sessions/revoke")
  revokeSessions(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.admin.revokeSessions(user, id, clientIp(req));
  }

  @Post("impersonate")
  impersonate(@CurrentUser() user: User, @Body() body: ImpersonateDto, @Req() req: Request) {
    return this.admin.impersonate(user, body.userId, clientIp(req));
  }

  @Get("audit")
  listAudit(@CurrentUser() user: User, @Query() query: AdminAuditListQueryDto) {
    return this.admin.listAudit(user, query);
  }

  @Get("reports")
  listReports(@CurrentUser() user: User, @Query("status") status?: string) {
    return this.admin.listReports(user, status);
  }

  @Post("reports")
  createReport(@CurrentUser() user: User, @Body() body: CreateReportDto) {
    return this.admin.createReport(user, body);
  }

  @Patch("reports/:id")
  resolveReport(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: ResolveReportDto,
    @Req() req: Request,
  ) {
    return this.admin.resolveReport(user, id, body, clientIp(req));
  }

  @Get("articles")
  listArticles(@CurrentUser() user: User) {
    return this.admin.listArticles(user);
  }

  @Get("articles/:id")
  getArticle(@CurrentUser() user: User, @Param("id") id: string) {
    return this.admin.getArticle(user, id);
  }

  @Post("articles")
  createArticle(@CurrentUser() user: User, @Body() body: UpsertAdminArticleDto, @Req() req: Request) {
    return this.admin.createArticle(user, body, clientIp(req));
  }

  @Put("articles/:id")
  updateArticle(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpsertAdminArticleDto,
    @Req() req: Request,
  ) {
    return this.admin.updateArticle(user, id, body, clientIp(req));
  }

  @Delete("articles/:id")
  deleteArticle(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.admin.deleteArticle(user, id, clientIp(req));
  }

  @Get("weddings")
  listWeddings(@CurrentUser() user: User, @Query() query: AdminWeddingListQueryDto) {
    return this.admin.listWeddings(user, query);
  }

  @Get("weddings/:id")
  getWedding(@CurrentUser() user: User, @Param("id") id: string) {
    return this.admin.getWedding(user, id);
  }

  @Get("inquiries")
  listInquiries(@CurrentUser() user: User) {
    return this.admin.listInquiries(user);
  }

  @Post("inquiries/:id/close")
  closeInquiry(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.admin.closeInquiry(user, id, clientIp(req));
  }

  @Get("reviews")
  listReviews(@CurrentUser() user: User) {
    return this.admin.listReviews(user);
  }

  @Patch("reviews/:id")
  setReviewHidden(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: { hidden: boolean },
    @Req() req: Request,
  ) {
    return this.admin.setReviewHidden(user, id, Boolean(body.hidden), clientIp(req));
  }

  @Get("featured")
  listPlacements(@CurrentUser() user: User) {
    return this.admin.listPlacements(user);
  }

  @Post("featured")
  createPlacement(
    @CurrentUser() user: User,
    @Body() body: UpsertFeaturedPlacementDto,
    @Req() req: Request,
  ) {
    return this.admin.createPlacement(user, body, clientIp(req));
  }

  @Put("featured/:id")
  updatePlacement(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpsertFeaturedPlacementDto,
    @Req() req: Request,
  ) {
    return this.admin.updatePlacement(user, id, body, clientIp(req));
  }

  @Delete("featured/:id")
  deletePlacement(@CurrentUser() user: User, @Param("id") id: string, @Req() req: Request) {
    return this.admin.deletePlacement(user, id, clientIp(req));
  }

  @Get("settings/flags")
  listFlags(@CurrentUser() user: User) {
    return this.admin.listFlags(user);
  }

  @Put("settings/flags")
  upsertFlag(@CurrentUser() user: User, @Body() body: UpsertFeatureFlagDto, @Req() req: Request) {
    return this.admin.upsertFlag(user, body, clientIp(req));
  }

  @Get("awards")
  listAwards(@CurrentUser() user: User) {
    return this.admin.listAwards(user);
  }

  @Put("awards")
  upsertAward(@CurrentUser() user: User, @Body() body: UpsertAwardNominationDto, @Req() req: Request) {
    return this.admin.upsertAward(user, body, clientIp(req));
  }

  @Get("jobs/health")
  jobHealth(@CurrentUser() user: User) {
    return this.admin.jobHealth(user);
  }

  @Get("analytics/summary")
  analyticsSummary(@CurrentUser() user: User) {
    return this.admin.analyticsSummary(user);
  }

  @Get("export/:kind")
  @Header("Content-Type", "text/csv; charset=utf-8")
  exportCsv(@CurrentUser() user: User, @Param("kind") kind: "vendors" | "users") {
    return this.admin.exportCsv(user, kind);
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}
