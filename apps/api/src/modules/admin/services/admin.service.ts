import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../../generated/prisma';

import { CacheService } from '../../../core/cache/cache.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { PartnerVerifiedEvent } from '../../identity/events/partner-verified.event';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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
    if (status === 'DRAFT') {
      if (!note?.trim()) {
        throw new BusinessException(
          'MODERATION_NOTE_REQUIRED',
          'Red için gerekçe zorunludur',
        );
      }
      prevExtras.moderationNote = note.trim().slice(0, 500);
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
  ) {
    return this.setPartnerStatus(agencyId, status, note);
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

  async hideReview(reviewId: string) {
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

    return {
      success: true,
      data: { id: reviewId, hidden: true },
      error: null,
    };
  }
}
