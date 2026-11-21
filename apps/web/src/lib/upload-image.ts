import { MEDIA_IMAGE_CONTENT_TYPES, MEDIA_IMAGE_MAX_BYTES } from "@ceylonweddings/contracts";

type ImageContentType = (typeof MEDIA_IMAGE_CONTENT_TYPES)[number];

/**
 * Validates an image, asks `presign` for an upload URL, PUTs the file, and
 * resolves to its public URL. `presign` is the caller's endpoint (vendor
 * media, admin assets …) so one helper serves every uploader.
 */
export async function uploadImage(
  file: File,
  presign: (body: { contentType: ImageContentType; filename: string }) => Promise<{
    uploadUrl: string;
    publicUrl: string;
  }>,
): Promise<string> {
  if (file.size > MEDIA_IMAGE_MAX_BYTES) throw new Error("Image must be under 10MB");
  const contentType = file.type as ImageContentType;
  if (!(MEDIA_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF");
  }
  const { uploadUrl, publicUrl } = await presign({ contentType, filename: file.name });
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!put.ok) throw new Error("Upload to storage failed");
  return publicUrl;
}
