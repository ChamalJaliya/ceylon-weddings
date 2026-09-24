import { Module } from "@nestjs/common";
import { StorageModule } from "../../common/storage.module";
import { AuthModule } from "../auth/auth.module";
import { WeddingAccessService } from "./wedding-access.service";
import { WeddingsService } from "./weddings.service";
import { GuestsService } from "./guests.service";
import { VendorsService } from "./vendors.service";
import { ArticlesService } from "./articles.service";
import { InviteTemplatesService } from "./invite-templates.service";
import { SeatingService } from "./seating.service";
import { MusicService } from "./music.service";
import { MoodboardsService } from "./moodboards.service";
import { FamilyService } from "./family.service";
import { MediaService } from "./media.service";
import { WeddingsController } from "./weddings.controller";

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [WeddingsController],
  providers: [
    WeddingAccessService,
    WeddingsService,
    GuestsService,
    VendorsService,
    MediaService,
    ArticlesService,
    InviteTemplatesService,
    SeatingService,
    MusicService,
    MoodboardsService,
    FamilyService,
  ],
  exports: [VendorsService, ArticlesService],
})
export class WeddingsModule {}
