import { createZodDto } from "nestjs-zod";
import {
  createConversationBodySchema,
  markNotificationsReadBodySchema,
  markReadBodySchema,
  messageListQuerySchema,
  messagingMediaPresignBodySchema,
  sendMessageBodySchema,
} from "@ceylonweddings/contracts";

export class CreateConversationDto extends createZodDto(createConversationBodySchema) {}
export class SendMessageDto extends createZodDto(sendMessageBodySchema) {}
export class MessageListQueryDto extends createZodDto(messageListQuerySchema) {}
export class MarkReadDto extends createZodDto(markReadBodySchema) {}
export class MessagingMediaPresignDto extends createZodDto(messagingMediaPresignBodySchema) {}
export class MarkNotificationsReadDto extends createZodDto(markNotificationsReadBodySchema) {}
