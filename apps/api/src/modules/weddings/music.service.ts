import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "@ceylonweddings/database";
import type {
  CreateMusicCueBody,
  CreateMusicTrackBody,
  MusicPlan,
  ReorderMusicCuesBody,
  ReorderMusicTracksBody,
  SeedMusicCueTemplatesBody,
  SetMusicShareBody,
  UpdateMusicCueBody,
  UpdateMusicPlanBody,
  UpdateMusicTrackBody,
  UpsertMusicPlanBody,
  User,
} from "@ceylonweddings/contracts";
import {
  buildMusicBrief,
  musicCueTemplatesForEventKind,
  type MusicCueKind,
  type MusicLanguage,
  type MusicListKind,
  type MusicVibe,
} from "@ceylonweddings/contracts";
import { WeddingAccessService } from "./wedding-access.service";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

const planInclude = {
  event: true,
  tracks: { orderBy: [{ list: "asc" as const }, { sortOrder: "asc" as const }] },
  cues: { orderBy: { sortOrder: "asc" as const } },
};

@Injectable()
export class MusicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async list(user: User) {
    const wedding = await this.access.requireWedding(user);
    const plans = await this.prisma.musicPlan.findMany({
      where: { weddingId: wedding.id },
      include: planInclude,
      orderBy: { createdAt: "asc" },
    });
    return plans.map((plan) => this.serializePlan(plan, true));
  }

  async get(user: User, planId: string) {
    const wedding = await this.access.requireWedding(user);
    const plan = await this.requirePlan(wedding.id, planId);
    return this.serializePlan(plan, true);
  }

  async upsert(user: User, body: UpsertMusicPlanBody) {
    const { wedding } = await this.access.requireCouple(user);
    const event = await this.assertEvent(wedding.id, body.eventId);
    const existing = await this.prisma.musicPlan.findUnique({
      where: { eventId: event.id },
      include: planInclude,
    });
    if (existing) {
      if (existing.weddingId !== wedding.id) {
        throw new NotFoundException("Music plan not found");
      }
      const updated = await this.prisma.musicPlan.update({
        where: { id: existing.id },
        data: {
          notes: body.notes === undefined ? undefined : body.notes,
          vibePrimary: body.vibePrimary === undefined ? undefined : body.vibePrimary,
          languages: body.languages === undefined ? undefined : body.languages,
          entertainmentVendorId:
            body.entertainmentVendorId === undefined ? undefined : body.entertainmentVendorId,
        },
        include: planInclude,
      });
      return this.serializePlan(updated, true);
    }

    if (body.entertainmentVendorId) {
      await this.assertEntertainmentVendor(wedding.id, body.entertainmentVendorId);
    }

    const created = await this.prisma.musicPlan.create({
      data: {
        weddingId: wedding.id,
        eventId: event.id,
        notes: body.notes ?? null,
        vibePrimary: body.vibePrimary ?? null,
        languages: body.languages ?? [],
        entertainmentVendorId: body.entertainmentVendorId ?? null,
      },
      include: planInclude,
    });
    return this.serializePlan(created, true);
  }

  async update(user: User, planId: string, body: UpdateMusicPlanBody) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    if (body.entertainmentVendorId) {
      await this.assertEntertainmentVendor(wedding.id, body.entertainmentVendorId);
    }
    const updated = await this.prisma.musicPlan.update({
      where: { id: planId },
      data: {
        notes: body.notes === undefined ? undefined : body.notes,
        vibePrimary: body.vibePrimary === undefined ? undefined : body.vibePrimary,
        languages: body.languages === undefined ? undefined : body.languages,
        entertainmentVendorId:
          body.entertainmentVendorId === undefined ? undefined : body.entertainmentVendorId,
      },
      include: planInclude,
    });
    return this.serializePlan(updated, true);
  }

  async createTrack(user: User, planId: string, body: CreateMusicTrackBody) {
    const { wedding } = await this.access.requireCouple(user);
    const plan = await this.requirePlan(wedding.id, planId);
    const sortOrder =
      body.sortOrder ??
      (await this.prisma.musicTrack.count({ where: { planId: plan.id, list: body.list } }));
    const track = await this.prisma.musicTrack.create({
      data: {
        planId: plan.id,
        list: body.list,
        title: body.title,
        artist: body.artist ?? null,
        url: body.url ?? null,
        language: body.language ?? null,
        vibe: body.vibe ?? null,
        notes: body.notes ?? null,
        sortOrder,
      },
    });
    return this.serializeTrack(track);
  }

  async updateTrack(user: User, planId: string, trackId: string, body: UpdateMusicTrackBody) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    const existing = await this.prisma.musicTrack.findFirst({ where: { id: trackId, planId } });
    if (!existing) throw new NotFoundException("Track not found");
    const track = await this.prisma.musicTrack.update({
      where: { id: trackId },
      data: {
        list: body.list,
        title: body.title,
        artist: body.artist === undefined ? undefined : body.artist,
        url: body.url === undefined ? undefined : body.url,
        language: body.language === undefined ? undefined : body.language,
        vibe: body.vibe === undefined ? undefined : body.vibe,
        notes: body.notes === undefined ? undefined : body.notes,
        sortOrder: body.sortOrder,
      },
    });
    return this.serializeTrack(track);
  }

  async deleteTrack(user: User, planId: string, trackId: string) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    const existing = await this.prisma.musicTrack.findFirst({ where: { id: trackId, planId } });
    if (!existing) throw new NotFoundException("Track not found");
    await this.prisma.musicTrack.delete({ where: { id: trackId } });
    return { ok: true as const };
  }

  async reorderTracks(user: User, planId: string, body: ReorderMusicTracksBody) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    const tracks = await this.prisma.musicTrack.findMany({ where: { planId } });
    const idSet = new Set(tracks.map((t) => t.id));
    if (body.orderedIds.length !== idSet.size || body.orderedIds.some((id) => !idSet.has(id))) {
      throw new BadRequestException("orderedIds must include every track exactly once");
    }
    await this.prisma.$transaction(
      body.orderedIds.map((id, index) =>
        this.prisma.musicTrack.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return this.get(user, planId);
  }

  async createCue(user: User, planId: string, body: CreateMusicCueBody) {
    const { wedding } = await this.access.requireCouple(user);
    const plan = await this.requirePlan(wedding.id, planId);
    if (body.trackId) await this.assertTrack(plan.id, body.trackId);
    if (body.appointmentId) await this.assertAppointment(wedding.id, body.appointmentId);
    const sortOrder =
      body.sortOrder ?? (await this.prisma.musicCue.count({ where: { planId: plan.id } }));
    const cue = await this.prisma.musicCue.create({
      data: {
        planId: plan.id,
        kind: body.kind ?? "CUSTOM",
        label: body.label,
        trackTitle: body.trackTitle ?? null,
        trackId: body.trackId ?? null,
        appointmentId: body.appointmentId ?? null,
        offsetMinutes: body.offsetMinutes ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        durationMinutes: body.durationMinutes ?? null,
        notes: body.notes ?? null,
        sortOrder,
      },
    });
    return this.serializeCue(cue);
  }

  async updateCue(user: User, planId: string, cueId: string, body: UpdateMusicCueBody) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    const existing = await this.prisma.musicCue.findFirst({ where: { id: cueId, planId } });
    if (!existing) throw new NotFoundException("Cue not found");
    if (body.trackId) await this.assertTrack(planId, body.trackId);
    if (body.appointmentId) await this.assertAppointment(wedding.id, body.appointmentId);
    const cue = await this.prisma.musicCue.update({
      where: { id: cueId },
      data: {
        kind: body.kind,
        label: body.label,
        trackTitle: body.trackTitle === undefined ? undefined : body.trackTitle,
        trackId: body.trackId === undefined ? undefined : body.trackId,
        appointmentId: body.appointmentId === undefined ? undefined : body.appointmentId,
        offsetMinutes: body.offsetMinutes === undefined ? undefined : body.offsetMinutes,
        startsAt:
          body.startsAt === undefined
            ? undefined
            : body.startsAt
              ? new Date(body.startsAt)
              : null,
        durationMinutes: body.durationMinutes === undefined ? undefined : body.durationMinutes,
        notes: body.notes === undefined ? undefined : body.notes,
        sortOrder: body.sortOrder,
      },
    });
    return this.serializeCue(cue);
  }

  async deleteCue(user: User, planId: string, cueId: string) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    const existing = await this.prisma.musicCue.findFirst({ where: { id: cueId, planId } });
    if (!existing) throw new NotFoundException("Cue not found");
    await this.prisma.musicCue.delete({ where: { id: cueId } });
    return { ok: true as const };
  }

  async reorderCues(user: User, planId: string, body: ReorderMusicCuesBody) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requirePlan(wedding.id, planId);
    const cues = await this.prisma.musicCue.findMany({ where: { planId } });
    const idSet = new Set(cues.map((c) => c.id));
    if (body.orderedIds.length !== idSet.size || body.orderedIds.some((id) => !idSet.has(id))) {
      throw new BadRequestException("orderedIds must include every cue exactly once");
    }
    await this.prisma.$transaction(
      body.orderedIds.map((id, index) =>
        this.prisma.musicCue.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return this.get(user, planId);
  }

  async seedTemplates(user: User, planId: string, body: SeedMusicCueTemplatesBody) {
    const { wedding } = await this.access.requireCouple(user);
    const plan = await this.requirePlan(wedding.id, planId);
    const existingCount = await this.prisma.musicCue.count({ where: { planId } });
    if (existingCount > 0 && !body.replace) {
      return this.serializePlan(plan, true);
    }
    if (body.replace && existingCount > 0) {
      await this.prisma.musicCue.deleteMany({ where: { planId } });
    }
    const templates = musicCueTemplatesForEventKind(plan.event.kind);
    if (templates.length) {
      await this.prisma.musicCue.createMany({
        data: templates.map((template, index) => ({
          planId,
          kind: template.kind,
          label: template.label,
          offsetMinutes: template.offsetMinutes,
          durationMinutes: template.durationMinutes,
          notes: template.notes ?? null,
          sortOrder: index,
        })),
      });
    }
    return this.get(user, planId);
  }

  async setShare(user: User, planId: string, body: SetMusicShareBody) {
    const { wedding } = await this.access.requireCouple(user);
    const plan = await this.requirePlan(wedding.id, planId);
    let shareToken = plan.shareToken;
    let shareEnabled = body.enabled;

    if (body.enabled) {
      if (!shareToken || body.rotate) {
        shareToken = randomBytes(24).toString("hex");
      }
      shareEnabled = true;
    } else {
      shareEnabled = false;
      if (body.rotate) {
        shareToken = null;
      }
    }

    const updated = await this.prisma.musicPlan.update({
      where: { id: planId },
      data: { shareEnabled, shareToken },
      include: planInclude,
    });
    return this.serializePlan(updated, true);
  }

  async publicBrief(token: string) {
    const plan = await this.prisma.musicPlan.findFirst({
      where: { shareToken: token, shareEnabled: true },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException("Music brief not found");
    return buildMusicBrief({
      event: {
        name: plan.event.name,
        kind: plan.event.kind,
        startsAt: iso(plan.event.startsAt),
        nekathAt: iso(plan.event.nekathAt),
        venueName: plan.event.venueName,
      },
      plan: {
        notes: plan.notes,
        vibePrimary: plan.vibePrimary,
        languages: plan.languages,
      },
      tracks: plan.tracks.map((track) => this.serializeTrack(track)),
      cues: plan.cues.map((cue) => this.serializeCue(cue)),
    });
  }

  private async requirePlan(weddingId: string, planId: string) {
    const plan = await this.prisma.musicPlan.findFirst({
      where: { id: planId, weddingId },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException("Music plan not found");
    return plan;
  }

  private async assertEvent(weddingId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, weddingId } });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  private async assertTrack(planId: string, trackId: string) {
    const track = await this.prisma.musicTrack.findFirst({ where: { id: trackId, planId } });
    if (!track) throw new BadRequestException("Invalid track for this plan");
    return track;
  }

  private async assertAppointment(weddingId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, weddingId },
    });
    if (!appointment) throw new BadRequestException("Invalid appointment for this wedding");
    return appointment;
  }

  private async assertEntertainmentVendor(weddingId: string, vendorId: string) {
    const link = await this.prisma.weddingVendor.findFirst({
      where: {
        weddingId,
        vendorId,
        status: "BOOKED",
        vendor: { categoryType: { slug: "ENTERTAINMENT" } },
      },
    });
    if (!link) {
      throw new BadRequestException("Entertainment vendor must be BOOKED on the team");
    }
  }

  private serializeTrack(track: {
    id: string;
    planId: string;
    list: string;
    title: string;
    artist: string | null;
    url: string | null;
    language: string | null;
    vibe: string | null;
    notes: string | null;
    sortOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: track.id,
      planId: track.planId,
      list: track.list as MusicListKind,
      title: track.title,
      artist: track.artist,
      url: track.url,
      language: track.language as MusicLanguage | null,
      vibe: track.vibe as MusicVibe | null,
      notes: track.notes,
      sortOrder: track.sortOrder,
      createdAt: track.createdAt ? iso(track.createdAt) ?? undefined : undefined,
      updatedAt: track.updatedAt ? iso(track.updatedAt) ?? undefined : undefined,
    };
  }

  private serializeCue(cue: {
    id: string;
    planId: string;
    kind: string;
    label: string;
    trackTitle: string | null;
    trackId: string | null;
    appointmentId: string | null;
    offsetMinutes: number | null;
    startsAt: Date | null;
    durationMinutes: number | null;
    notes: string | null;
    sortOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: cue.id,
      planId: cue.planId,
      kind: cue.kind as MusicCueKind,
      label: cue.label,
      trackTitle: cue.trackTitle,
      trackId: cue.trackId,
      appointmentId: cue.appointmentId,
      offsetMinutes: cue.offsetMinutes,
      startsAt: iso(cue.startsAt),
      durationMinutes: cue.durationMinutes,
      notes: cue.notes,
      sortOrder: cue.sortOrder,
      createdAt: cue.createdAt ? iso(cue.createdAt) ?? undefined : undefined,
      updatedAt: cue.updatedAt ? iso(cue.updatedAt) ?? undefined : undefined,
    };
  }

  private serializePlan(
    plan: {
      id: string;
      weddingId: string;
      eventId: string;
      notes: string | null;
      vibePrimary: string | null;
      languages: string[];
      entertainmentVendorId: string | null;
      shareToken: string | null;
      shareEnabled: boolean;
      createdAt: Date;
      updatedAt: Date;
      event: { name: string; kind: string };
      tracks: Array<{
        id: string;
        planId: string;
        list: string;
        title: string;
        artist: string | null;
        url: string | null;
        language: string | null;
        vibe: string | null;
        notes: string | null;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
      }>;
      cues: Array<{
        id: string;
        planId: string;
        kind: string;
        label: string;
        trackTitle: string | null;
        trackId: string | null;
        appointmentId: string | null;
        offsetMinutes: number | null;
        startsAt: Date | null;
        durationMinutes: number | null;
        notes: string | null;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
      }>;
    },
    includeShareToken: boolean,
  ): MusicPlan {
    const tracks = plan.tracks.map((track) => this.serializeTrack(track));
    const cues = plan.cues.map((cue) => this.serializeCue(cue));
    return {
      id: plan.id,
      weddingId: plan.weddingId,
      eventId: plan.eventId,
      eventName: plan.event.name,
      eventKind: plan.event.kind as MusicPlan["eventKind"],
      notes: plan.notes,
      vibePrimary: plan.vibePrimary as MusicPlan["vibePrimary"],
      languages: plan.languages as MusicPlan["languages"],
      entertainmentVendorId: plan.entertainmentVendorId,
      shareToken: includeShareToken ? plan.shareToken : undefined,
      shareEnabled: plan.shareEnabled,
      tracks,
      cues,
      createdAt: iso(plan.createdAt) ?? undefined,
      updatedAt: iso(plan.updatedAt) ?? undefined,
    };
  }
}
