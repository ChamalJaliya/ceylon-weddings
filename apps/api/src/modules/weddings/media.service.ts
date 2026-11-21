import { Injectable } from "@nestjs/common";
import {
  type MediaPresignBody,
  type MediaPresignResponse,
  type User,
  MEDIA_IMAGE_CONTENT_TYPES,
} from "@ceylonweddings/contracts";
import { S3PresignService } from "../../common/s3-presign.service";
import { VendorsService } from "./vendors.service";
import { WeddingAccessService } from "./wedding-access.service";

@Injectable()
export class MediaService {
  constructor(
    private readonly vendors: VendorsService,
    private readonly access: WeddingAccessService,
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

  /** Couple cover photo for planning hub + guest wedding site. */
  async presignWeddingCover(user: User, body: MediaPresignBody): Promise<MediaPresignResponse> {
    const context = await this.access.requireCouple(user);
    return this.presigner.presignObject({
      keyPrefix: `weddings/${context.wedding.id}/cover`,
      filename: body.filename,
      contentType: body.contentType,
      allowed: MEDIA_IMAGE_CONTENT_TYPES,
      mockUrl: undefined,
    });
  }
}
