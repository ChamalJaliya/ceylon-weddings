import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, randomUUID } from "node:crypto";
import { extname } from "node:path";
import { PrismaService } from "@ceylonweddings/database";
import { Prisma } from "@ceylonweddings/database";
import type {
  CreateMoodboardBody,
  Moodboard,
  MoodboardAsset,
  MoodboardBrief,
  MoodboardPresignBody,
  MoodboardPresignResponse,
  MoodboardSummary,
  SaveMoodboardSceneBody,
  SetMoodboardShareBody,
  UpdateMoodboardMetaBody,
  User,
} from "@ceylonweddings/contracts";
import {
  MOODBOARD_IMAGE_CONTENT_TYPES,
  emptyMoodboardScene,
  migrateMoodboardScene,
  moodboardElementCount,
  moodboardReady,
  sanitizeMoodboardScene,
} from "@ceylonweddings/contracts";
import { loadApiEnv } from "@ceylonweddings/env";
import { WeddingAccessService } from "./wedding-access.service";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

const EXT_BY_TYPE: Record<(typeof MOODBOARD_IMAGE_CONTENT_TYPES)[number], string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const boardInclude = {
  event: true,
  assets: { orderBy: { createdAt: "asc" as const } },
};

@Injectable()
export class MoodboardsService {
  private readonly env = loadApiEnv();
  private client: S3Client | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async list(user: User): Promise<MoodboardSummary[]> {
    const wedding = await this.access.requireWedding(user);
    const boards = await this.prisma.moodboard.findMany({
      where: { weddingId: wedding.id },
      include: boardInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return boards.map((board) => this.serializeSummary(board));
  }

  async get(user: User, boardId: string): Promise<Moodboard> {
    const wedding = await this.access.requireWedding(user);
    const board = await this.requireBoard(wedding.id, boardId);
    return this.serializeBoard(board, true);
  }

  async create(user: User, body: CreateMoodboardBody): Promise<Moodboard> {
    const { wedding } = await this.access.requireCouple(user);
    if (body.eventId) {
      await this.assertEvent(wedding.id, body.eventId);
    }
    const count = await this.prisma.moodboard.count({ where: { weddingId: wedding.id } });
    const created = await this.prisma.moodboard.create({
      data: {
        weddingId: wedding.id,
        title: body.title?.trim() || "Style",
        eventId: body.eventId ?? null,
        notes: body.notes ?? null,
        scene: emptyMoodboardScene() as Prisma.InputJsonValue,
        sortOrder: count,
      },
      include: boardInclude,
    });
    return this.serializeBoard(created, true);
  }

  async updateMeta(user: User, boardId: string, body: UpdateMoodboardMetaBody): Promise<Moodboard> {
    const { wedding } = await this.access.requireCouple(user);
    await this.requireBoard(wedding.id, boardId);
    if (body.eventId) {
      await this.assertEvent(wedding.id, body.eventId);
    }
    const updated = await this.prisma.moodboard.update({
      where: { id: boardId },
      data: {
        title: body.title === undefined ? undefined : body.title.trim(),
        eventId: body.eventId === undefined ? undefined : body.eventId,
        notes: body.notes === undefined ? undefined : body.notes,
        sortOrder: body.sortOrder === undefined ? undefined : body.sortOrder,
      },
      include: boardInclude,
    });
    return this.serializeBoard(updated, true);
  }

  async saveScene(user: User, boardId: string, body: SaveMoodboardSceneBody): Promise<Moodboard> {
    const { wedding } = await this.access.requireCouple(user);
    const board = await this.requireBoard(wedding.id, boardId);
    if (board.version !== body.expectedVersion) {
      throw new ConflictException("Moodboard was updated elsewhere — reload and try again");
    }

    const scene = sanitizeMoodboardScene(body.scene);
    const assetFileIds = new Set(body.assets.map((a) => a.fileId));

    await this.prisma.$transaction(async (tx) => {
      await tx.moodboard.update({
        where: { id: boardId },
        data: {
          scene: scene as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });

      for (const asset of body.assets) {
        await tx.moodboardAsset.upsert({
          where: {
            moodboardId_fileId: { moodboardId: boardId, fileId: asset.fileId },
          },
          create: {
            moodboardId: boardId,
            fileId: asset.fileId,
            key: asset.key,
            publicUrl: asset.publicUrl,
            mimeType: asset.mimeType,
          },
          update: {
            key: asset.key,
            publicUrl: asset.publicUrl,
            mimeType: asset.mimeType,
          },
        });
      }

      // Drop assets no longer referenced by image items
      const sceneFileIds = new Set<string>();
      for (const item of scene.items) {
        if (item.type === "image" && item.assetId) sceneFileIds.add(item.assetId);
      }
      const keep = new Set([...assetFileIds, ...sceneFileIds]);
      const existing = await tx.moodboardAsset.findMany({ where: { moodboardId: boardId } });
      const toDelete = existing.filter((a) => !keep.has(a.fileId)).map((a) => a.id);
      if (toDelete.length) {
        await tx.moodboardAsset.deleteMany({ where: { id: { in: toDelete } } });
      }
    });

    return this.get(user, boardId);
  }

  async remove(user: User, boardId: string) {
    const { wedding } = await this.access.requireCouple(user);
    await this.requireBoard(wedding.id, boardId);
    await this.prisma.moodboard.delete({ where: { id: boardId } });
    return { ok: true as const };
  }

  async presign(
    user: User,
    boardId: string,
    body: MoodboardPresignBody,
  ): Promise<MoodboardPresignResponse> {
    const { wedding } = await this.access.requireCouple(user);
    await this.requireBoard(wedding.id, boardId);

    if (!(MOODBOARD_IMAGE_CONTENT_TYPES as readonly string[]).includes(body.contentType)) {
      throw new BadRequestException("Unsupported image type");
    }

    const fromName = extname(body.filename).toLowerCase();
    const ext =
      fromName && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)
        ? fromName === ".jpeg"
          ? ".jpg"
          : fromName
        : EXT_BY_TYPE[body.contentType];

    const key = `weddings/${wedding.id}/moodboards/${boardId}/${randomUUID()}${ext}`;
    const s3 = this.tryGetS3();

    if (!s3) {
      const mockUrl = `https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80`;
      return {
        uploadUrl: `http://localhost:${this.env.PORT}/mock-upload`,
        key,
        publicUrl: mockUrl,
        fileId: body.fileId,
      };
    }

    const client = this.getClient(s3.region, s3.accessKeyId, s3.secretAccessKey);
    const command = new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      ContentType: body.contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    const publicUrl = `${s3.publicBase}/${key}`;
    return { uploadUrl, key, publicUrl, fileId: body.fileId };
  }

  async setShare(user: User, boardId: string, body: SetMoodboardShareBody): Promise<Moodboard> {
    const { wedding } = await this.access.requireCouple(user);
    const board = await this.requireBoard(wedding.id, boardId);
    let shareToken = board.shareToken;
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

    const updated = await this.prisma.moodboard.update({
      where: { id: boardId },
      data: { shareEnabled, shareToken },
      include: boardInclude,
    });
    return this.serializeBoard(updated, true);
  }

  async publicBrief(token: string): Promise<MoodboardBrief> {
    const board = await this.prisma.moodboard.findFirst({
      where: { shareToken: token, shareEnabled: true },
      include: {
        event: true,
        assets: true,
        wedding: { select: { partnerOneName: true, partnerTwoName: true } },
      },
    });
    if (!board) throw new NotFoundException("Moodboard not found");
    const { scene, migratedFromSketch } = migrateMoodboardScene(board.scene);
    return {
      title: board.title,
      notes: board.notes,
      eventName: board.event?.name ?? null,
      coupleLabel: `${board.wedding.partnerOneName} & ${board.wedding.partnerTwoName}`,
      scene,
      assets: board.assets.map((a) => ({
        fileId: a.fileId,
        publicUrl: a.publicUrl,
        mimeType: a.mimeType,
      })),
      migratedFromSketch,
    };
  }

  private async requireBoard(weddingId: string, boardId: string) {
    const board = await this.prisma.moodboard.findFirst({
      where: { id: boardId, weddingId },
      include: boardInclude,
    });
    if (!board) throw new NotFoundException("Moodboard not found");
    return board;
  }

  private async assertEvent(weddingId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, weddingId } });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  private serializeAsset(asset: {
    id: string;
    moodboardId: string;
    fileId: string;
    key: string;
    publicUrl: string;
    mimeType: string;
    createdAt: Date;
  }): MoodboardAsset {
    return {
      id: asset.id,
      moodboardId: asset.moodboardId,
      fileId: asset.fileId,
      key: asset.key,
      publicUrl: asset.publicUrl,
      mimeType: asset.mimeType,
      createdAt: iso(asset.createdAt) ?? undefined,
    };
  }

  private serializeSummary(board: {
    id: string;
    weddingId: string;
    title: string;
    eventId: string | null;
    notes: string | null;
    scene: unknown;
    version: number;
    shareToken: string | null;
    shareEnabled: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    event: { name: string } | null;
    assets: unknown[];
  }): MoodboardSummary {
    const elementCount = moodboardElementCount(board.scene);
    return {
      id: board.id,
      weddingId: board.weddingId,
      title: board.title,
      eventId: board.eventId,
      eventName: board.event?.name ?? null,
      notes: board.notes,
      version: board.version,
      shareToken: board.shareToken,
      shareEnabled: board.shareEnabled,
      sortOrder: board.sortOrder,
      elementCount,
      assetCount: board.assets.length,
      ready: moodboardReady({ elementCount }),
      createdAt: iso(board.createdAt) ?? undefined,
      updatedAt: iso(board.updatedAt) ?? undefined,
    };
  }

  private serializeBoard(
    board: {
      id: string;
      weddingId: string;
      title: string;
      eventId: string | null;
      notes: string | null;
      scene: unknown;
      version: number;
      shareToken: string | null;
      shareEnabled: boolean;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
      event: { name: string } | null;
      assets: Array<{
        id: string;
        moodboardId: string;
        fileId: string;
        key: string;
        publicUrl: string;
        mimeType: string;
        createdAt: Date;
      }>;
    },
    includeToken: boolean,
  ): Moodboard {
    const { scene, migratedFromSketch } = migrateMoodboardScene(board.scene);
    const elementCount = moodboardElementCount(scene);
    return {
      id: board.id,
      weddingId: board.weddingId,
      title: board.title,
      eventId: board.eventId,
      eventName: board.event?.name ?? null,
      notes: board.notes,
      scene,
      version: board.version,
      shareToken: includeToken ? board.shareToken : undefined,
      shareEnabled: board.shareEnabled,
      sortOrder: board.sortOrder,
      assets: board.assets.map((a) => this.serializeAsset(a)),
      elementCount,
      ready: moodboardReady({ elementCount }),
      migratedFromSketch: migratedFromSketch || undefined,
      createdAt: iso(board.createdAt) ?? undefined,
      updatedAt: iso(board.updatedAt) ?? undefined,
    };
  }

  private tryGetS3() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET, S3_PUBLIC_BASE_URL } =
      this.env;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !S3_BUCKET || !S3_PUBLIC_BASE_URL) {
      return null;
    }
    return {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION,
      bucket: S3_BUCKET,
      publicBase: S3_PUBLIC_BASE_URL,
    };
  }

  private getClient(region: string, accessKeyId: string, secretAccessKey: string) {
    if (!this.client) {
      this.client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return this.client;
  }
}
