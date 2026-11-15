/**
 * Shared HTML email shell — turta brand (ink / paper monochrome).
 * Table layout for Outlook/Gmail; logo via CID `turta-logo`.
 */

const INK = '#0a0a0a';
const PAPER = '#ffffff';
const SURFACE = '#f5f5f5';
const MUTED = '#737373';
const BORDER = '#e5e5e5';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type MailLayoutInput = {
  /** Short preview text in inbox list */
  preheader: string;
  /** Main headline inside the card */
  title: string;
  /** Inner HTML (already escaped where needed) */
  bodyHtml: string;
  webBaseUrl: string;
  /** Absolute or cid: URL for wordmark */
  logoSrc: string;
};

export function renderMailLayout(input: MailLayoutInput): string {
  const { preheader, title, bodyHtml, webBaseUrl, logoSrc } = input;
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>${safeTitle}</title>
  <!--[if mso]><style>table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${SURFACE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${SURFACE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${PAPER};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 32px 20px;border-bottom:1px solid ${BORDER};background-color:${PAPER};">
              <a href="${escapeHtml(webBaseUrl)}" style="text-decoration:none;">
                <img src="${escapeHtml(logoSrc)}" width="120" height="36" alt="turta" style="display:block;height:36px;width:auto;max-width:140px;border:0;outline:none;"/>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;font-weight:700;color:${INK};letter-spacing:-0.02em;">
                ${safeTitle}
              </h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${INK};">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};">
                Bu e-posta turta hesabınızla ilgili otomatik bir bildirimdir. Siz talep etmediyseniz yok sayabilirsiniz.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:${INK};">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#a3a3a3;text-align:center;">
                © ${year} turta ·
                <a href="${escapeHtml(webBaseUrl)}" style="color:${PAPER};text-decoration:underline;">turta.com.tr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpCodeBlock(code: string): string {
  const safe = escapeHtml(code);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td align="center" style="background-color:${SURFACE};border:1px solid ${BORDER};border-radius:10px;padding:20px 16px;">
          <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">
            Doğrulama kodu
          </p>
          <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;line-height:1.2;font-weight:700;letter-spacing:0.35em;color:${INK};">
            ${safe}
          </p>
        </td>
      </tr>
    </table>`;
}

export function primaryButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
      <tr>
        <td style="background-color:${INK};border-radius:8px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${PAPER};text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}
