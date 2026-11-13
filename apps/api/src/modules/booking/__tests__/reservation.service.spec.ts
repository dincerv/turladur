import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';

import { AuditService } from '../../../core/audit/audit.service';
import { AgencyLinkService } from '../../../core/agency/agency-link.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { createPrismaMock } from '../../__tests__/test-helpers';
import { ReservationService } from '../services/reservation.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let events: { emit: jest.Mock };

  const guests = [
    {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      identityNumber: '10000000146',
      phone: '+905551112233',
      email: 'ahmet@example.com',
      address: 'Kadıköy, İstanbul',
    },
    {
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      identityNumber: '10000000146',
      phone: '+905551112244',
      email: 'ayse@example.com',
      address: 'Kadıköy, İstanbul',
    },
  ];

  const billing = {
    line1: 'Bağdat Cad. No:1',
    city: 'İstanbul',
    country: 'Türkiye',
  };
  beforeEach(async () => {
    prisma = createPrismaMock();
    events = { emit: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: events },
        {
          provide: AuditService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
        AgencyLinkService,
      ],
    }).compile();

    service = module.get(ReservationService);
  });

  it('should reject when guest count mismatches party size', async () => {
    await expect(
      service.create(
        {
          tourDateId: 'td1',
          adults: 2,
          children: 0,
          contactEmail: 'a@b.com',
          contactPhone: '+905551112233',
          guests: [
            {
              firstName: 'A',
              lastName: 'B',
              identityNumber: '10000000146',
              phone: '+905551112233',
              email: 'a@b.com',
              address: 'Test Adres 1',
            },
          ],
          billing,
        },
        'u1',
      ),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('should reject when more than one product is selected', async () => {
    await expect(
      service.create(
        {
          tourDateId: 'td1',
          activityDateId: 'ad1',
          adults: 2,
          contactEmail: 'a@b.com',
          contactPhone: '+905551112233',
          guests,
          billing,
        },
        'u1',
      ),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('should create a tour reservation and decrement capacity', async () => {
    (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue({
      id: 'td1',
      tourId: 't1',
      remainingCapacity: 10,
      version: 1,
      priceOverride: null,
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-08-22'),
      tour: {
        id: 't1',
        agencyId: 'p1',

        price: new Prisma.Decimal(1500),
        currency: 'TRY',
        status: 'PUBLISHED',
        deletedAt: null,
        childMaxAge: 12,
      },
    });
    (prisma.tourPickupPoint.findFirst as jest.Mock).mockResolvedValue({
      id: 'pp1',
      tourId: 't1',
      city: 'Ankara',
      location: 'Kızılay',
      time: '07:00',
      isActive: true,
    });
    (prisma.tourDate.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.reservationGuest.createMany as jest.Mock).mockResolvedValue({
      count: 2,
    });
    (prisma.reservation.create as jest.Mock).mockResolvedValue({
      id: 'res1',
      bookingNumber: 'TD-ABC',
      userId: 'u1',
      tourId: 't1',
      tourDateId: 'td1',
      experienceId: null,
      activityDateId: null,
      agencyId: 'p1',
      status: 'PENDING_PAYMENT',
      adults: 2,
      children: 0,
      totalAmount: new Prisma.Decimal(3000),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create(
      {
        tourDateId: 'td1',
        pickupPointId: 'pp1',
        adults: 2,
        contactEmail: 'a@b.com',
        contactPhone: '+905551112233',
        guests,
        billing,
      },
      'u1',
    );

    expect(result.data.tourDateId).toBe('td1');
    expect(result.data.totalAmount).toBe('3000');
    expect(prisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agencyId: 'p1',
        }),
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'booking.created',
      expect.anything(),
    );
  });

  it('should create an experience reservation', async () => {
    (prisma.activityDate.findFirst as jest.Mock).mockResolvedValue({
      id: 'ad1',
      experienceId: 'e1',
      price: new Prisma.Decimal(500),
      availableSeats: 10,
      remainingCapacity: 8,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-15'),
      experience: {
        agencyId: 'p1',
        currency: 'TRY',
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });
    (prisma.activityDate.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    });
    (prisma.reservation.create as jest.Mock).mockResolvedValue({
      id: 'res3',
      bookingNumber: 'TD-EXP',
      userId: 'u1',
      tourId: null,
      tourDateId: null,
      experienceId: 'e1',
      activityDateId: 'ad1',
      agencyId: 'p1',
      status: 'PENDING',
      adults: 2,
      children: 0,
      totalAmount: new Prisma.Decimal(1000),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create(
      {
        activityDateId: 'ad1',
        adults: 2,
        contactEmail: 'a@b.com',
        contactPhone: '+905551112233',
        guests,
        billing,
      },
      'u1',
    );

    expect(result.data.activityDateId).toBe('ad1');
    expect(result.data.experienceId).toBe('e1');
  });

  it('should throw when tour date is not found', async () => {
    (prisma.tourDate.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(
      service.create(
        {
          tourDateId: 'missing',
          pickupPointId: 'pp1',
          adults: 2,
          contactEmail: 'a@b.com',
          contactPhone: '+905551112233',
          guests,
          billing,
        },
        'u1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should cancel reservation and restore tour capacity', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'PENDING',
      adults: 2,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      tourId: 't1',
      experienceId: null,
      bookingNumber: 'TD-1',
      totalAmount: new Prisma.Decimal(100),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    (prisma.tourDate.update as jest.Mock).mockResolvedValue({});
    (prisma.reservation.update as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CANCELLED',
      adults: 2,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      tourId: 't1',
      experienceId: null,
      bookingNumber: 'TD-1',
      totalAmount: new Prisma.Decimal(100),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.cancel('res1', 'u1', 'CUSTOMER');
    expect(result.data.status).toBe('CANCELLED');
    expect(prisma.tourDate.update).toHaveBeenCalled();
  });

  it('should list reservations for user', async () => {
    (prisma.reservation.findMany as jest.Mock).mockResolvedValue([]);
    const result = await service.listForUser('u1');
    expect(result.data).toEqual([]);
  });

  it('should get reservation by id for owner', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CONFIRMED',
      adults: 1,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      tourId: 't1',
      experienceId: null,
      bookingNumber: 'TD-1',
      totalAmount: new Prisma.Decimal(100),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests: [guests[0]],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    const result = await service.getById('res1', 'u1', 'CUSTOMER');
    expect(result.data.id).toBe('res1');
  });

  it('should mark reservation completed', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CONFIRMED',
      adults: 1,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      tourId: 't1',
      experienceId: null,
      bookingNumber: 'TD-1',
      totalAmount: new Prisma.Decimal(100),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests: [guests[0]],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    (prisma.reservation.update as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'COMPLETED',
      adults: 1,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      tourId: 't1',
      experienceId: null,
      bookingNumber: 'TD-1',
      totalAmount: new Prisma.Decimal(100),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests: [guests[0]],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.markCompleted('res1', {
      userId: 'u1',
      role: 'PARTNER',
      agencyId: 'p1',
    });
    expect(result.data.status).toBe('COMPLETED');
    expect(events.emit).toHaveBeenCalledWith(
      'booking.completed',
      expect.anything(),
    );
  });

  it('should cancel experience booking and restore activity capacity', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res3',
      userId: 'u1',
      agencyId: 'p1',
      status: 'PENDING',
      adults: 2,
      children: 0,
      tourDateId: null,
      activityDateId: 'ad1',
      tourId: null,
      experienceId: 'e1',
      bookingNumber: 'TD-E',
      totalAmount: new Prisma.Decimal(1000),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    (prisma.activityDate.update as jest.Mock).mockResolvedValue({});
    (prisma.reservation.update as jest.Mock).mockResolvedValue({
      id: 'res3',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CANCELLED',
      adults: 2,
      children: 0,
      tourDateId: null,
      activityDateId: 'ad1',
      tourId: null,
      experienceId: 'e1',
      bookingNumber: 'TD-E',
      totalAmount: new Prisma.Decimal(1000),
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.cancel('res3', 'u1', 'CUSTOMER');
    expect(result.data.status).toBe('CANCELLED');
    expect(prisma.activityDate.update).toHaveBeenCalled();
  });

  it('should mark paymentStatus REFUNDED without changing status', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      deletedAt: null,
    });
    (prisma.reservation.update as jest.Mock).mockResolvedValue({
      id: 'res1',
      status: 'CONFIRMED',
      paymentStatus: 'REFUNDED',
    });

    const updated = await service.markPaymentRefunded('res1');
    expect(updated.paymentStatus).toBe('REFUNDED');
    expect(updated.status).toBe('CONFIRMED');
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: 'res1' },
      data: { paymentStatus: 'REFUNDED' },
    });
  });

  it('should be idempotent when already REFUNDED', async () => {
    const existing = {
      id: 'res1',
      status: 'CONFIRMED',
      paymentStatus: 'REFUNDED',
      deletedAt: null,
    };
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue(existing);

    const result = await service.markPaymentRefunded('res1');
    expect(result).toEqual(existing);
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });

  it('agencyUpdateStatus COMPLETED emits booking.completed', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CONFIRMED',
      tourId: 't1',
      contactEmail: 'a@b.com',
      deletedAt: null,
    });
    (prisma.reservation.update as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'COMPLETED',
      tourId: 't1',
      contactEmail: 'a@b.com',
      adults: 1,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      experienceId: null,
      bookingNumber: 'TD-1',
      totalAmount: new Prisma.Decimal(100),
      currency: 'TRY',
      contactPhone: null,
      guests: [guests[0]],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.agencyUpdateStatus('res1', 'p1', 'COMPLETED');
    expect(result.data.status).toBe('COMPLETED');
    expect(events.emit).toHaveBeenCalledWith(
      'booking.completed',
      expect.anything(),
    );
  });

  it('agencyUpdateStatus CANCELLED restores capacity', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CONFIRMED',
      adults: 2,
      children: 0,
      tourDateId: 'td1',
      activityDateId: null,
      deletedAt: null,
    });
    const seatUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          tourDate: { update: jest.fn().mockResolvedValue({}) },
          activityDate: { update: jest.fn() },
          seatAssignment: { updateMany: seatUpdateMany },
          reservation: {
            update: jest.fn().mockResolvedValue({
              id: 'res1',
              userId: 'u1',
              agencyId: 'p1',
              status: 'CANCELLED',
              adults: 2,
              children: 0,
              tourDateId: 'td1',
              activityDateId: null,
              tourId: 't1',
              experienceId: null,
              bookingNumber: 'TD-1',
              totalAmount: new Prisma.Decimal(100),
              currency: 'TRY',
              contactEmail: 'a@b.com',
              contactPhone: null,
              guests: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        }),
    );

    const result = await service.agencyUpdateStatus('res1', 'p1', 'CANCELLED');
    expect(result.data.status).toBe('CANCELLED');
    expect(seatUpdateMany).toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith(
      'booking.cancelled',
      expect.anything(),
    );
  });

  it('agencyUpdateStatus rejects CANCELLED → CONFIRMED', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CANCELLED',
      adults: 1,
      children: 0,
      deletedAt: null,
    });

    await expect(
      service.agencyUpdateStatus('res1', 'p1', 'CONFIRMED'),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('agencyUpdateStatus CONFIRMED emits payment.completed', async () => {
    (prisma.reservation.findFirst as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'PENDING_PAYMENT',
      paymentMethod: null,
      totalAmount: new Prisma.Decimal(250),
      deletedAt: null,
    });
    (prisma.reservation.update as jest.Mock).mockResolvedValue({
      id: 'res1',
      userId: 'u1',
      agencyId: 'p1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      totalAmount: new Prisma.Decimal(250),
      adults: 1,
      children: 0,
      tourDateId: null,
      activityDateId: null,
      tourId: 't1',
      experienceId: null,
      bookingNumber: 'TD-1',
      currency: 'TRY',
      contactEmail: 'a@b.com',
      contactPhone: null,
      guests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.agencyUpdateStatus('res1', 'p1', 'CONFIRMED');
    expect(result.data.status).toBe('CONFIRMED');
    expect(events.emit).toHaveBeenCalledWith(
      'payment.completed',
      expect.anything(),
    );
  });
});
