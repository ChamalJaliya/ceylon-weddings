import { z } from "zod";

export const weddingTypeSchema = z.enum([
  "KANDYAN_PORUWA",
  "WESTERN_CHURCH",
  "HINDU",
  "MUSLIM_NIKAH",
  "HOMECOMING",
  "ENGAGEMENT",
  "MEHNDI",
  "DESTINATION",
]);
export type WeddingType = z.infer<typeof weddingTypeSchema>;

export const eventKindSchema = z.enum([
  "PORUWA",
  "CHURCH",
  "NIKAH",
  "WALIMA",
  "RECEPTION",
  "HOMECOMING",
  "MEHNDI",
  "ENGAGEMENT",
  "OTHER",
]);
export type EventKind = z.infer<typeof eventKindSchema>;

export const payerSchema = z.enum(["COUPLE", "BRIDE_FAMILY", "GROOM_FAMILY"]);
export type Payer = z.infer<typeof payerSchema>;

export const guestSideSchema = z.enum(["BRIDE", "GROOM", "BOTH"]);
export type GuestSide = z.infer<typeof guestSideSchema>;

export const rsvpStatusSchema = z.enum([
  "CONSIDERING",
  "INVITED",
  "CONFIRMED",
  "DECLINED",
  "MAYBE",
  "WALK_IN",
]);
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const mealSchema = z.enum(["VEG", "FISH", "CHICKEN", "BEEF", "HALAL", "OTHER"]);
export type Meal = z.infer<typeof mealSchema>;

export const inviteChannelSchema = z.enum(["WHATSAPP", "PHONE", "PRINTED", "OVERSEAS"]);
export type InviteChannel = z.infer<typeof inviteChannelSchema>;

export const vendorLinkStatusSchema = z.enum(["SHORTLISTED", "INQUIRED", "BOOKED"]);
export type VendorLinkStatus = z.infer<typeof vendorLinkStatusSchema>;

export const inquiryStatusSchema = z.enum(["NEW", "REPLIED", "CLOSED"]);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

export const taskStatusSchema = z.enum(["TODO", "DOING", "DONE"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const weddingStyleSchema = z.enum(["MINIMALIST", "TRADITIONAL", "KANDYAN", "MODERN", "BEACH"]);
export type WeddingStyle = z.infer<typeof weddingStyleSchema>;

export const appointmentKindSchema = z.enum([
  "VENDOR_MEETING",
  "TASTING",
  "FITTING",
  "CEREMONY",
  "DAY_OF",
  "OTHER",
]);
export type AppointmentKind = z.infer<typeof appointmentKindSchema>;
