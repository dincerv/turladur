import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../../generated/prisma';

import { AuditService } from '../../../core/audit/audit.service';
import { CacheService } from '../../../core/cache/cache.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { PartnerVerifiedEvent } from '../../identity/events/partner-verified.event';

type AdminActor = {
  userId: string;
  email?: string | null;
  name?: string | null;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly audit: AuditService,
  ) {}

  private async resolveActorLabel(actor: AdminActor): Promise<{
    actorId: string;
    actorEmail: string | null;
    actorName: string | null;
  }> {
    if (actor.email || actor.name) {
      return {
        actorId: actor.userId,
        actorEmail: actor.email ?? null,
        actorName: actor.name ?? null,
      };
    }
    const user = await this.prisma.user.findFirst({
      where: { id: actor.userId, deletedAt: null },
      select: { email: true, firstName: true, lastName: true },
    });
    const name = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      actorId: actor.userId,
      actorEmail: user?.email ?? null,
      actorName: name || null,
    };
  }

  private async recordAdminAction(input: {
    actor: AdminActor;
    action: string;
    actionLabel: string;
    entityType: string;
    entityId: string;
    entityLabel?: string | null;
    note?: string | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const actor = await this.resolveActorLabel(input.actor);
    await this.audit.record({
      actorType: 'PLATFORM_ADMIN',
      actorId: actor.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      meta: {
        actionLabel: input.actionLabel,
        entityLabel: input.entityLabel ?? null,
        note: input.note ?? null,
        actorEmail: actor.actorEmail,
        actorName: actor.actorName,
        ...(input.meta ?? {}),
      },
    });
  }

  async getDashboardStats() {
    const [
      users,
      partners,
      partnersPending,
      tours,
      toursPending,
      experiences,
      experiencesPending,
      reservations,
      paymentsSuccess,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.agency.count({ where: { deletedAt: null } }),
      this.prisma.agency.count({
        where: { deletedAt: null, status: 'PENDING' },
      }),
      this.prisma.tour.count({ where: { deletedAt: null } }),
      this.prisma.tour.count({
        where: { deletedAt: null, status: 'PENDING_REVIEW' },
      }),
      this.prisma.experience.count({ where: { deletedAt: null } }),
      this.prisma.experience.count({
        where: { deletedAt: null, status: 'PENDING_REVIEW' },
      }),
      this.prisma.reservation.count({ where: { deletedAt: null } }),
      this.prisma.paymentTransaction.count({ where: { status: 'SUCCESS' } }),
    ]);

    return {
      success: true,
      data: {
        users,
        partners: { total: partners, pending: partnersPending },
        tours: { total: tours, pendingReview: toursPending },
        experiences: { total: experiences, pendingReview: experiencesPending },
        reservations,
        paymentsSuccess,
      },
      error: null,
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  async updateUser(
    userId: string,
    input: { isActive?: boolean; role?: string },
    actor?: AdminActor,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    const allowedUserRoles = new Set([
      'CUSTOMER',
      'PARTNER',
      'PARTNER_STAFF',
      'ADMIN',
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'PLATFORM_SUPER_ADMIN',
    ]);
    if (input.role && !allowedUserRoles.has(input.role)) {
      throw new BusinessException(
        'INVALID_USER_ROLE',
        'Bu rol kullanıcı kaydına atanamaz',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.role
          ? {
              role: input.role as
                | 'CUSTOMER'
                | 'PARTNER'
                | 'PARTNER_STAFF'
                | 'ADMIN'
                | 'SUPER_ADMIN'
                | 'PLATFORM_ADMIN'
                | 'PLATFORM_SUPER_ADMIN',
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (actor) {
      await this.recordAdminAction({
        actor,
        action: 'USER_UPDATED',
        actionLabel: 'Kullanıcı Güncellendi',
        entityType: 'User',
        entityId: updated.id,
        entityLabel: updated.email,
        meta: {
          isActive: updated.isActive,
          role: updated.role,
        },
      });
    }

    return { success: true, data: updated, error: null };
  }

  async listPartners(status?: string) {
    const partners = await this.prisma.agency.findMany({
      where: {
        deletedAt: null,
        ...(status
          ? {
              status: status as
                'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: partners.map((p) => ({
        id: p.id,
        companyName: p.companyName,
        contactEmail: p.contactEmail,
        contactPhone: p.contactPhone,
        status: p.status,
        moderationNote: p.moderationNote,
        verifiedAt: p.verifiedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  async setPartnerStatus(
    agencyId: string,
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    note?: string,
    actor?: AdminActor,
  ) {
    const partner = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });
    if (!partner) {
      throw new NotFoundException({
        code: 'PARTNER_NOT_FOUND',
        message: 'Partner bulunamadı',
      });
    }

    this.assertModerationNote(status, note);

    const wasVerified = partner.status === 'VERIFIED';
    const prevStatus = partner.status;
    const trimmed = note?.trim().slice(0, 500) || null;
    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : partner.verifiedAt,
        moderationNote:
          status === 'VERIFIED' ? null : (trimmed ?? partner.moderationNote),
        moderatedAt:
          status === 'VERIFIED'
            ? null
            : trimmed
              ? new Date()
              : partner.moderatedAt,
      },
    });

    if (status === 'VERIFIED' && !wasVerified) {
      this.emitPartnerVerified(updated);
    }

    if (actor) {
      const action =
        status === 'REJECTED'
          ? 'AGENCY_REJECTED'
          : status === 'SUSPENDED'
            ? 'AGENCY_SUSPENDED'
            : prevStatus === 'SUSPENDED'
              ? 'AGENCY_UNSUSPENDED'
              : 'AGENCY_VERIFIED';
      const actionLabel =
        status === 'REJECTED'
          ? 'Acente Reddedildi'
          : status === 'SUSPENDED'
            ? 'Acente Askıya Alındı'
            : prevStatus === 'SUSPENDED'
              ? 'Acente Askısı Kaldırıldı'
              : 'Acente Onaylandı';
      await this.recordAdminAction({
        actor,
        action,
        actionLabel,
        entityType: 'Agency',
        entityId: updated.id,
        entityLabel: updated.companyName,
        note: trimmed,
        meta: { fromStatus: prevStatus, toStatus: status },
      });
    }

    return {
      success: true,
      data: {
        id: updated.id,
        companyName: updated.companyName,
        status: updated.status,
        moderationNote: updated.moderationNote,
        verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      },
      error: null,
    };
  }

  async listGuides(status?: string) {
    const guides = await this.prisma.guide.findMany({
      where: {
        deletedAt: null,
        ...(status
          ? {
              status: status as
                'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: guides.map((guide) => ({
        id: guide.id,
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        identityNumber: guide.identityNumber,
        phone: guide.phone,
        city: guide.city,
        languages: guide.languages,
        oda: guide.oda,
        sicilNo: guide.sicilNo,
        ruhsatNo: guide.ruhsatNo,
        ruhsatExpiresAt:
          guide.ruhsatExpiresAt?.toISOString().slice(0, 10) ?? null,
        birthDate: guide.birthDate?.toISOString().slice(0, 10) ?? null,
        status: guide.status,
        moderationNote: guide.moderationNote,
        verifiedAt: guide.verifiedAt?.toISOString() ?? null,
        createdAt: guide.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  async setGuideStatus(
    guideId: string,
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    note?: string,
    actor?: AdminActor,
  ) {
    const guide = await this.prisma.guide.findFirst({
      where: { id: guideId, deletedAt: null },
    });
    if (!guide) {
      throw new NotFoundException({
        code: 'GUIDE_NOT_FOUND',
        message: 'Rehber bulunamadı',
      });
    }

    this.assertModerationNote(status, note);

    const prevStatus = guide.status;
    const trimmed = note?.trim().slice(0, 500) || null;
    const updated = await this.prisma.guide.update({
      where: { id: guideId },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : guide.verifiedAt,
        moderationNote:
          status === 'VERIFIED' ? null : (trimmed ?? guide.moderationNote),
        moderatedAt:
          status === 'VERIFIED'
            ? null
            : trimmed
              ? new Date()
              : guide.moderatedAt,
      },
    });

    if (actor) {
      const action =
        status === 'REJECTED'
          ? 'GUIDE_REJECTED'
          : status === 'SUSPENDED'
            ? 'GUIDE_SUSPENDED'
            : prevStatus === 'SUSPENDED'
              ? 'GUIDE_UNSUSPENDED'
              : 'GUIDE_VERIFIED';
      const actionLabel =
        status === 'REJECTED'
          ? 'Rehber Reddedildi'
          : status === 'SUSPENDED'
            ? 'Rehber Askıya Alındı'
            : prevStatus === 'SUSPENDED'
              ? 'Rehber Askısı Kaldırıldı'
              : 'Rehber Onaylandı';
      await this.recordAdminAction({
        actor,
        action,
        actionLabel,
        entityType: 'Guide',
        entityId: updated.id,
        entityLabel: `${updated.firstName} ${updated.lastName}`.trim(),
        note: trimmed,
        meta: { fromStatus: prevStatus, toStatus: status },
      });
    }

    return {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        moderationNote: updated.moderationNote,
        verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      },
      error: null,
    };
  }

  async listPendingTours() {
    const tours = await this.prisma.tour.findMany({
      where: { deletedAt: null, status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: tours.map((t) => {
        const extras =
          t.extras && typeof t.extras === 'object' && !Array.isArray(t.extras)
            ? (t.extras as Record<string, unknown>)
            : {};
        return {
          id: t.id,
          title: t.title,
          agencyId: t.agencyId,
          partnerId: t.agencyId,
          price: t.price.toString(),
          currency: t.currency,
          category: t.category,
          status: t.status,
          coverUrl: t.coverUrl,
          moderationNote:
            typeof extras.moderationNote === 'string'
              ? extras.moderationNote
              : null,
          createdAt: t.createdAt.toISOString(),
        };
      }),
      error: null,
    };
  }

  /** Moderation preview — any non-deleted status (public catalog is PUBLISHED-only). */
  async getTourPreview(tourId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      include: {
        agency: {
          select: { id: true, companyName: true, logo: true },
        },
      },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    const extras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? (tour.extras as Record<string, unknown>)
        : {};

    return {
      success: true,
      data: {
        id: tour.id,
        slug: tour.slug,
        title: tour.title,
        description: tour.description,
        status: tour.status,
        category: tour.category,
        price: tour.price.toString(),
        currency: tour.currency,
        durationDays: tour.durationDays,
        coverUrl: tour.coverUrl,
        galleryUrls: tour.galleryUrls ?? [],
        departureCities: tour.departureCities ?? [],
        stayKind: tour.stayKind,
        destinationScope: tour.destinationScope,
        moderationNote:
          typeof extras.moderationNote === 'string'
            ? extras.moderationNote
            : null,
        agency: tour.agency
          ? {
              id: tour.agency.id,
              companyName: tour.agency.companyName,
              logo: tour.agency.logo,
            }
          : null,
        createdAt: tour.createdAt.toISOString(),
        updatedAt: tour.updatedAt.toISOString(),
      },
      error: null,
    };
  }

  async listPendingExperiences() {
    const rows = await this.prisma.experience.findMany({
      where: { deletedAt: null, status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: rows.map((e) => ({
        id: e.id,
        title: e.title,
        agencyId: e.agencyId,
        partnerId: e.agencyId,
        price: e.price.toString(),
        currency: e.currency,
        category: e.category,
        location: e.location,
        status: e.status,
        coverUrl: e.imageUrl,
        moderationNote: e.moderationNote,
        createdAt: e.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  async setExperienceStatus(
    experienceId: string,
    status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
    note?: string,
    actor?: AdminActor,
  ) {
    const experience = await this.prisma.experience.findFirst({
      where: { id: experienceId, deletedAt: null },
    });
    if (!experience) {
      throw new NotFoundException({
        code: 'EXPERIENCE_NOT_FOUND',
        message: 'Deneyim bulunamadı',
      });
    }

    if (status === 'DRAFT' && !note?.trim()) {
      throw new BusinessException(
        'MODERATION_NOTE_REQUIRED',
        'Red için gerekçe zorunludur',
      );
    }

    const trimmed = note?.trim().slice(0, 500) || null;
    const updated = await this.prisma.experience.update({
      where: { id: experienceId },
      data: {
        status,
        moderationNote:
          status === 'PUBLISHED'
            ? null
            : status === 'DRAFT' && trimmed
              ? trimmed
              : experience.moderationNote,
        moderatedAt:
          status === 'PUBLISHED'
            ? null
            : status === 'DRAFT' && trimmed
              ? new Date()
              : experience.moderatedAt,
      },
    });

    if (actor) {
      const action =
        status === 'PUBLISHED'
          ? 'EXPERIENCE_PUBLISHED'
          : status === 'DRAFT'
            ? 'EXPERIENCE_REJECTED'
            : 'EXPERIENCE_ARCHIVED';
      const actionLabel =
        status === 'PUBLISHED'
          ? 'Deneyim Onaylandı'
          : status === 'DRAFT'
            ? 'Deneyim Reddedildi'
            : 'Deneyim Arşivlendi';
      await this.recordAdminAction({
        actor,
        action,
        actionLabel,
        entityType: 'Experience',
        entityId: updated.id,
        entityLabel: updated.title,
        note: trimmed,
        meta: { toStatus: status },
      });
    }

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        moderationNote: updated.moderationNote,
      },
      error: null,
    };
  }

  async setTourStatus(
    tourId: string,
    status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT',
    note?: string,
    actor?: AdminActor,
  ) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    if (
      status === 'PUBLISHED' &&
      tour.status !== 'PENDING_REVIEW' &&
      tour.status !== 'DRAFT' &&
      tour.status !== 'ARCHIVED'
    ) {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        'Tur yayına alınamaz',
      );
    }

    if (status === 'PUBLISHED') {
      if (tour.agencyId) {
        const agency = await this.prisma.agency.findFirst({
          where: { id: tour.agencyId, deletedAt: null },
        });
        if (
          !agency?.taxNumber?.trim() ||
          !agency.legalTitle?.trim() ||
          !agency.address?.trim()
        ) {
          throw new BusinessException(
            'AGENCY_INVOICE_FIELDS_REQUIRED',
            'Tur yayınlamak için acente VKN, unvan ve adres zorunludur',
          );
        }
      } else {
        const partner = await this.prisma.agency.findFirst({
          where: { id: tour.agencyId, deletedAt: null },
        });
        if (!partner?.taxNumber?.trim() || !partner.address?.trim()) {
          throw new BusinessException(
            'AGENCY_INVOICE_FIELDS_REQUIRED',
            'Tur yayınlamak için satıcı VKN ve adres zorunludur',
          );
        }
      }
    }

    const prevExtras =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...(tour.extras as Record<string, unknown>) }
        : {};
    const trimmed = note?.trim().slice(0, 500) || null;
    if (status === 'DRAFT') {
      if (!trimmed) {
        throw new BusinessException(
          'MODERATION_NOTE_REQUIRED',
          'Red için gerekçe zorunludur',
        );
      }
      prevExtras.moderationNote = trimmed;
      prevExtras.moderatedAt = new Date().toISOString();
    }
    if (status === 'PUBLISHED') {
      delete prevExtras.moderationNote;
      delete prevExtras.moderatedAt;
    }

    const updated = await this.prisma.tour.update({
      where: { id: tourId },
      data: {
        status,
        extras: prevExtras as Prisma.InputJsonValue,
      },
    });

    await this.cache.invalidatePattern('catalog:tours:search:*');
    await this.cache.del(`catalog:tour:${tourId}`);

    if (actor) {
      const action =
        status === 'PUBLISHED'
          ? 'TOUR_PUBLISHED'
          : status === 'DRAFT'
            ? 'TOUR_REJECTED'
            : 'TOUR_ARCHIVED';
      const actionLabel =
        status === 'PUBLISHED'
          ? 'Tur Onaylandı'
          : status === 'DRAFT'
            ? 'Tur Reddedildi'
            : 'Tur Arşivlendi';
      await this.recordAdminAction({
        actor,
        action,
        actionLabel,
        entityType: 'Tour',
        entityId: updated.id,
        entityLabel: updated.title,
        note: trimmed,
        meta: { toStatus: status, agencyId: updated.agencyId },
      });
    }

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      },
      error: null,
    };
  }

  async listAgencies(status?: string) {
    const agencies = await this.prisma.agency.findMany({
      where: {
        deletedAt: null,
        ...(status
          ? {
              status: status as
                'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: agencies.map((a) => ({
        id: a.id,
        name: a.companyName,
        status: a.status,
        userId: null,
        email: a.contactEmail,
        city: a.city,
        createdAt: a.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  async setAgencyStatus(
    agencyId: string,
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    note?: string,
    actor?: AdminActor,
  ) {
    return this.setPartnerStatus(agencyId, status, note, actor);
  }

  private assertModerationNote(
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    note?: string,
  ) {
    if ((status === 'REJECTED' || status === 'SUSPENDED') && !note?.trim()) {
      throw new BusinessException(
        'MODERATION_NOTE_REQUIRED',
        'Red veya askıya alma için gerekçe zorunludur',
      );
    }
  }

  private emitPartnerVerified(agency: {
    id: string;
    contactEmail: string;
    companyName: string;
  }): void {
    this.eventEmitter.emit(
      'partner.verified',
      new PartnerVerifiedEvent(
        agency.id,
        agency.contactEmail,
        agency.companyName,
      ),
    );
  }

  async listReservations(filters?: { status?: string; q?: string }) {
    const q = filters?.q?.trim();
    const status = filters?.status?.trim();
    const rows = await this.prisma.reservation.findMany({
      where: {
        deletedAt: null,
        ...(status
          ? {
              status: status as
                | 'PENDING'
                | 'PENDING_PAYMENT'
                | 'CONFIRMED'
                | 'COMPLETED'
                | 'CANCELLED'
                | 'SUSPENDED'
                | 'PAYMENT_FAILED'
                | 'EXPIRED',
            }
          : {}),
        ...(q
          ? {
              OR: [
                { bookingNumber: { contains: q, mode: 'insensitive' } },
                { contactEmail: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const tourIds = [
      ...new Set(rows.map((row) => row.tourId).filter(Boolean)),
    ] as string[];
    const experienceIds = [
      ...new Set(rows.map((row) => row.experienceId).filter(Boolean)),
    ] as string[];
    const partnerIds = [...new Set(rows.map((row) => row.agencyId))];

    const [tours, experiences, partners] = await Promise.all([
      tourIds.length
        ? this.prisma.tour.findMany({
            where: { id: { in: tourIds } },
            select: { id: true, title: true },
          })
        : [],
      experienceIds.length
        ? this.prisma.experience.findMany({
            where: { id: { in: experienceIds } },
            select: { id: true, title: true },
          })
        : [],
      partnerIds.length
        ? this.prisma.agency.findMany({
            where: { id: { in: partnerIds } },
            select: { id: true, companyName: true },
          })
        : [],
    ]);

    const tourTitleById = new Map(tours.map((t) => [t.id, t.title]));
    const experienceTitleById = new Map(
      experiences.map((e) => [e.id, e.title]),
    );
    const partnerNameById = new Map(partners.map((p) => [p.id, p.companyName]));

    return {
      success: true,
      data: rows.map((row) => {
        const guests = Array.isArray(row.guests)
          ? (row.guests as Array<{ firstName?: string; lastName?: string }>)
          : [];
        const primary = guests[0];
        const customerName = primary
          ? `${primary.firstName ?? ''} ${primary.lastName ?? ''}`.trim()
          : row.contactEmail;

        return {
          id: row.id,
          bookingNumber: row.bookingNumber,
          customerName,
          contactEmail: row.contactEmail,
          tourTitle: row.tourId
            ? (tourTitleById.get(row.tourId) ?? null)
            : row.experienceId
              ? (experienceTitleById.get(row.experienceId) ?? null)
              : null,
          partnerName: partnerNameById.get(row.agencyId) ?? null,
          agencyId: row.agencyId,
          status: row.status,
          paymentStatus: row.paymentStatus,
          guestCount: row.adults + row.children,
          totalAmount: row.totalAmount.toString(),
          currency: row.currency,
          startDate: row.startDate?.toISOString() ?? null,
          endDate: row.endDate?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
        };
      }),
      error: null,
    };
  }

  async listReviews(q?: string) {
    const query = q?.trim();
    const rows = await this.prisma.review.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { comment: { contains: query, mode: 'insensitive' } },
                { agencyReply: { contains: query, mode: 'insensitive' } },
                { partnerReply: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        tourId: true,
        experienceId: true,
        agencyId: true,
        rating: true,
        comment: true,
        agencyReply: true,
        partnerReply: true,
        tags: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        tourId: row.tourId,
        experienceId: row.experienceId,
        agencyId: row.agencyId,
        rating: row.rating,
        comment: row.comment,
        agencyReply: row.agencyReply ?? row.partnerReply,
        tags: row.tags ?? [],
        createdAt: row.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  /** Tur bazlı yorum özeti — admin moderasyon listesi. */
  async listReviewTours(q?: string) {
    const query = q?.trim().toLowerCase();
    const reviews = await this.prisma.review.findMany({
      where: { tourId: { not: null } },
      select: {
        tourId: true,
        agencyId: true,
        rating: true,
        deletedAt: true,
      },
      take: 5000,
    });

    const byTour = new Map<
      string,
      {
        agencyId: string;
        reviewCount: number;
        ratingSum: number;
        needsReviewCount: number;
        hiddenCount: number;
      }
    >();

    for (const row of reviews) {
      if (!row.tourId) continue;
      const cur = byTour.get(row.tourId) ?? {
        agencyId: row.agencyId,
        reviewCount: 0,
        ratingSum: 0,
        needsReviewCount: 0,
        hiddenCount: 0,
      };
      if (row.deletedAt) {
        cur.hiddenCount += 1;
      } else {
        cur.reviewCount += 1;
        cur.ratingSum += row.rating;
        if (row.rating <= 2) cur.needsReviewCount += 1;
      }
      byTour.set(row.tourId, cur);
    }

    const tourIds = [...byTour.keys()];
    if (tourIds.length === 0) {
      return { success: true, data: [], error: null };
    }

    const [tours, agencies] = await Promise.all([
      this.prisma.tour.findMany({
        where: { id: { in: tourIds }, deletedAt: null },
        select: { id: true, title: true, agencyId: true },
      }),
      this.prisma.agency.findMany({
        where: {
          id: {
            in: [
              ...new Set(
                [...byTour.values()].map((v) => v.agencyId).filter(Boolean),
              ),
            ],
          },
        },
        select: { id: true, companyName: true },
      }),
    ]);

    const tourById = new Map(tours.map((t) => [t.id, t]));
    const agencyById = new Map(agencies.map((a) => [a.id, a.companyName]));

    let data = tourIds
      .map((tourId) => {
        const agg = byTour.get(tourId)!;
        const tour = tourById.get(tourId);
        const agencyName = agencyById.get(agg.agencyId) ?? null;
        return {
          tourId,
          title: tour?.title ?? 'Silinmiş tur',
          agencyId: agg.agencyId,
          agencyName,
          reviewCount: agg.reviewCount,
          averageRating:
            agg.reviewCount > 0
              ? Math.round((agg.ratingSum / agg.reviewCount) * 10) / 10
              : 0,
          needsReviewCount: agg.needsReviewCount,
          hiddenCount: agg.hiddenCount,
        };
      })
      .sort(
        (a, b) =>
          b.reviewCount - a.reviewCount ||
          b.needsReviewCount - a.needsReviewCount,
      );

    if (query) {
      data = data.filter(
        (row) =>
          row.title.toLowerCase().includes(query) ||
          (row.agencyName?.toLowerCase().includes(query) ?? false),
      );
    }

    return { success: true, data: data.slice(0, 100), error: null };
  }

  async listTourReviews(tourId: string, opts?: { includeHidden?: boolean }) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      select: {
        id: true,
        title: true,
        agencyId: true,
        agency: { select: { companyName: true } },
      },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }

    const rows = await this.prisma.review.findMany({
      where: {
        tourId,
        ...(opts?.includeHidden ? {} : { deletedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        tourId: true,
        agencyId: true,
        rating: true,
        comment: true,
        photoUrls: true,
        guideRating: true,
        operatorRating: true,
        routeRating: true,
        foodRating: true,
        hotelRating: true,
        transportRating: true,
        accommodationRating: true,
        agencyReply: true,
        partnerReply: true,
        tags: true,
        travelerContext: true,
        deletedAt: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: {
        tour: {
          id: tour.id,
          title: tour.title,
          agencyId: tour.agencyId,
          agencyName: tour.agency?.companyName ?? null,
        },
        reviews: rows.map((row) => ({
          id: row.id,
          tourId: row.tourId,
          agencyId: row.agencyId,
          rating: row.rating,
          comment: row.comment,
          photoUrls: row.photoUrls ?? [],
          guideRating: row.guideRating,
          operatorRating: row.operatorRating,
          routeRating: row.routeRating,
          foodRating: row.foodRating,
          hotelRating: row.hotelRating,
          transportRating: row.transportRating,
          accommodationRating: row.accommodationRating,
          agencyReply: row.agencyReply ?? row.partnerReply,
          tags: row.tags ?? [],
          travelerContext: row.travelerContext,
          hidden: Boolean(row.deletedAt),
          createdAt: row.createdAt.toISOString(),
        })),
      },
      error: null,
    };
  }

  async hideReview(reviewId: string, actor?: AdminActor) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });
    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadı',
      });
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });

    if (actor) {
      let entityLabel: string | null = null;
      if (review.tourId) {
        const tour = await this.prisma.tour.findFirst({
          where: { id: review.tourId },
          select: { title: true },
        });
        entityLabel = tour?.title ?? null;
      }
      await this.recordAdminAction({
        actor,
        action: 'REVIEW_HIDDEN',
        actionLabel: 'Yorum Gizlendi',
        entityType: 'Review',
        entityId: reviewId,
        entityLabel,
        meta: {
          tourId: review.tourId,
          agencyId: review.agencyId,
          rating: review.rating,
        },
      });
    }

    return {
      success: true,
      data: { id: reviewId, hidden: true },
      error: null,
    };
  }

  async restoreReview(reviewId: string, actor?: AdminActor) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: { not: null } },
    });
    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Gizli yorum bulunamadı',
      });
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: null },
    });

    if (actor) {
      let entityLabel: string | null = null;
      if (review.tourId) {
        const tour = await this.prisma.tour.findFirst({
          where: { id: review.tourId },
          select: { title: true },
        });
        entityLabel = tour?.title ?? null;
      }
      await this.recordAdminAction({
        actor,
        action: 'REVIEW_RESTORED',
        actionLabel: 'Yorum Yayına Alındı',
        entityType: 'Review',
        entityId: reviewId,
        entityLabel,
        meta: {
          tourId: review.tourId,
          agencyId: review.agencyId,
          rating: review.rating,
        },
      });
    }

    return {
      success: true,
      data: { id: reviewId, hidden: false },
      error: null,
    };
  }

  async listAuditLogs(filters?: {
    actorId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
    take?: number;
  }) {
    const take = Math.min(Math.max(filters?.take ?? 100, 1), 200);
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters?.from) {
      const from = new Date(filters.from);
      if (!Number.isNaN(from.getTime())) createdAt.gte = from;
    }
    if (filters?.to) {
      const to = new Date(filters.to);
      if (!Number.isNaN(to.getTime())) createdAt.lte = to;
    }

    const rows = await this.prisma.auditLog.findMany({
      where: {
        actorType: 'PLATFORM_ADMIN',
        ...(filters?.actorId ? { actorId: filters.actorId } : {}),
        ...(filters?.action ? { action: filters.action } : {}),
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(filters?.entityId ? { entityId: filters.entityId } : {}),
        ...(Object.keys(createdAt).length ? { createdAt } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return {
      success: true,
      data: rows.map((row) => this.mapAuditRow(row)),
      error: null,
    };
  }

  async listEntityAudit(entityType: string, entityId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        actorType: 'PLATFORM_ADMIN',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: rows.map((row) => this.mapAuditRow(row)),
      error: null,
    };
  }

  private mapAuditRow(row: {
    id: string;
    actorType: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    meta: Prisma.JsonValue;
    createdAt: Date;
  }) {
    const meta =
      row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta)
        ? (row.meta as Record<string, unknown>)
        : {};
    return {
      id: row.id,
      actorId: row.actorId,
      actorType: row.actorType,
      actorName: typeof meta.actorName === 'string' ? meta.actorName : null,
      actorEmail: typeof meta.actorEmail === 'string' ? meta.actorEmail : null,
      action: row.action,
      actionLabel:
        typeof meta.actionLabel === 'string' ? meta.actionLabel : row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      entityLabel:
        typeof meta.entityLabel === 'string' ? meta.entityLabel : null,
      note: typeof meta.note === 'string' ? meta.note : null,
      meta,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
