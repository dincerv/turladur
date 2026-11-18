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
  CreatePaidTourExtraDto,
  CreateTourPickupPointDto,
  UpdatePaidTourExtraDto,
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

  /** Public: active paid extras for a tour (checkout). */
  async listPaidExtras(tourId: string, includeInactive = false) {
    const tour = await this.requireTour(tourId);
    const rows = await this.prisma.tourExtra.findMany({
      where: {
        tourId: tour.id,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      success: true as const,
      data: rows.map((row) => this.toPaidExtra(row)),
      error: null,
    };
  }

  /** Agency: list all non-deleted extras (incl. inactive) for owned tour. */
  async listPaidExtrasForAgency(
    tourId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const rows = await this.prisma.tourExtra.findMany({
      where: { tourId: tour.id, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      success: true as const,
      data: rows.map((row) => this.toPaidExtra(row)),
      error: null,
    };
  }

  async createPaidExtra(
    tourId: string,
    dto: CreatePaidTourExtraDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const row = await this.prisma.tourExtra.create({
      data: {
        tourId: tour.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        price: new Prisma.Decimal(dto.price),
        currency: (dto.currency ?? 'TRY').toUpperCase().slice(0, 3),
        isRequired: dto.isRequired ?? false,
        isActive: dto.isActive ?? true,
        dayNumber: dto.dayNumber ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return {
      success: true as const,
      data: this.toPaidExtra(row),
      error: null,
    };
  }

  async updatePaidExtra(
    tourId: string,
    extraId: string,
    dto: UpdatePaidTourExtraDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const existing = await this.prisma.tourExtra.findFirst({
      where: { id: extraId, tourId: tour.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'TOUR_EXTRA_NOT_FOUND',
        message: 'Ekstra bulunamadı',
      });
    }

    const row = await this.prisma.tourExtra.update({
      where: { id: existing.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.price !== undefined
          ? { price: new Prisma.Decimal(dto.price) }
          : {}),
        ...(dto.currency !== undefined
          ? { currency: dto.currency.toUpperCase().slice(0, 3) }
          : {}),
        ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.dayNumber !== undefined ? { dayNumber: dto.dayNumber } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    return {
      success: true as const,
      data: this.toPaidExtra(row),
      error: null,
    };
  }

  async softDeletePaidExtra(
    tourId: string,
    extraId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const tour = await this.findOwnedTour(tourId, agencyId, role);
    const existing = await this.prisma.tourExtra.findFirst({
      where: { id: extraId, tourId: tour.id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'TOUR_EXTRA_NOT_FOUND',
        message: 'Ekstra bulunamadı',
      });
    }
    await this.prisma.tourExtra.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    return {
      success: true as const,
      data: { id: extraId, deleted: true },
      error: null,
    };
  }

  private toPaidExtra(row: {
    id: string;
    tourId: string;
    title: string;
    description: string | null;
    dayNumber: number | null;
    price: Prisma.Decimal;
    currency: string;
    isRequired: boolean;
    isActive: boolean;
    sortOrder: number;
  }) {
    return {
      id: row.id,
      tourId: row.tourId,
      title: row.title,
      description: row.description,
      dayNumber: row.dayNumber,
      price: row.price.toString(),
      currency: row.currency,
      isRequired: row.isRequired,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
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
