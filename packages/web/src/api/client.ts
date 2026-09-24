import {
  authResponseSchema,
  mineWeddingSchema,
  guestHouseholdSchema,
  guestImportResultSchema,
  inviteTemplateSchema,
  seatingResponseSchema,
  familyPersonSchema,
  weddingVendorSchema,
  weddingMemberSchema,
  taskSchema,
  budgetLineSchema,
  eventSchema,
  appointmentSchema,
  inquirySchema,
  okResultSchema,
  publicWebsiteSchema,
  type AuthResponse,
  type GoogleAuthBody,
  type LoginBody,
  type RegisterBody,
  type User,
  type UpdateWeddingBody,
  type CreateGuestBody,
  type UpdateGuestBody,
  type BulkCreateGuestsBody,
  type UpdateEventInviteBody,
  type CreateInquiryBody,
  type ShortlistVendorBody,
  type UpdateTeamVendorBody,
  type InviteMemberBody,
  type UpdateMemberFlagsBody,
  type CreateFamilyPersonBody,
  type UpdateFamilyPersonBody,
  type UpdateVendorBody,
  type MediaPresignBody,
  type MediaPresignResponse,
  type OnboardingAssetPresignBody,
  type OnboardingAssetPresignResponse,
  type PublicRsvpBody,
  type AdminUser,
  type AdminStats,
  type AdminPatchVendorBody,
  type AdminPatchUserBody,
  type AdminBulkVendorBody,
  type AdminVendorListQuery,
  type AdminUserListQuery,
  type AdminAuditListQuery,
  type AdminWeddingListQuery,
  type AuditLog,
  type Report,
  type CreateReportBody,
  type ResolveReportBody,
  type AdminArticle,
  type UpsertAdminArticleBody,
  type AdminWeddingSummary,
  type AdminInquiry,
  type AdminReview,
  type FeaturedPlacement,
  type UpsertFeaturedPlacementBody,
  type FeatureFlag,
  type UpsertFeatureFlagBody,
  type AwardNomination,
  type UpsertAwardNominationBody,
  type AdminJobHealth,
  type AdminAnalyticsSummary,
  type Promotion,
  type UpsertPromotionBody,
  type PromotionListQuery,
  type PublicPromotionQuery,
  type PromotionSlot,
  type CreateTaskBody,
  type UpdateTaskBody,
  type CreateBudgetLineBody,
  type UpdateBudgetLineBody,
  type CreateEventBody,
  type UpdateEventBody,
  type CreateAppointmentBody,
  type UpdateAppointmentBody,
  type CreateInviteTemplateBody,
  type UpdateInviteTemplateBody,
  type UpsertSeatingPlanBody,
  type Article,
  type Review,
  type CreateReviewBody,
  type Vendor,
  type Inquiry,
  type VendorCatalogQuery,
  type VendorCatalogResult,
  type SearchQuery,
  type SearchResponse,
  searchResponseSchema,
  toSearchParams,
  vendorCatalogQuerySchema,
  VENDOR_CATALOG_DEFAULTS,
  vendorSubscriptionSchema,
  type VendorSubscription,
  type SubscriptionPlan,
  type AdminOverrideTrialBody,
  type AdminGrantCompedBody,
  type AdminActivatePaidBody,
  type SiteConfig,
  type UpdateSiteConfigBody,
  type CmsPage,
  type UpsertCmsPageBody,
  type PublicSiteConfig,
  type PublicFlags,
  type PublicAward,
  type VendorType,
  type VendorAttributeDefinition,
  type VendorAttributeOption,
  type TaxonomyPack,
  type CreateVendorTypeBody,
  type UpdateVendorTypeBody,
  type CloneVendorTypeBody,
  type CreateAttributeDefinitionBody,
  type UpdateAttributeDefinitionBody,
  type CreateAttributeOptionBody,
  type UpdateAttributeOptionBody,
  type ImportTaxonomyBody,
  type LocalizedString,
  type PublicVendorTypeListItem,
  type VendorOnboardingResponse,
  type UpsertVendorAttributesBody,
  type Conversation,
  type ConversationListResponse,
  type CreateConversationBody,
  type Message,
  type MessageListQuery,
  type MessageListResponse,
  type SendMessageBody,
  type MessagingMediaPresignBody,
  type MessagingMediaPresignResponse,
  type NotificationListResponse,
  type MarkNotificationsReadBody,
  type AppNotification,
  conversationListResponseSchema,
  messageListResponseSchema,
  messageSchema,
  conversationSchema,
  notificationListResponseSchema,
  messagingMediaPresignResponseSchema,
  musicPlanSchema,
  musicPlanListSchema,
  musicTrackSchema,
  musicCueSchema,
  musicBriefSchema,
  type UpsertMusicPlanBody,
  type UpdateMusicPlanBody,
  type CreateMusicTrackBody,
  type UpdateMusicTrackBody,
  type ReorderMusicTracksBody,
  type CreateMusicCueBody,
  type UpdateMusicCueBody,
  type ReorderMusicCuesBody,
  type SeedMusicCueTemplatesBody,
  type SetMusicShareBody,
  moodboardSchema,
  moodboardSummaryListSchema,
  moodboardBriefSchema,
  moodboardPresignResponseSchema,
  type CreateMoodboardBody,
  type UpdateMoodboardMetaBody,
  type SaveMoodboardSceneBody,
  type SetMoodboardShareBody,
  type MoodboardPresignBody,
  type AdminCreateConsultationBody,
  type CancelConsultationBody,
  type Consultation,
  type ConsultationAvailability,
  type ConsultationAvailabilityQuery,
  type ConsultationDay,
  type ConsultationListQuery,
  type ContactMessage,
  type ContactMessageListQuery,
  type CreateConsultationBody,
  type CreateContactMessageBody,
  type PublicConsultation,
  type UpdateConsultationBody,
  type UpdateContactMessageBody,
} from "@ceylonweddings/contracts";

const guestListSchema = guestHouseholdSchema.array();
const inquiryListSchema = inquirySchema.array();
const appointmentListSchema = appointmentSchema.array();
const budgetListSchema = budgetLineSchema.array();
const inviteTemplateListSchema = inviteTemplateSchema.array();
const familyListSchema = familyPersonSchema.array();

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: response.statusText }))) as {
      message?: string | string[];
    };
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type TaxonomyImportPreviewItem = {
  slug: string;
  action: "create" | "update" | "skip";
  conflicts: string[];
  attributes: Array<{ key: string; action: string; note?: string }>;
};

export type TaxonomyImportResult = {
  dryRun: boolean;
  applied: boolean;
  blocked: boolean;
  preview: TaxonomyImportPreviewItem[];
};

export type VendorTypeAnalytics = {
  typeId: string;
  slug: string;
  vendorCount: number;
  attributes: Array<{
    key: string;
    valueType: string;
    buckets: Array<{ key: string; label: LocalizedString; count: number }>;
  }>;
};

export const api = {
  health: () => request("/health"),
  me: () => request<User>("/auth/me"),
  login: async (body: LoginBody) =>
    authResponseSchema.parse(await request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) })),
  register: async (body: RegisterBody) =>
    authResponseSchema.parse(
      await request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    ),
  google: async (body: GoogleAuthBody) =>
    authResponseSchema.parse(
      await request<AuthResponse>("/auth/google", { method: "POST", body: JSON.stringify(body) }),
    ),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  search: async (query: SearchQuery) => {
    const params = toSearchParams(query);
    return searchResponseSchema.parse(await request(`/search?${params.toString()}`));
  },
  vendorTypes: () => request<PublicVendorTypeListItem[]>("/vendor-types"),
  vendorTypeSchema: (slug: string) =>
    request<VendorType>(`/vendor-types/${encodeURIComponent(slug)}/schema`),
  wedding: {
    mine: async () => mineWeddingSchema.parse(await request("/weddings/mine")),
    update: async (body: UpdateWeddingBody) =>
      mineWeddingSchema.parse(await request("/weddings/mine", { method: "PATCH", body: JSON.stringify(body) })),
    guests: async (query: { q?: string } = {}) => {
      const params = toSearchParams(query);
      const qs = params.toString();
      return guestListSchema.parse(await request(qs ? `/weddings/mine/guests?${qs}` : "/weddings/mine/guests"));
    },
    createGuest: async (body: CreateGuestBody) =>
      guestHouseholdSchema.parse(
        await request("/weddings/mine/guests", { method: "POST", body: JSON.stringify(body) }),
      ),
    bulkCreateGuests: async (body: BulkCreateGuestsBody) =>
      guestImportResultSchema.parse(
        await request("/weddings/mine/guests/bulk", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateGuest: async (id: string, body: UpdateGuestBody) =>
      guestHouseholdSchema.parse(
        await request(`/weddings/mine/guests/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    deleteGuest: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/guests/${id}`, { method: "DELETE" })),
    updateGuestInvite: async (id: string, eventId: string, body: UpdateEventInviteBody) =>
      guestHouseholdSchema.parse(
        await request(`/weddings/mine/guests/${id}/invites/${eventId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      ),
    inviteTemplates: async () =>
      inviteTemplateListSchema.parse(await request("/weddings/mine/invite-templates")),
    createInviteTemplate: async (body: CreateInviteTemplateBody) =>
      inviteTemplateSchema.parse(
        await request("/weddings/mine/invite-templates", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateInviteTemplate: async (id: string, body: UpdateInviteTemplateBody) =>
      inviteTemplateSchema.parse(
        await request(`/weddings/mine/invite-templates/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      ),
    deleteInviteTemplate: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/invite-templates/${id}`, { method: "DELETE" })),
    resetInviteTemplates: async () =>
      inviteTemplateListSchema.parse(
        await request("/weddings/mine/invite-templates/reset", { method: "POST" }),
      ),
    seating: async (eventId: string) =>
      seatingResponseSchema.parse(await request(`/weddings/mine/events/${eventId}/seating`)),
    upsertSeating: async (eventId: string, body: UpsertSeatingPlanBody) =>
      seatingResponseSchema.parse(
        await request(`/weddings/mine/events/${eventId}/seating`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      ),
    inviteMember: async (body: InviteMemberBody) =>
      weddingMemberSchema.parse(
        await request("/weddings/mine/members", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateMember: async (id: string, body: UpdateMemberFlagsBody) =>
      weddingMemberSchema.parse(
        await request(`/weddings/mine/members/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    deleteMember: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/members/${id}`, { method: "DELETE" })),
    family: async () => familyListSchema.parse(await request("/weddings/mine/family")),
    createFamilyPerson: async (body: CreateFamilyPersonBody) =>
      familyPersonSchema.parse(
        await request("/weddings/mine/family", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateFamilyPerson: async (id: string, body: UpdateFamilyPersonBody) =>
      familyPersonSchema.parse(
        await request(`/weddings/mine/family/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    deleteFamilyPerson: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/family/${id}`, { method: "DELETE" })),
    createTask: async (body: CreateTaskBody) =>
      taskSchema.parse(await request("/weddings/mine/tasks", { method: "POST", body: JSON.stringify(body) })),
    updateTask: async (id: string, body: UpdateTaskBody) =>
      taskSchema.parse(await request(`/weddings/mine/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) })),
    deleteTask: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/tasks/${id}`, { method: "DELETE" })),
    budget: async () => budgetListSchema.parse(await request("/weddings/mine/budget")),
    createBudgetLine: async (body: CreateBudgetLineBody) =>
      budgetLineSchema.parse(
        await request("/weddings/mine/budget", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateBudgetLine: async (id: string, body: UpdateBudgetLineBody) =>
      budgetLineSchema.parse(
        await request(`/weddings/mine/budget/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    deleteBudgetLine: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/budget/${id}`, { method: "DELETE" })),
    createEvent: async (body: CreateEventBody) =>
      eventSchema.parse(await request("/weddings/mine/events", { method: "POST", body: JSON.stringify(body) })),
    updateEvent: async (id: string, body: UpdateEventBody) =>
      eventSchema.parse(await request(`/weddings/mine/events/${id}`, { method: "PATCH", body: JSON.stringify(body) })),
    deleteEvent: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/events/${id}`, { method: "DELETE" })),
    generateNekathSchedule: async (eventId: string) =>
      appointmentListSchema.parse(
        await request(`/weddings/mine/events/${eventId}/nekath-schedule`, { method: "POST" }),
      ),
    appointments: async () => appointmentListSchema.parse(await request("/weddings/mine/appointments")),
    createAppointment: async (body: CreateAppointmentBody) =>
      appointmentSchema.parse(
        await request("/weddings/mine/appointments", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateAppointment: async (id: string, body: UpdateAppointmentBody) =>
      appointmentSchema.parse(
        await request(`/weddings/mine/appointments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    deleteAppointment: async (id: string) =>
      okResultSchema.parse(await request(`/weddings/mine/appointments/${id}`, { method: "DELETE" })),
    musicPlans: async () => musicPlanListSchema.parse(await request("/weddings/mine/music")),
    upsertMusicPlan: async (body: UpsertMusicPlanBody) =>
      musicPlanSchema.parse(await request("/weddings/mine/music", { method: "POST", body: JSON.stringify(body) })),
    musicPlan: async (planId: string) =>
      musicPlanSchema.parse(await request(`/weddings/mine/music/${planId}`)),
    updateMusicPlan: async (planId: string, body: UpdateMusicPlanBody) =>
      musicPlanSchema.parse(
        await request(`/weddings/mine/music/${planId}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    createMusicTrack: async (planId: string, body: CreateMusicTrackBody) =>
      musicTrackSchema.parse(
        await request(`/weddings/mine/music/${planId}/tracks`, { method: "POST", body: JSON.stringify(body) }),
      ),
    updateMusicTrack: async (planId: string, trackId: string, body: UpdateMusicTrackBody) =>
      musicTrackSchema.parse(
        await request(`/weddings/mine/music/${planId}/tracks/${trackId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      ),
    deleteMusicTrack: async (planId: string, trackId: string) =>
      okResultSchema.parse(await request(`/weddings/mine/music/${planId}/tracks/${trackId}`, { method: "DELETE" })),
    reorderMusicTracks: async (planId: string, body: ReorderMusicTracksBody) =>
      musicPlanSchema.parse(
        await request(`/weddings/mine/music/${planId}/tracks/reorder`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    createMusicCue: async (planId: string, body: CreateMusicCueBody) =>
      musicCueSchema.parse(
        await request(`/weddings/mine/music/${planId}/cues`, { method: "POST", body: JSON.stringify(body) }),
      ),
    updateMusicCue: async (planId: string, cueId: string, body: UpdateMusicCueBody) =>
      musicCueSchema.parse(
        await request(`/weddings/mine/music/${planId}/cues/${cueId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      ),
    deleteMusicCue: async (planId: string, cueId: string) =>
      okResultSchema.parse(await request(`/weddings/mine/music/${planId}/cues/${cueId}`, { method: "DELETE" })),
    reorderMusicCues: async (planId: string, body: ReorderMusicCuesBody) =>
      musicPlanSchema.parse(
        await request(`/weddings/mine/music/${planId}/cues/reorder`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    seedMusicCueTemplates: async (planId: string, body: SeedMusicCueTemplatesBody = { replace: false }) =>
      musicPlanSchema.parse(
        await request(`/weddings/mine/music/${planId}/cues/seed-templates`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    setMusicShare: async (planId: string, body: SetMusicShareBody) =>
      musicPlanSchema.parse(
        await request(`/weddings/mine/music/${planId}/share`, { method: "POST", body: JSON.stringify(body) }),
      ),
    moodboards: async () =>
      moodboardSummaryListSchema.parse(await request("/weddings/mine/moodboards")),
    createMoodboard: async (body: CreateMoodboardBody = { title: "Style" }) =>
      moodboardSchema.parse(
        await request("/weddings/mine/moodboards", { method: "POST", body: JSON.stringify(body) }),
      ),
    moodboard: async (boardId: string) =>
      moodboardSchema.parse(await request(`/weddings/mine/moodboards/${boardId}`)),
    updateMoodboard: async (boardId: string, body: UpdateMoodboardMetaBody) =>
      moodboardSchema.parse(
        await request(`/weddings/mine/moodboards/${boardId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      ),
    saveMoodboardScene: async (boardId: string, body: SaveMoodboardSceneBody) =>
      moodboardSchema.parse(
        await request(`/weddings/mine/moodboards/${boardId}/scene`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      ),
    deleteMoodboard: async (boardId: string) =>
      okResultSchema.parse(
        await request(`/weddings/mine/moodboards/${boardId}`, { method: "DELETE" }),
      ),
    moodboardPresign: async (boardId: string, body: MoodboardPresignBody) =>
      moodboardPresignResponseSchema.parse(
        await request(`/weddings/mine/moodboards/${boardId}/presign`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    setMoodboardShare: async (boardId: string, body: SetMoodboardShareBody) =>
      moodboardSchema.parse(
        await request(`/weddings/mine/moodboards/${boardId}/share`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      ),
    inquiries: async () => inquiryListSchema.parse(await request("/weddings/mine/inquiries")),
    inquire: async (body: CreateInquiryBody) =>
      inquirySchema.parse(
        await request("/weddings/mine/inquiries", { method: "POST", body: JSON.stringify(body) }),
      ),
    shortlist: async (body: ShortlistVendorBody) =>
      weddingVendorSchema.parse(
        await request("/weddings/mine/team", { method: "POST", body: JSON.stringify(body) }),
      ),
    updateTeamVendor: async (vendorId: string, body: UpdateTeamVendorBody) =>
      weddingVendorSchema.parse(
        await request(`/weddings/mine/team/${vendorId}`, { method: "PATCH", body: JSON.stringify(body) }),
      ),
    unshortlist: async (vendorId: string) =>
      okResultSchema.parse(await request(`/weddings/mine/team/${vendorId}`, { method: "DELETE" })),
  },
  vendors: {
    list: (query: Partial<VendorCatalogQuery> = {}, init?: RequestInit) => {
      const parsed = vendorCatalogQuerySchema.parse(query);
      const params = toSearchParams(parsed, VENDOR_CATALOG_DEFAULTS).toString();
      return request<VendorCatalogResult>(params ? `/vendors?${params}` : "/vendors", init);
    },
    get: (slug: string) => request<Vendor>(`/vendors/${slug}`),
    review: (id: string, body: CreateReviewBody) =>
      request<Review>(`/vendors/${id}/reviews`, { method: "POST", body: JSON.stringify(body) }),
    mine: () => request<Vendor>("/vendors/me"),
    updateMine: (body: UpdateVendorBody) =>
      request<Vendor>("/vendors/me", { method: "PATCH", body: JSON.stringify(body) }),
    presignMedia: (body: MediaPresignBody) =>
      request<MediaPresignResponse>("/vendors/me/media/presign", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    leads: () =>
      request<(Inquiry & { wedding: { partnerOneName: string; partnerTwoName: string; slug: string } })[]>(
        "/vendors/me/leads",
      ),
    onboarding: () => request<VendorOnboardingResponse>("/vendors/me/onboarding"),
    putAttributes: (body: UpsertVendorAttributesBody) =>
      request<Vendor>("/vendors/me/attributes", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  public: {
    wedding: async (slug: string) => publicWebsiteSchema.parse(await request(`/public/weddings/${slug}`)),
    rsvp: (slug: string, body: PublicRsvpBody) =>
      request(`/public/weddings/${slug}/rsvp`, { method: "POST", body: JSON.stringify(body) }),
    musicBrief: async (token: string) =>
      musicBriefSchema.parse(await request(`/public/music-brief/${token}`)),
    moodboard: async (token: string) =>
      moodboardBriefSchema.parse(await request(`/public/moodboards/${token}`)),
    articles: (category?: string, q?: string, vendorSlug?: string) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q) params.set("q", q);
      if (vendorSlug) params.set("vendorSlug", vendorSlug);
      const query = params.toString();
      return request<Article[]>(query ? `/articles?${query}` : "/articles");
    },
    article: (slug: string) => request<Article>(`/articles/${slug}`),
  },
  admin: {
    stats: () => request<AdminStats>("/admin/stats"),
    vendors: (query: AdminVendorListQuery = {}) => {
      const params = toSearchParams(query);
      const qs = params.toString();
      return request<Vendor[]>(qs ? `/admin/vendors?${qs}` : "/admin/vendors");
    },
    vendor: (id: string) =>
      request<{ vendor: Vendor; gateFailures: string[]; audit: AuditLog[] }>(`/admin/vendors/${id}`),
    patchVendor: (id: string, body: AdminPatchVendorBody) =>
      request<Vendor>(`/admin/vendors/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    bulkVendors: (body: AdminBulkVendorBody) =>
      request<Vendor[]>("/admin/vendors/bulk", { method: "POST", body: JSON.stringify(body) }),
    users: (query: AdminUserListQuery = {}) => {
      const params = toSearchParams(query);
      const qs = params.toString();
      return request<AdminUser[]>(qs ? `/admin/users?${qs}` : "/admin/users");
    },
    user: (id: string) =>
      request<{
        user: AdminUser;
        vendor: { id: string; name: string; slug: string } | null;
        weddings: Array<{ id: string; slug: string; partnerOneName: string; partnerTwoName: string }>;
        sessions: Array<{ id: string; createdAt: string; expiresAt: string }>;
        audit: AuditLog[];
      }>(`/admin/users/${id}`),
    patchUser: (id: string, body: AdminPatchUserBody) =>
      request<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    revokeSessions: (id: string) =>
      request<{ ok: true; deleted: number }>(`/admin/users/${id}/sessions/revoke`, { method: "POST" }),
    impersonate: (userId: string) =>
      request<{ ok: true; target: { id: string; email: string; name: string; role: string } }>(
        "/admin/impersonate",
        { method: "POST", body: JSON.stringify({ userId }) },
      ),
    audit: (query: AdminAuditListQuery = {}) => {
      const params = toSearchParams(query);
      const qs = params.toString();
      return request<AuditLog[]>(qs ? `/admin/audit?${qs}` : "/admin/audit");
    },
    reports: (status?: string) =>
      request<Report[]>(status ? `/admin/reports?status=${encodeURIComponent(status)}` : "/admin/reports"),
    createReport: (body: CreateReportBody) =>
      request<Report>("/admin/reports", { method: "POST", body: JSON.stringify(body) }),
    resolveReport: (id: string, body: ResolveReportBody) =>
      request<Report>(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    articles: () => request<AdminArticle[]>("/admin/articles"),
    article: (id: string) => request<AdminArticle>(`/admin/articles/${id}`),
    createArticle: (body: UpsertAdminArticleBody) =>
      request<AdminArticle>("/admin/articles", { method: "POST", body: JSON.stringify(body) }),
    updateArticle: (id: string, body: UpsertAdminArticleBody) =>
      request<AdminArticle>(`/admin/articles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteArticle: (id: string) => request<{ ok: true }>(`/admin/articles/${id}`, { method: "DELETE" }),
    weddings: (query: AdminWeddingListQuery = {}) => {
      const params = toSearchParams(query);
      const qs = params.toString();
      return request<AdminWeddingSummary[]>(qs ? `/admin/weddings?${qs}` : "/admin/weddings");
    },
    wedding: (id: string) => request<AdminWeddingSummary>(`/admin/weddings/${id}`),
    inquiries: () => request<AdminInquiry[]>("/admin/inquiries"),
    closeInquiry: (id: string) => request<{ ok: true }>(`/admin/inquiries/${id}/close`, { method: "POST" }),
    reviews: () => request<AdminReview[]>("/admin/reviews"),
    setReviewHidden: (id: string, hidden: boolean) =>
      request<AdminReview>(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ hidden }) }),
    featured: () => request<FeaturedPlacement[]>("/admin/featured"),
    createFeatured: (body: UpsertFeaturedPlacementBody) =>
      request<FeaturedPlacement>("/admin/featured", { method: "POST", body: JSON.stringify(body) }),
    updateFeatured: (id: string, body: UpsertFeaturedPlacementBody) =>
      request<FeaturedPlacement>(`/admin/featured/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteFeatured: (id: string) => request<{ ok: true }>(`/admin/featured/${id}`, { method: "DELETE" }),
    flags: () => request<FeatureFlag[]>("/admin/settings/flags"),
    upsertFlag: (body: UpsertFeatureFlagBody) =>
      request<FeatureFlag>("/admin/settings/flags", { method: "PUT", body: JSON.stringify(body) }),
    siteConfig: () => request<SiteConfig>("/admin/settings/site"),
    updateSiteConfig: (body: UpdateSiteConfigBody) =>
      request<SiteConfig>("/admin/settings/site", { method: "PUT", body: JSON.stringify(body) }),
    cmsPages: () => request<CmsPage[]>("/admin/settings/pages"),
    cmsPage: (slug: string) => request<CmsPage>(`/admin/settings/pages/${encodeURIComponent(slug)}`),
    upsertCmsPage: (slug: string, body: UpsertCmsPageBody) =>
      request<CmsPage>(`/admin/settings/pages/${encodeURIComponent(slug)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    awards: () => request<AwardNomination[]>("/admin/awards"),
    upsertAward: (body: UpsertAwardNominationBody) =>
      request<AwardNomination>("/admin/awards", { method: "PUT", body: JSON.stringify(body) }),
    vendorTypes: () => request<VendorType[]>("/admin/vendor-types"),
    vendorType: (id: string) => request<VendorType>(`/admin/vendor-types/${encodeURIComponent(id)}`),
    createVendorType: (body: CreateVendorTypeBody) =>
      request<VendorType>("/admin/vendor-types", { method: "POST", body: JSON.stringify(body) }),
    updateVendorType: (id: string, body: UpdateVendorTypeBody) =>
      request<VendorType>(`/admin/vendor-types/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteVendorType: (id: string) =>
      request<VendorType | { ok: true }>(`/admin/vendor-types/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    reorderVendorTypes: (ids: string[]) =>
      request<VendorType[]>("/admin/vendor-types/reorder", {
        method: "PATCH",
        body: JSON.stringify({ ids }),
      }),
    cloneVendorType: (id: string, body: CloneVendorTypeBody) =>
      request<VendorType>(`/admin/vendor-types/${encodeURIComponent(id)}/clone`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    exportVendorTaxonomy: (slug?: string) => {
      const qs = slug ? `?slug=${encodeURIComponent(slug)}` : "";
      return request<TaxonomyPack>(`/admin/vendor-types/export${qs}`);
    },
    importVendorTaxonomy: (body: ImportTaxonomyBody, dryRun = false) => {
      const qs = dryRun ? "?dryRun=true" : "";
      return request<TaxonomyImportResult>(`/admin/vendor-types/import${qs}`, {
        method: "POST",
        body: JSON.stringify({ ...body, dryRun }),
      });
    },
    vendorTypeAnalytics: (id: string) =>
      request<VendorTypeAnalytics>(`/admin/vendor-types/${encodeURIComponent(id)}/analytics`),
    onboardingAssetPresign: (body: OnboardingAssetPresignBody) =>
      request<OnboardingAssetPresignResponse>("/admin/onboarding-assets/presign", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createAttributeDefinition: (typeId: string, body: CreateAttributeDefinitionBody) =>
      request<VendorAttributeDefinition>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions`,
        { method: "POST", body: JSON.stringify(body) },
      ),
    updateAttributeDefinition: (
      typeId: string,
      definitionId: string,
      body: UpdateAttributeDefinitionBody,
    ) =>
      request<VendorAttributeDefinition>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/${encodeURIComponent(definitionId)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    deleteAttributeDefinition: (typeId: string, definitionId: string) =>
      request<VendorAttributeDefinition | { ok: true }>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/${encodeURIComponent(definitionId)}`,
        { method: "DELETE" },
      ),
    reorderAttributeDefinitions: (typeId: string, ids: string[]) =>
      request<VendorType>(`/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ ids }),
      }),
    createAttributeOption: (typeId: string, definitionId: string, body: CreateAttributeOptionBody) =>
      request<VendorAttributeOption>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/${encodeURIComponent(definitionId)}/options`,
        { method: "POST", body: JSON.stringify(body) },
      ),
    updateAttributeOption: (
      typeId: string,
      definitionId: string,
      optionId: string,
      body: UpdateAttributeOptionBody,
    ) =>
      request<VendorAttributeOption>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/${encodeURIComponent(definitionId)}/options/${encodeURIComponent(optionId)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    deleteAttributeOption: (typeId: string, definitionId: string, optionId: string) =>
      request<VendorAttributeOption | { ok: true }>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/${encodeURIComponent(definitionId)}/options/${encodeURIComponent(optionId)}`,
        { method: "DELETE" },
      ),
    reorderAttributeOptions: (typeId: string, definitionId: string, ids: string[]) =>
      request<VendorAttributeDefinition>(
        `/admin/vendor-types/${encodeURIComponent(typeId)}/definitions/${encodeURIComponent(definitionId)}/options/reorder`,
        { method: "PATCH", body: JSON.stringify({ ids }) },
      ),
    jobHealth: () => request<AdminJobHealth>("/admin/jobs/health"),
    analytics: () => request<AdminAnalyticsSummary>("/admin/analytics/summary"),
    exportCsv: async (kind: "vendors" | "users") => {
      const res = await fetch(`${apiUrl}/admin/export/${kind}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.text();
    },
    promotions: (query: PromotionListQuery = {}) => {
      const params = toSearchParams(query);
      const qs = params.toString();
      return request<Promotion[]>(qs ? `/admin/promotions?${qs}` : "/admin/promotions");
    },
    promotion: (id: string) => request<Promotion>(`/admin/promotions/${id}`),
    createPromotion: (body: UpsertPromotionBody) =>
      request<Promotion>("/admin/promotions", { method: "POST", body: JSON.stringify(body) }),
    updatePromotion: (id: string, body: UpsertPromotionBody) =>
      request<Promotion>(`/admin/promotions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deletePromotion: (id: string) =>
      request<{ ok: true }>(`/admin/promotions/${id}`, { method: "DELETE" }),
    vendorSubscription: (vendorId: string) =>
      request<VendorSubscription>(`/admin/vendors/${vendorId}/subscription`),
    overrideTrial: (vendorId: string, body: AdminOverrideTrialBody) =>
      request<VendorSubscription>(`/admin/vendors/${vendorId}/subscription/trial`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    grantComped: (vendorId: string, body: AdminGrantCompedBody) =>
      request<VendorSubscription>(`/admin/vendors/${vendorId}/subscription/comp`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    activatePaid: (vendorId: string, body: AdminActivatePaidBody) =>
      request<VendorSubscription>(`/admin/vendors/${vendorId}/subscription/activate`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    suspendSubscription: (vendorId: string) =>
      request<VendorSubscription>(`/admin/vendors/${vendorId}/subscription/suspend`, {
        method: "PATCH",
      }),
    consultations: (query: ConsultationListQuery = {}) => {
      const qs = toSearchParams(query as unknown as Record<string, unknown>).toString();
      return request<Consultation[]>(qs ? `/admin/consultations?${qs}` : "/admin/consultations");
    },
    consultation: (id: string) => request<Consultation>(`/admin/consultations/${id}`),
    consultationSummary: () =>
      request<{ pending: number; upcoming: number }>("/admin/consultations/summary"),
    consultationAvailability: (query: ConsultationAvailabilityQuery = {}) => {
      const qs = toSearchParams(query as unknown as Record<string, unknown>).toString();
      return request<{ timezone: string; slotMinutes: number; days: ConsultationDay[] }>(
        qs ? `/admin/consultations/availability?${qs}` : "/admin/consultations/availability",
      );
    },
    createConsultation: (body: AdminCreateConsultationBody) =>
      request<Consultation>("/admin/consultations", { method: "POST", body: JSON.stringify(body) }),
    updateConsultation: (id: string, body: UpdateConsultationBody) =>
      request<Consultation>(`/admin/consultations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    cancelConsultation: (id: string, body: CancelConsultationBody = {}) =>
      request<Consultation>(`/admin/consultations/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    contactMessages: (query: ContactMessageListQuery = {}) => {
      const qs = toSearchParams(query as unknown as Record<string, unknown>).toString();
      return request<ContactMessage[]>(qs ? `/admin/contact-messages?${qs}` : "/admin/contact-messages");
    },
    updateContactMessage: (id: string, body: UpdateContactMessageBody) =>
      request<ContactMessage>(`/admin/contact-messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  subscription: {
    plans: () => request<SubscriptionPlan[]>("/subscription/plans"),
    vendor: (vendorId: string) => request<VendorSubscription>(`/subscription/vendor/${vendorId}`),
    checkout: (body: { vendorId: string; planId: string; interval: "MONTHLY" | "ANNUAL"; returnUrl?: string; cancelUrl?: string }) =>
      request<{ paymentIntentId: string; orderId: string; actionUrl: string; fields: Record<string, string> }>("/subscription/checkout", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  promotions: {
    mine: () => request<Promotion[]>("/vendors/me/promotions"),
    getMine: (id: string) => request<Promotion>(`/vendors/me/promotions/${id}`),
    createMine: (body: UpsertPromotionBody) =>
      request<Promotion>("/vendors/me/promotions", { method: "POST", body: JSON.stringify(body) }),
    updateMine: (id: string, body: UpsertPromotionBody) =>
      request<Promotion>(`/vendors/me/promotions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    public: (query: PublicPromotionQuery) => {
      const params = toSearchParams(query as unknown as Record<string, unknown>);
      return request<Promotion[]>(`/public/promotions?${params.toString()}`);
    },
    impression: (id: string) =>
      request<{ ok: true }>(`/public/promotions/${id}/impression`, { method: "POST" }),
    click: (id: string) => request<{ ok: true }>(`/public/promotions/${id}/click`, { method: "POST" }),
  },
  site: {
    config: () => request<PublicSiteConfig>("/public/site-config"),
    page: (slug: string) => request<CmsPage>(`/public/pages/${encodeURIComponent(slug)}`),
    flags: () => request<PublicFlags>("/public/flags"),
    awards: (year?: number) =>
      request<PublicAward[]>(
        year != null ? `/public/awards?year=${encodeURIComponent(String(year))}` : "/public/awards",
      ),
  },
  consultations: {
    availability: (query: ConsultationAvailabilityQuery = {}) => {
      const qs = toSearchParams(query as unknown as Record<string, unknown>).toString();
      return request<ConsultationAvailability>(
        qs ? `/public/consultations/availability?${qs}` : "/public/consultations/availability",
      );
    },
    book: (body: CreateConsultationBody) =>
      request<PublicConsultation>("/public/consultations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    byToken: (manageToken: string) =>
      request<PublicConsultation>(`/public/consultations/${encodeURIComponent(manageToken)}`),
    cancel: (manageToken: string, body: CancelConsultationBody = {}) =>
      request<PublicConsultation>(
        `/public/consultations/${encodeURIComponent(manageToken)}/cancel`,
        { method: "POST", body: JSON.stringify(body) },
      ),
    icsUrl: (manageToken: string) =>
      `${apiUrl}/public/consultations/${encodeURIComponent(manageToken)}/calendar.ics`,
  },
  contact: {
    send: (body: CreateContactMessageBody) =>
      request<{ ok: true }>("/public/contact-messages", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  messaging: {
    conversations: async () =>
      conversationListResponseSchema.parse(await request<ConversationListResponse>("/messaging/conversations")),
    openConversation: async (body: CreateConversationBody) =>
      conversationSchema.parse(
        await request<Conversation>("/messaging/conversations", { method: "POST", body: JSON.stringify(body) }),
      ),
    conversation: async (id: string) =>
      conversationSchema.parse(await request<Conversation>(`/messaging/conversations/${id}`)),
    messages: async (id: string, query: Partial<MessageListQuery> = {}) => {
      const params = toSearchParams(query as unknown as Record<string, unknown>);
      const qs = params.toString();
      return messageListResponseSchema.parse(
        await request<MessageListResponse>(
          qs ? `/messaging/conversations/${id}/messages?${qs}` : `/messaging/conversations/${id}/messages`,
        ),
      );
    },
    sendMessage: async (id: string, body: SendMessageBody) =>
      messageSchema.parse(
        await request<Message>(`/messaging/conversations/${id}/messages`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    markRead: async (id: string, body: { readAt?: string } = {}) =>
      request<{ ok: true; conversationId: string; userId: string; readAt: string }>(
        `/messaging/conversations/${id}/read`,
        { method: "POST", body: JSON.stringify(body) },
      ),
    presignMedia: async (body: MessagingMediaPresignBody) =>
      messagingMediaPresignResponseSchema.parse(
        await request<MessagingMediaPresignResponse>("/messaging/media/presign", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    notifications: async () =>
      notificationListResponseSchema.parse(await request<NotificationListResponse>("/messaging/notifications")),
    markNotificationsRead: async (body: MarkNotificationsReadBody = { all: true }) =>
      okResultSchema.parse(
        await request("/messaging/notifications/read", { method: "POST", body: JSON.stringify(body) }),
      ),
  },
};
