import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { CacheService } from '../../../core/cache/cache.service';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { ExperienceService } from '../services/experience.service';
import {
  createCacheMock,
  createPrismaMock,
  decimal,
} from '../../__tests__/test-helpers';

describe('ExperienceService', () => {
  let service: ExperienceService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const cache = createCacheMock();

    const module = await Test.createTestingModule({
      providers: [
        ExperienceService,
        AgencyLinkService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get(ExperienceService);
  });

  describe('search', () => {
    it('should return only published experiences', async () => {
      (prisma.experience.count as jest.Mock).mockResolvedValue(1);
      (prisma.experience.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'e1',
          title: 'Çömlek Atölyesi',
          slug: 'comlek-atolyesi',
          description: 'Kısa açıklama metni burada',
          category: 'Kültür',
          location: 'Avanos',
          duration: '2 saat',
          price: decimal(890),
          status: 'PUBLISHED',
          agencyId: 'p1',
          averageRating: decimal('4.5'),
          reviewCount: 12,
        },
      ]);

      const result = await service.search({ page: 1, limit: 20 });
      expect(result.data[0].title).toBe('Çömlek Atölyesi');
      expect(result.meta?.total).toBe(1);
      expect(prisma.experience.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLISHED' }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should require TOURS capability for experiences', async () => {
      (prisma.agency.findFirst as jest.Mock).mockResolvedValue({
        id: 'p1',
        status: 'VERIFIED',
        capabilities: ['HOTELS'],
      });

      await expect(
        service.create(
          {
            title: 'Test Exp',
            description: 'En az on karakterlik açıklama',
            longDescription: 'En az on karakterlik uzun açıklama',
            category: 'Kültür',
            location: 'Avanos',
            duration: '1 saat',
            price: 100,
          },
          'p1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('createDate', () => {
    it('should reject invalid date range', async () => {
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({
        id: 'e1',
        agencyId: 'p1',
        deletedAt: null,
      });

      await expect(
        service.createDate(
          'e1',
          {
            startDate: '2026-08-20',
            endDate: '2026-08-10',
            price: 100,
            availableSeats: 10,
          },
          'p1',
          'PARTNER',
        ),
      ).rejects.toBeInstanceOf(BusinessException);
    });

    it('should create activity date for owner', async () => {
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({
        id: 'e1',
        agencyId: 'p1',
        deletedAt: null,
      });
      (prisma.activityDate.create as jest.Mock).mockResolvedValue({
        id: 'd1',
        experienceId: 'e1',
        startDate: new Date('2026-08-15'),
        endDate: new Date('2026-08-15'),
        price: decimal(890),
        availableSeats: 12,
        isActive: true,
      });

      const result = await service.createDate(
        'e1',
        {
          startDate: '2026-08-15',
          endDate: '2026-08-15',
          price: 890,
          availableSeats: 12,
        },
        'p1',
        'PARTNER',
      );

      expect(result.data.id).toBe('d1');
      expect(result.data.availableSeats).toBe(12);
    });
  });

  describe('getById', () => {
    it('should throw when unpublished or missing', async () => {
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should map detail content and drop malformed json items', async () => {
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({
        id: 'e1',
        title: 'Balon',
        slug: 'balon',
        description: 'Kısa',
        longDescription: 'Uzun açıklama',
        category: 'Doğa',
        location: 'Göreme',
        duration: '3 saat',
        price: decimal(2300),
        currency: 'TRY',
        status: 'PUBLISHED',
        agencyId: 'p1',
        averageRating: decimal('4.5'),
        reviewCount: 5,
        ageRestriction: '18+',
        gallery: ['/a.jpg', 42, ' '],
        included: ['Transfer', null],
        notIncluded: 'not-an-array',
        highlights: [],
        schedule: [
          { time: '05:00', activity: 'Toplanma' },
          '06:00 Kalkış',
          { time: 1 },
        ],
        meetingPoint: ' ',
        meetingPointAddress: 'Göreme Meydanı',
        agency: {
          id: 'p1',
          companyName: 'Demo',
          logo: null,
          sellerTier: 'GOLD',
          averageRating: decimal('4.8'),
          reviewCount: 10,
        },
      });

      const { data } = await service.getById('e1');
      expect(data).toMatchObject({
        longDescription: 'Uzun açıklama',
        gallery: ['/a.jpg'],
        included: ['Transfer'],
        notIncluded: [],
        schedule: [
          { time: '05:00', activity: 'Toplanma' },
          { time: '', activity: '06:00 Kalkış' },
        ],
        meetingPoint: null,
        meetingPointAddress: 'Göreme Meydanı',
        ageRestriction: '18+',
        operator: { id: 'p1', membershipTier: 'GOLD', averageRating: '4.8' },
      });
    });
  });

  describe('update / delete / partner list', () => {
    it('should update owned experience', async () => {
      (prisma.experience.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'e1',
          agencyId: 'p1',
          deletedAt: null,
        })
        .mockResolvedValueOnce(null);
      (prisma.experience.update as jest.Mock).mockResolvedValue({
        id: 'e1',
        title: 'Güncel Başlık',
        slug: 'guncel-baslik',
        description: 'Açıklama metni',
        category: 'Kültür',
        location: 'Avanos',
        duration: '2 saat',
        price: decimal(900),
        status: 'PUBLISHED',
        agencyId: 'p1',
        averageRating: decimal(0),
        reviewCount: 0,
      });

      const result = await service.update(
        'e1',
        { title: 'Güncel Başlık', price: 900 },
        'p1',
        'PARTNER',
      );
      expect(result.data.title).toBe('Güncel Başlık');
    });

    it('should soft-delete experience', async () => {
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({
        id: 'e1',
        agencyId: 'p1',
        deletedAt: null,
      });
      (prisma.experience.update as jest.Mock).mockResolvedValue({});
      const result = await service.softDelete('e1', 'p1', 'PARTNER');
      expect(result.data.deleted).toBe(true);
    });

    it('should list dates and update/delete them', async () => {
      (prisma.experience.findFirst as jest.Mock).mockResolvedValue({
        id: 'e1',
        agencyId: 'p1',
        deletedAt: null,
      });
      (prisma.activityDate.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'd1',
          experienceId: 'e1',
          startDate: new Date('2026-08-15'),
          endDate: new Date('2026-08-15'),
          price: decimal(100),
          availableSeats: 10,
          isActive: true,
        },
      ]);
      const listed = await service.listDates('e1');
      expect(listed.data).toHaveLength(1);

      (prisma.activityDate.findFirst as jest.Mock).mockResolvedValue({
        id: 'd1',
        experienceId: 'e1',
        startDate: new Date('2026-08-15'),
        endDate: new Date('2026-08-15'),
        availableSeats: 10,
        remainingCapacity: 8,
        deletedAt: null,
      });
      (prisma.activityDate.update as jest.Mock).mockResolvedValue({
        id: 'd1',
        experienceId: 'e1',
        startDate: new Date('2026-08-16'),
        endDate: new Date('2026-08-16'),
        price: decimal(120),
        availableSeats: 10,
        isActive: true,
      });

      const updated = await service.updateDate(
        'e1',
        'd1',
        { startDate: '2026-08-16', endDate: '2026-08-16', price: 120 },
        'p1',
        'PARTNER',
      );
      expect(updated.data.price).toBe('120');

      const deleted = await service.softDeleteDate('e1', 'd1', 'p1', 'PARTNER');
      expect(deleted.data.deleted).toBe(true);
    });

    it('should list partner experiences', async () => {
      (prisma.experience.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.listForPartner('p1');
      expect(result.data).toEqual([]);
    });

    it('should require partner for listForPartner', async () => {
      await expect(service.listForPartner(undefined)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
