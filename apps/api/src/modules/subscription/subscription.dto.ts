import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import {
  adminActivatePaidBodySchema,
  adminGrantCompedBodySchema,
  adminOverrideTrialBodySchema,
  cancelSubscriptionBodySchema,
  changeSubscriptionPlanBodySchema,
  createCheckoutBodySchema,
  upsertSubscriptionPlanBodySchema,
} from "@ceylonweddings/contracts";

export class AdminOverrideTrialDto extends createZodDto(adminOverrideTrialBodySchema) {}
export class AdminGrantCompedDto extends createZodDto(adminGrantCompedBodySchema) {}
export class AdminActivatePaidDto extends createZodDto(adminActivatePaidBodySchema) {}

export class CreateCheckoutDto extends createZodDto(createCheckoutBodySchema) {}

export class CancelSubscriptionDto extends createZodDto(cancelSubscriptionBodySchema) {}
export class ChangeSubscriptionPlanDto extends createZodDto(changeSubscriptionPlanBodySchema) {}
export class UpsertSubscriptionPlanDto extends createZodDto(upsertSubscriptionPlanBodySchema) {}

export class PayHereWebhookDto extends createZodDto(
  z.object({
    merchant_id: z.string(),
    order_id: z.string(),
    payment_id: z.string(),
    payhere_amount: z.string(),
    payhere_currency: z.string(),
    status_code: z.string(),
    md5sig: z.string(),
    custom_1: z.string().optional(),
    custom_2: z.string().optional(),
    method: z.string().optional(),
    status_message: z.string().optional(),
  }),
) {}
