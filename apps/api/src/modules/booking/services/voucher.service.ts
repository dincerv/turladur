import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BookingGuest } from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import {
  isAgencyTenantRole,
  isPlatformAdminRole,
} from '../../../core/auth/utils/role-access';
import {
  renderVoucherHtml,
  resolvePickupMapsUrl,
  resolveVoucherBrandLogos,
  wrapVoucherDocument,
  type VoucherTemplateData,
} from '../../../core/mail/voucher-template';
import { PrismaService } from '../../../core/database/prisma.service';

type ReservationMeta = {
  billing?: { fullName?: string };
  pickup?: {
    location?: string;
    city?: string;
    time?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  seatNumbers?: string | string[] | null;
};

const DEFAULT_BRAND_URL = 'https://turladur-zjyf.vercel.app';

@Injectable()
export class VoucherService {
  private readonly brandBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.brandBaseUrl = (
      config.get<string>('FRONTEND_URL') ??
      config.get<string>('EMAIL_BRAND_URL') ??
      config.get<string>('PUBLIC_WEB_URL') ??
      DEFAULT_BRAND_URL
    )
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
  }

  async getVoucherPayload(
    reservationId: string,
    actor: {
      userId: string;
      role: string;
      agencyId?: string;
    },
  ) {
    const data = await this.buildTemplateData(reservationId, actor);
    const fragment = renderVoucherHtml(data);
    const html = wrapVoucherDocument(data.bookingNumber, fragment);
    return {
      success: true as const,
      data: {
        bookingNumber: data.bookingNumber,
        html,
        fragmentHtml: fragment,
      },
      error: null,
    };
  }

  async buildTemplateData(
    reservationId: string,
    actor?: {
      userId: string;
      role: string;
      agencyId?: string;
    },
  ): Promise<VoucherTemplateData> {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    if (actor) {
      this.assertAccess(reservation, actor);
    }

    const [tour, experience, partner] = await Promise.all([
      reservation.tourId
        ? this.prisma.tour.findFirst({
            where: { id: reservation.tourId },
            select: { title: true },
          })
        : null,
      reservation.experienceId
        ? this.prisma.experience.findFirst({
            where: { id: reservation.experienceId },
            select: { title: true },
          })
        : null,
      this.prisma.agency.findFirst({
        where: { id: reservation.agencyId },
        select: {
          companyName: true,
          contactPhone: true,
          taxNumber: true,
          logo: true,
        },
      }),
    ]);

    const meta = (reservation.metadata ?? {}) as ReservationMeta;
    const guests = (reservation.guests as unknown as BookingGuest[]) ?? [];
    const primary = guests[0];
    const payerName =
      meta.billing?.fullName?.trim() ||
      (primary
        ? `${primary.firstName} ${primary.lastName}`.trim()
        : reservation.contactEmail);

    const pickupLocation = meta.pickup?.location
      ? [meta.pickup.city, meta.pickup.location].filter(Boolean).join(' — ')
      : null;

    const seatLabel = this.formatSeatLabel(meta.seatNumbers);
    const paymentStatusLabel =
      reservation.paymentStatus === 'PAID' ||
      reservation.status === 'CONFIRMED' ||
      reservation.status === 'COMPLETED'
        ? 'ÖDENDİ (Tahsil Edildi)'
        : reservation.paymentStatus === 'REFUNDED'
          ? 'İADE EDİLDİ'
          : 'ÖDEME BEKLİYOR';

    const brandLogos = resolveVoucherBrandLogos(this.brandBaseUrl);

    return {
      bookingNumber: reservation.bookingNumber,
      issuedAt: reservation.createdAt,
      tourTitle: tour?.title ?? experience?.title ?? 'Rezervasyon',
      tourStartDate: reservation.startDate,
      tourEndDate: reservation.endDate,
      partnerName: partner?.companyName ?? 'turta Partner',
      partnerPhone: partner?.contactPhone ?? null,
      partnerTaxNumber: partner?.taxNumber ?? null,
      partnerLogoUrl: partner?.logo ?? null,
      platformLogoUrl: brandLogos.platformLogoUrl,
      tursabLogoUrl: brandLogos.tursabLogoUrl,
      guests: guests.map((guest) => ({
        firstName: guest.firstName,
        lastName: guest.lastName,
        identityNumber: guest.identityNumber,
      })),
      pickupLocation,
      pickupTime: meta.pickup?.time ?? null,
      pickupMapsUrl: resolvePickupMapsUrl(meta.pickup),
      seatLabel,
      payerName,
      totalAmount: reservation.totalAmount.toString(),
      currency: reservation.currency,
      paymentStatusLabel,
    };
  }

  private formatSeatLabel(value: string | string[] | null | undefined): string {
    if (value == null) return 'Partner tarafından atanacak';
    if (Array.isArray(value)) {
      const joined = value.map(String).filter(Boolean).join(', ');
      return joined || 'Partner tarafından atanacak';
    }
    const trimmed = String(value).trim();
    return trimmed || 'Partner tarafından atanacak';
  }

  private assertAccess(
    reservation: { userId: string; agencyId: string },
    actor: { userId: string; role: string; agencyId?: string },
  ) {
    const isAdmin = isPlatformAdminRole(actor.role);
    const isOwner = reservation.userId === actor.userId;
    const isPartnerOwner =
      isAgencyTenantRole(actor.role) &&
      Boolean(actor.agencyId) &&
      reservation.agencyId === actor.agencyId;

    if (isAdmin || isOwner || isPartnerOwner) return;

    throw new ForbiddenException({
      code: 'FORBIDDEN',
      message: 'Bu vouchera erişim yetkiniz yok',
    });
  }
}

/** Merge seat numbers into reservation metadata (partner ops). */
export function mergeSeatNumbersIntoMetadata(
  metadata: Prisma.JsonValue | null,
  seatNumbers: string,
): Prisma.InputJsonValue {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  return {
    ...base,
    seatNumbers: seatNumbers.trim(),
  };
}
