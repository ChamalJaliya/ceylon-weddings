import { Module } from "@nestjs/common";
import { S3PresignService } from "./s3-presign.service";

@Module({
  providers: [S3PresignService],
  exports: [S3PresignService],
})
export class StorageModule {}
