import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT } from '@turta/shared-constants';
import type { Hotel as SharedHotel } from '@turta/shared-types';
import { Prisma } from '../../../generated/prisma';

import { CacheService } from '../../../core/cache/cache.service';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreateHotelDto,
  SearchHotelsDto,
  UpdateHotelDto,
} from '../dto/hotel.dto';
import { slugify } from '../utils/slugify';

@Injectable()
export class HotelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly agencyLink: AgencyLinkService,
  ) {}

  async search(dto: SearchHotelsDto) {
    const page = dto.page ?? DEFAULT_PAGE;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const q = dto.q?.trim() ?? '';

    const where: Prisma.HotelWhereInput = {
      deletedAt: null,
      ...(dto.city
        ? { city: { contains: dto.city, mode: 'insensitive' } }
        : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.hotel.count({ where }),
      this.prisma.hotel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      success: true,
      data: rows.map((h) => this.toHotel(h)),
      error: null,
      meta: { page, limit, total },
    };
  }

  async getById(hotelId: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
    });
    if (!hotel) {
      throw new NotFoundException({
        code: 'HOTEL_NOT_FOUND',
        message: 'Otel bulunamadı',
      });
    }
    return {
      success: true,
      data: {
        ...this.toHotel(hotel),
        rooms: [],
      },
      error: null,
    };
  }

  async create(dto: CreateHotelDto, agencyId: string | undefined) {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'AGENCY_REQUIRED',
        message: 'Otel oluşturmak için acente hesabı gerekir',
      });
    }
    await this.ensurePartnerCapability(agencyId, 'TOURS');

    const slug = await this.uniqueHotelSlug(slugify(dto.name));
    const hotel = await this.prisma.hotel.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
        city: dto.city.trim(),
        country: dto.country?.trim() ?? 'Türkiye',
        address: dto.address?.trim(),
        type: dto.type,
        stars: dto.stars,
        phone: dto.phone,
        website: dto.website,
        agencyId,
      },
    });

    await this.cache.invalidatePattern('catalog:hotels:*');
    return { success: true, data: this.toHotel(hotel), error: null };
  }

  async update(
    hotelId: string,
    dto: UpdateHotelDto,
    agencyId: string | undefined,
    role: string,
  ) {
    const hotel = await this.findOwnedHotel(hotelId, agencyId, role);
    const data: Prisma.HotelUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
      data.slug = await this.uniqueHotelSlug(slugify(dto.name), hotelId);
    }
    if (dto.description !== undefined)
      data.description = dto.description.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.country !== undefined) data.country = dto.country.trim();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.stars !== undefined) data.stars = dto.stars;

    const updated = await this.prisma.hotel.update({
      where: { id: hotel.id },
      data,
    });
    await this.cache.invalidatePattern('catalog:hotels:*');
    return { success: true, data: this.toHotel(updated), error: null };
  }

  async softDelete(
    hotelId: string,
    agencyId: string | undefined,
    role: string,
    deletedBy?: string,
  ) {
    const hotel = await this.findOwnedHotel(hotelId, agencyId, role);
    await this.prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      },
    });
    await this.cache.invalidatePattern('catalog:hotels:*');
    return { success: true, data: { id: hotelId, deleted: true }, error: null };
  }

  async listRooms(hotelId: string) {
    await this.requireHotel(hotelId);
    return {
      success: true,
      data: [],
      error: null,
    };
  }

  private async ensurePartnerCapability(
    agencyId: string | undefined,
    capability: 'TOURS',
  ) {
    if (!agencyId) {
      throw new ForbiddenException({
        code: 'PARTNER_REQUIRED',
        message: 'Partner hesabı gerekli',
      });
    }
    const partner = await this.prisma.agency.findFirst({
      where: { id: agencyId, deletedAt: null },
    });
    if (!partner || partner.status !== 'VERIFIED') {
      throw new ForbiddenException({
        code: 'PARTNER_NOT_VERIFIED',
        message: 'Doğrulanmış partner hesabı gerekli',
      });
    }
    if (
      partner.capabilities.length > 0 &&
      !partner.capabilities.includes(capability)
    ) {
      throw new ForbiddenException({
        code: 'CAPABILITY_REQUIRED',
        message: `Bu işlem için ${capability} yetkisi gerekli`,
      });
    }
  }

  private async findOwnedHotel(
    hotelId: string,
    agencyId: string | undefined,
    role: string,
  ) {
    const hotel = await this.requireHotel(hotelId);
    this.agencyLink.assertSellerOwner(
      { agencyId: hotel.agencyId },
      { agencyId, role },
      'Bu oteli yönetemezsiniz',
    );
    return hotel;
  }

  private async requireHotel(hotelId: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
    });
    if (!hotel) {
      throw new NotFoundException({
        code: 'HOTEL_NOT_FOUND',
        message: 'Otel bulunamadı',
      });
    }
    return hotel;
  }

  private async uniqueHotelSlug(base: string, excludeId?: string) {
    let slug = base;
    let i = 0;
    while (true) {
      const existing = await this.prisma.hotel.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) return slug;
      i += 1;
      slug = `${base}-${i}`;
    }
  }

  private toHotel(row: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    type: string;
    agencyId: string;
    stars: number | null;
  }): SharedHotel {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      city: row.city,
      country: row.country,
      type: row.type as SharedHotel['type'],
      partnerId: row.agencyId,
      agencyId: row.agencyId,
      stars: row.stars,
    };
  }
}
