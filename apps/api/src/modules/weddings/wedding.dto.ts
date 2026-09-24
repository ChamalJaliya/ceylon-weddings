import { createZodDto } from "nestjs-zod";
import {
  bulkCreateGuestsBodySchema,
  createAppointmentBodySchema,
  createBudgetLineBodySchema,
  createEventBodySchema,
  createFamilyPersonBodySchema,
  createGuestBodySchema,
  guestListQuerySchema,
  createInquiryBodySchema,
  createInviteTemplateBodySchema,
  createMusicCueBodySchema,
  createMusicTrackBodySchema,
  createReviewBodySchema,
  createTaskBodySchema,
  inviteMemberBodySchema,
  publicRsvpBodySchema,
  reorderMusicCuesBodySchema,
  reorderMusicTracksBodySchema,
  seedMusicCueTemplatesBodySchema,
  setMusicShareBodySchema,
  shortlistVendorBodySchema,
  updateAppointmentBodySchema,
  updateBudgetLineBodySchema,
  updateEventBodySchema,
  updateEventInviteBodySchema,
  updateFamilyPersonBodySchema,
  updateGuestBodySchema,
  updateInviteTemplateBodySchema,
  updateMemberFlagsBodySchema,
  updateMusicCueBodySchema,
  updateMusicPlanBodySchema,
  updateMusicTrackBodySchema,
  updateTaskBodySchema,
  updateTeamVendorBodySchema,
  updateVendorBodySchema,
  upsertVendorAttributesBodySchema,
  updateWeddingBodySchema,
  upsertMusicPlanBodySchema,
  upsertSeatingPlanBodySchema,
  vendorCatalogQuerySchema,
  mediaPresignBodySchema,
  createMoodboardBodySchema,
  updateMoodboardMetaBodySchema,
  saveMoodboardSceneBodySchema,
  setMoodboardShareBodySchema,
  moodboardPresignBodySchema,
} from "@ceylonweddings/contracts";

export class UpdateWeddingDto extends createZodDto(updateWeddingBodySchema) {}
export class CreateGuestDto extends createZodDto(createGuestBodySchema) {}
export class GuestListQueryDto extends createZodDto(guestListQuerySchema) {}
export class UpdateGuestDto extends createZodDto(updateGuestBodySchema) {}
export class BulkCreateGuestsDto extends createZodDto(bulkCreateGuestsBodySchema) {}
export class UpdateEventInviteDto extends createZodDto(updateEventInviteBodySchema) {}
export class CreateInquiryDto extends createZodDto(createInquiryBodySchema) {}
export class ShortlistVendorDto extends createZodDto(shortlistVendorBodySchema) {}
export class UpdateTeamVendorDto extends createZodDto(updateTeamVendorBodySchema) {}
export class InviteMemberDto extends createZodDto(inviteMemberBodySchema) {}
export class UpdateMemberFlagsDto extends createZodDto(updateMemberFlagsBodySchema) {}
export class CreateFamilyPersonDto extends createZodDto(createFamilyPersonBodySchema) {}
export class UpdateFamilyPersonDto extends createZodDto(updateFamilyPersonBodySchema) {}
export class UpdateVendorDto extends createZodDto(updateVendorBodySchema) {}
export class UpsertVendorAttributesDto extends createZodDto(upsertVendorAttributesBodySchema) {}
export class PublicRsvpDto extends createZodDto(publicRsvpBodySchema) {}
export class CreateTaskDto extends createZodDto(createTaskBodySchema) {}
export class UpdateTaskDto extends createZodDto(updateTaskBodySchema) {}
export class CreateBudgetLineDto extends createZodDto(createBudgetLineBodySchema) {}
export class UpdateBudgetLineDto extends createZodDto(updateBudgetLineBodySchema) {}
export class CreateEventDto extends createZodDto(createEventBodySchema) {}
export class UpdateEventDto extends createZodDto(updateEventBodySchema) {}
export class CreateAppointmentDto extends createZodDto(createAppointmentBodySchema) {}
export class UpdateAppointmentDto extends createZodDto(updateAppointmentBodySchema) {}
export class CreateInviteTemplateDto extends createZodDto(createInviteTemplateBodySchema) {}
export class UpdateInviteTemplateDto extends createZodDto(updateInviteTemplateBodySchema) {}
export class UpsertSeatingPlanDto extends createZodDto(upsertSeatingPlanBodySchema) {}
export class CreateReviewDto extends createZodDto(createReviewBodySchema) {}
export class VendorCatalogQueryDto extends createZodDto(vendorCatalogQuerySchema) {}
export class MediaPresignDto extends createZodDto(mediaPresignBodySchema) {}
export class UpsertMusicPlanDto extends createZodDto(upsertMusicPlanBodySchema) {}
export class UpdateMusicPlanDto extends createZodDto(updateMusicPlanBodySchema) {}
export class CreateMusicTrackDto extends createZodDto(createMusicTrackBodySchema) {}
export class UpdateMusicTrackDto extends createZodDto(updateMusicTrackBodySchema) {}
export class ReorderMusicTracksDto extends createZodDto(reorderMusicTracksBodySchema) {}
export class CreateMusicCueDto extends createZodDto(createMusicCueBodySchema) {}
export class UpdateMusicCueDto extends createZodDto(updateMusicCueBodySchema) {}
export class ReorderMusicCuesDto extends createZodDto(reorderMusicCuesBodySchema) {}
export class SeedMusicCueTemplatesDto extends createZodDto(seedMusicCueTemplatesBodySchema) {}
export class SetMusicShareDto extends createZodDto(setMusicShareBodySchema) {}
export class CreateMoodboardDto extends createZodDto(createMoodboardBodySchema) {}
export class UpdateMoodboardMetaDto extends createZodDto(updateMoodboardMetaBodySchema) {}
export class SaveMoodboardSceneDto extends createZodDto(saveMoodboardSceneBodySchema) {}
export class SetMoodboardShareDto extends createZodDto(setMoodboardShareBodySchema) {}
export class MoodboardPresignDto extends createZodDto(moodboardPresignBodySchema) {}
