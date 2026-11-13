import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';

import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import {
  type BusLayoutJson,
  sellableSeatCodes,
} from '../../../shared/utils/bus-seat-layout';
import {
  adjacentSellableCodes,
  cellUiStatus,
  gendersConflict,
  inferGenderFromIdentity,
  SeatGender,
  SeatUiStatus,
} from '../utils/seat-gender';

type ManualAssignmentInput = {
  seatCode: string;
  reservationGuestId: string;
};

@Injectable()
export class SeatAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeatMap(
    tourDateId: string,
    agencyId: string | undefined,
    role: string,
    expectedTourId?: string,
  ) {
    const tourDate = await this.findOwnedTourDate(tourDateId, agencyId, role);
    this.assertTourIdMatch(tourDate.tourId, expectedTourId);

    if (!tourDate.busSeatLayoutId || !tourDate.busSeatLayout) {
      throw new BusinessException(
        'LAYOUT_REQUIRED',
        'Önce TourDate için bus seat layout seçilmeli',
      );
    }

    await this.ensureReservationGuestsMaterialized(tourDateId);

    const assignments = await this.prisma.seatAssignment.findMany({
      where: { tourDateId, deletedAt: null },
      include: {
        reservationGuest: {
          select: {
            id: true,
            fullName: true,
            identityNumber: true,
          },
        },
        reservation: {
          select: { id: true, bookingNumber: true, status: true },
        },
      },
      orderBy: { assignedAt: 'asc' },
    });

    const byCode = new Map(assignments.map((row) => [row.seatCode, row]));
    const layoutJson = tourDate.busSeatLayout
      .layoutJson as unknown as BusLayoutJson;

    const cells = layoutJson.cells.map((cell) => {
      const assignment = byCode.get(cell.code);
      const gender = assignment
        ? inferGenderFromIdentity(assignment.reservationGuest.identityNumber)
        : SeatGender.UNKNOWN;
      const status = cellUiStatus(cell, Boolean(assignment));
      return {
        ...cell,
        status,
        gender: assignment ? gender : null,
        occupancy: assignment
          ? {
              assignmentId: assignment.id,
              guestId: assignment.reservationGuestId,
              fullName: assignment.reservationGuest.fullName,
              bookingNumber: assignment.reservation.bookingNumber,
              source: assignment.source,
              gender,
            }
          : null,
      };
    });

    const unassignedGuests =
      await this.listUnassignedGuestsInternal(tourDateId);

    return {
      success: true,
      data: {
        tourDateId,
        tourId: tourDate.tourId,
        layoutVersion: tourDate.version,
        layout: {
          id: tourDate.busSeatLayout.id,
          kind: tourDate.busSeatLayout.kind,
          passengerSeats: tourDate.busSeatLayout.passengerSeats,
          orientation: layoutJson.orientation,
          legend: layoutJson.legend,
          cells,
        },
        assignments: assignments.map((row) => ({
          id: row.id,
          seatCode: row.seatCode,
          source: row.source,
          guestId: row.reservationGuestId,
          fullName: row.reservationGuest.fullName,
          bookingNumber: row.reservation.bookingNumber,
          gender: inferGenderFromIdentity(row.reservationGuest.identityNumber),
        })),
        unassignedGuests: unassignedGuests.map((guest) => ({
          ...guest,
          gender: inferGenderFromIdentity(guest.identityNumber),
        })),
      },
      error: null,
    };
  }

  /**
   * MANUAL assign — Prisma $transaction + partial unique + TourDate.version OCC.
   * SOLD koltuğa yazım kesinlikle engellenir (P2002 → SEAT_OCCUPIED).
   */
  async assignManual(
    tourDateId: string,
    dto: ManualAssignmentInput,
    agencyId: string | undefined,
    role: string | null,
    expectedTourId?: string,
  ) {
    const result = await this.assignManualBulk(
      tourDateId,
      [dto],
      agencyId,
      role,
      expectedTourId,
    );
    return {
      success: true,
      data: result.data.assignments[0] ?? null,
      error: null,
    };
  }

  async assignManualBulk(
    tourDateId: string,
    items: ManualAssignmentInput[],
    agencyId: string | undefined,
    role: string | null,
    expectedTourId?: string,
  ) {
    if (!items.length) {
      throw new BusinessException('EMPTY_ASSIGNMENTS', 'Atama listesi boş');
    }

    const tourDate = await this.findOwnedTourDate(tourDateId, agencyId, role);
    this.assertTourIdMatch(tourDate.tourId, expectedTourId);
    this.assertLayout(tourDate);
    const layoutJson = tourDate.busSeatLayout!
      .layoutJson as unknown as BusLayoutJson;

    const seatCodes = new Set<string>();
    const guestIds = new Set<string>();
    for (const item of items) {
      const seatCode = item.seatCode.trim();
      const guestId = item.reservationGuestId.trim();
      if (seatCodes.has(seatCode)) {
        throw new BusinessException(
          'DUPLICATE_SEAT_IN_PAYLOAD',
          `Koltuk ${seatCode} payload içinde tekrar ediyor`,
        );
      }
      if (guestIds.has(guestId)) {
        throw new BusinessException(
          'DUPLICATE_GUEST_IN_PAYLOAD',
          'Aynı misafir birden fazla koltuğa atanamaz',
        );
      }
      seatCodes.add(seatCode);
      guestIds.add(guestId);
      this.assertSellableSeat(layoutJson, seatCode);
    }

    try {
      const created = await this.prisma.$transaction(
        async (tx) => {
          // Optimistic concurrency: TourDate.version bump
          const locked = await tx.tourDate.updateMany({
            where: {
              id: tourDateId,
              deletedAt: null,
              version: tourDate.version,
            },
            data: { version: { increment: 1 } },
          });
          if (locked.count !== 1) {
            throw new BusinessException(
              'SEAT_MAP_VERSION_CONFLICT',
              'Koltuk haritası başka bir işlem tarafından güncellendi; yenileyip tekrar deneyin',
            );
          }

          const rows = [];
          for (const item of items) {
            const seatCode = item.seatCode.trim();
            const guest = await this.loadConfirmedGuestTx(
              tx,
              item.reservationGuestId.trim(),
              tourDateId,
            );

            const seatTaken = await tx.seatAssignment.findFirst({
              where: { tourDateId, seatCode, deletedAt: null },
              select: { id: true },
            });
            if (seatTaken) {
              throw new BusinessException(
                'SEAT_OCCUPIED',
                `Koltuk ${seatCode} dolu (SOLD) — üzerine yazılamaz`,
              );
            }

            const guestTaken = await tx.seatAssignment.findFirst({
              where: {
                reservationGuestId: guest.id,
                deletedAt: null,
              },
              select: { id: true },
            });
            if (guestTaken) {
              throw new BusinessException(
                'GUEST_ALREADY_SEATED',
                'Misafirin zaten koltuğu var',
              );
            }

            await this.assertGenderAdjacencyTx(
              tx,
              tourDateId,
              layoutJson,
              seatCode,
              inferGenderFromIdentity(guest.identityNumber),
            );

            const row = await tx.seatAssignment.create({
              data: {
                tourDateId,
                seatCode,
                reservationGuestId: guest.id,
                reservationId: guest.reservationId,
                assignedByAgencyId: agencyId ?? null,
                source: 'MANUAL',
              },
            });
            rows.push(row);
          }
          return rows;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return {
        success: true,
        data: {
          assignedCount: created.length,
          layoutVersion: tourDate.version + 1,
          assignments: created,
        },
        error: null,
      };
    } catch (err) {
      this.rethrowUniqueConflict(err);
      throw err;
    }
  }

  async unassign(
    assignmentId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const assignment = await this.prisma.seatAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        tourDate: {
          include: {
            tour: { select: { id: true, agencyId: true, deletedAt: true } },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'SEAT_ASSIGNMENT_NOT_FOUND',
        message: 'Koltuk ataması bulunamadı',
      });
    }

    this.assertTourOwnership(
      assignment.tourDate.tour.agencyId,
      agencyId,
      role,
      assignment.tourDate.tour.deletedAt,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.tourDate.update({
        where: { id: assignment.tourDateId },
        data: { version: { increment: 1 } },
      });
      return tx.seatAssignment.update({
        where: { id: assignmentId },
        data: {
          deletedAt: new Date(),
          ...(deletedBy ? { deletedBy } : {}),
        },
      });
    });

    return { success: true, data: updated, error: null };
  }

  /**
   * AUTO_FIFO — tek transaction + createMany; version OCC; cinsiyet uyumlu yerleştirme.
   */
  async autoFifo(
    tourDateId: string,
    agencyId: string | undefined,
    role: string | null,
    expectedTourId?: string,
  ) {
    const tourDate = await this.findOwnedTourDate(tourDateId, agencyId, role);
    this.assertTourIdMatch(tourDate.tourId, expectedTourId);
    this.assertLayout(tourDate);
    await this.ensureReservationGuestsMaterialized(tourDateId);

    const layoutJson = tourDate.busSeatLayout!
      .layoutJson as unknown as BusLayoutJson;
    const codes = sellableSeatCodes(layoutJson);

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const locked = await tx.tourDate.updateMany({
            where: {
              id: tourDateId,
              deletedAt: null,
              version: tourDate.version,
            },
            data: { version: { increment: 1 } },
          });
          if (locked.count !== 1) {
            throw new BusinessException(
              'SEAT_MAP_VERSION_CONFLICT',
              'Koltuk haritası başka bir işlem tarafından güncellendi; yenileyip tekrar deneyin',
            );
          }

          const occupied = await tx.seatAssignment.findMany({
            where: { tourDateId, deletedAt: null },
            select: {
              seatCode: true,
              reservationGuestId: true,
              reservationGuest: { select: { identityNumber: true } },
            },
          });
          const takenSeats = new Set(occupied.map((row) => row.seatCode));
          const seatedGuests = new Set(
            occupied.map((row) => row.reservationGuestId),
          );
          const genderBySeat = new Map<string, SeatGender>();
          for (const row of occupied) {
            genderBySeat.set(
              row.seatCode,
              inferGenderFromIdentity(row.reservationGuest.identityNumber),
            );
          }

          const guests = await this.listUnassignedGuestsTx(tx, tourDateId);
          const queue = guests.filter((guest) => !seatedGuests.has(guest.id));

          const freeSeats = codes.filter((code) => !takenSeats.has(code));
          const rows: Array<{
            tourDateId: string;
            seatCode: string;
            reservationGuestId: string;
            reservationId: string;
            assignedByAgencyId: string | null;
            source: string;
          }> = [];

          const remainingSeats = [...freeSeats];
          for (const guest of queue) {
            const gender = inferGenderFromIdentity(guest.identityNumber);
            const seatIndex = remainingSeats.findIndex((seatCode) => {
              const neighbors = adjacentSellableCodes(layoutJson, seatCode);
              return !neighbors.some((neighbor) => {
                const neighborGender = genderBySeat.get(neighbor);
                return (
                  neighborGender != null &&
                  gendersConflict(gender, neighborGender)
                );
              });
            });
            if (seatIndex < 0) continue;
            const [seatCode] = remainingSeats.splice(seatIndex, 1);
            genderBySeat.set(seatCode, gender);
            rows.push({
              tourDateId,
              seatCode,
              reservationGuestId: guest.id,
              reservationId: guest.reservationId,
              assignedByAgencyId: agencyId ?? null,
              source: 'AUTO_FIFO',
            });
          }

          if (rows.length > 0) {
            await tx.seatAssignment.createMany({ data: rows });
          }

          const created =
            rows.length > 0
              ? await tx.seatAssignment.findMany({
                  where: {
                    tourDateId,
                    deletedAt: null,
                    reservationGuestId: {
                      in: rows.map((row) => row.reservationGuestId),
                    },
                    source: 'AUTO_FIFO',
                  },
                })
              : [];

          return {
            assignedCount: rows.length,
            remainingUnassigned: queue.length - rows.length,
            remainingFreeSeats: freeSeats.length - rows.length,
            assignments: created,
            layoutVersion: tourDate.version + 1,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return { success: true, data: result, error: null };
    } catch (err) {
      this.rethrowUniqueConflict(err);
      throw err;
    }
  }

  private async assertGenderAdjacencyTx(
    tx: Prisma.TransactionClient,
    tourDateId: string,
    layoutJson: BusLayoutJson,
    seatCode: string,
    gender: SeatGender,
  ) {
    if (gender === SeatGender.UNKNOWN) return;

    const neighbors = adjacentSellableCodes(layoutJson, seatCode);
    if (neighbors.length === 0) return;

    const neighborRows = await tx.seatAssignment.findMany({
      where: {
        tourDateId,
        seatCode: { in: neighbors },
        deletedAt: null,
      },
      select: {
        seatCode: true,
        reservationGuest: { select: { identityNumber: true, fullName: true } },
      },
    });

    for (const row of neighborRows) {
      const neighborGender = inferGenderFromIdentity(
        row.reservationGuest.identityNumber,
      );
      if (gendersConflict(gender, neighborGender)) {
        throw new BusinessException(
          'GENDER_ADJACENCY_VIOLATION',
          `Koltuk ${seatCode}: yanındaki ${row.seatCode} farklı cinsiyet (${row.reservationGuest.fullName}) — atama yapılamaz`,
        );
      }
    }
  }

  private async ensureReservationGuestsMaterialized(tourDateId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        tourDateId,
        deletedAt: null,
        status: 'CONFIRMED',
      },
      select: {
        id: true,
        guests: true,
        reservationGuests: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    for (const reservation of reservations) {
      if (reservation.reservationGuests.length > 0) continue;
      if (
        !Array.isArray(reservation.guests) ||
        reservation.guests.length === 0
      ) {
        continue;
      }

      const rows: Array<{
        reservationId: string;
        fullName: string;
        identityNumber: string;
        sortOrder: number;
      }> = [];

      reservation.guests.forEach((raw, index) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
        const guest = raw as Record<string, unknown>;
        const firstName =
          typeof guest.firstName === 'string' ? guest.firstName.trim() : '';
        const lastName =
          typeof guest.lastName === 'string' ? guest.lastName.trim() : '';
        const fullName =
          `${firstName} ${lastName}`.trim() ||
          (typeof guest.fullName === 'string' ? guest.fullName.trim() : '') ||
          `Misafir ${index + 1}`;
        const identityNumber =
          typeof guest.identityNumber === 'string' &&
          guest.identityNumber.trim().length > 0
            ? guest.identityNumber.trim()
            : `LEGACY-${reservation.id.slice(-6)}-${index + 1}`;
        rows.push({
          reservationId: reservation.id,
          fullName,
          identityNumber,
          sortOrder: index,
        });
      });

      if (rows.length > 0) {
        await this.prisma.reservationGuest.createMany({ data: rows });
      }
    }
  }

  private async listUnassignedGuestsInternal(tourDateId: string) {
    return this.listUnassignedGuestsTx(this.prisma, tourDateId);
  }

  private async listUnassignedGuestsTx(
    db: Prisma.TransactionClient | PrismaService,
    tourDateId: string,
  ) {
    const reservations = await db.reservation.findMany({
      where: {
        tourDateId,
        deletedAt: null,
        status: 'CONFIRMED',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        bookingNumber: true,
        createdAt: true,
        reservationGuests: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            fullName: true,
            identityNumber: true,
            sortOrder: true,
            reservationId: true,
            seatAssignments: {
              where: { deletedAt: null },
              select: { id: true },
            },
          },
        },
      },
    });

    const guests = [];
    for (const reservation of reservations) {
      for (const guest of reservation.reservationGuests) {
        if (guest.seatAssignments.length === 0) {
          guests.push({
            id: guest.id,
            fullName: guest.fullName,
            identityNumber: guest.identityNumber,
            sortOrder: guest.sortOrder,
            reservationId: guest.reservationId,
            bookingNumber: reservation.bookingNumber,
            reservationCreatedAt: reservation.createdAt,
          });
        }
      }
    }
    return guests;
  }

  private async loadConfirmedGuestTx(
    tx: Prisma.TransactionClient,
    guestId: string,
    tourDateId: string,
  ) {
    const guest = await tx.reservationGuest.findFirst({
      where: { id: guestId, deletedAt: null },
      include: {
        reservation: {
          select: {
            id: true,
            tourDateId: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!guest || guest.reservation.deletedAt) {
      throw new NotFoundException({
        code: 'GUEST_NOT_FOUND',
        message: 'Misafir bulunamadı',
      });
    }

    if (guest.reservation.tourDateId !== tourDateId) {
      throw new BusinessException(
        'GUEST_WRONG_TOUR_DATE',
        'Misafir bu tur tarihine ait değil',
      );
    }

    if (guest.reservation.status !== 'CONFIRMED') {
      throw new BusinessException(
        'RESERVATION_NOT_CONFIRMED',
        'Yalnızca onaylı rezervasyon misafirlerine koltuk atanır',
      );
    }

    return guest;
  }

  private assertLayout(tourDate: {
    busSeatLayoutId: string | null;
    busSeatLayout: { layoutJson: unknown } | null;
  }) {
    if (!tourDate.busSeatLayoutId || !tourDate.busSeatLayout) {
      throw new BusinessException(
        'LAYOUT_REQUIRED',
        'Önce TourDate için bus seat layout seçilmeli',
      );
    }
  }

  private assertSellableSeat(layoutJson: unknown, seatCode: string) {
    const codes = sellableSeatCodes(layoutJson as BusLayoutJson);
    if (!codes.includes(seatCode)) {
      throw new BusinessException(
        'INVALID_SEAT_CODE',
        'Geçersiz veya satılamaz koltuk kodu (CREW atanamaz)',
      );
    }
  }

  private assertTourIdMatch(actualTourId: string, expectedTourId?: string) {
    if (expectedTourId && expectedTourId !== actualTourId) {
      throw new ForbiddenException({
        code: 'TOUR_DATE_MISMATCH',
        message: 'Tur tarihi bu tura ait değil',
      });
    }
  }

  private rethrowUniqueConflict(err: unknown): void {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new BusinessException(
        'SEAT_OCCUPIED',
        'Koltuk dolu veya misafir zaten oturtulmuş (eşzamanlı çakışma)',
      );
    }
  }

  private async findOwnedTourDate(
    tourDateId: string,
    agencyId: string | undefined,
    role: string | null,
  ) {
    const tourDate = await this.prisma.tourDate.findFirst({
      where: { id: tourDateId, deletedAt: null },
      include: {
        tour: { select: { id: true, agencyId: true, deletedAt: true } },
        busSeatLayout: true,
      },
    });

    if (!tourDate || tourDate.tour.deletedAt) {
      throw new NotFoundException({
        code: 'TOUR_DATE_NOT_FOUND',
        message: 'Tur tarihi bulunamadı',
      });
    }

    this.assertTourOwnership(
      tourDate.tour.agencyId,
      agencyId,
      role,
      tourDate.tour.deletedAt,
    );

    return { ...tourDate, tourId: tourDate.tour.id };
  }

  private assertTourOwnership(
    tourAgencyId: string,
    agencyId: string | undefined,
    role: string | null,
    tourDeletedAt: Date | null,
  ) {
    if (tourDeletedAt) {
      throw new NotFoundException({
        code: 'TOUR_DATE_NOT_FOUND',
        message: 'Tur tarihi bulunamadı',
      });
    }
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin && tourAgencyId !== agencyId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu tura erişim yetkiniz yok',
      });
    }
  }
}

export { SeatGender, SeatUiStatus };
