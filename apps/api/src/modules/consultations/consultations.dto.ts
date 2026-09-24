import { createZodDto } from "nestjs-zod";
import {
  adminCreateConsultationBodySchema,
  cancelConsultationBodySchema,
  consultationAvailabilityQuerySchema,
  consultationListQuerySchema,
  contactMessageListQuerySchema,
  createConsultationBodySchema,
  createContactMessageBodySchema,
  updateConsultationBodySchema,
  updateContactMessageBodySchema,
} from "@ceylonweddings/contracts";

export class ConsultationAvailabilityQueryDto extends createZodDto(consultationAvailabilityQuerySchema) {}
export class CreateConsultationDto extends createZodDto(createConsultationBodySchema) {}
export class CancelConsultationDto extends createZodDto(cancelConsultationBodySchema) {}
export class AdminCreateConsultationDto extends createZodDto(adminCreateConsultationBodySchema) {}
export class UpdateConsultationDto extends createZodDto(updateConsultationBodySchema) {}
export class ConsultationListQueryDto extends createZodDto(consultationListQuerySchema) {}
export class CreateContactMessageDto extends createZodDto(createContactMessageBodySchema) {}
export class ContactMessageListQueryDto extends createZodDto(contactMessageListQuerySchema) {}
export class UpdateContactMessageDto extends createZodDto(updateContactMessageBodySchema) {}
