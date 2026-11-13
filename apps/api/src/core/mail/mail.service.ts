import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import {
  escapeHtml,
  otpCodeBlock,
  primaryButton,
  renderMailLayout,
} from './mail-layout';

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
};

const LOGO_CID = 'turta-logo';
const DEFAULT_BRAND_URL = 'https://turladur-zjyf.vercel.app';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly webBaseUrl: string;
  private readonly logoPath: string | null;
  private readonly logoDataUri: string | null;
  private readonly resendApiKey: string;
  private readonly smtpUser: string;
  private readonly smtpPass: string;
  private readonly useAuthenticatedSmtp: boolean;

  constructor(private readonly config: ConfigService) {
    this.resendApiKey = config.get<string>('RESEND_API_KEY', '').trim();
    this.smtpUser = config.get<string>('SMTP_USER', '').trim();
    // Google App Passwords are often copied with spaces — strip them
    this.smtpPass = config
      .get<string>('SMTP_PASS', '')
      .trim()
      .replace(/\s+/g, '');
    this.useAuthenticatedSmtp = Boolean(this.smtpUser && this.smtpPass);

    this.from = this.resolveFromAddress(config.get<string>('MAIL_FROM'));

    // Email CTA / logo links — not local CORS FRONTEND_URL list
    this.webBaseUrl = (
      config.get<string>('EMAIL_BRAND_URL') ??
      config.get<string>('PUBLIC_WEB_URL') ??
      DEFAULT_BRAND_URL
    )
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    const candidates = [
      join(
        __dirname,
        '..',
        '..',
        '..',
        'assets',
        'email',
        'wordmark-on-light.png',
      ),
      join(process.cwd(), 'assets', 'email', 'wordmark-on-light.png'),
      join(process.cwd(), 'apps/api/assets/email/wordmark-on-light.png'),
    ];
    this.logoPath = candidates.find((p) => existsSync(p)) ?? null;
    this.logoDataUri = this.logoPath
      ? `data:image/png;base64,${readFileSync(this.logoPath).toString('base64')}`
      : null;

    if (this.useAuthenticatedSmtp) {
      const isGmail = /gmail\.com$/i.test(this.smtpUser);
      // Ignore leftover Mailhog SMTP_PORT=1025 when using real Gmail auth
      const rawPort = config.get<string>('SMTP_PORT', '');
      const port = Number(
        isGmail && (!rawPort || rawPort === '1025')
          ? '587'
          : rawPort || (isGmail ? '587' : '1025'),
      );
      const secure =
        config.get<string>('SMTP_SECURE', port === 465 ? 'true' : 'false') ===
        'true';
      this.transporter = nodemailer.createTransport({
        host: isGmail
          ? 'smtp.gmail.com'
          : config.get<string>('SMTP_HOST', 'localhost'),
        port,
        secure,
        requireTLS: !secure && port === 587,
        // Soft-launch: never hang OTP behind frontend 12s timeout
        connectionTimeout: 8_000,
        greetingTimeout: 8_000,
        socketTimeout: 12_000,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });
      this.logger.log(
        this.resendApiKey
          ? `Mail provider: Resend (from=${this.from}); SMTP leftover ignored`
          : `Mail provider: SMTP auth (${this.smtpUser}) host=${isGmail ? 'smtp.gmail.com' : config.get('SMTP_HOST')} port=${port} secure=${secure}`,
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host: config.get<string>('SMTP_HOST', 'localhost'),
        port: Number(config.get<string>('SMTP_PORT', '1025')),
        secure: false,
        connectionTimeout: 3_000,
        greetingTimeout: 3_000,
        socketTimeout: 5_000,
      });
      if (this.resendApiKey) {
        this.logger.log(`Mail provider: Resend (from=${this.from})`);
      } else {
        this.logger.log('Mail provider: SMTP/Mailhog (local)');
      }
    }
  }

  /** True when mail leaves the machine (Resend or authenticated SMTP). */
  get usesRealInbox(): boolean {
    return Boolean(this.resendApiKey) || this.useAuthenticatedSmtp;
  }

  async send(payload: MailPayload): Promise<void> {
    if (this.resendApiKey) {
      await this.sendViaResend(payload);
      return;
    }
    await this.sendViaSmtp(payload);
  }

  private resolveFromAddress(rawFrom: string | undefined): string {
    const configured = (rawFrom ?? '').trim().replace(/^["']|["']$/g, '');
    if (this.resendApiKey) {
      if (configured && /@turta\.xyz\b/i.test(configured)) {
        return configured;
      }
      return 'turta <noreply@turta.xyz>';
    }
    if (configured) return configured;
    if (this.smtpUser) return `turta <${this.smtpUser}>`;
    return 'turta <noreply@turta.xyz>';
  }

  private async sendViaSmtp(payload: MailPayload): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: this.logoPath
        ? [
            {
              filename: 'turta-logo.png',
              path: this.logoPath,
              cid: LOGO_CID,
              contentDisposition: 'inline' as const,
            },
          ]
        : undefined,
    });

    this.logger.log(
      `Email sent (SMTP) to ${payload.to} from=${this.from} (id=${info.messageId})`,
    );
  }

  private async sendViaResend(payload: MailPayload): Promise<void> {
    const logoReplacement =
      this.logoDataUri ?? `${this.webBaseUrl}/brand/wordmark-on-light.png`;
    const html = payload.html.replace(`cid:${LOGO_CID}`, logoReplacement);

    this.logger.log(`Resend → to=${payload.to} from=${this.from}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'turta-api/1.0',
        },
        body: JSON.stringify({
          from: this.from,
          to: [payload.to],
          subject: payload.subject,
          html,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Resend network error: ${message}`);
      throw new Error(`Resend network error: ${message}`);
    }
    clearTimeout(timer);

    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      this.logger.error(
        `Resend failed: ${response.status} ${JSON.stringify(body)}`,
      );
      const detail =
        body.message || body.name || `Resend HTTP ${response.status}`;
      if (
        /only send|not verified|domain/i.test(detail) ||
        response.status === 403
      ) {
        throw new Error(
          'only send testing emails to your own email address / domain not verified',
        );
      }
      throw new Error(detail);
    }

    this.logger.log(`Email sent (Resend) to ${payload.to} (id=${body.id})`);
  }

  async sendTemplate(
    to: string,
    template: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const { subject, html } = this.renderTemplate(template, data);
    await this.send({ to, subject, html });
  }

  private logoSrc(): string {
    if (this.logoPath) return `cid:${LOGO_CID}`;
    return `${this.webBaseUrl}/brand/wordmark-on-light.png`;
  }

  private layout(title: string, preheader: string, bodyHtml: string): string {
    return renderMailLayout({
      title,
      preheader,
      bodyHtml,
      webBaseUrl: this.webBaseUrl,
      logoSrc: this.logoSrc(),
    });
  }

  private renderTemplate(
    template: string,
    data: Record<string, unknown>,
  ): { subject: string; html: string } {
    switch (template) {
      case 'welcome': {
        const name = escapeHtml(String(data.name ?? ''));
        return {
          subject: 'turta’a hoş geldiniz',
          html: this.layout(
            'Hesabınız hazır',
            'turta hesabınız oluşturuldu. Keşfetmeye başlayın.',
            `<p style="margin:0 0 12px;">Merhaba ${name},</p>
             <p style="margin:0 0 12px;color:#404040;">Hesabınız başarıyla oluşturuldu. Turları ve deneyimleri keşfetmeye başlayabilirsiniz.</p>
             ${primaryButton(`${this.webBaseUrl}/tours`, 'Turlara göz at')}`,
          ),
        };
      }
      case 'booking-confirmed': {
        const tourName = escapeHtml(String(data.tourName ?? ''));
        const bookingId = escapeHtml(String(data.bookingId ?? ''));
        const guestName = escapeHtml(String(data.guestName ?? 'Misafir'));
        const partnerName = escapeHtml(String(data.partnerName ?? 'Partner'));
        const tourDateLabel = escapeHtml(String(data.tourDateLabel ?? '—'));
        const totalAmountLabel = escapeHtml(
          String(data.totalAmountLabel ?? ''),
        );
        const voucherHtml = String(data.voucherHtml ?? '');
        const bookingsUrl = `${this.webBaseUrl}/bookings`;
        return {
          subject: `Rezervasyonunuz Onaylandı - ${String(data.tourName ?? 'Tur')} - ${String(data.bookingId ?? '')}`,
          html: this.layout(
            'Rezervasyonunuz onaylandı',
            `Rezervasyon kodunuz: ${bookingId}`,
            `<p style="margin:0 0 12px;">Sayın <strong>${guestName}</strong>,</p>
             <p style="margin:0 0 12px;color:#404040;line-height:1.55;">
               <strong>${partnerName}</strong> tarafından düzenlenen
               <strong>${tourName}</strong> turu için
               <strong>${tourDateLabel}</strong> tarihli rezervasyonunuz başarıyla alınmıştır.
               Tahsil edilen toplam tutar: <strong>${totalAmountLabel}</strong>.
               Detaylı voucher belgeniz aşağıdadır. İyi yolculuklar dileriz.
             </p>
             <p style="margin:0 0 16px;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:#0a0a0a;">
               Kod: ${bookingId}
             </p>
             ${primaryButton(bookingsUrl, 'Rezervasyonlarım')}
             ${
               voucherHtml
                 ? `<div style="margin-top:24px;border-top:1px solid #e5e5e5;padding-top:16px;">
                      <p style="margin:0 0 12px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">Voucher</p>
                      ${voucherHtml}
                    </div>`
                 : ''
             }`,
          ),
        };
      }
      case 'password-reset': {
        const resetUrl = String(data.resetUrl ?? '#');
        return {
          subject: 'Şifre sıfırlama — turta',
          html: this.layout(
            'Şifrenizi sıfırlayın',
            'Şifre sıfırlama talebiniz alındı.',
            `<p style="margin:0 0 12px;color:#404040;">Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak devam edin.</p>
             ${primaryButton(resetUrl, 'Şifreyi sıfırla')}`,
          ),
        };
      }
      case 'otp': {
        const code = String(data.code ?? '');
        const name = escapeHtml(String(data.name ?? ''));
        const title = String(data.title ?? 'E-posta doğrulama');
        const actionLine = escapeHtml(
          String(
            data.actionLine ??
              'Doğrulama kodunu girerek işleme devam edebilirsiniz.',
          ),
        );
        const minutes = String(data.expiresMinutes ?? 2);
        const subject = String(data.subject ?? `turta doğrulama kodu`);
        return {
          subject,
          html: this.layout(
            title,
            `Merhaba ${name}, doğrulama kodunuz: ${code}`,
            `<p style="margin:0 0 4px;">Merhaba <strong>${name}</strong>,</p>
             <p style="margin:0 0 4px;color:#404040;">${actionLine}</p>
             ${otpCodeBlock(code)}
             <p style="margin:0;color:#737373;font-size:13px;">
               Bu kod <strong>${escapeHtml(minutes)} dakika</strong> geçerlidir. Kimseyle paylaşmayın.
             </p>`,
          ),
        };
      }
      case 'partner-verify': {
        const company = escapeHtml(String(data.companyName ?? ''));
        const verifyUrl = String(data.verifyUrl ?? '#');
        return {
          subject: 'Partner hesabınızı doğrulayın — turta',
          html: this.layout(
            'Partner hesabını doğrula',
            `${company} partner kaydınızı doğrulayın.`,
            `<p style="margin:0 0 12px;color:#404040;">
               <strong>${company}</strong> partner kaydınız oluşturuldu. Devam etmek için e-posta adresinizi doğrulayın.
               Ardından editör onayından sonra paneline giriş yapabileceksiniz.
             </p>
             ${primaryButton(verifyUrl, 'E-postayı doğrula')}`,
          ),
        };
      }
      case 'partner-approved': {
        const company = escapeHtml(String(data.companyName ?? ''));
        const loginUrl = String(data.loginUrl ?? '#');
        return {
          subject: 'Hesabınız onaylanmıştır — turta',
          html: this.layout(
            'Hesabınız onaylanmıştır',
            `${company} partner hesabınız onaylanmıştır. Giriş yapabilirsiniz.`,
            `<p style="margin:0 0 12px;color:#404040;">
               Merhaba, <strong>${company}</strong> başvurunuz
               <strong>onaylanmıştır</strong>. Acente paneline giriş yapabilirsiniz.
             </p>
             ${primaryButton(loginUrl, 'Giriş yap')}`,
          ),
        };
      }
      case 'new-review': {
        const company = escapeHtml(String(data.companyName ?? ''));
        const tourName = escapeHtml(String(data.tourName ?? 'Tur'));
        const rating = escapeHtml(String(data.rating ?? ''));
        return {
          subject: `Yeni yorum — ${tourName}`,
          html: this.layout(
            'Yeni değerlendirme',
            `${tourName} için yeni bir yorum aldınız.`,
            `<p style="margin:0;color:#404040;">Merhaba ${company},</p>
             <p style="margin:12px 0 0;color:#404040;">
               <strong>${tourName}</strong> için <strong>${rating}/5</strong> puanlı yeni bir yorum aldınız.
             </p>`,
          ),
        };
      }
      case 'review-request': {
        const reviewUrl = String(data.reviewUrl ?? '#');
        return {
          subject: 'Turunuzu değerlendirin — turta',
          html: this.layout(
            'Deneyiminizi paylaşın',
            'Tamamlanan turunuz için yorum bırakın.',
            `<p style="margin:0 0 12px;color:#404040;">Tamamlanan turunuz için deneyiminizi paylaşır mısınız?</p>
             ${primaryButton(reviewUrl, 'Yorum yaz')}`,
          ),
        };
      }
      case 'contact-inquiry': {
        const name = escapeHtml(String(data.name ?? ''));
        const email = escapeHtml(String(data.email ?? ''));
        const phone = data.phone ? escapeHtml(String(data.phone)) : null;
        const subjectLabel = escapeHtml(String(data.subjectLabel ?? 'Diğer'));
        const message = escapeHtml(String(data.message ?? '')).replace(
          /\n/g,
          '<br/>',
        );
        return {
          subject: `[İletişim] ${String(data.subjectLabel ?? 'Mesaj')} — ${String(data.name ?? '')}`,
          html: this.layout(
            'Yeni iletişim formu mesajı',
            `${String(data.name ?? '')} iletişim formundan yazdı.`,
            `<p style="margin:0 0 12px;color:#404040;">
               <strong>${name}</strong> iletişim formundan yeni bir mesaj gönderdi.
             </p>
             <table style="width:100%;border-collapse:collapse;font-size:14px;color:#404040;">
               <tr><td style="padding:6px 0;width:110px;color:#737373;">Konu</td><td style="padding:6px 0;"><strong>${subjectLabel}</strong></td></tr>
               <tr><td style="padding:6px 0;color:#737373;">E-posta</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#0284c7;text-decoration:none;">${email}</a></td></tr>
               ${
                 phone
                   ? `<tr><td style="padding:6px 0;color:#737373;">Telefon</td><td style="padding:6px 0;">${phone}</td></tr>`
                   : ''
               }
             </table>
             <div style="margin-top:16px;padding:14px 16px;border-radius:8px;background:#f5f5f5;color:#0a0a0a;line-height:1.55;white-space:normal;">
               ${message}
             </div>`,
          ),
        };
      }
      case 'booking-cancelled': {
        const bookingId = escapeHtml(String(data.bookingId ?? ''));
        const guestName = escapeHtml(String(data.guestName ?? 'Misafir'));
        const tourName = escapeHtml(String(data.tourName ?? 'Turunuz'));
        const reasonLabel = escapeHtml(
          String(data.reasonLabel ?? 'Rezervasyon iptali'),
        );
        const cancelledDateLabel = data.cancelledDateLabel
          ? escapeHtml(String(data.cancelledDateLabel))
          : '';
        const scope = String(data.scope ?? 'RESERVATION');
        const isTourCancel = scope === 'TOUR' || scope === 'TOUR_DATE';
        const apology = isTourCancel
          ? `<p style="margin:0 0 12px;color:#404040;line-height:1.55;">
                 Yaşanan bu durum için içtenlikle özür dileriz. Planlarınızı olumsuz
                 etkilemiş olabileceğimizin farkındayız; mümkün olan en kısa sürede
                 alternatif seçenekler için sizinle iletişime geçebiliriz.
               </p>`
          : `<p style="margin:0 0 12px;color:#404040;line-height:1.55;">
                 Rezervasyonunuz iptal edilmiştir. Sorularınız için destek ekibimize
                 yazabilirsiniz.
               </p>`;
        const dateBlock = cancelledDateLabel
          ? `<p style="margin:0 0 12px;color:#404040;">
               İptal edilen tarih: <strong>${cancelledDateLabel}</strong>
             </p>`
          : '';
        return {
          subject: isTourCancel
            ? `Tur iptali${cancelledDateLabel ? ` (${String(data.cancelledDateLabel)})` : ''} — ${String(data.tourName ?? 'Tur')} — ${String(data.bookingId ?? '')}`
            : `Rezervasyon iptal edildi — ${String(data.bookingId ?? '')}`,
          html: this.layout(
            isTourCancel ? 'Tur iptal bildirimi' : 'Rezervasyon iptal edildi',
            `Rezervasyon ${bookingId} iptal edildi.`,
            `<p style="margin:0 0 12px;">Sayın <strong>${guestName}</strong>,</p>
             <p style="margin:0 0 12px;color:#404040;line-height:1.55;">
               <strong>${tourName}</strong> için
               <strong>${bookingId}</strong> numaralı rezervasyonunuz iptal edilmiştir.
             </p>
             ${dateBlock}
             <p style="margin:0 0 12px;color:#404040;">
               İptal nedeni: <strong>${reasonLabel}</strong>
             </p>
             ${apology}
             <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:#0a0a0a;">
               Kod: ${bookingId}
             </p>`,
          ),
        };
      }
      case 'payment-refunded': {
        const bookingId = escapeHtml(String(data.bookingId ?? ''));
        const amountLabel = escapeHtml(String(data.amountLabel ?? ''));
        return {
          subject: `Ödeme iadesi — ${String(data.bookingId ?? '')}`,
          html: this.layout(
            'Ödeme iadesi',
            `Ödemeniz iade edildi. Rezervasyon: ${bookingId}`,
            `<p style="margin:0 0 12px;color:#404040;line-height:1.55;">
               <strong>${bookingId}</strong> numaralı rezervasyonunuz için
               ${amountLabel ? `<strong>${amountLabel}</strong> tutarında ` : ''}
               ödeme iadesi başlatıldı / tamamlandı.
             </p>
             <p style="margin:0;color:#737373;font-size:13px;">
               İadenin hesabınıza yansıması bankanıza göre birkaç iş günü sürebilir.
             </p>`,
          ),
        };
      }
      default:
        return {
          subject: String(data.subject ?? 'turta Bildirim'),
          html: this.layout(
            'Bildirim',
            'turta bildirimi',
            `<pre style="margin:0;white-space:pre-wrap;font-size:12px;color:#404040;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`,
          ),
        };
    }
  }
}
