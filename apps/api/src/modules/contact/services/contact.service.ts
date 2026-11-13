import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailQueueService } from '../../../core/queue/email-queue.service';
import {
  CONTACT_SUBJECTS,
  type CreateContactMessageDto,
} from '../dto/contact.dto';

const SUBJECT_LABELS: Record<(typeof CONTACT_SUBJECTS)[number], string> = {
  reservation: 'Rezervasyon',
  cancellation: 'İptal & İade',
  support: 'Teknik Destek',
  partnership: 'İş Ortaklığı',
  other: 'Diğer',
};

/** Strip tags / control chars before the payload ever reaches the mail queue. */
function toPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly inbox: string;

  constructor(
    private readonly emailQueue: EmailQueueService,
    config: ConfigService,
  ) {
    this.inbox = (
      config.get<string>('CONTACT_INBOX') ||
      config.get<string>('MAIL_FROM') ||
      'info@turta.com.tr'
    )
      .trim()
      .toLowerCase();
  }

  async submit(dto: CreateContactMessageDto) {
    // Silent success for honeypot fills — do not tip bots off.
    if (dto.website && dto.website.trim().length > 0) {
      this.logger.warn('Contact honeypot triggered; dropping message');
      return { success: true, data: { ok: true }, error: null };
    }

    const name = toPlainText(dto.name);
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone ? toPlainText(dto.phone) : '';
    const message = toPlainText(dto.message);
    const subjectLabel = SUBJECT_LABELS[dto.subject] ?? 'Diğer';

    if (name.length < 2 || message.length < 10) {
      return {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz form verisi',
        },
      };
    }

    await this.emailQueue.enqueue({
      to: this.inbox,
      template: 'contact-inquiry',
      data: {
        name,
        email,
        phone: phone || null,
        subjectLabel,
        subjectKey: dto.subject,
        message,
        replyTo: email,
      },
    });

    return { success: true, data: { ok: true }, error: null };
  }
}
