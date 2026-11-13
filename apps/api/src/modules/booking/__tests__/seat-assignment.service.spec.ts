import { Test } from '@nestjs/testing';

import { PrismaService } from '../../../core/database/prisma.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { createPrismaMock } from '../../__tests__/test-helpers';
import { buildPlusOneLayoutJson } from '../../../shared/utils/bus-seat-layout';
import { SeatAssignmentService } from '../services/seat-assignment.service';

describe('SeatAssignmentService', () => {
  let service: SeatAssignmentService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const layout = buildPlusOneLayoutJson(19);
  const tourDateBase = {
    id: 'td1',
    tourId: 'tour1',
    version: 1,
    busSeatLayoutId: 'lay1',
    deletedAt: null,
    tour: { id: 'tour1', agencyId: 'p1', deletedAt: null },
    busSeatLayout: {
      id: 'lay1',
      kind: 'BUS_19_PLUS_1',
      passengerSeats: 19,
      layoutJson: layout.layoutJson,
    },
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        SeatAssignmentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(SeatAssignmentService);

    (prisma.tourDate.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.seatAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.seatAssignment.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe('assignManual', () => {
    it('should reject CREW seat', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(tourDateBase);

      await expect(
        service.assignManual(
          'td1',
          { seatCode: 'CREW', reservationGuestId: 'g1' },
          'p1',
          'PARTNER',
        ),
      ).rejects.toMatchObject({ code: 'INVALID_SEAT_CODE' });
    });

    it('should create MANUAL assignment for confirmed guest', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(tourDateBase);
      (prisma.reservationGuest.findFirst as jest.Mock).mockResolvedValue({
        id: 'g1',
        reservationId: 'r1',
        identityNumber: '10000000146',
        reservation: {
          id: 'r1',
          tourDateId: 'td1',
          status: 'CONFIRMED',
          deletedAt: null,
        },
      });
      (prisma.seatAssignment.create as jest.Mock).mockResolvedValue({
        id: 'sa1',
        seatCode: '1',
        source: 'MANUAL',
      });

      const result = await service.assignManual(
        'td1',
        { seatCode: '1', reservationGuestId: 'g1' },
        'p1',
        'PARTNER',
        'tour1',
      );

      expect(result.data.source).toBe('MANUAL');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.tourDate.updateMany).toHaveBeenCalled();
      expect(prisma.seatAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            seatCode: '1',
            source: 'MANUAL',
            reservationGuestId: 'g1',
          }),
        }),
      );
    });

    it('should reject when seat already SOLD inside transaction', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(tourDateBase);
      (prisma.reservationGuest.findFirst as jest.Mock).mockResolvedValue({
        id: 'g1',
        reservationId: 'r1',
        identityNumber: '10000000146',
        reservation: {
          id: 'r1',
          tourDateId: 'td1',
          status: 'CONFIRMED',
          deletedAt: null,
        },
      });
      (prisma.seatAssignment.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'existing',
      });

      await expect(
        service.assignManual(
          'td1',
          { seatCode: '1', reservationGuestId: 'g1' },
          'p1',
          'PARTNER',
        ),
      ).rejects.toMatchObject({ code: 'SEAT_OCCUPIED' });
    });

    it('should reject tourId mismatch (IDOR)', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(tourDateBase);

      await expect(
        service.assignManual(
          'td1',
          { seatCode: '1', reservationGuestId: 'g1' },
          'p1',
          'PARTNER',
          'other-tour',
        ),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'TOUR_DATE_MISMATCH' }),
      });
    });
  });

  describe('autoFifo', () => {
    it('should place guests in booking order onto free seats via createMany', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(tourDateBase);
      (prisma.seatAssignment.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'sa1', seatCode: '1', source: 'AUTO_FIFO' },
          { id: 'sa2', seatCode: '2', source: 'AUTO_FIFO' },
        ]);
      (prisma.reservation.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          bookingNumber: 'B1',
          createdAt: new Date('2026-01-01'),
          reservationGuests: [
            {
              id: 'g1',
              fullName: 'A',
              identityNumber: '10000000146',
              sortOrder: 0,
              reservationId: 'r1',
              seatAssignments: [],
            },
            {
              id: 'g2',
              fullName: 'B',
              identityNumber: '10000000154',
              sortOrder: 1,
              reservationId: 'r1',
              seatAssignments: [],
            },
          ],
        },
      ]);
      (prisma.seatAssignment.createMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      const result = await service.autoFifo('td1', 'p1', 'PARTNER', 'tour1');

      expect(result.data.assignedCount).toBe(2);
      expect(prisma.seatAssignment.createMany).toHaveBeenCalled();
    });

    it('should require layout', async () => {
      (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue({
        ...tourDateBase,
        busSeatLayoutId: null,
        busSeatLayout: null,
      });

      await expect(
        service.autoFifo('td1', 'p1', 'PARTNER'),
      ).rejects.toBeInstanceOf(BusinessException);
    });
  });
});
