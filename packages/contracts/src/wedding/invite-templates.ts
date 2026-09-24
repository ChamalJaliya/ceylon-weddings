import { z } from "zod";
import { inviteChannelSchema } from "./enums";

export const inviteTemplateSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  name: z.string(),
  locale: z.string(),
  channel: inviteChannelSchema,
  body: z.string(),
  isDefault: z.boolean(),
});

export const createInviteTemplateBodySchema = z.object({
  name: z.string().min(1),
  locale: z.string().default("en"),
  channel: inviteChannelSchema.default("WHATSAPP"),
  body: z.string().min(1),
  isDefault: z.boolean().default(false),
});

export const updateInviteTemplateBodySchema = createInviteTemplateBodySchema.partial();

export type InviteTemplate = z.infer<typeof inviteTemplateSchema>;
export type CreateInviteTemplateBody = z.infer<typeof createInviteTemplateBodySchema>;
export type UpdateInviteTemplateBody = z.infer<typeof updateInviteTemplateBodySchema>;

export type InviteTemplateVars = {
  partnerOne?: string;
  partnerTwo?: string;
  eventName?: string;
  date?: string;
  venue?: string;
  rsvpUrl?: string;
  guestName?: string;
};

export const INVITE_TEMPLATE_STARTERS: Array<{
  name: string;
  locale: string;
  channel: "WHATSAPP";
  body: string;
  isDefault?: boolean;
}> = [
  {
    name: "Formal English",
    locale: "en",
    channel: "WHATSAPP",
    isDefault: true,
    body: "Ayubowan {{guestName}}! You are warmly invited to celebrate {{partnerOne}} & {{partnerTwo}}. {{eventName}} — {{date}} at {{venue}}. Please RSVP: {{rsvpUrl}}",
  },
  {
    name: "Warm Sinhala",
    locale: "si",
    channel: "WHATSAPP",
    body: "ආයුබෝවන් {{guestName}}! {{partnerOne}} සහ {{partnerTwo}} ගේ මංගල උත්සවයට ඔබව ආරාධනා කරමු. {{eventName}} — {{date}}, {{venue}}. RSVP: {{rsvpUrl}}",
  },
  {
    name: "Concise Tamil",
    locale: "ta",
    channel: "WHATSAPP",
    body: "வணக்கம் {{guestName}}! {{partnerOne}} & {{partnerTwo}} திருமணத்திற்கு அழைக்கிறோம். {{eventName}} — {{date}}, {{venue}}. RSVP: {{rsvpUrl}}",
  },
  {
    name: "Overseas English",
    locale: "en",
    channel: "WHATSAPP",
    body: "Hi {{guestName}} — {{partnerOne}} & {{partnerTwo}} would love you at {{eventName}} on {{date}} ({{venue}}). Travel notes + RSVP: {{rsvpUrl}}",
  },
];

export function renderInviteTemplate(body: string, vars: InviteTemplateVars) {
  return body
    .replaceAll("{{partnerOne}}", vars.partnerOne ?? "")
    .replaceAll("{{partnerTwo}}", vars.partnerTwo ?? "")
    .replaceAll("{{eventName}}", vars.eventName ?? "our wedding")
    .replaceAll("{{date}}", vars.date ?? "")
    .replaceAll("{{venue}}", vars.venue ?? "")
    .replaceAll("{{rsvpUrl}}", vars.rsvpUrl ?? "")
    .replaceAll("{{guestName}}", vars.guestName ?? "friend");
}
