import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AuditService } from './audit.service';

/**
 * Domain event → AuditLog köprüsü.
 * Orphan emit’leri bilinçli olarak audit’e bağlar (Faz 1).
 * Payload tipleri structural — core → modules import yok.
 * Not: welcome / partner-approved e-posta emit tarafında kalır; burada tekrar gönderilmez.
 */
@Injectable()
export class DomainAuditListener {
  constructor(private readonly auditService: AuditService) {}

  @OnEvent('user.registered', { async: true })
  async onUserRegistered(event: {
    userId: string;
    email: string;
    role: string;
  }): Promise<void> {
    await this.auditService.record({
      actorType: 'USER',
      actorId: event.userId,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: event.userId,
      meta: { email: event.email, role: event.role },
    });
  }

  @OnEvent('partner.registered', { async: true })
  async onPartnerRegistered(event: {
    agencyId: string;
    userId: string;
    contactEmail: string;
  }): Promise<void> {
    await this.auditService.record({
      actorType: 'AGENCY_STAFF',
      actorId: event.userId,
      action: 'AGENCY_REGISTERED',
      entityType: 'Agency',
      entityId: event.agencyId,
      meta: { contactEmail: event.contactEmail },
    });
  }

  @OnEvent('partner.verified', { async: true })
  async onPartnerVerified(): Promise<void> {
    // AGENCY_VERIFIED / AGENCY_UNSUSPENDED audit AdminService üzerinden actorId ile yazılır.
  }

  // booking.created → bilinçli no-op (audit emit tarafında; çift kayıt yok)

  @OnEvent('tour.created', { async: true })
  async onTourCreated(event: {
    tourId: string;
    agencyId: string;
  }): Promise<void> {
    await this.auditService.record({
      actorType: 'AGENCY',
      actorId: event.agencyId,
      action: 'TOUR_CREATED',
      entityType: 'Tour',
      entityId: event.tourId,
      meta: { agencyId: event.agencyId },
    });
  }
}
