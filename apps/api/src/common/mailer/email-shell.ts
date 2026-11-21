import { BRAND_COLORS, BRAND_NAME, BRAND_TAGLINE } from "@ceylonweddings/contracts";
import { appOrigin } from "./app-origin.util";

/**
 * Shared Ceylon Weddings letterhead for every transactional email (ported from
 * Kloqra's email-shell): gold stripe, serif wordmark, white card, branded footer.
 * Table-based, inline-styled, responsive (<600px) and Outlook-safe.
 */
export const C = BRAND_COLORS;
export const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Wordmark built from text so it renders when images are blocked. */
function wordmark(size: number): string {
  return `<span style="font-family:${SERIF};font-size:${size}px;letter-spacing:0.18em;text-transform:uppercase;color:${C.ink};">Ceylon <span style="color:${C.gold};">Weddings</span></span>`;
}

/** Bulletproof CTA button (VML for Outlook, full-width on mobile). */
export function renderButton(href: string, label: string, color: string = C.gold): string {
  const h = escapeHtml(href);
  const l = escapeHtml(label);
  return `
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${h}" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="${color}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${l}</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" cellspacing="0" cellpadding="0" class="k-btn"><tr>
                <td align="center" style="border-radius:999px;background:${color};">
                  <a href="${h}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:500;color:${C.white};text-decoration:none;border-radius:999px;font-family:${FONT};">${l} &rarr;</a>
                </td>
              </tr></table>
              <!--<![endif]-->
              <p style="margin:12px 0 0;font-size:12px;color:${C.muted};">Button not working? <a href="${h}" style="color:${C.gold};">Open this link</a></p>`;
}

export type EmailDocumentInput = {
  title: string;
  preheader: string;
  /** Small uppercase label on the right of the letterhead, e.g. "Notification", "Security". */
  label?: string;
  /** Rows (<tr>…</tr>) placed between the letterhead and the footer. */
  sections: string;
  footerNote?: string;
};

export function renderEmailDocument(input: EmailDocumentInput): string {
  const origin = escapeHtml(appOrigin());
  const link = (href: string, text: string) =>
    `<a href="${href}" style="color:${C.body};text-decoration:none;">${text}</a>`;
  const footerLinks = [
    link(`${origin}/en`, `Open ${BRAND_NAME}`),
    link(`${origin}/en/settings/profile`, "Settings"),
    link(`${origin}/en/privacy`, "Privacy"),
  ].join(" &nbsp;·&nbsp; ");
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(input.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    @media only screen and (max-width:600px) {
      .k-outer { padding:0 !important; }
      .k-card { border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
      .k-px { padding-left:20px !important; padding-right:20px !important; }
      .k-hero { padding:28px 20px 30px !important; }
      .k-h1 { font-size:24px !important; }
      .k-hide-sm { display:none !important; }
      .k-btn, .k-btn a { display:block !important; width:100% !important; box-sizing:border-box; text-align:center !important; }
      .k-dl td { display:block !important; width:auto !important; }
      .k-dl .k-dd { border-top:0 !important; padding-top:2px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.ivory};font-family:${FONT};">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(input.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.ivory};">
    <tr>
      <td align="center" class="k-outer" style="padding:32px 12px;">
        <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="k-card" style="max-width:600px;background:${C.paper};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
          <tr><td style="height:4px;line-height:4px;font-size:0;background:${C.gold};">&nbsp;</td></tr>
          <tr>
            <td class="k-px" style="padding:22px 32px;border-bottom:1px solid ${C.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                <td style="vertical-align:middle;">${wordmark(18)}</td>
                ${input.label ? `<td align="right" class="k-hide-sm" style="vertical-align:middle;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};">${escapeHtml(input.label)}</td>` : ""}
              </tr></table>
            </td>
          </tr>
${input.sections}
          <tr>
            <td class="k-px" style="padding:24px 32px 28px;background:${C.ivory};border-top:1px solid ${C.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                <td style="vertical-align:middle;">${wordmark(13)}</td>
                <td align="right" class="k-hide-sm" style="vertical-align:middle;font-size:12px;color:${C.muted};font-family:${SERIF};font-style:italic;">${BRAND_TAGLINE}</td>
              </tr></table>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.6;">${footerLinks}</p>
              ${input.footerNote ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${C.muted};">${input.footerNote}</p>` : ""}
              <p style="margin:8px 0 0;font-size:11px;color:${C.muted};">&copy; ${year} ${BRAND_NAME}. Made in Sri Lanka.</p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
