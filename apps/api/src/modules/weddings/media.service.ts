import { Injectable } from "@nestjs/common";
import type { MediaPresignBody, MediaPresignResponse, User } from "@ceylonweddings/contracts";
import { MEDIA_IMAGE_CONTENT_TYPES } from "@ceylonweddings/contracts";
import { S3PresignService } from "../../common/s3-presign.service";
import { VendorsService } from "./vendors.service";

@Injectable()
export class MediaService {
  constructor(
    private readonly vendors: VendorsService,
    private readonly presigner: S3PresignService,
  ) {}

  async presign(user: User, body: MediaPresignBody): Promise<MediaPresignResponse> {
    const vendor = await this.vendors.mine(user);
    return this.presigner.presignObject({
      keyPrefix: `vendors/${vendor.id}/${body.kind}`,
      filename: body.filename,
      contentType: body.contentType,
      allowed: MEDIA_IMAGE_CONTENT_TYPES,
    });
  }
}
