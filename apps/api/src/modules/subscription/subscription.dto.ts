import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import {
  adminActivatePaidBodySchema,
  adminGrantCompedBodySchema,
  adminOverrideTrialBodySchema,
} from "@ceylonweddings/contracts";

export class AdminOverrideTrialDto extends createZodDto(adminOverrideTrialBodySchema) {}
export class AdminGrantCompedDto extends createZodDto(adminGrantCompedBodySchema) {}
export class AdminActivatePaidDto extends createZodDto(adminActivatePaidBodySchema) {}

export class CreateCheckoutDto extends createZodDto(
  z.object({
    vendorId: z.string(),
    planId: z.string(),
    interval: z.enum(["MONTHLY", "ANNUAL"]),
    returnUrl: z.string().optional(),
    cancelUrl: z.string().optional(),
  })
) {}

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
  })
) {}

