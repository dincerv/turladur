import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../core/database/prisma.service';
import { BusLayoutKind } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { SYSTEM_BUS_LAYOUTS } from '../../../shared/utils/bus-seat-layout';
import type { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';

const VEHICLE_SELECT = {
  id: true,
  plateNumber: true,
  seatLayoutKind: true,
  capacity: true,
  isActive: true,
  modelYear: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

function capacityForKind(kind: BusLayoutKind): number {
  const def = SYSTEM_BUS_LAYOUTS.find((row) => row.kind === kind);
  if (!def) {
    throw new BusinessException(
      'INVALID_BUS_LAYOUT_KIND',
      'Geçersiz otobüs tipi',
    );
  }
  return def.passengerSeats;
}

function normalizePlate(plate: string): string {
  return plate.trim().replace(/\s+/g, ' ').toUpperCase();
}

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async list(busCompanyId: string) {
    await this.requireBusCompany(busCompanyId);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { busCompanyId, deletedAt: null },
      orderBy: { plateNumber: 'asc' },
      select: VEHICLE_SELECT,
    });
    return { success: true as const, data: vehicles, error: null };
  }

  /**
   * Soft-live dashboard KPIs — fleet size, assignments, utilization.
   */
  async getDashboard(busCompanyId: string) {
    const bus = await this.prisma.busCompany.findFirst({
      where: { id: busCompanyId, deletedAt: null },
    });
    if (!bus) {
      throw new NotFoundException({
        code: 'BUS_COMPANY_NOT_FOUND',
        message: 'Otobüs firması bulunamadı',
      });
    }

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fromDay = now.toISOString().slice(0, 10);
    const toDay = in30.toISOString().slice(0, 10);

    const [
      vehicleCount,
      activeVehicleCount,
      pendingAssignments,
      acceptedUpcoming,
      vehicleIds,
    ] = await Promise.all([
      this.prisma.vehicle.count({
        where: { busCompanyId, deletedAt: null },
      }),
      this.prisma.vehicle.count({
        where: { busCompanyId, deletedAt: null, isActive: true },
      }),
      this.prisma.tourDateAssignment.count({
        where: {
          busCompanyId,
          deletedAt: null,
          role: 'BUS',
          status: 'PENDING',
        },
      }),
      this.prisma.tourDateAssignment.count({
        where: {
          busCompanyId,
          deletedAt: null,
          role: 'BUS',
          status: 'ACCEPTED',
          tourDate: {
            deletedAt: null,
            startDate: { gte: now },
          },
        },
      }),
      this.prisma.vehicle.findMany({
        where: { busCompanyId, deletedAt: null, isActive: true },
        select: { id: true },
      }),
    ]);

    const ids = vehicleIds.map((row) => row.id);
    let reservedDaysNext30 = 0;
    let unavailableDaysNext30 = 0;
    if (ids.length > 0) {
      const [lockedTourDates, closedDays] = await Promise.all([
        this.prisma.tourDate.findMany({
          where: {
            vehicleId: { in: ids },
            deletedAt: null,
            startDate: { lte: in30 },
            endDate: { gte: now },
          },
          select: { startDate: true, endDate: true },
        }),
        this.prisma.vehicleAvailability.count({
          where: {
            vehicleId: { in: ids },
            deletedAt: null,
            isAvailable: false,
            date: {
              gte: new Date(`${fromDay}T00:00:00.000Z`),
              lte: new Date(`${toDay}T23:59:59.999Z`),
            },
          },
        }),
      ]);
      unavailableDaysNext30 = closedDays;
      for (const tourDate of lockedTourDates) {
        const start = Math.max(tourDate.startDate.getTime(), now.getTime());
        const end = Math.min(tourDate.endDate.getTime(), in30.getTime());
        if (end >= start) {
          reservedDaysNext30 +=
            Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
        }
      }
    }

    const capacityDays = Math.max(activeVehicleCount, 1) * 30;
    const busyDays = Math.min(
      capacityDays,
      reservedDaysNext30 + unavailableDaysNext30,
    );
    const fleetUtilizationPercent = Math.round((busyDays / capacityDays) * 100);

    return {
      success: true as const,
      data: {
        status: bus.status,
        verifiedAt: bus.verifiedAt?.toISOString() ?? null,
        companyName: bus.companyName,
        contactEmail: bus.contactEmail,
        vehicleCount,
        activeVehicleCount,
        pendingAssignments,
        acceptedUpcoming,
        fleetUtilizationPercent,
      },
      error: null,
    };
  }

  async create(busCompanyId: string, dto: CreateVehicleDto) {
    await this.requireBusCompany(busCompanyId);
    const plateNumber = normalizePlate(dto.plateNumber);
    await this.assertPlateFree(busCompanyId, plateNumber);

    const capacity = capacityForKind(dto.seatLayoutKind);
    const vehicle = await this.prisma.vehicle.create({
      data: {
        busCompanyId,
        plateNumber,
        seatLayoutKind: dto.seatLayoutKind,
        capacity,
        modelYear: dto.modelYear ?? null,
        notes: dto.notes?.trim() || null,
        isActive: true,
      },
      select: VEHICLE_SELECT,
    });

    return { success: true as const, data: vehicle, error: null };
  }

  async update(busCompanyId: string, vehicleId: string, dto: UpdateVehicleDto) {
    await this.requireOwnedVehicle(busCompanyId, vehicleId);

    const data: {
      plateNumber?: string;
      seatLayoutKind?: BusLayoutKind;
      capacity?: number;
      modelYear?: number | null;
      isActive?: boolean;
      notes?: string | null;
    } = {};

    if (dto.plateNumber !== undefined) {
      const plateNumber = normalizePlate(dto.plateNumber);
      await this.assertPlateFree(busCompanyId, plateNumber, vehicleId);
      data.plateNumber = plateNumber;
    }
    if (dto.seatLayoutKind !== undefined) {
      data.seatLayoutKind = dto.seatLayoutKind;
      data.capacity = capacityForKind(dto.seatLayoutKind);
    }
    if (dto.modelYear !== undefined) {
      data.modelYear = dto.modelYear;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes?.trim() || null;
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      select: VEHICLE_SELECT,
    });

    return { success: true as const, data: vehicle, error: null };
  }

  async softDelete(
    busCompanyId: string,
    vehicleId: string,
    deletedBy?: string,
  ) {
    await this.requireOwnedVehicle(busCompanyId, vehicleId);

    const assigned = await this.prisma.tourDate.findFirst({
      where: {
        vehicleId,
        deletedAt: null,
        endDate: { gte: new Date() },
      },
      select: { id: true },
    });
    if (assigned) {
      throw new BusinessException(
        'VEHICLE_IN_USE',
        'Aktif veya gelecek sefere atanmış araç silinemez',
      );
    }

    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        ...(deletedBy ? { deletedBy } : {}),
      },
    });

    return { success: true as const, data: { id: vehicleId }, error: null };
  }

  private async assertPlateFree(
    busCompanyId: string,
    plateNumber: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        busCompanyId,
        plateNumber,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'PLATE_EXISTS',
        message: 'Bu plaka zaten kayıtlı',
      });
    }
  }

  private async requireBusCompany(busCompanyId: string) {
    const bus = await this.prisma.busCompany.findFirst({
      where: { id: busCompanyId, deletedAt: null },
      select: { id: true },
    });
    if (!bus) {
      throw new NotFoundException({
        code: 'BUS_COMPANY_NOT_FOUND',
        message: 'Otobüs firması bulunamadı',
      });
    }
    return bus;
  }

  private async requireOwnedVehicle(busCompanyId: string, vehicleId: string) {
    await this.requireBusCompany(busCompanyId);
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, busCompanyId, deletedAt: null },
      select: { id: true },
    });
    if (!vehicle) {
      throw new NotFoundException({
        code: 'VEHICLE_NOT_FOUND',
        message: 'Araç bulunamadı',
      });
    }
    return vehicle;
  }
}
