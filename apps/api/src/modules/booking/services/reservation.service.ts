import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStatus as SharedBookingStatus } from '@turta/shared-constants';
import type {
  BookingGuest,
  Reservation as SharedReservation,
} from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { AuditService } from '../../../core/audit/audit.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { BookingCancelledEvent } from '../events/booking-cancelled.event';
import { BookingCompletedEvent } from '../events/booking-completed.event';
import { BookingCreatedEvent } from '../events/booking-created.event';
import { PaymentCompletedEvent } from '../../payment/events/payment-completed.event';
import { isValidTckn } from '../../../shared/utils/tckn';

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  async create(dto: CreateReservationDto, userId: string) {
    const partySize = dto.adults + (dto.children ?? 0);
    if (dto.guests.length !== partySize) {
      throw new BusinessException(
        'GUEST_COUNT_MISMATCH',
        `Misafir sayısı (${dto.guests.length}) yetişkin+çocuk (${partySize}) ile eşleşmeli`,
      );
    }

    for (const [index, guest] of dto.guests.entries()) {
      if (!isValidTckn(guest.identityNumber)) {
        throw new BusinessException(
          'INVALID_IDENTITY_NUMBER',
          `${guest.firstName} ${guest.lastName}: TC kimlik no geçersiz`,
        );
      }
      if (index === 0) {
        const address = guest.address?.trim() ?? '';
        if (address.length < 5) {
          throw new BusinessException(
            'ADDRESS_REQUIRED',
            'Satın alan katılımcı için adres zorunludur',
          );
        }
        if (!guest.phone?.trim() || guest.phone.trim().length < 10) {
          throw new BusinessException(
            'PHONE_REQUIRED',
            'Satın alan katılımcı için telefon zorunludur',
          );
        }
        if (!guest.email?.trim() || !guest.email.includes('@')) {
          throw new BusinessException(
            'EMAIL_REQUIRED',
            'Satın alan katılımcı için e-posta zorunludur',
          );
        }
      }
    }

    if (
      !dto.billing?.line1?.trim() ||
      !dto.billing?.city?.trim() ||
      !dto.billing?.country?.trim()
    ) {
      throw new BusinessException(
        'BILLING_REQUIRED',
        'Fatura adresi, şehir ve ülke zorunludur',
      );
    }

    const productCount = [dto.tourDateId, dto.activityDateId].filter(
      Boolean,
    ).length;
    if (productCount !== 1) {
      throw new BusinessException(
        'INVALID_BOOKING_PRODUCT',
        'Tam olarak bir ürün seçilmeli: tourDateId veya activityDateId',
      );
    }

    if (dto.tourDateId) {
      return this.createTourReservation(dto, userId, partySize);
    }
    return this.createExperienceReservation(dto, userId, partySize);
  }

  async getById(
    reservationId: string,
    userId: string,
    role: string,
    agencyId?: string,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    this.assertAccess(reservation, userId, role, agencyId);

    return {
      success: true,
      data: this.toShared(reservation),
      error: null,
    };
  }

  async listForUser(userId: string) {
    const rows = await this.prisma.reservation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: rows.map((row) => this.toShared(row)),
      error: null,
    };
  }

  async cancel(reservationId: string, userId: string, role: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    this.assertAccess(reservation, userId, role, undefined);

    if (
      reservation.status === 'CANCELLED' ||
      reservation.status === 'COMPLETED'
    ) {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        'Bu rezervasyon iptal edilemez',
      );
    }

    const partySize = reservation.adults + reservation.children;

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.restoreCapacity(tx, reservation, partySize);

      return tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });
    });

    this.eventEmitter.emit(
      'booking.cancelled',
      new BookingCancelledEvent(updated.id, updated.userId, 'RESERVATION'),
    );

    return {
      success: true,
      data: this.toShared(updated),
      error: null,
    };
  }

  /**
   * Cancel every active reservation for a delisted tour (capacity restore + events).
   */
  async cancelAllForTour(
    tourId: string,
    reasonCode?: string,
    reasonLabel?: string,
  ) {
    const rows = await this.prisma.reservation.findMany({
      where: {
        tourId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    });

    for (const reservation of rows) {
      const partySize = reservation.adults + reservation.children;
      const meta =
        reservation.metadata &&
        typeof reservation.metadata === 'object' &&
        !Array.isArray(reservation.metadata)
          ? { ...(reservation.metadata as Record<string, unknown>) }
          : {};

      const updated = await this.prisma.$transaction(async (tx) => {
        await this.restoreCapacity(tx, reservation, partySize);
        return tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            metadata: {
              ...meta,
              cancelScope: 'TOUR',
              cancelReason: reasonCode ?? null,
              cancelReasonLabel: reasonLabel ?? null,
            } as Prisma.InputJsonValue,
          },
        });
      });

      this.eventEmitter.emit(
        'booking.cancelled',
        new BookingCancelledEvent(
          updated.id,
          updated.userId,
          'TOUR',
          reasonCode,
          reasonLabel,
        ),
      );
    }

    return { cancelledCount: rows.length };
  }

  /**
   * Cancel active reservations for specific tour departure dates.
   */
  async cancelAllForTourDates(
    tourDateIds: string[],
    reasonCode?: string,
    reasonLabel?: string,
    dateLabelById?: Record<string, string>,
  ) {
    if (tourDateIds.length === 0) {
      return { cancelledCount: 0 };
    }

    const rows = await this.prisma.reservation.findMany({
      where: {
        tourDateId: { in: tourDateIds },
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    });

    for (const reservation of rows) {
      const partySize = reservation.adults + reservation.children;
      const meta =
        reservation.metadata &&
        typeof reservation.metadata === 'object' &&
        !Array.isArray(reservation.metadata)
          ? { ...(reservation.metadata as Record<string, unknown>) }
          : {};

      const dateLabel =
        (reservation.tourDateId && dateLabelById?.[reservation.tourDateId]) ||
        undefined;

      const updated = await this.prisma.$transaction(async (tx) => {
        await this.restoreCapacity(tx, reservation, partySize);
        return tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            metadata: {
              ...meta,
              cancelScope: 'TOUR_DATE',
              cancelReason: reasonCode ?? null,
              cancelReasonLabel: reasonLabel ?? null,
              cancelledDateLabel: dateLabel ?? null,
              cancelledTourDateId: reservation.tourDateId,
            } as Prisma.InputJsonValue,
          },
        });
      });

      this.eventEmitter.emit(
        'booking.cancelled',
        new BookingCancelledEvent(
          updated.id,
          updated.userId,
          'TOUR_DATE',
          reasonCode,
          reasonLabel,
          dateLabel,
        ),
      );
    }

    return { cancelledCount: rows.length };
  }

  async markConfirmed(reservationId: string) {
    const reservation = await this.transition(
      reservationId,
      ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_FAILED'],
      'CONFIRMED',
    );

    if (reservation.status === 'CONFIRMED') {
      await this.ensureVoucherRow(reservationId, reservation.bookingNumber);
      this.eventEmitter.emit('booking.confirmed', {
        reservationId,
        userId: reservation.userId,
        agencyId: reservation.agencyId,
      });
      await this.auditService.record({
        actorType: 'USER',
        actorId: reservation.userId,
        action: 'BOOKING_CONFIRMED',
        entityType: 'Reservation',
        entityId: reservationId,
        meta: {
          agencyId: reservation.agencyId,
        },
      });
    }

    return reservation;
  }

  async markPaymentFailed(reservationId: string) {
    return this.transition(
      reservationId,
      ['PENDING', 'PENDING_PAYMENT'],
      'PAYMENT_FAILED',
    );
  }

  /** payment.refunded → yalnızca paymentStatus; rezervasyon status’una dokunma. */
  async markPaymentRefunded(reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    if (reservation.paymentStatus === 'REFUNDED') {
      return reservation;
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { paymentStatus: 'REFUNDED' },
    });
  }

  /** Hold süresi dolan PENDING_PAYMENT → EXPIRED + kontenjan iade. */
  async releaseExpiredHolds(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.reservation.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        holdExpiresAt: { lt: now },
        deletedAt: null,
      },
      take: 100,
    });

    let released = 0;
    for (const reservation of expired) {
      const partySize =
        reservation.heldPartySize ?? reservation.adults + reservation.children;
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.reservation.updateMany({
          where: {
            id: reservation.id,
            status: 'PENDING_PAYMENT',
          },
          data: {
            status: 'EXPIRED',
            cancelledAt: now,
          },
        });
        if (updated.count === 0) return;
        await this.restoreCapacity(tx, reservation, partySize);
      });
      released += 1;
    }
    return released;
  }

  /**
   * Partner/admin marks a confirmed booking as completed after the tour ends.
   * Required for Sprint 17 review eligibility.
   */
  async markCompleted(
    reservationId: string,
    actor?: {
      userId: string;
      role: string;
      agencyId?: string;
    },
  ) {
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
      this.assertAccess(reservation, actor.userId, actor.role, actor.agencyId);
    }

    if (reservation.status === 'COMPLETED') {
      return {
        success: true,
        data: this.toShared(reservation),
        error: null,
      };
    }

    if (reservation.status !== 'CONFIRMED') {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        'Sadece onaylı rezervasyonlar tamamlanabilir',
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'COMPLETED' },
    });

    this.eventEmitter.emit(
      'booking.completed',
      new BookingCompletedEvent(
        updated.id,
        updated.userId,
        updated.tourId,
        updated.agencyId,
        updated.contactEmail,
      ),
    );

    return {
      success: true,
      data: this.toShared(updated),
      error: null,
    };
  }

  /**
   * Agency panel status writes (Faz 3). Partner tetikler; booking yazar.
   * State machine — CANCELLED/COMPLETED terminal; no blind re-confirm.
   */
  async agencyUpdateStatus(
    reservationId: string,
    agencyId: string,
    status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED',
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, agencyId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    const from = reservation.status;
    this.assertAgencyStatusTransition(from, status);

    if (status === 'COMPLETED') {
      return this.markCompleted(reservationId, {
        userId: reservation.userId,
        role: 'AGENCY_OWNER',
        agencyId,
      });
    }

    if (status === 'CANCELLED') {
      const partySize =
        reservation.heldPartySize ?? reservation.adults + reservation.children;
      const updated = await this.prisma.$transaction(async (tx) => {
        await this.restoreCapacity(tx, reservation, partySize);
        // Free assigned seats (soft-delete) so map inventory stays consistent.
        await tx.seatAssignment.updateMany({
          where: { reservationId: reservation.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        return tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            holdExpiresAt: null,
            heldPartySize: null,
          },
        });
      });

      this.eventEmitter.emit(
        'booking.cancelled',
        new BookingCancelledEvent(
          updated.id,
          updated.userId,
          'RESERVATION',
          'PARTNER_CANCELLED',
          'Tur firması tarafından iptal edildi',
        ),
      );

      return {
        success: true,
        data: this.toShared(updated),
        error: null,
      };
    }

    if (status === 'SUSPENDED') {
      const updated = await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'SUSPENDED', holdExpiresAt: null },
      });
      return {
        success: true,
        data: this.toShared(updated),
        error: null,
      };
    }

    // CONFIRMED — capacity already held on create; never from CANCELLED.
    const updated = await this.prisma.$transaction(async (tx) => {
      return tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: reservation.paymentMethod ?? 'BANK_TRANSFER',
          holdExpiresAt: null,
        },
      });
    });

    this.eventEmitter.emit(
      'payment.completed',
      new PaymentCompletedEvent(
        `manual-${updated.id}`,
        updated.id,
        updated.totalAmount.toString(),
      ),
    );

    return {
      success: true,
      data: this.toShared(updated),
      error: null,
    };
  }

  private assertAgencyStatusTransition(
    from: string,
    to: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED',
  ) {
    if (from === 'CANCELLED' || from === 'COMPLETED' || from === 'EXPIRED') {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        from === 'CANCELLED'
          ? 'İptal edilmiş rezervasyon yeniden onaylanamaz'
          : 'Bu rezervasyon güncellenemez',
      );
    }

    const allowed: Record<typeof to, readonly string[]> = {
      CONFIRMED: ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'SUSPENDED'],
      CANCELLED: [
        'PENDING',
        'PENDING_PAYMENT',
        'PAYMENT_FAILED',
        'CONFIRMED',
        'SUSPENDED',
      ],
      COMPLETED: ['CONFIRMED'],
      SUSPENDED: ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'CONFIRMED'],
    };

    if (!allowed[to].includes(from)) {
      throw new BusinessException(
        'INVALID_STATUS_TRANSITION',
        `${from} → ${to} geçişine izin verilmiyor`,
      );
    }
  }

  async agencyUpdateSeatNumbers(
    reservationId: string,
    agencyId: string,
    seatNumbers: string,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, agencyId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    const base =
      reservation.metadata &&
      typeof reservation.metadata === 'object' &&
      !Array.isArray(reservation.metadata)
        ? { ...(reservation.metadata as Record<string, unknown>) }
        : {};

    return this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        metadata: {
          ...base,
          seatNumbers: seatNumbers.trim(),
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async createTourReservation(
    dto: CreateReservationDto,
    userId: string,
    partySize: number,
  ) {
    if (!dto.pickupPointId?.trim()) {
      throw new BusinessException(
        'BOARDING_PICKUP_REQUIRED',
        'Tur rezervasyonunda biniş noktası zorunludur',
      );
    }

    const tourDate = await this.prisma.tourDate.findFirst({
      where: { id: dto.tourDateId, deletedAt: null, isActive: true },
      include: { tour: true },
    });

    if (
      !tourDate ||
      tourDate.tour.deletedAt ||
      tourDate.tour.status !== 'PUBLISHED'
    ) {
      throw new NotFoundException({
        code: 'TOUR_DATE_NOT_FOUND',
        message: 'Tur tarihi bulunamadı veya yayında değil',
      });
    }

    if (tourDate.remainingCapacity < partySize) {
      throw new BusinessException(
        'BOOKING_NOT_AVAILABLE',
        'Seçilen tarihte müsaitlik bulunmamaktadır.',
      );
    }

    const boarding = await this.prisma.tourPickupPoint.findFirst({
      where: {
        id: dto.pickupPointId,
        tourId: tourDate.tourId,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!boarding) {
      throw new BusinessException(
        'PICKUP_POINT_NOT_FOUND',
        'Seçilen kalkış noktası bulunamadı',
      );
    }

    const unitPrice = tourDate.priceOverride ?? tourDate.tour.price;
    let extrasTotal = new Prisma.Decimal(0);
    const extraRows: Array<{
      tourExtraId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      currency: string;
    }> = [];

    if (dto.extras?.length) {
      for (const item of dto.extras) {
        const tourExtra = await this.prisma.tourExtra.findFirst({
          where: {
            id: item.tourExtraId,
            tourId: tourDate.tourId,
            isActive: true,
            deletedAt: null,
          },
        });
        if (!tourExtra) {
          throw new BusinessException(
            'TOUR_EXTRA_NOT_FOUND',
            'Seçilen tur ekstrası bulunamadı',
          );
        }
        const line = new Prisma.Decimal(tourExtra.price).mul(item.quantity);
        extrasTotal = extrasTotal.add(line);
        extraRows.push({
          tourExtraId: tourExtra.id,
          quantity: item.quantity,
          unitPrice: tourExtra.price,
          currency: tourExtra.currency,
        });
      }
    }

    const totalAmount = new Prisma.Decimal(unitPrice)
      .mul(partySize)
      .add(extrasTotal);
    const bookingNumber = await this.nextBookingNumber();
    const metadata = await this.buildReservationMetadata(dto, tourDate.tourId);
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const childMaxAge = tourDate.tour.childMaxAge ?? 12;

    const reservation = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tourDate.updateMany({
        where: {
          id: tourDate.id,
          version: tourDate.version,
          remainingCapacity: { gte: partySize },
          deletedAt: null,
        },
        data: {
          remainingCapacity: { decrement: partySize },
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new BusinessException(
          'BOOKING_NOT_AVAILABLE',
          'Seçilen tarihte müsaitlik bulunmamaktadır.',
        );
      }

      const created = await tx.reservation.create({
        data: {
          bookingNumber,
          userId,
          tourId: tourDate.tourId,
          tourDateId: tourDate.id,
          agencyId: tourDate.tour.agencyId,
          ...(tourDate.tour.agencyId
            ? { agencyId: tourDate.tour.agencyId }
            : {}),
          status: 'PENDING_PAYMENT',
          paymentStatus: 'UNPAID',
          paymentMethod: null,
          adults: dto.adults,
          children: dto.children ?? 0,
          totalAmount,
          currency: tourDate.tour.currency,
          boardingPickupPointId: boarding.id,
          contactEmail: dto.contactEmail.toLowerCase().trim(),
          contactPhone: dto.contactPhone,
          guests: dto.guests as unknown as Prisma.InputJsonValue,
          specialRequests: dto.specialRequests ?? null,
          startDate: tourDate.startDate,
          endDate: tourDate.endDate,
          holdExpiresAt,
          heldPartySize: partySize,
          metadata,
        },
      });

      await tx.reservationGuest.createMany({
        data: dto.guests.map((guest, index) => {
          const fullName = `${guest.firstName} ${guest.lastName}`.trim();
          const isChild = guest.birthDate
            ? this.isChildByBirthDate(guest.birthDate, childMaxAge)
            : index > 0 && (dto.children ?? 0) > 0
              ? index >= dto.adults
              : false;
          return {
            reservationId: created.id,
            fullName,
            identityNumber: guest.identityNumber,
            birthDate: guest.birthDate ? new Date(guest.birthDate) : null,
            isChild,
            sortOrder: index,
          };
        }),
      });

      if (extraRows.length > 0) {
        await tx.reservationExtra.createMany({
          data: extraRows.map((row) => ({
            reservationId: created.id,
            tourExtraId: row.tourExtraId,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            currency: row.currency,
          })),
        });
      }

      return created;
    });

    this.emitCreated(reservation);
    return {
      success: true,
      data: this.toShared(reservation),
      error: null,
    };
  }

  private async createExperienceReservation(
    dto: CreateReservationDto,
    userId: string,
    partySize: number,
  ) {
    const activityDate = await this.prisma.activityDate.findFirst({
      where: { id: dto.activityDateId, deletedAt: null, isActive: true },
      include: { experience: true },
    });

    if (
      !activityDate ||
      activityDate.experience.deletedAt ||
      activityDate.experience.status !== 'PUBLISHED'
    ) {
      throw new NotFoundException({
        code: 'ACTIVITY_DATE_NOT_FOUND',
        message: 'Aktivite tarihi bulunamadı veya yayında değil',
      });
    }

    const totalAmount = new Prisma.Decimal(activityDate.price).mul(partySize);
    const bookingNumber = await this.nextBookingNumber();
    const metadata = await this.buildReservationMetadata(dto, null);

    const reservation = await this.prisma.$transaction(async (tx) => {
      const remaining =
        activityDate.remainingCapacity ?? activityDate.availableSeats;
      if (remaining < partySize) {
        throw new BusinessException(
          'BOOKING_NOT_AVAILABLE',
          'Seçilen tarihte müsaitlik bulunmamaktadır.',
        );
      }

      const updated = await tx.activityDate.updateMany({
        where: {
          id: activityDate.id,
          deletedAt: null,
          isActive: true,
          OR: [
            { remainingCapacity: { gte: partySize } },
            {
              remainingCapacity: null,
              availableSeats: { gte: partySize },
            },
          ],
        },
        data: {
          remainingCapacity: remaining - partySize,
        },
      });

      if (updated.count === 0) {
        throw new BusinessException(
          'BOOKING_NOT_AVAILABLE',
          'Seçilen tarihte müsaitlik bulunmamaktadır.',
        );
      }

      return tx.reservation.create({
        data: {
          bookingNumber,
          userId,
          experienceId: activityDate.experienceId,
          activityDateId: activityDate.id,
          agencyId: activityDate.experience.agencyId,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'UNPAID',
          paymentMethod: null,
          adults: dto.adults,
          children: dto.children ?? 0,
          totalAmount,
          currency: activityDate.experience.currency,
          contactEmail: dto.contactEmail.toLowerCase().trim(),
          contactPhone: dto.contactPhone,
          guests: dto.guests as unknown as Prisma.InputJsonValue,
          startDate: activityDate.startDate,
          endDate: activityDate.endDate,
          holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          heldPartySize: partySize,
          specialRequests: dto.specialRequests ?? null,
          metadata,
        },
      });
    });

    this.emitCreated(reservation);
    return {
      success: true,
      data: this.toShared(reservation),
      error: null,
    };
  }

  private emitCreated(reservation: {
    id: string;
    userId: string;
    tourDateId: string | null;
    agencyId: string;
    totalAmount: Prisma.Decimal;
  }) {
    // booking.created: bilinçli no-op consumer (Faz 1) — audit burada; event gelecek modüller için tutuluyor
    this.eventEmitter.emit(
      'booking.created',
      new BookingCreatedEvent(
        reservation.id,
        reservation.userId,
        reservation.tourDateId,
        reservation.agencyId,
        reservation.totalAmount.toString(),
      ),
    );
    void this.auditService.record({
      actorType: 'USER',
      actorId: reservation.userId,
      action: 'BOOKING_CREATE',
      entityType: 'Reservation',
      entityId: reservation.id,
      meta: {
        agencyId: reservation.agencyId,
        tourDateId: reservation.tourDateId,
        totalAmount: reservation.totalAmount.toString(),
      },
    });
  }

  private async restoreCapacity(
    tx: Prisma.TransactionClient,
    reservation: {
      tourDateId: string | null;
      activityDateId: string | null;
    },
    partySize: number,
  ) {
    if (reservation.tourDateId) {
      await tx.tourDate.update({
        where: { id: reservation.tourDateId },
        data: { remainingCapacity: { increment: partySize } },
      });
    }
    if (reservation.activityDateId) {
      await tx.activityDate.update({
        where: { id: reservation.activityDateId },
        data: { remainingCapacity: { increment: partySize } },
      });
    }
  }

  private async transition(
    reservationId: string,
    from: Array<'PENDING' | 'PENDING_PAYMENT' | 'PAYMENT_FAILED' | 'CONFIRMED'>,
    to: 'CONFIRMED' | 'PAYMENT_FAILED',
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, deletedAt: null },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Rezervasyon bulunamadı',
      });
    }

    if (!from.includes(reservation.status as (typeof from)[number])) {
      return reservation;
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: to,
        ...(to === 'CONFIRMED'
          ? {
              paymentStatus: 'PAID' as const,
              paymentMethod: 'CARD' as const,
              holdExpiresAt: null,
            }
          : to === 'PAYMENT_FAILED'
            ? { paymentStatus: 'UNPAID' as const }
            : {}),
      },
    });
  }

  private isChildByBirthDate(birthDate: string, childMaxAge: number): boolean {
    const born = new Date(birthDate);
    if (Number.isNaN(born.getTime())) return false;
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const monthDiff = now.getMonth() - born.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) {
      age -= 1;
    }
    return age <= childMaxAge;
  }

  private async ensureVoucherRow(
    reservationId: string,
    bookingNumber: string,
  ): Promise<void> {
    const existing = await this.prisma.voucher.findFirst({
      where: { reservationId, deletedAt: null },
    });
    if (existing) return;
    await this.prisma.voucher.create({
      data: {
        reservationId,
        code: bookingNumber,
        qrPayload: bookingNumber,
        issuedAt: new Date(),
      },
    });
  }

  private async buildReservationMetadata(
    dto: CreateReservationDto,
    tourId?: string | null,
  ): Promise<Prisma.InputJsonValue> {
    const primary = dto.guests[0];
    const billingFullName =
      dto.billing.fullName?.trim() ||
      `${primary.firstName} ${primary.lastName}`.trim();

    const meta: Record<string, unknown> = {
      billing: {
        ...dto.billing,
        fullName: billingFullName,
      },
    };

    if (dto.pickupPointId && tourId) {
      const point = await this.prisma.tourPickupPoint.findFirst({
        where: {
          id: dto.pickupPointId,
          tourId,
          deletedAt: null,
          isActive: true,
        },
      });
      if (!point) {
        throw new BusinessException(
          'PICKUP_POINT_NOT_FOUND',
          'Seçilen kalkış noktası bulunamadı',
        );
      }
      meta.pickup = {
        pickupPointId: point.id,
        location: point.location,
        city: point.city,
        time: point.time,
        description: point.description,
        latitude: point.latitude,
        longitude: point.longitude,
      };
    }

    // Seat numbers are assigned later by the partner (not at checkout).
    meta.seatNumbers = null;

    return meta as Prisma.InputJsonValue;
  }

  private assertAccess(
    reservation: { userId: string; agencyId: string },
    userId: string,
    role: string,
    agencyId?: string,
  ) {
    const isOwner = reservation.userId === userId;
    if (isOwner) {
      return;
    }

    this.agencyLink.assertSellerOwner(
      { agencyId: reservation.agencyId },
      { agencyId, role },
      'Bu rezervasyona erişim yetkiniz yok',
    );
  }

  private async nextBookingNumber(): Promise<string> {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const candidate = `TRL-${ymd}-${suffix}`;
      const exists = await this.prisma.reservation.findFirst({
        where: { bookingNumber: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    return `TRL-${ymd}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  }

  private toShared(row: {
    id: string;
    bookingNumber: string;
    userId: string;
    tourId: string | null;
    tourDateId: string | null;
    experienceId?: string | null;
    activityDateId?: string | null;
    agencyId: string;
    status: string;
    paymentStatus?: string;
    adults: number;
    children: number;
    totalAmount: Prisma.Decimal;
    currency: string;
    contactEmail: string;
    contactPhone: string | null;
    guests: Prisma.JsonValue | null;
    metadata?: Prisma.JsonValue | null;
    startDate?: Date | null;
    endDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SharedReservation {
    return {
      id: row.id,
      bookingNumber: row.bookingNumber,
      userId: row.userId,
      tourId: row.tourId,
      tourDateId: row.tourDateId,
      hotelId: null,
      roomId: null,
      experienceId: row.experienceId ?? null,
      activityDateId: row.activityDateId ?? null,
      partnerId: row.agencyId,
      agencyId: row.agencyId,
      status: row.status as SharedBookingStatus,
      paymentStatus: row.paymentStatus ?? 'UNPAID',
      adults: row.adults,
      children: row.children,
      totalAmount: row.totalAmount.toString(),
      currency: row.currency,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      guests: (row.guests as unknown as BookingGuest[]) ?? [],
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      startDate: row.startDate?.toISOString() ?? null,
      endDate: row.endDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
