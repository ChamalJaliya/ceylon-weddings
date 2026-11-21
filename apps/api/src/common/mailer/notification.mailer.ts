import { type RenderedNotification, BRAND_NAME } from "@ceylonweddings/contracts";
import { appUrl } from "./app-origin.util";
import { renderBrandedEmail } from "./branded-email.layout";

const LABEL_BY_CATEGORY: Record<RenderedNotification["metadata"]["category"], string> = {
  messages: "Message",
  bookings: "Inquiries",
  planning: "Planning",
  listing: "Your listing",
  account: "Security",
  admin: "Admin",
};

/** Render a catalog notification as a branded email (subject + html + text). */
export function renderNotificationEmail(rendered: RenderedNotification, locale = "en") {
  const { html, text } = renderBrandedEmail({
    title: rendered.title,
    body: rendered.body,
    preheader: rendered.preheader,
    ctaHref: appUrl(rendered.href, locale),
    ctaLabel: rendered.metadata.ctaLabel,
    variant: rendered.metadata.variant,
    details: rendered.metadata.details,
    label: LABEL_BY_CATEGORY[rendered.metadata.category],
    footer:
      rendered.preferenceKey === null
        ? `This is a security notice about your ${BRAND_NAME} account, so it can't be switched off.`
        : `You're getting this because of your ${BRAND_NAME} notification settings. Change them any time under Settings → Notifications.`,
  });
  return { subject: rendered.emailSubject, html, text };
}
