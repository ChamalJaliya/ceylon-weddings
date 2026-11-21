import { BRAND_NAME, BRAND_TAGLINE, type NotificationVariant } from "@ceylonweddings/contracts";
import { C, FONT, SERIF, escapeHtml, renderButton, renderEmailDocument } from "./email-shell";

export type BrandedEmailInput = {
  title: string;
  /** Plain-text body; blank lines become paragraphs. */
  body?: string;
  preheader: string;
  ctaHref?: string;
  ctaLabel?: string;
  variant?: NotificationVariant;
  details?: { label: string; value: string }[];
  footer?: string;
  /** Letterhead label (top right). Defaults per variant. */
  label?: string;
  /** Small coloured eyebrow above the title. */
  eyebrow?: string;
};

/** Severity per variant: coloured eyebrow + solid bar under the hero (Kloqra pattern). */
const VARIANT_STYLES: Record<NotificationVariant, { label: string; color: string }> = {
  info: { label: "Update", color: C.goldLight },
  success: { label: "Good news", color: C.success },
  attention: { label: "Action needed", color: C.warning },
  warning: { label: "Important", color: C.danger },
};

function paragraphs(body: string): string {
  return body
    .trim()
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.body};font-family:${FONT};">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function detailsCard(details: { label: string; value: string }[]): string {
  if (!details.length) return "";
  const rows = details
    .map(
      (d, i) => `<tr>
                  <td class="k-dt" width="38%" style="padding:12px 16px;${i ? `border-top:1px solid ${C.border};` : ""}font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};vertical-align:top;">${escapeHtml(d.label)}</td>
                  <td class="k-dd" style="padding:12px 16px;${i ? `border-top:1px solid ${C.border};` : ""}font-size:14px;color:${C.ink};vertical-align:top;">${escapeHtml(d.value)}</td>
                </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="k-dl" style="margin:4px 0 8px;border:1px solid ${C.border};border-radius:14px;background:${C.ivory};border-collapse:separate;">${rows}</table>`;
}

function heroRow(input: BrandedEmailInput): string {
  const style = input.variant ? VARIANT_STYLES[input.variant] : null;
  const color = style?.color ?? C.goldLight;
  return `
          <tr>
            <td class="k-hero k-px" style="background:${C.inkDeep};padding:32px;">
              ${input.eyebrow ? `<p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${color};font-family:${FONT};"><span style="display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:999px;background:${color};vertical-align:1px;"></span>${escapeHtml(input.eyebrow)}</p>` : ""}
              <h1 class="k-h1" style="margin:0;font-size:30px;line-height:1.2;font-weight:500;color:${C.white};font-family:${SERIF};">${escapeHtml(input.title)}</h1>
            </td>
          </tr>
          ${style ? `<tr><td style="height:4px;line-height:4px;font-size:0;background:${color};">&nbsp;</td></tr>` : ""}`;
}

export function renderBrandedEmailHtml(input: BrandedEmailInput): string {
  const cta =
    input.ctaHref && input.ctaLabel
      ? `
          <tr>
            <td align="center" class="k-px" style="padding:24px 32px 8px;">${renderButton(input.ctaHref, input.ctaLabel)}
            </td>
          </tr>`
      : "";
  const sections = `${heroRow(input)}
          <tr>
            <td class="k-px" style="padding:28px 32px 0;">
              ${input.body?.trim() ? paragraphs(input.body) : ""}
              ${detailsCard(input.details ?? [])}
            </td>
          </tr>${cta}
          <tr><td style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>`;

  return renderEmailDocument({
    title: input.title,
    preheader: input.preheader,
    label: input.label ?? (input.variant ? VARIANT_STYLES[input.variant].label : undefined),
    sections,
    footerNote: input.footer?.trim() ? escapeHtml(input.footer.trim()) : undefined,
  });
}

export function renderBrandedEmailText(input: BrandedEmailInput): string {
  const lines = [input.title];
  if (input.body?.trim()) lines.push("", input.body.trim());
  if (input.details?.length) lines.push("", ...input.details.map((d) => `${d.label}: ${d.value}`));
  if (input.ctaHref && input.ctaLabel) lines.push("", `${input.ctaLabel}: ${input.ctaHref}`);
  if (input.footer) lines.push("", input.footer);
  lines.push("", `— ${BRAND_NAME} · ${BRAND_TAGLINE}`);
  return lines.join("\n");
}

export function renderBrandedEmail(input: BrandedEmailInput): { html: string; text: string } {
  return { html: renderBrandedEmailHtml(input), text: renderBrandedEmailText(input) };
}
