import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { User } from "@ceylonweddings/contracts";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { MessagingService } from "./messaging.service";
import {
  CreateConversationDto,
  MarkNotificationsReadDto,
  MarkReadDto,
  MessageListQueryDto,
  MessagingMediaPresignDto,
  SendMessageDto,
} from "./messaging.dto";

@ApiTags("messaging")
@Controller("messaging")
@UseGuards(JwtCookieGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get("conversations")
  listConversations(@CurrentUser() user: User) {
    return this.messaging.listConversations(user);
  }

  @Post("conversations")
  openConversation(@CurrentUser() user: User, @Body() body: CreateConversationDto) {
    return this.messaging.openConversation(user, body);
  }

  @Get("conversations/:id")
  getConversation(@CurrentUser() user: User, @Param("id") id: string) {
    return this.messaging.getConversation(user, id);
  }

  @Get("conversations/:id/messages")
  listMessages(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Query() query: MessageListQueryDto,
  ) {
    return this.messaging.listMessages(user, id, query);
  }

  @Post("conversations/:id/messages")
  sendMessage(@CurrentUser() user: User, @Param("id") id: string, @Body() body: SendMessageDto) {
    return this.messaging.sendMessage(user, id, body);
  }

  @Post("conversations/:id/read")
  markRead(@CurrentUser() user: User, @Param("id") id: string, @Body() body: MarkReadDto) {
    return this.messaging.markRead(user, id, body);
  }

  @Post("media/presign")
  presign(@CurrentUser() user: User, @Body() body: MessagingMediaPresignDto) {
    return this.messaging.presign(user, body);
  }

  @Get("notifications")
  listNotifications(@CurrentUser() user: User) {
    return this.messaging.listNotifications(user);
  }

  @Post("notifications/read")
  markNotificationsRead(@CurrentUser() user: User, @Body() body: MarkNotificationsReadDto) {
    return this.messaging.markNotificationsRead(user, body);
  }
}
