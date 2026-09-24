import { BadRequestException, Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { loadApiEnv } from "@ceylonweddings/env";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/json": ".json",
};

const KNOWN_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".json",
  ".lottie",
]);

export type PresignRequest = {
  /** Object key prefix, without a trailing slash. */
  keyPrefix: string;
  filename: string;
  contentType: string;
  allowed: readonly string[];
  /** Public URL returned when S3 is not configured (local development). */
  mockUrl?: string;
};

export type PresignResult = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

const DEFAULT_MOCK_URL = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";

@Injectable()
export class S3PresignService {
  private readonly env = loadApiEnv();
  private client: S3Client | null = null;

  async presignObject(request: PresignRequest): Promise<PresignResult> {
    if (!request.allowed.includes(request.contentType)) {
      throw new BadRequestException("Unsupported file type");
    }

    const key = `${request.keyPrefix}/${randomUUID()}${resolveExtension(request)}`;
    const s3 = this.tryGetS3();

    if (!s3) {
      // Local development mock fallback
      return {
        uploadUrl: `http://localhost:${this.env.PORT}/mock-upload`,
        key,
        publicUrl: request.mockUrl ?? DEFAULT_MOCK_URL,
      };
    }

    const client = this.getClient(s3.region, s3.accessKeyId, s3.secretAccessKey);
    const command = new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      ContentType: request.contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

    return { uploadUrl, key, publicUrl: `${s3.publicBase}/${key}` };
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

function resolveExtension(request: PresignRequest): string {
  const fromName = extname(request.filename).toLowerCase();
  if (fromName && KNOWN_EXTENSIONS.has(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }
  return EXT_BY_TYPE[request.contentType] ?? "";
}
