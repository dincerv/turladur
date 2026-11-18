import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { RegisterGuideDto, UpdateGuideProfileDto } from '../dto/guide.dto';

const BCRYPT_ROUNDS = 12;

function parseDay(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) {
    throw new BusinessException('INVALID_DATE', 'Tarih YYYY-MM-DD olmalı');
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function toPublicGuide(guide: {
  id: string;
  identityNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: Date | null;
  status: string;
  languages: string[];
  oda: string | null;
  sicilNo: string | null;
  ruhsatNo: string | null;
  ruhsatExpiresAt: Date | null;
  bio: string | null;
  photoUrl: string | null;
  city: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: guide.id,
    identityNumber: guide.identityNumber,
    firstName: guide.firstName,
    lastName: guide.lastName,
    email: guide.email,
    phone: guide.phone,
    birthDate: guide.birthDate?.toISOString().slice(0, 10) ?? null,
    status: guide.status,
    languages: guide.languages,
    oda: guide.oda,
    sicilNo: guide.sicilNo,
    ruhsatNo: guide.ruhsatNo,
    ruhsatExpiresAt: guide.ruhsatExpiresAt?.toISOString().slice(0, 10) ?? null,
    bio: guide.bio,
    photoUrl: guide.photoUrl,
    city: guide.city,
    verifiedAt: guide.verifiedAt?.toISOString() ?? null,
    createdAt: guide.createdAt.toISOString(),
  };
}

@Injectable()
export class GuideService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterGuideDto) {
    const email = dto.email.toLowerCase().trim();
    await this.assertEmailAvailable(email);
    await this.assertIdentityAvailable(dto.identityNumber);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const guide = await this.prisma.guide.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        identityNumber: dto.identityNumber.trim(),
        languages: dto.languages.map((lang) => lang.trim()).filter(Boolean),
        oda: dto.oda.trim(),
        sicilNo: dto.sicilNo.trim(),
        ruhsatNo: dto.ruhsatNo.trim(),
        ruhsatExpiresAt: parseDay(dto.ruhsatExpiresAt),
        birthDate: dto.birthDate ? parseDay(dto.birthDate) : null,
        phone: dto.phone?.trim() || null,
        city: dto.city?.trim() || null,
        status: 'PENDING',
      },
    });

    return {
      success: true as const,
      data: toPublicGuide(guide),
      error: null,
    };
  }

  async getProfile(guideId: string) {
    const guide = await this.requireGuide(guideId);
    return { success: true as const, data: toPublicGuide(guide), error: null };
  }

  /**
   * Soft-live dashboard KPIs — own assignments + availability window.
   */
  async getDashboard(guideId: string) {
    const guide = await this.requireGuide(guideId);
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fromDay = now.toISOString().slice(0, 10);
    const toDay = in30.toISOString().slice(0, 10);

    const [pendingAssignments, acceptedUpcoming, availableDays] =
      await Promise.all([
        this.prisma.tourDateAssignment.count({
          where: {
            guideId,
            deletedAt: null,
            status: 'PENDING',
            role: 'GUIDE',
          },
        }),
        this.prisma.tourDateAssignment.count({
          where: {
            guideId,
            deletedAt: null,
            status: 'ACCEPTED',
            role: 'GUIDE',
            tourDate: {
              deletedAt: null,
              startDate: { gte: now },
            },
          },
        }),
        this.prisma.guideAvailability.count({
          where: {
            guideId,
            isAvailable: true,
            deletedAt: null,
            date: {
              gte: new Date(`${fromDay}T00:00:00.000Z`),
              lte: new Date(`${toDay}T23:59:59.999Z`),
            },
          },
        }),
      ]);

    return {
      success: true as const,
      data: {
        status: guide.status,
        verifiedAt: guide.verifiedAt?.toISOString() ?? null,
        canReceiveAssignments: guide.status === 'VERIFIED',
        pendingAssignments,
        acceptedUpcoming,
        availableDaysNext30: availableDays,
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
      },
      error: null,
    };
  }

  async updateProfile(guideId: string, dto: UpdateGuideProfileDto) {
    await this.requireGuide(guideId);

    if (dto.identityNumber) {
      const other = await this.prisma.guide.findFirst({
        where: {
          identityNumber: dto.identityNumber.trim(),
          deletedAt: null,
          NOT: { id: guideId },
        },
        select: { id: true },
      });
      if (other) {
        throw new ConflictException({
          code: 'TCKN_ALREADY_EXISTS',
          message: 'Bu TCKN ile kayıtlı başka bir rehber var',
        });
      }
    }

    const updated = await this.prisma.guide.update({
      where: { id: guideId },
      data: {
        ...(dto.firstName !== undefined
          ? { firstName: dto.firstName.trim() }
          : {}),
        ...(dto.lastName !== undefined
          ? { lastName: dto.lastName.trim() }
          : {}),
        ...(dto.identityNumber !== undefined
          ? { identityNumber: dto.identityNumber.trim() }
          : {}),
        ...(dto.languages !== undefined
          ? {
              languages: dto.languages
                .map((lang) => lang.trim())
                .filter(Boolean),
            }
          : {}),
        ...(dto.oda !== undefined ? { oda: dto.oda.trim() } : {}),
        ...(dto.sicilNo !== undefined ? { sicilNo: dto.sicilNo.trim() } : {}),
        ...(dto.ruhsatNo !== undefined
          ? { ruhsatNo: dto.ruhsatNo.trim() }
          : {}),
        ...(dto.ruhsatExpiresAt !== undefined
          ? { ruhsatExpiresAt: parseDay(dto.ruhsatExpiresAt) }
          : {}),
        ...(dto.birthDate !== undefined
          ? {
              birthDate: dto.birthDate ? parseDay(dto.birthDate) : null,
            }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() || null }
          : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio?.trim() || null } : {}),
      },
    });

    return {
      success: true as const,
      data: toPublicGuide(updated),
      error: null,
    };
  }

  private async requireGuide(guideId: string) {
    const guide = await this.prisma.guide.findFirst({
      where: { id: guideId, deletedAt: null },
    });
    if (!guide) {
      throw new NotFoundException({
        code: 'GUIDE_NOT_FOUND',
        message: 'Rehber bulunamadı',
      });
    }
    return guide;
  }

  private async assertIdentityAvailable(identityNumber: string) {
    const existing = await this.prisma.guide.findFirst({
      where: { identityNumber: identityNumber.trim(), deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'TCKN_ALREADY_EXISTS',
        message: 'Bu TCKN ile rehber kaydı zaten var',
      });
    }
  }

  private async assertEmailAvailable(email: string) {
    const [user, agency, staff, guide, bus] = await Promise.all([
      this.prisma.user.findFirst({
        where: { email, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.agency.findFirst({
        where: { contactEmail: email, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.agencyStaff.findFirst({
        where: { email, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.guide.findFirst({
        where: { email, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.busCompany.findFirst({
        where: { contactEmail: email, deletedAt: null },
        select: { id: true },
      }),
    ]);

    if (user || agency || staff || guide || bus) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Bu e-posta adresi zaten kayıtlı',
      });
    }
  }
}
