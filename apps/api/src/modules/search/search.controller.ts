import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SearchQueryDto } from "./search.dto";
import { SearchService } from "./search.service";

@ApiTags("search")
@Controller("search")
@UseGuards(JwtCookieGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  query(@CurrentUser() user: User, @Query() query: SearchQueryDto) {
    return this.search.search(user, query);
  }
}
