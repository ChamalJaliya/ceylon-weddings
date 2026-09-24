import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { User } from "@ceylonweddings/contracts";
import { RateLimit } from "../../common/rate-limit.guard";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ConsultationsService } from "./consultations.service";
import {
  AdminCreateConsultationDto,
  CancelConsultationDto,
  ConsultationAvailabilityQueryDto,
  ConsultationListQueryDto,
  ContactMessageListQueryDto,
  CreateConsultationDto,
  CreateContactMessageDto,
  UpdateConsultationDto,
  UpdateContactMessageDto,
} from "./consultations.dto";

@ApiTags("consultations")
@Controller()
export class ConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Get("public/consultations/availability")
  @RateLimit({ points: 120, duration: 60 })
  availability(@Query() query: ConsultationAvailabilityQueryDto) {
    return this.consultations.availability(query);
  }

  @Post("public/consultations")
  @RateLimit({
    points: 5,
    duration: 3600,
    errorMessage: "Too many booking attempts. Please try again later or email us.",
  })
  book(@Body() body: CreateConsultationDto, @Req() req: Request) {
    return this.consultations.book(body, { ip: clientIp(req), request: req });
  }

  @Get("public/consultations/:manageToken")
  @RateLimit({ points: 60, duration: 60 })
  byToken(@Param("manageToken") manageToken: string) {
    return this.consultations.byToken(manageToken);
  }

  @Post("public/consultations/:manageToken/cancel")
  @RateLimit({ points: 10, duration: 3600 })
  cancel(@Param("manageToken") manageToken: string, @Body() body: CancelConsultationDto) {
    return this.consultations.cancelByToken(manageToken, body);
  }

  @Get("public/consultations/:manageToken/calendar.ics")
  @RateLimit({ points: 30, duration: 60 })
  @Header("Content-Type", "text/calendar; charset=utf-8")
  async ics(@Param("manageToken") manageToken: string, @Res() res: Response) {
    const file = await this.consultations.icsByToken(manageToken);
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }

  @Get("admin/consultations")
  @UseGuards(JwtCookieGuard)
  adminList(@CurrentUser() user: User, @Query() query: ConsultationListQueryDto) {
    return this.consultations.adminList(user, query);
  }

  @Get("admin/consultations/summary")
  @UseGuards(JwtCookieGuard)
  adminSummary(@CurrentUser() user: User) {
    return this.consultations.adminSummary(user);
  }

  @Get("admin/consultations/availability")
  @UseGuards(JwtCookieGuard)
  adminAvailability(@CurrentUser() user: User, @Query() query: ConsultationAvailabilityQueryDto) {
    return this.consultations.adminAvailability(user, query);
  }

  @Get("admin/consultations/:id")
  @UseGuards(JwtCookieGuard)
  adminGet(@CurrentUser() user: User, @Param("id") id: string) {
    return this.consultations.adminGet(user, id);
  }

  @Post("admin/consultations")
  @UseGuards(JwtCookieGuard)
  adminCreate(
    @CurrentUser() user: User,
    @Body() body: AdminCreateConsultationDto,
    @Req() req: Request,
  ) {
    return this.consultations.adminCreate(user, body, clientIp(req));
  }

  @Patch("admin/consultations/:id")
  @UseGuards(JwtCookieGuard)
  adminUpdate(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpdateConsultationDto,
    @Req() req: Request,
  ) {
    return this.consultations.adminUpdate(user, id, body, clientIp(req));
  }

  @Post("admin/consultations/:id/cancel")
  @UseGuards(JwtCookieGuard)
  adminCancel(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: CancelConsultationDto,
    @Req() req: Request,
  ) {
    return this.consultations.adminCancel(user, id, body, clientIp(req));
  }

  @Post("public/contact-messages")
  @RateLimit({
    points: 5,
    duration: 3600,
    errorMessage: "Too many messages. Please try again later or email us.",
  })
  submitContact(@Body() body: CreateContactMessageDto, @Req() req: Request) {
    return this.consultations.submitContact(body, clientIp(req));
  }

  @Get("admin/contact-messages")
  @UseGuards(JwtCookieGuard)
  adminContactList(@CurrentUser() user: User, @Query() query: ContactMessageListQueryDto) {
    return this.consultations.adminContactList(user, query);
  }

  @Patch("admin/contact-messages/:id")
  @UseGuards(JwtCookieGuard)
  adminContactUpdate(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: UpdateContactMessageDto,
    @Req() req: Request,
  ) {
    return this.consultations.adminContactUpdate(user, id, body, clientIp(req));
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}
