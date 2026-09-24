import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { WeddingsService } from "./weddings.service";
import { GuestsService } from "./guests.service";
import { VendorsService } from "./vendors.service";
import { ArticlesService } from "./articles.service";
import {
  CreateAppointmentDto,
  CreateBudgetLineDto,
  CreateEventDto,
  CreateGuestDto,
  GuestListQueryDto,
  CreateInquiryDto,
  CreateInviteTemplateDto,
  CreateReviewDto,
  CreateTaskDto,
  CreateFamilyPersonDto,
  BulkCreateGuestsDto,
  InviteMemberDto,
  PublicRsvpDto,
  ShortlistVendorDto,
  UpdateAppointmentDto,
  UpdateBudgetLineDto,
  UpdateEventDto,
  UpdateEventInviteDto,
  UpdateGuestDto,
  UpdateInviteTemplateDto,
  UpdateFamilyPersonDto,
  UpdateMemberFlagsDto,
  UpdateTaskDto,
  UpdateTeamVendorDto,
  UpdateVendorDto,
  UpsertVendorAttributesDto,
  UpdateWeddingDto,
  UpsertSeatingPlanDto,
  VendorCatalogQueryDto,
  MediaPresignDto,
  UpsertMusicPlanDto,
  UpdateMusicPlanDto,
  CreateMusicTrackDto,
  UpdateMusicTrackDto,
  ReorderMusicTracksDto,
  CreateMusicCueDto,
  UpdateMusicCueDto,
  ReorderMusicCuesDto,
  SeedMusicCueTemplatesDto,
  SetMusicShareDto,
  CreateMoodboardDto,
  UpdateMoodboardMetaDto,
  SaveMoodboardSceneDto,
  SetMoodboardShareDto,
  MoodboardPresignDto,
} from "./wedding.dto";
import { InviteTemplatesService } from "./invite-templates.service";
import { SeatingService } from "./seating.service";
import { MusicService } from "./music.service";
import { MoodboardsService } from "./moodboards.service";
import { FamilyService } from "./family.service";
import { MediaService } from "./media.service";

@ApiTags("weddings")
@Controller()
export class WeddingsController {
  constructor(
    private readonly weddings: WeddingsService,
    private readonly guests: GuestsService,
    private readonly vendors: VendorsService,
    private readonly media: MediaService,
    private readonly articles: ArticlesService,
    private readonly inviteTemplates: InviteTemplatesService,
    private readonly seating: SeatingService,
    private readonly music: MusicService,
    private readonly moodboards: MoodboardsService,
    private readonly family: FamilyService,
  ) {}

  @Get("weddings/mine")
  @UseGuards(JwtCookieGuard)
  mine(@CurrentUser() user: User) {
    return this.weddings.mine(user);
  }

  @Patch("weddings/mine")
  @UseGuards(JwtCookieGuard)
  updateMine(@CurrentUser() user: User, @Body() body: UpdateWeddingDto) {
    return this.weddings.updateMine(user, body);
  }

  @Get("weddings/mine/guests")
  @UseGuards(JwtCookieGuard)
  guestsList(@CurrentUser() user: User, @Query() query: GuestListQueryDto) {
    return this.guests.list(user, query);
  }

  @Post("weddings/mine/guests")
  @UseGuards(JwtCookieGuard)
  guestsCreate(@CurrentUser() user: User, @Body() body: CreateGuestDto) {
    return this.guests.create(user, body);
  }

  @Post("weddings/mine/guests/bulk")
  @UseGuards(JwtCookieGuard)
  guestsBulk(@CurrentUser() user: User, @Body() body: BulkCreateGuestsDto) {
    return this.guests.bulkCreate(user, body);
  }

  @Patch("weddings/mine/guests/:id")
  @UseGuards(JwtCookieGuard)
  guestsUpdate(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateGuestDto) {
    return this.guests.update(user, id, body);
  }

  @Delete("weddings/mine/guests/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  guestsDelete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.guests.deleteGuest(user, id);
  }

  @Patch("weddings/mine/guests/:id/invites/:eventId")
  @UseGuards(JwtCookieGuard)
  guestsInviteUpdate(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("eventId") eventId: string,
    @Body() body: UpdateEventInviteDto,
  ) {
    return this.guests.updateInvite(user, id, eventId, body);
  }

  @Post("weddings/mine/members")
  @UseGuards(JwtCookieGuard)
  invite(@CurrentUser() user: User, @Body() body: InviteMemberDto) {
    return this.guests.invite(user, body);
  }

  @Patch("weddings/mine/members/:id")
  @UseGuards(JwtCookieGuard)
  updateMember(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateMemberFlagsDto) {
    return this.guests.updateMember(user, id, body);
  }

  @Delete("weddings/mine/members/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteMember(@CurrentUser() user: User, @Param("id") id: string) {
    return this.guests.deleteMember(user, id);
  }

  @Get("weddings/mine/family")
  @UseGuards(JwtCookieGuard)
  familyList(@CurrentUser() user: User) {
    return this.family.list(user);
  }

  @Post("weddings/mine/family")
  @UseGuards(JwtCookieGuard)
  familyCreate(@CurrentUser() user: User, @Body() body: CreateFamilyPersonDto) {
    return this.family.create(user, body);
  }

  @Patch("weddings/mine/family/:id")
  @UseGuards(JwtCookieGuard)
  familyUpdate(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateFamilyPersonDto) {
    return this.family.update(user, id, body);
  }

  @Delete("weddings/mine/family/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  familyDelete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.family.delete(user, id);
  }

  @Post("weddings/mine/tasks")
  @UseGuards(JwtCookieGuard)
  createTask(@CurrentUser() user: User, @Body() body: CreateTaskDto) {
    return this.weddings.createTask(user, body);
  }

  @Patch("weddings/mine/tasks/:id")
  @UseGuards(JwtCookieGuard)
  updateTask(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateTaskDto) {
    return this.weddings.updateTask(user, id, body);
  }

  @Delete("weddings/mine/tasks/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteTask(@CurrentUser() user: User, @Param("id") id: string) {
    return this.weddings.deleteTask(user, id);
  }

  @Get("weddings/mine/budget")
  @UseGuards(JwtCookieGuard)
  listBudget(@CurrentUser() user: User) {
    return this.weddings.listBudget(user);
  }

  @Post("weddings/mine/budget")
  @UseGuards(JwtCookieGuard)
  createBudget(@CurrentUser() user: User, @Body() body: CreateBudgetLineDto) {
    return this.weddings.createBudgetLine(user, body);
  }

  @Patch("weddings/mine/budget/:id")
  @UseGuards(JwtCookieGuard)
  updateBudget(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateBudgetLineDto) {
    return this.weddings.updateBudgetLine(user, id, body);
  }

  @Delete("weddings/mine/budget/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteBudget(@CurrentUser() user: User, @Param("id") id: string) {
    return this.weddings.deleteBudgetLine(user, id);
  }

  @Post("weddings/mine/events")
  @UseGuards(JwtCookieGuard)
  createEvent(@CurrentUser() user: User, @Body() body: CreateEventDto) {
    return this.weddings.createEvent(user, body);
  }

  @Patch("weddings/mine/events/:id")
  @UseGuards(JwtCookieGuard)
  updateEvent(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateEventDto) {
    return this.weddings.updateEvent(user, id, body);
  }

  @Delete("weddings/mine/events/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteEvent(@CurrentUser() user: User, @Param("id") id: string) {
    return this.weddings.deleteEvent(user, id);
  }

  @Get("weddings/mine/appointments")
  @UseGuards(JwtCookieGuard)
  appointments(@CurrentUser() user: User) {
    return this.weddings.listAppointments(user);
  }

  @Post("weddings/mine/appointments")
  @UseGuards(JwtCookieGuard)
  createAppointment(@CurrentUser() user: User, @Body() body: CreateAppointmentDto) {
    return this.weddings.createAppointment(user, body);
  }

  @Patch("weddings/mine/appointments/:id")
  @UseGuards(JwtCookieGuard)
  updateAppointment(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateAppointmentDto) {
    return this.weddings.updateAppointment(user, id, body);
  }

  @Delete("weddings/mine/appointments/:id")
  @UseGuards(JwtCookieGuard)
  deleteAppointment(@CurrentUser() user: User, @Param("id") id: string) {
    return this.weddings.deleteAppointment(user, id);
  }

  @Post("weddings/mine/events/:id/nekath-schedule")
  @UseGuards(JwtCookieGuard)
  generateNekath(@CurrentUser() user: User, @Param("id") id: string) {
    return this.weddings.generateNekathAppointments(user, id);
  }

  @Get("weddings/mine/invite-templates")
  @UseGuards(JwtCookieGuard)
  listInviteTemplates(@CurrentUser() user: User) {
    return this.inviteTemplates.list(user);
  }

  @Post("weddings/mine/invite-templates")
  @UseGuards(JwtCookieGuard)
  createInviteTemplate(@CurrentUser() user: User, @Body() body: CreateInviteTemplateDto) {
    return this.inviteTemplates.create(user, body);
  }

  @Post("weddings/mine/invite-templates/reset")
  @UseGuards(JwtCookieGuard)
  resetInviteTemplates(@CurrentUser() user: User) {
    return this.inviteTemplates.resetStarters(user);
  }

  @Patch("weddings/mine/invite-templates/:id")
  @UseGuards(JwtCookieGuard)
  updateInviteTemplate(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpdateInviteTemplateDto,
  ) {
    return this.inviteTemplates.update(user, id, body);
  }

  @Delete("weddings/mine/invite-templates/:id")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteInviteTemplate(@CurrentUser() user: User, @Param("id") id: string) {
    return this.inviteTemplates.delete(user, id);
  }

  @Get("weddings/mine/events/:eventId/seating")
  @UseGuards(JwtCookieGuard)
  getSeating(@CurrentUser() user: User, @Param("eventId") eventId: string) {
    return this.seating.get(user, eventId);
  }

  @Put("weddings/mine/events/:eventId/seating")
  @UseGuards(JwtCookieGuard)
  upsertSeating(
    @CurrentUser() user: User,
    @Param("eventId") eventId: string,
    @Body() body: UpsertSeatingPlanDto,
  ) {
    return this.seating.upsert(user, eventId, body);
  }

  @Get("weddings/mine/music")
  @UseGuards(JwtCookieGuard)
  musicPlans(@CurrentUser() user: User) {
    return this.music.list(user);
  }

  @Post("weddings/mine/music")
  @UseGuards(JwtCookieGuard)
  upsertMusicPlan(@CurrentUser() user: User, @Body() body: UpsertMusicPlanDto) {
    return this.music.upsert(user, body);
  }

  @Get("weddings/mine/music/:planId")
  @UseGuards(JwtCookieGuard)
  musicPlan(@CurrentUser() user: User, @Param("planId") planId: string) {
    return this.music.get(user, planId);
  }

  @Patch("weddings/mine/music/:planId")
  @UseGuards(JwtCookieGuard)
  updateMusicPlan(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: UpdateMusicPlanDto,
  ) {
    return this.music.update(user, planId, body);
  }

  @Post("weddings/mine/music/:planId/tracks")
  @UseGuards(JwtCookieGuard)
  createMusicTrack(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: CreateMusicTrackDto,
  ) {
    return this.music.createTrack(user, planId, body);
  }

  @Patch("weddings/mine/music/:planId/tracks/:trackId")
  @UseGuards(JwtCookieGuard)
  updateMusicTrack(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Param("trackId") trackId: string,
    @Body() body: UpdateMusicTrackDto,
  ) {
    return this.music.updateTrack(user, planId, trackId, body);
  }

  @Delete("weddings/mine/music/:planId/tracks/:trackId")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteMusicTrack(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Param("trackId") trackId: string,
  ) {
    return this.music.deleteTrack(user, planId, trackId);
  }

  @Post("weddings/mine/music/:planId/tracks/reorder")
  @UseGuards(JwtCookieGuard)
  reorderMusicTracks(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: ReorderMusicTracksDto,
  ) {
    return this.music.reorderTracks(user, planId, body);
  }

  @Post("weddings/mine/music/:planId/cues")
  @UseGuards(JwtCookieGuard)
  createMusicCue(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: CreateMusicCueDto,
  ) {
    return this.music.createCue(user, planId, body);
  }

  @Patch("weddings/mine/music/:planId/cues/:cueId")
  @UseGuards(JwtCookieGuard)
  updateMusicCue(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Param("cueId") cueId: string,
    @Body() body: UpdateMusicCueDto,
  ) {
    return this.music.updateCue(user, planId, cueId, body);
  }

  @Delete("weddings/mine/music/:planId/cues/:cueId")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteMusicCue(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Param("cueId") cueId: string,
  ) {
    return this.music.deleteCue(user, planId, cueId);
  }

  @Post("weddings/mine/music/:planId/cues/reorder")
  @UseGuards(JwtCookieGuard)
  reorderMusicCues(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: ReorderMusicCuesDto,
  ) {
    return this.music.reorderCues(user, planId, body);
  }

  @Post("weddings/mine/music/:planId/cues/seed-templates")
  @UseGuards(JwtCookieGuard)
  seedMusicCues(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: SeedMusicCueTemplatesDto,
  ) {
    return this.music.seedTemplates(user, planId, body);
  }

  @Post("weddings/mine/music/:planId/share")
  @UseGuards(JwtCookieGuard)
  setMusicShare(
    @CurrentUser() user: User,
    @Param("planId") planId: string,
    @Body() body: SetMusicShareDto,
  ) {
    return this.music.setShare(user, planId, body);
  }

  @Get("public/music-brief/:token")
  publicMusicBrief(@Param("token") token: string) {
    return this.music.publicBrief(token);
  }

  @Get("weddings/mine/moodboards")
  @UseGuards(JwtCookieGuard)
  moodboardList(@CurrentUser() user: User) {
    return this.moodboards.list(user);
  }

  @Post("weddings/mine/moodboards")
  @UseGuards(JwtCookieGuard)
  createMoodboard(@CurrentUser() user: User, @Body() body: CreateMoodboardDto) {
    return this.moodboards.create(user, body);
  }

  @Get("weddings/mine/moodboards/:boardId")
  @UseGuards(JwtCookieGuard)
  moodboard(@CurrentUser() user: User, @Param("boardId") boardId: string) {
    return this.moodboards.get(user, boardId);
  }

  @Patch("weddings/mine/moodboards/:boardId")
  @UseGuards(JwtCookieGuard)
  updateMoodboard(
    @CurrentUser() user: User,
    @Param("boardId") boardId: string,
    @Body() body: UpdateMoodboardMetaDto,
  ) {
    return this.moodboards.updateMeta(user, boardId, body);
  }

  @Put("weddings/mine/moodboards/:boardId/scene")
  @UseGuards(JwtCookieGuard)
  saveMoodboardScene(
    @CurrentUser() user: User,
    @Param("boardId") boardId: string,
    @Body() body: SaveMoodboardSceneDto,
  ) {
    return this.moodboards.saveScene(user, boardId, body);
  }

  @Delete("weddings/mine/moodboards/:boardId")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  deleteMoodboard(@CurrentUser() user: User, @Param("boardId") boardId: string) {
    return this.moodboards.remove(user, boardId);
  }

  @Post("weddings/mine/moodboards/:boardId/presign")
  @UseGuards(JwtCookieGuard)
  moodboardPresign(
    @CurrentUser() user: User,
    @Param("boardId") boardId: string,
    @Body() body: MoodboardPresignDto,
  ) {
    return this.moodboards.presign(user, boardId, body);
  }

  @Patch("weddings/mine/moodboards/:boardId/share")
  @UseGuards(JwtCookieGuard)
  setMoodboardShare(
    @CurrentUser() user: User,
    @Param("boardId") boardId: string,
    @Body() body: SetMoodboardShareDto,
  ) {
    return this.moodboards.setShare(user, boardId, body);
  }

  @Get("public/moodboards/:token")
  publicMoodboard(@Param("token") token: string) {
    return this.moodboards.publicBrief(token);
  }

  @Get("weddings/mine/inquiries")
  @UseGuards(JwtCookieGuard)
  inquiries(@CurrentUser() user: User) {
    return this.weddings.listInquiries(user);
  }

  @Post("weddings/mine/inquiries")
  @UseGuards(JwtCookieGuard)
  inquire(@CurrentUser() user: User, @Body() body: CreateInquiryDto) {
    return this.vendors.inquire(user, body);
  }

  @Post("weddings/mine/team")
  @UseGuards(JwtCookieGuard)
  shortlist(@CurrentUser() user: User, @Body() body: ShortlistVendorDto) {
    return this.vendors.shortlist(user, body);
  }

  @Patch("weddings/mine/team/:vendorId")
  @UseGuards(JwtCookieGuard)
  updateTeam(@CurrentUser() user: User, @Param("vendorId") vendorId: string, @Body() body: UpdateTeamVendorDto) {
    return this.vendors.updateTeamVendor(user, vendorId, body);
  }

  @Delete("weddings/mine/team/:vendorId")
  @UseGuards(JwtCookieGuard)
  @HttpCode(200)
  unshortlist(@CurrentUser() user: User, @Param("vendorId") vendorId: string) {
    return this.vendors.unshortlist(user, vendorId);
  }

  @Get("vendors")
  vendorsList(@Query() query: VendorCatalogQueryDto) {
    return this.vendors.catalog(query);
  }

  @Get("vendors/me")
  @UseGuards(JwtCookieGuard)
  vendorMine(@CurrentUser() user: User) {
    return this.vendors.mine(user);
  }

  @Get("vendors/me/onboarding")
  @UseGuards(JwtCookieGuard)
  vendorOnboarding(@CurrentUser() user: User) {
    return this.vendors.onboardingMine(user);
  }

  @Put("vendors/me/attributes")
  @UseGuards(JwtCookieGuard)
  vendorAttributes(@CurrentUser() user: User, @Body() body: UpsertVendorAttributesDto) {
    return this.vendors.upsertMineAttributes(user, body);
  }

  @Patch("vendors/me")
  @UseGuards(JwtCookieGuard)
  vendorUpdate(@CurrentUser() user: User, @Body() body: UpdateVendorDto) {
    return this.vendors.updateMine(user, body);
  }

  @Post("vendors/me/media/presign")
  @UseGuards(JwtCookieGuard)
  vendorMediaPresign(@CurrentUser() user: User, @Body() body: MediaPresignDto) {
    return this.media.presign(user, body);
  }

  @Get("vendors/me/leads")
  @UseGuards(JwtCookieGuard)
  leads(@CurrentUser() user: User) {
    return this.vendors.leads(user);
  }

  @Get("vendors/:slug")
  vendorBySlug(@Param("slug") slug: string) {
    return this.vendors.bySlug(slug);
  }

  @Post("vendors/:id/reviews")
  @UseGuards(JwtCookieGuard)
  createReview(@CurrentUser() user: User, @Param("id") id: string, @Body() body: CreateReviewDto) {
    return this.vendors.createReview(user, id, body);
  }

  @Get("articles")
  articlesList(
    @Query("category") category?: string,
    @Query("q") q?: string,
    @Query("vendorSlug") vendorSlug?: string,
  ) {
    return this.articles.list(category, q, vendorSlug);
  }

  @Get("articles/:slug")
  articleBySlug(@Param("slug") slug: string) {
    return this.articles.bySlug(slug);
  }

  @Get("public/weddings/:slug")
  async publicSite(@Param("slug") slug: string) {
    const site = await this.guests.publicSite(slug);
    if (!site) {
      throw new NotFoundException("Wedding website not found");
    }
    return site;
  }

  @Post("public/weddings/:slug/rsvp")
  async publicRsvp(@Param("slug") slug: string, @Body() body: PublicRsvpDto) {
    const result = await this.guests.publicRsvp(slug, body);
    if (!result) {
      throw new NotFoundException("Wedding website not found");
    }
    return result;
  }
}
