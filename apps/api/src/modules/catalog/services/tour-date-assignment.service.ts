import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  parseInviteBusAssignment,
  parseInviteGuideAssignment,
} from '@turta/shared-validators';
import { ZodError } from 'zod';
import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';

import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/exceptions/business.exception';

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED'] as const;

type AssignmentRole = 'GUIDE' | 'BUS';
type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class TourDateAssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  async listByTourDate(
    tourDateId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    await this.findOwnedTourDate(tourDateId, agencyId, role);
    const rows = await this.prisma.tourDateAssignment.findMany({
      where: { tourDateId, deletedAt: null },
      include: {
        guide: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            city: true,
          },
        },
        busCompany: {
          select: {
            id: true,
            companyName: true,
            contactEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rows, error: null };
  }

  /** Guide inbox: PENDING / ACCEPTED assignments for logged-in guide. */
  async listForGuide(guideId: string) {
    const rows = await this.prisma.tourDateAssignment.findMany({
      where: {
        guideId,
        deletedAt: null,
        role: 'GUIDE',
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        tourDate: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            tour: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rows, error: null };
  }

  /** Bus company inbox: PENDING / ACCEPTED assignments. */
  async listForBusCompany(busCompanyId: string) {
    const rows = await this.prisma.tourDateAssignment.findMany({
      where: {
        busCompanyId,
        deletedAt: null,
        role: 'BUS',
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        tourDate: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            vehicleId: true,
            tour: { select: { id: true, title: true } },
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                seatLayoutKind: true,
                capacity: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rows, error: null };
  }

  /** Agency global inbox — all roles/statuses for invitedByAgencyId. */
  async listForAgency(agencyId: string | undefined, role: string) {
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin && !agencyId) {
      throw new ForbiddenException({
        code: 'AGENCY_REQUIRED',
        message: 'Acente hesabı gerekli',
      });
    }

    const rows = await this.prisma.tourDateAssignment.findMany({
      where: {
        deletedAt: null,
        ...(isAdmin && !agencyId
          ? {}
          : { invitedByAgencyId: agencyId as string }),
      },
      include: {
        guide: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            city: true,
          },
        },
        busCompany: {
          select: {
            id: true,
            companyName: true,
            contactEmail: true,
          },
        },
        tourDate: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            vehicleId: true,
            tour: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: rows, error: null };
  }

  async inviteGuide(
    tourDateId: string,
    dto: { guideId: string; note?: string },
    agencyId: string | undefined,
    role: string,
  ) {
    const parsed = this.parseGuideDto(dto);
    const tourDate = await this.findOwnedTourDate(tourDateId, agencyId, role);
    const invitedByAgencyId = await this.requireAgencyId(
      tourDate.tour.agencyId,
    );
    this.assertAgencyMatchesTenant(invitedByAgencyId, agencyId, role);

    const guide = await this.prisma.guide.findFirst({
      where: { id: parsed.guideId, deletedAt: null, status: 'VERIFIED' },
    });
    if (!guide) {
      throw new NotFoundException({
        code: 'GUIDE_NOT_FOUND',
        message: 'Rehber bulunamadı',
      });
    }

    if (guide.ruhsatExpiresAt && guide.ruhsatExpiresAt.getTime() < Date.now()) {
      throw new BusinessException(
        'GUIDE_RUHSAT_EXPIRED',
        'Rehber ruhsat süresi dolmuş',
      );
    }

    const days = eachCalendarDay(tourDate.startDate, tourDate.endDate);

    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertNoActiveRoleAssignment(tx, tourDateId, 'GUIDE');
      await this.assertGuideDaysFree(tx, parsed.guideId, days);
      await this.assertNoGuideScheduleConflict(
        tx,
        parsed.guideId,
        tourDate.startDate,
        tourDate.endDate,
        tourDateId,
      );

      return tx.tourDateAssignment.create({
        data: {
          tourDateId,
          role: 'GUIDE',
          guideId: parsed.guideId,
          status: 'PENDING',
          invitedByAgencyId,
          note: parsed.note ?? null,
        },
        include: {
          guide: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
            },
          },
        },
      });
    });

    return { success: true, data: row, error: null };
  }

  /** Agency withdraws a PENDING invite (soft-delete). */
  async withdrawPending(
    assignmentId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const assignment = await this.prisma.tourDateAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        tourDate: {
          include: { tour: { select: { agencyId: true } } },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Atama bulunamadı',
      });
    }

    this.agencyLink.assertSellerOwner(
      { agencyId: assignment.tourDate.tour.agencyId },
      { agencyId, role },
      'Bu tura erişim yetkiniz yok',
    );
    this.assertAgencyMatchesTenant(
      assignment.invitedByAgencyId,
      agencyId,
      role,
    );

    if (assignment.status !== 'PENDING') {
      throw new BusinessException(
        'ASSIGNMENT_NOT_PENDING',
        'Sadece PENDING davetler geri çekilebilir',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      return tx.tourDateAssignment.update({
        where: { id: assignmentId },
        data: {
          deletedAt: new Date(),
          ...(deletedBy ? { deletedBy } : {}),
          note: assignment.note
            ? `${assignment.note}\n[Withdrawn by agency]`
            : 'Withdrawn by agency',
        },
      });
    });

    return { success: true, data: updated, error: null };
  }

  async inviteBus(
    tourDateId: string,
    dto: { busCompanyId: string; note?: string },
    agencyId: string | undefined,
    role: string,
  ) {
    const parsed = this.parseBusDto(dto);
    const tourDate = await this.findOwnedTourDate(tourDateId, agencyId, role);
    const invitedByAgencyId = await this.requireAgencyId(
      tourDate.tour.agencyId,
    );
    this.assertAgencyMatchesTenant(invitedByAgencyId, agencyId, role);

    const busCompany = await this.prisma.busCompany.findFirst({
      where: {
        id: parsed.busCompanyId,
        deletedAt: null,
        status: 'VERIFIED',
      },
    });
    if (!busCompany) {
      throw new NotFoundException({
        code: 'BUS_COMPANY_NOT_FOUND',
        message: 'Otobüs firması bulunamadı',
      });
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertNoActiveRoleAssignment(tx, tourDateId, 'BUS');
      await this.assertNoBusScheduleConflict(
        tx,
        parsed.busCompanyId,
        tourDate.startDate,
        tourDate.endDate,
        tourDateId,
      );

      return tx.tourDateAssignment.create({
        data: {
          tourDateId,
          role: 'BUS',
          busCompanyId: parsed.busCompanyId,
          status: 'PENDING',
          invitedByAgencyId,
          note: parsed.note ?? null,
        },
        include: {
          busCompany: {
            select: {
              id: true,
              companyName: true,
              contactEmail: true,
            },
          },
        },
      });
    });

    return { success: true, data: row, error: null };
  }

  async respond(
    assignmentId: string,
    dto: {
      status: 'ACCEPTED' | 'REJECTED';
      vehicleId?: string;
      note?: string;
      actorGuideId?: string;
      actorBusCompanyId?: string;
    },
    agencyId: string | undefined,
    role: string,
  ) {
    const assignment = await this.prisma.tourDateAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        tourDate: {
          include: { tour: { select: { agencyId: true } } },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Atama bulunamadı',
      });
    }

    if (assignment.status !== 'PENDING') {
      throw new BusinessException(
        'ASSIGNMENT_NOT_PENDING',
        'Sadece PENDING atamalar yanıtlanabilir',
      );
    }

    const isAdmin = isPlatformAdminRole(role);
    this.assertRespondActor(assignment, dto, isAdmin);

    if (dto.status === 'REJECTED') {
      const updated = await this.prisma.$transaction(async (tx) => {
        return tx.tourDateAssignment.update({
          where: { id: assignmentId },
          data: {
            status: 'REJECTED',
            respondedAt: new Date(),
            note: dto.note ?? assignment.note,
          },
        });
      });
      return { success: true, data: updated, error: null };
    }

    // ACCEPTED
    if (assignment.role === 'GUIDE') {
      if (!assignment.guideId) {
        throw new BusinessException(
          'ASSIGNMENT_INVALID',
          'GUIDE atamasında guideId yok',
        );
      }
      return this.acceptGuide(assignment);
    }

    if (assignment.role === 'BUS') {
      if (!assignment.busCompanyId) {
        throw new BusinessException(
          'ASSIGNMENT_INVALID',
          'BUS atamasında busCompanyId yok',
        );
      }
      if (!dto.vehicleId) {
        throw new BusinessException(
          'VEHICLE_REQUIRED',
          'Otobüs kabulünde vehicleId zorunlu',
        );
      }
      return this.acceptBus(assignment, dto.vehicleId, dto.note);
    }

    throw new BusinessException(
      'ASSIGNMENT_INVALID_ROLE',
      'Geçersiz atama rolü',
    );
  }

  /** ACCEPTED atamayı iptal: mirror temizle + müsaitlik aç. */
  async cancelAccepted(
    assignmentId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const assignment = await this.prisma.tourDateAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        tourDate: {
          include: { tour: { select: { agencyId: true } } },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Atama bulunamadı',
      });
    }

    await this.assertTourOwnership(
      assignment.tourDate.tour.agencyId,
      agencyId,
      role,
    );
    this.assertAgencyMatchesTenant(
      assignment.invitedByAgencyId,
      agencyId,
      role,
    );

    if (assignment.status !== 'ACCEPTED') {
      throw new BusinessException(
        'ASSIGNMENT_NOT_ACCEPTED',
        'Sadece ACCEPTED atamalar iptal edilebilir',
      );
    }

    const days = eachCalendarDay(
      assignment.tourDate.startDate,
      assignment.tourDate.endDate,
    );

    await this.prisma.$transaction(async (tx) => {
      if (assignment.role === 'GUIDE' && assignment.guideId) {
        for (const day of days) {
          await tx.guideAvailability.upsert({
            where: {
              guideId_date: { guideId: assignment.guideId, date: day },
            },
            create: {
              guideId: assignment.guideId,
              date: day,
              isAvailable: true,
            },
            update: { isAvailable: true, deletedAt: null },
          });
        }
        await tx.tourDate.update({
          where: { id: assignment.tourDateId },
          data: { guideId: null },
        });
      }

      if (assignment.role === 'BUS' && assignment.busCompanyId) {
        const tourDate = await tx.tourDate.findFirst({
          where: { id: assignment.tourDateId },
          select: { vehicleId: true },
        });
        if (tourDate?.vehicleId) {
          for (const day of days) {
            await tx.vehicleAvailability.upsert({
              where: {
                vehicleId_date: {
                  vehicleId: tourDate.vehicleId,
                  date: day,
                },
              },
              create: {
                vehicleId: tourDate.vehicleId,
                date: day,
                isAvailable: true,
              },
              update: { isAvailable: true, deletedAt: null },
            });
          }
        }
        await tx.tourDate.update({
          where: { id: assignment.tourDateId },
          data: { busCompanyId: null, vehicleId: null },
        });
      }

      await tx.tourDateAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'REJECTED',
          note: 'Cancelled by agency',
          respondedAt: new Date(),
          deletedAt: new Date(),
          ...(deletedBy ? { deletedBy } : {}),
        },
      });
    });

    const updated = await this.prisma.tourDateAssignment.findFirst({
      where: { id: assignmentId },
    });
    return { success: true, data: updated, error: null };
  }

  private async acceptGuide(assignment: {
    id: string;
    tourDateId: string;
    guideId: string | null;
    tourDate: { startDate: Date; endDate: Date };
  }) {
    const guideId = assignment.guideId!;
    const days = eachCalendarDay(
      assignment.tourDate.startDate,
      assignment.tourDate.endDate,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.assertGuideDaysFree(tx, guideId, days);
      await this.assertNoGuideScheduleConflict(
        tx,
        guideId,
        assignment.tourDate.startDate,
        assignment.tourDate.endDate,
        assignment.tourDateId,
      );

      for (const day of days) {
        await tx.guideAvailability.upsert({
          where: { guideId_date: { guideId, date: day } },
          create: { guideId, date: day, isAvailable: false },
          update: { isAvailable: false, deletedAt: null },
        });
      }

      await tx.tourDate.update({
        where: { id: assignment.tourDateId },
        data: { guideId },
      });

      return tx.tourDateAssignment.update({
        where: { id: assignment.id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
    });

    return { success: true, data: updated, error: null };
  }

  private async acceptBus(
    assignment: {
      id: string;
      tourDateId: string;
      busCompanyId: string | null;
      tourDate: { startDate: Date; endDate: Date };
    },
    vehicleId: string,
    note?: string,
  ) {
    const busCompanyId = assignment.busCompanyId!;
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        busCompanyId,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!vehicle) {
      throw new BusinessException(
        'VEHICLE_NOT_FOUND',
        'Araç bulunamadı veya firmaya ait değil',
      );
    }

    const days = eachCalendarDay(
      assignment.tourDate.startDate,
      assignment.tourDate.endDate,
    );

    const layout = await this.prisma.busSeatLayout.findFirst({
      where: {
        kind: vehicle.seatLayoutKind,
        isSystem: true,
        deletedAt: null,
      },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.assertVehicleDaysFree(tx, vehicleId, days);
      await this.assertNoVehicleScheduleConflict(
        tx,
        vehicleId,
        assignment.tourDate.startDate,
        assignment.tourDate.endDate,
        assignment.tourDateId,
      );

      for (const day of days) {
        await tx.vehicleAvailability.upsert({
          where: { vehicleId_date: { vehicleId, date: day } },
          create: { vehicleId, date: day, isAvailable: false },
          update: { isAvailable: false, deletedAt: null },
        });
      }

      const current = await tx.tourDate.findFirst({
        where: { id: assignment.tourDateId },
        select: { capacity: true, remainingCapacity: true },
      });
      const soldCount = current
        ? current.capacity - current.remainingCapacity
        : 0;

      const capacityUpdate =
        layout && soldCount <= layout.passengerSeats
          ? {
              busSeatLayoutId: layout.id,
              capacity: layout.passengerSeats,
              remainingCapacity: layout.passengerSeats - soldCount,
            }
          : layout
            ? { busSeatLayoutId: layout.id }
            : {};

      await tx.tourDate.update({
        where: { id: assignment.tourDateId },
        data: { busCompanyId, vehicleId, ...capacityUpdate },
      });

      return tx.tourDateAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
          note: note ?? undefined,
        },
      });
    });

    return { success: true, data: updated, error: null };
  }

  private async assertGuideDaysFree(
    db: DbClient,
    guideId: string,
    days: Date[],
  ) {
    const blocked = await db.guideAvailability.findMany({
      where: {
        guideId,
        date: { in: days },
        isAvailable: false,
        deletedAt: null,
      },
      select: { date: true },
    });
    if (blocked.length > 0) {
      throw new BusinessException(
        'GUIDE_UNAVAILABLE',
        'Rehber tur tarih aralığında müsait değil',
      );
    }
  }

  private async assertVehicleDaysFree(
    db: DbClient,
    vehicleId: string,
    days: Date[],
  ) {
    const blocked = await db.vehicleAvailability.findMany({
      where: {
        vehicleId,
        date: { in: days },
        isAvailable: false,
        deletedAt: null,
      },
      select: { date: true },
    });
    if (blocked.length > 0) {
      throw new BusinessException(
        'VEHICLE_UNAVAILABLE',
        'Araç tur tarih aralığında müsait değil',
      );
    }
  }

  /**
   * Overlap: guide already PENDING/ACCEPTED on another TourDate whose
   * [startDate, endDate] intersects this range.
   */
  private async assertNoGuideScheduleConflict(
    db: DbClient,
    guideId: string,
    startDate: Date,
    endDate: Date,
    excludeTourDateId: string,
  ) {
    const conflicting = await db.tourDateAssignment.findFirst({
      where: {
        guideId,
        role: 'GUIDE',
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        tourDateId: { not: excludeTourDateId },
        tourDate: {
          deletedAt: null,
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      },
      select: { id: true },
    });
    if (conflicting) {
      throw new BusinessException(
        'GUIDE_SCHEDULE_CONFLICT',
        'Rehber bu tarih aralığında başka bir turda görevli',
      );
    }
  }

  /**
   * Overlap: bus company already PENDING/ACCEPTED on another TourDate
   * whose range intersects this one.
   */
  private async assertNoBusScheduleConflict(
    db: DbClient,
    busCompanyId: string,
    startDate: Date,
    endDate: Date,
    excludeTourDateId: string,
  ) {
    const conflicting = await db.tourDateAssignment.findFirst({
      where: {
        busCompanyId,
        role: 'BUS',
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        tourDateId: { not: excludeTourDateId },
        tourDate: {
          deletedAt: null,
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      },
      select: { id: true },
    });
    if (conflicting) {
      throw new BusinessException(
        'BUS_SCHEDULE_CONFLICT',
        'Otobüs firması bu tarih aralığında başka bir turda görevli',
      );
    }
  }

  /** Overlap: same vehicle already mirrored on another TourDate. */
  private async assertNoVehicleScheduleConflict(
    db: DbClient,
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeTourDateId: string,
  ) {
    const conflicting = await db.tourDate.findFirst({
      where: {
        vehicleId,
        deletedAt: null,
        id: { not: excludeTourDateId },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    });
    if (conflicting) {
      throw new BusinessException(
        'VEHICLE_SCHEDULE_CONFLICT',
        'Araç bu tarih aralığında başka bir turda görevli',
      );
    }
  }

  private async assertNoActiveRoleAssignment(
    db: DbClient,
    tourDateId: string,
    assignmentRole: AssignmentRole,
  ) {
    const existing = await db.tourDateAssignment.findFirst({
      where: {
        tourDateId,
        role: assignmentRole,
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
      },
    });
    if (existing) {
      throw new BusinessException(
        'ASSIGNMENT_ALREADY_ACTIVE',
        `Bu tarih için aktif ${assignmentRole} ataması zaten var`,
      );
    }
  }

  private parseGuideDto(dto: { guideId: string; note?: string }) {
    try {
      return parseInviteGuideAssignment(dto);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'ASSIGNMENT_INVITE_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz rehber daveti',
          details: error.issues,
        });
      }
      throw error;
    }
  }

  private parseBusDto(dto: { busCompanyId: string; note?: string }) {
    try {
      return parseInviteBusAssignment(dto);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: 'ASSIGNMENT_INVITE_INVALID',
          message: error.issues[0]?.message ?? 'Geçersiz otobüs daveti',
          details: error.issues,
        });
      }
      throw error;
    }
  }

  /** Extra IDOR guard: invitedByAgencyId must match session agency. */
  private assertAgencyMatchesTenant(
    invitedByAgencyId: string | null | undefined,
    agencyId: string | undefined,
    role: string,
  ) {
    if (isPlatformAdminRole(role)) return;
    if (!agencyId || !invitedByAgencyId || invitedByAgencyId !== agencyId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message:
          'Bu işlem yalnızca kendi acentenizin kaynakları için yapılabilir',
      });
    }
  }

  private assertRespondActor(
    assignment: {
      role: string;
      guideId: string | null;
      busCompanyId: string | null;
      tourDate: { tour: { agencyId: string } };
    },
    dto: { actorGuideId?: string; actorBusCompanyId?: string },
    isAdmin: boolean,
  ) {
    if (isAdmin) return;

    if (assignment.role === 'GUIDE') {
      if (!dto.actorGuideId || dto.actorGuideId !== assignment.guideId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Bu atamayı yalnızca ilgili rehber yanıtlayabilir',
        });
      }
      return;
    }

    if (assignment.role === 'BUS') {
      if (
        !dto.actorBusCompanyId ||
        dto.actorBusCompanyId !== assignment.busCompanyId
      ) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Bu atamayı yalnızca ilgili otobüs firması yanıtlayabilir',
        });
      }
    }
  }

  private async requireAgencyId(agencyId: string | null): Promise<string> {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'AGENCY_REQUIRED',
        message: 'Acente kimliği gerekli',
      });
    }
    return agencyId;
  }

  private async findOwnedTourDate(
    tourDateId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const tourDate = await this.prisma.tourDate.findFirst({
      where: { id: tourDateId, deletedAt: null },
      include: {
        tour: { select: { agencyId: true, deletedAt: true } },
      },
    });

    if (!tourDate || tourDate.tour.deletedAt) {
      throw new NotFoundException({
        code: 'TOUR_DATE_NOT_FOUND',
        message: 'Tur tarihi bulunamadı',
      });
    }

    this.agencyLink.assertSellerOwner(
      {
        agencyId: tourDate.tour.agencyId,
      },
      { agencyId, role },
      'Bu tura erişim yetkiniz yok',
    );
    return tourDate;
  }

  private async assertTourOwnership(
    tourPartnerId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    this.agencyLink.assertSellerOwner(
      { agencyId: tourPartnerId },
      { agencyId, role },
      'Bu tura erişim yetkiniz yok',
    );
  }
}

/** startDate..endDate (Date-only) inclusive UTC günleri. */
export function eachCalendarDay(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );
  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    ),
  );

  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
