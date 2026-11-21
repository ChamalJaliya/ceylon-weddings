import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { markNotificationsReadBodySchema, notificationCategorySchema, type User } from "@ceylonweddings/contracts";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";
import { NotificationsService } from "./notifications.service";

class NotificationListQueryDto extends createZodDto(
  z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    unread: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    category: notificationCategorySchema.optional(),
    before: z.string().datetime().optional(),
  }),
) {}

class MarkReadDto extends createZodDto(markNotificationsReadBodySchema) {}

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtCookieGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: NotificationListQueryDto) {
    return this.notifications.list(user, query);
  }

  @Get("unread-count")
  async unread(@CurrentUser() user: User) {
    return { unreadCount: await this.notifications.unreadCount(user) };
  }

  @Post("read")
  read(@CurrentUser() user: User, @Body() body: MarkReadDto) {
    return this.notifications.markRead(user, body);
  }
}
