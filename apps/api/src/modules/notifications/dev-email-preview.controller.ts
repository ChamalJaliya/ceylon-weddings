import { Controller, Get, Header, NotFoundException, Param } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import {
  NOTIFICATION_TEMPLATE_IDS,
  buildNotificationTemplate,
  type NotificationTemplateContextMap,
  type NotificationTemplateId,
} from "@ceylonweddings/contracts";
import { escapeHtml } from "../../common/mailer/email-shell";
import { renderNotificationEmail } from "../../common/mailer/notification.mailer";

/** Sample data for every template — keeps the preview gallery honest. */
const SAMPLES: { [T in NotificationTemplateId]: NotificationTemplateContextMap[T] } = {
  "message.received": {
    senderName: "Nimali Perera",
    preview: "Hi! Are you free on 12 December for a Kandyan poruwa ceremony in Colombo?",
    href: "/pro/messages",
  },
  "inquiry.received": {
    coupleName: "Nimali & Kasun",
    message: "We love your portfolio — could you share your full-day package for 180 guests?",
    preferredDate: "12 Dec 2026",
    packageName: "Signature full day",
  },
  "review.received": {
    authorName: "Tharushi",
    rating: 5,
    excerpt: "They captured every moment of our homecoming. Calm, kind and right on time.",
    vendorSlug: "lotus-photography",
  },
  "listing.approved": { vendorName: "Lotus Photography", vendorSlug: "lotus-photography" },
  "listing.rejected": {
    vendorName: "Lotus Photography",
    note: "Please add at least six portfolio photos and your WhatsApp number.",
  },
  "listing.featured": { vendorName: "Lotus Photography", vendorSlug: "lotus-photography" },
  "rsvp.received": { guestName: "Aunty Malini", status: "CONFIRMED", plusCount: 2 },
  "consultation.booked": {
    name: "Dilini Fernando",
    when: "Sat 29 Nov, 10:30 AM",
    topic: "Beach wedding in Galle for 120 guests",
    consultationId: "demo",
  },
  "consultation.cancelled": { name: "Dilini Fernando", when: "Sat 29 Nov, 10:30 AM", consultationId: "demo" },
  "account.passwordChanged": { signedOut: 2 },
  "account.twoFactorEnabled": {},
  "account.twoFactorDisabled": {},
};

/**
 * Dev-only email gallery (Kloqra dev-email-preview): GET /dev/emails lists every
 * template, /dev/emails/:id renders it. 404 in production.
 */
@ApiExcludeController()
@Controller("dev/emails")
export class DevEmailPreviewController {
  private assertDev() {
    if (process.env.NODE_ENV === "production") throw new NotFoundException();
  }

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  index() {
    this.assertDev();
    const links = NOTIFICATION_TEMPLATE_IDS.map((id) => {
      const subject = buildNotificationTemplate(id, SAMPLES[id] as never).emailSubject;
      return `<li><a href="/dev/emails/${id}">${escapeHtml(id)}</a> — ${escapeHtml(subject)}</li>`;
    }).join("");
    return `<!doctype html><meta charset="utf-8"><title>Email previews</title><body style="font-family:system-ui;padding:32px;line-height:1.8"><h1>Email previews</h1><ul>${links}</ul></body>`;
  }

  @Get(":id")
  @Header("Content-Type", "text/html; charset=utf-8")
  show(@Param("id") id: string) {
    this.assertDev();
    if (!(NOTIFICATION_TEMPLATE_IDS as readonly string[]).includes(id)) throw new NotFoundException();
    const templateId = id as NotificationTemplateId;
    return renderNotificationEmail(buildNotificationTemplate(templateId, SAMPLES[templateId] as never)).html;
  }
}
