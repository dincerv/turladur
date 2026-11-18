import { Test } from '@nestjs/testing';

import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { createPrismaMock } from '../../__tests__/test-helpers';
import {
  eachCalendarDay,
  TourDateAssignmentService,
} from '../services/tour-date-assignment.service';

describe('eachCalendarDay', () => {
  it('should include start and end for multi-day span', () => {
    const days = eachCalendarDay(
      new Date('2026-10-10T00:00:00.000Z'),
      new Date('2026-10-12T00:00:00.000Z'),
    );
    expect(days).toHaveLength(3);
    expect(days[0].toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(days[2].toISOString().slice(0, 10)).toBe('2026-10-12');
  });
});

describe('TourDateAssignmentService', () => {
  let service: TourDateAssignmentService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const tourDateBase = {
    id: 'td1',
    startDate: new Date('2026-10-10T00:00:00.000Z'),
    endDate: new Date('2026-10-12T00:00:00.000Z'),
    deletedAt: null,
    tour: { agencyId: 'a1', deletedAt: null },
  };

  const agencyLink = {
    assertSellerOwner: jest.fn(),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    agencyLink.assertSellerOwner.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        TourDateAssignmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AgencyLinkService, useValue: agencyLink },
      ],
    }).compile();
    service = module.get(TourDateAssignmentService);
  });

  describe('inviteGuide', () => {
    it('should create PENDING assignment', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue({
        id: 'td1',
        startDate: new Date('2026-10-10T00:00:00.000Z'),
        endDate: new Date('2026-10-12T00:00:00.000Z'),
        deletedAt: null,
        tour: { agencyId: 'a1', deletedAt: null },
      });
      (prisma.guide.findFirst as jest.Mock).mockResolvedValue({
        id: 'g1',
        status: 'VERIFIED',
      });
      (prisma.tourDateAssignment.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.guideAvailability.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tourDateAssignment.create as jest.Mock).mockResolvedValue({
        id: 'as1',
        role: 'GUIDE',
        status: 'PENDING',
        guideId: 'g1',
      });

      const result = await service.inviteGuide(
        'td1',
        { guideId: 'g1' },
        'a1',
        'PARTNER',
      );

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('PENDING');
      expect(prisma.tourDateAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'GUIDE',
            guideId: 'g1',
            invitedByAgencyId: 'a1',
            status: 'PENDING',
          }),
        }),
      );
    });

    it('should reject when active GUIDE assignment exists', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue({
        id: 'td1',
        startDate: new Date('2026-10-10T00:00:00.000Z'),
        endDate: new Date('2026-10-12T00:00:00.000Z'),
        deletedAt: null,
        tour: { agencyId: 'a1', deletedAt: null },
      });
      (prisma.guide.findFirst as jest.Mock).mockResolvedValue({
        id: 'g1',
        status: 'VERIFIED',
      });
      (prisma.tourDateAssignment.findFirst as jest.Mock).mockResolvedValue({
        id: 'as-old',
        status: 'PENDING',
      });

      await expect(
        service.inviteGuide('td1', { guideId: 'g1' }, 'a1', 'PARTNER'),
      ).rejects.toBeInstanceOf(BusinessException);
    });
  });

  describe('respond ACCEPTED GUIDE', () => {
    it('should block availability for each day and mirror guideId', async () => {
      (prisma.tourDateAssignment.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'as1',
          role: 'GUIDE',
          guideId: 'g1',
          busCompanyId: null,
          status: 'PENDING',
          tourDateId: 'td1',
          tourDate: tourDateBase,
        })
        .mockResolvedValueOnce(null);
      (prisma.guideAvailability.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.guideAvailability.upsert as jest.Mock).mockResolvedValue({});
      (prisma.tourDate.update as jest.Mock).mockResolvedValue({});
      (prisma.tourDateAssignment.update as jest.Mock).mockResolvedValue({
        id: 'as1',
        status: 'ACCEPTED',
      });

      const result = await service.respond(
        'as1',
        { status: 'ACCEPTED' },
        undefined,
        'ADMIN',
      );

      expect(result.data.status).toBe('ACCEPTED');
      expect(prisma.guideAvailability.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.tourDate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { guideId: 'g1' },
        }),
      );
    });

    it('should reject when guide already busy', async () => {
      (prisma.tourDateAssignment.findFirst as jest.Mock).mockResolvedValue({
        id: 'as1',
        role: 'GUIDE',
        guideId: 'g1',
        busCompanyId: null,
        status: 'PENDING',
        tourDateId: 'td1',
        tourDate: tourDateBase,
      });
      (prisma.guideAvailability.findMany as jest.Mock).mockResolvedValue([
        { date: new Date('2026-10-11T00:00:00.000Z') },
      ]);

      await expect(
        service.respond('as1', { status: 'ACCEPTED' }, undefined, 'ADMIN'),
      ).rejects.toMatchObject({ code: 'GUIDE_UNAVAILABLE' });
    });

    it('should reject overlapping schedule conflict', async () => {
      (prisma.tourDateAssignment.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'as1',
          role: 'GUIDE',
          guideId: 'g1',
          busCompanyId: null,
          status: 'PENDING',
          tourDateId: 'td1',
          tourDate: tourDateBase,
        })
        .mockResolvedValueOnce({ id: 'as-other' });
      (prisma.guideAvailability.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.respond('as1', { status: 'ACCEPTED' }, undefined, 'ADMIN'),
      ).rejects.toMatchObject({ code: 'GUIDE_SCHEDULE_CONFLICT' });
    });
  });

  describe('respond ACCEPTED BUS', () => {
    it('should require vehicleId and block vehicle days', async () => {
      (prisma.tourDateAssignment.findFirst as jest.Mock).mockResolvedValue({
        id: 'as2',
        role: 'BUS',
        guideId: null,
        busCompanyId: 'bc1',
        status: 'PENDING',
        tourDateId: 'td1',
        tourDate: tourDateBase,
      });

      await expect(
        service.respond('as2', { status: 'ACCEPTED' }, undefined, 'ADMIN'),
      ).rejects.toMatchObject({ code: 'VEHICLE_REQUIRED' });

      (prisma.vehicle.findFirst as jest.Mock).mockResolvedValue({
        id: 'v1',
        busCompanyId: 'bc1',
        seatLayoutKind: 'BUS_46_PLUS_1',
      });
      (prisma.busSeatLayout.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vehicleAvailability.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vehicleAvailability.upsert as jest.Mock).mockResolvedValue({});
      (prisma.tourDate.update as jest.Mock).mockResolvedValue({});
      (prisma.tourDateAssignment.update as jest.Mock).mockResolvedValue({
        id: 'as2',
        status: 'ACCEPTED',
      });

      const result = await service.respond(
        'as2',
        { status: 'ACCEPTED', vehicleId: 'v1' },
        undefined,
        'ADMIN',
      );

      expect(result.data.status).toBe('ACCEPTED');
      expect(prisma.vehicleAvailability.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.tourDate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            busCompanyId: 'bc1',
            vehicleId: 'v1',
          }),
        }),
      );
    });
  });

  describe('listForAgency', () => {
    it('should list by invitedByAgencyId', async () => {
      (prisma.tourDateAssignment.findMany as jest.Mock).mockResolvedValue([
        { id: 'as1', status: 'PENDING', invitedByAgencyId: 'a1' },
      ]);

      const result = await service.listForAgency('a1', 'AGENCY_OWNER');

      expect(result.data).toHaveLength(1);
      expect(prisma.tourDateAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invitedByAgencyId: 'a1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should require agencyId for non-admin', async () => {
      await expect(
        service.listForAgency(undefined, 'AGENCY_OWNER'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'AGENCY_REQUIRED' }),
      });
    });
  });
});
