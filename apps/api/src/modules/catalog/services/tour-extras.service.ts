import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isValidGeoCoordinate } from '@turta/shared-constants';

import { isPlatformAdminRole } from '../../../core/auth/utils/role-access';
import { Prisma } from '../../../generated/prisma';

import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreateTourPickupPointDto,
  UpdateTourPickupPointDto,
  UpsertTourAccommodationDto,
} from '../dto/tour-extras.dto';

@Injectable()
export class TourExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccommodation(tourId: string) {
    const tour = await this.requireTour(tourId);
    const row = await this.prisma.tourAccommodation.findFirst({
      where: { tourId: tour.id, deletedAt: null },
    });
    return {
      success: true,
      data: row ? this.toAccommodation(row) : null,
      error: null,
    };
  }

  async upsertAccommodation(
    tourId: string,
    dto: UpsertTourAccommodationDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const data = {
      name: dto.name.trim(),
      image: dto.image,
      location: dto.location.trim(),
      type: dto.type.trim(),
      rating: dto.rating ?? 0,
      features: (dto.features ?? []) as unknown as Prisma.InputJsonValue,
      description: dto.description?.trim(),
      deletedAt: null as Date | null,
    };

    const row = await this.prisma.tourAccommodation.upsert({
      where: { tourId: tour.id },
      create: { tourId: tour.id, ...data },
      update: data,
    });

    return {
      success: true,
      data: this.toAccommodation(row),
      error: null,
    };
  }

  async deleteAccommodation(
    tourId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const existing = await this.prisma.tourAccommodation.findFirst({
      where: { tourId: tour.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'ACCOMMODATION_NOT_FOUND',
        message: 'Konaklama bilgisi bulunamadı',
      });
    }
    await this.prisma.tourAccommodation.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true,
      data: { tourId: tour.id, deleted: true },
      error: null,
    };
  }

  async listPickupPoints(tourId: string) {
    const tour = await this.requireTour(tourId);
    const rows = await this.prisma.tourPickupPoint.findMany({
      where: { tourId: tour.id, deletedAt: null, isActive: true },
      orderBy: { order: 'asc' },
    });
    return {
      success: true,
      data: rows.map((r) => this.toPickup(r)),
      error: null,
    };
  }

  async createPickupPoint(
    tourId: string,
    dto: CreateTourPickupPointDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const geo = this.normalizePickupGeo(dto.latitude, dto.longitude);
    const row = await this.prisma.tourPickupPoint.create({
      data: {
        tourId: tour.id,
        city: dto.city.trim(),
        location: dto.location.trim(),
        time: dto.time.trim(),
        description: dto.description?.trim(),
        latitude: geo.latitude,
        longitude: geo.longitude,
        order: dto.order ?? 0,
        isFixedOrigin: dto.isFixedOrigin ?? false,
      },
    });
    return { success: true, data: this.toPickup(row), error: null };
  }

  async updatePickupPoint(
    tourId: string,
    pointId: string,
    dto: UpdateTourPickupPointDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const existing = await this.prisma.tourPickupPoint.findFirst({
      where: { id: pointId, tourId: tour.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'PICKUP_POINT_NOT_FOUND',
        message: 'Kalkış noktası bulunamadı',
      });
    }

    const data: Prisma.TourPickupPointUpdateInput = {};
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.location !== undefined) data.location = dto.location.trim();
    if (dto.time !== undefined) data.time = dto.time.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      const geo = this.normalizePickupGeo(dto.latitude, dto.longitude);
      data.latitude = geo.latitude;
      data.longitude = geo.longitude;
    }
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isFixedOrigin !== undefined) data.isFixedOrigin = dto.isFixedOrigin;

    const updated = await this.prisma.tourPickupPoint.update({
      where: { id: existing.id },
      data,
    });
    return { success: true, data: this.toPickup(updated), error: null };
  }

  async deletePickupPoint(
    tourId: string,
    pointId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const existing = await this.prisma.tourPickupPoint.findFirst({
      where: { id: pointId, tourId: tour.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'PICKUP_POINT_NOT_FOUND',
        message: 'Kalkış noktası bulunamadı',
      });
    }
    await this.prisma.tourPickupPoint.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true,
      data: { id: pointId, deleted: true },
      error: null,
    };
  }

  private async requireTour(tourId: string) {
    const key = tourId.trim();
    const tour = await this.prisma.tour.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: key }, { slug: key }],
      },
    });
    if (!tour) {
      throw new NotFoundException({
        code: 'TOUR_NOT_FOUND',
        message: 'Tur bulunamadı',
      });
    }
    return tour;
  }

  private async findOwnedTour(
    tourId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.requireTour(tourId);
    const isAdmin = isPlatformAdminRole(role);
    if (!isAdmin && tour.agencyId !== agencyId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu tura erişim yetkiniz yok',
      });
    }
    return tour;
  }

  private toAccommodation(row: {
    id: string;
    tourId: string;
    name: string;
    image: string;
    location: string;
    type: string;
    rating: number;
    features: Prisma.JsonValue;
    description: string | null;
  }) {
    return {
      id: row.id,
      tourId: row.tourId,
      name: row.name,
      image: row.image,
      location: row.location,
      type: row.type,
      rating: row.rating,
      features: row.features,
      description: row.description,
    };
  }

  private normalizePickupGeo(
    latitude?: number,
    longitude?: number,
  ): { latitude: number | null; longitude: number | null } {
    if (
      isValidGeoCoordinate(latitude, longitude) &&
      typeof longitude === 'number'
    ) {
      return { latitude, longitude };
    }
    return { latitude: null, longitude: null };
  }

  private toPickup(row: {
    id: string;
    tourId: string;
    city: string;
    location: string;
    time: string;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    order: number;
    isFixedOrigin: boolean;
    isActive: boolean;
  }) {
    return {
      id: row.id,
      tourId: row.tourId,
      city: row.city,
      location: row.location,
      time: row.time,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      order: row.order,
      isFixedOrigin: row.isFixedOrigin,
      isActive: row.isActive,
    };
  }
}
