import { GoneException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../../core/database/prisma.service';
import { StorageService } from '../../../core/storage/storage.service';
import { AgencyService } from '../services/agency.service';
import { createPrismaMock } from '../../__tests__/test-helpers';

describe('AgencyService', () => {
  let service: AgencyService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        AgencyService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: StorageService,
          useValue: {
            resolvePublicUrl: (value: string | null) => value,
          },
        },
      ],
    }).compile();
    service = module.get(AgencyService);
  });

  describe('legacy CRUD', () => {
    it('should return 410 for create', async () => {
      await expect(service.create({ name: 'X' }, 'u1')).rejects.toBeInstanceOf(
        GoneException,
      );
    });
  });

  describe('search', () => {
    it('should list verified agencies for public callers', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        1,
        [
          {
            id: 'a1',
            companyName: 'Demo Acente',
            logo: null,
            city: 'Ankara',
            country: 'Türkiye',
            website: null,
            sellerTier: 'GOLD',
            averageRating: { toString: () => '4.80' },
            reviewCount: 5,
            status: 'VERIFIED',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
      ]);
      (prisma.tour.groupBy as jest.Mock).mockResolvedValue([
        { agencyId: 'a1', _count: { _all: 4 } },
      ]);

      const result = await service.search({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].companyName).toBe('Demo Acente');
      expect(result.data[0].publishedTourCount).toBe(4);
      expect(result.meta.total).toBe(1);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should hide non-verified agency from public', async () => {
      (prisma.agency.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('a1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.agency.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'a1',
            status: 'VERIFIED',
          }),
        }),
      );
    });

    it('should return marketplace profile for verified agency', async () => {
      (prisma.agency.findFirst as jest.Mock).mockResolvedValue({
        id: 'seed-agency-demo',
        companyName: 'Demo Satıcı Acente',
        logo: null,
        city: 'Ankara',
        country: 'Türkiye',
        website: null,
        sellerTier: 'SILVER',
        averageRating: { toString: () => '4.50' },
        reviewCount: 2,
        status: 'VERIFIED',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      (prisma.tour.count as jest.Mock).mockResolvedValue(3);

      const result = await service.getById('seed-agency-demo');
      expect(result.data.companyName).toBe('Demo Satıcı Acente');
      expect(result.data.membershipTier).toBe('SILVER');
      expect(result.data.publishedTourCount).toBe(3);
    });
  });
});
