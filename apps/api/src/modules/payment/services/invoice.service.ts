import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '../../../generated/prisma';

import { PrismaService } from '../../../core/database/prisma.service';

type BookingConfirmedPayload = {
  reservationId: string;
  userId: string;
  agencyId: string | null;
};

/**
 * Ödeme SUCCESS → booking.confirmed sonrası Invoice QUEUED
 * (buyerSnapshot + sellerSnapshot mühür).
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('booking.confirmed')
  async onBookingConfirmed(event: BookingConfirmedPayload): Promise<void> {
    try {
      await this.queueFromReservation(event.reservationId);
    } catch (error) {
      this.logger.error(
        `Invoice queue failed for ${event.reservationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async queueFromReservation(reservationId: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { reservationId, deletedAt: null },
    });
    if (existing) return existing;

    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, deletedAt: null },
    });
    if (!reservation) return null;

    const [user, agency, partner, tour, extras, payment] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: reservation.userId } }),
      reservation.agencyId
        ? this.prisma.agency.findFirst({
            where: { id: reservation.agencyId, deletedAt: null },
          })
        : null,
      this.prisma.agency.findFirst({
        where: { id: reservation.agencyId, deletedAt: null },
      }),
      reservation.tourId
        ? this.prisma.tour.findFirst({
            where: { id: reservation.tourId },
            select: { title: true, price: true, currency: true },
          })
        : null,
      this.prisma.reservationExtra.findMany({
        where: { reservationId, deletedAt: null },
        include: { tourExtra: { select: { title: true } } },
      }),
      this.prisma.paymentTransaction.findFirst({
        where: { reservationId, status: 'SUCCESS', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const buyerSnapshot = {
      fullName:
        `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
        reservation.contactEmail,
      identityNumber: user?.identityNumber ?? null,
      email: reservation.contactEmail,
      phone: reservation.contactPhone,
      address: user?.address ?? null,
      billingLine1: user?.billingLine1 ?? null,
      billingCity: user?.billingCity ?? null,
      billingCountry: user?.billingCountry ?? null,
    };

    const sellerSnapshot = agency
      ? {
          agencyId: agency.id,
          companyName: agency.companyName,
          taxNumber: agency.taxNumber,
          legalTitle: agency.legalTitle,
          address: agency.address,
          contactEmail: agency.contactEmail,
        }
      : {
          agencyId: null,
          companyName: partner?.companyName ?? null,
          taxNumber: partner?.taxNumber ?? null,
          legalTitle: partner?.companyName ?? null,
          address: partner?.address ?? null,
          contactEmail: partner?.contactEmail ?? null,
          note: 'Expand: Agency bağlanana kadar Partner snapshot',
        };

    const linesSnapshot = [
      {
        type: 'TOUR',
        title: tour?.title ?? 'Tur',
        quantity: reservation.adults + reservation.children,
        unitPrice:
          tour?.price?.toString() ?? reservation.totalAmount.toString(),
        currency: reservation.currency,
      },
      ...extras.map((extra) => ({
        type: 'EXTRA',
        title: extra.tourExtra.title,
        tourExtraId: extra.tourExtraId,
        quantity: extra.quantity,
        unitPrice: extra.unitPrice.toString(),
        currency: extra.currency,
      })),
    ];

    const agencyIdForInvoice = reservation.agencyId;

    if (!agencyIdForInvoice) {
      this.logger.warn(
        `Invoice skipped — no agency for reservation ${reservationId}`,
      );
      return null;
    }

    return this.prisma.invoice.create({
      data: {
        reservationId,
        paymentTransactionId: payment?.id ?? null,
        userId: reservation.userId,
        agencyId: agencyIdForInvoice,
        provider: 'MOCK',
        status: 'QUEUED',
        amount: reservation.totalAmount,
        currency: reservation.currency,
        buyerSnapshot: buyerSnapshot,
        sellerSnapshot: sellerSnapshot,
        linesSnapshot: linesSnapshot,
      },
    });
  }
}
