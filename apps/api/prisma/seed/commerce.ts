import type { PrismaClient } from '../../src/generated/prisma';
import type { SeedCatalog } from './catalog';
import type { SeedIdentity } from './identity';
import { COVER_IMAGES } from './constants';

export async function seedCommerce(
  prisma: PrismaClient,
  identity: SeedIdentity,
  catalog: SeedCatalog,
): Promise<void> {
  const customer = identity.customers[0];
  const customer2 = identity.customers[1];

  // Favorites — first 3 tours + 2 experiences for customer01
  for (const tour of catalog.tours.slice(0, 3)) {
    await prisma.favorite.create({
      data: { userId: customer.id, tourId: tour.id },
    });
  }
  for (const exp of catalog.experiences.slice(0, 2)) {
    await prisma.favorite.create({
      data: { userId: customer.id, experienceId: exp.id },
    });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: 'DEMO10',
      discountType: 'PERCENT',
      discountValue: 10,
      maxUses: 100,
      isActive: true,
      startsAt: new Date('2025-01-01'),
      endsAt: new Date('2027-12-31'),
    },
  });
  await prisma.couponUsage.create({
    data: { couponId: coupon.id, userId: customer.id },
  });

  await prisma.campaign.create({
    data: {
      title: 'Yaz Erken Rezervasyon',
      slug: 'yaz-erken-2026',
      bannerUrl: COVER_IMAGES[0],
      payload: { subtitle: 'Seed kampanya — UI vitrin.' },
      isActive: true,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-12-31'),
    },
  });

  await prisma.searchQueryLog.create({
    data: { query: 'kapadokya tur', resultCount: catalog.tours.length },
  });

  // Seat-map demo on agency-01 first tourDate.
  // BusSeatLayout sellable codes are "1","2",… — never "1A".
  // 2 seated (visible on map) + 3 unassigned (manual / AUTO_FIFO).
  const seatDemoTour = catalog.tours[0];
  const seatDemoAgency = identity.agencies.find(
    (agency) => agency.id === seatDemoTour.agencyId,
  )!;

  const seatDemoGuests: Array<{
    fullName: string;
    seatCode: string | null;
    bookingSuffix: number;
  }> = [
    { fullName: 'Ayşe Yılmaz', seatCode: '1', bookingSuffix: 101 },
    { fullName: 'Mehmet Demir', seatCode: '2', bookingSuffix: 102 },
    { fullName: 'Zeynep Kaya', seatCode: null, bookingSuffix: 103 },
    { fullName: 'Can Öztürk', seatCode: null, bookingSuffix: 104 },
    { fullName: 'Elif Şahin', seatCode: null, bookingSuffix: 105 },
  ];

  for (let index = 0; index < seatDemoGuests.length; index++) {
    const demo = seatDemoGuests[index];
    const user = identity.customers[index % identity.customers.length];
    const bookingNumber = `SEED${String(20000 + demo.bookingSuffix)}`;
    const amount = seatDemoTour.price;

    const reservation = await prisma.reservation.create({
      data: {
        bookingNumber,
        userId: user.id,
        tourId: seatDemoTour.id,
        tourDateId: seatDemoTour.tourDateId,
        agencyId: seatDemoTour.agencyId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        adults: 1,
        children: 0,
        totalAmount: amount,
        boardingPickupPointId: seatDemoTour.pickupPointId,
        contactEmail: user.email,
        contactPhone: '+905551112233',
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    const guest = await prisma.reservationGuest.create({
      data: {
        reservationId: reservation.id,
        fullName: demo.fullName,
        identityNumber: `20000000${100 + index}`,
        birthDate: new Date('1990-01-01'),
        isChild: false,
        sortOrder: 0,
      },
    });

    await prisma.voucher.create({
      data: {
        reservationId: reservation.id,
        code: `VCH-SEAT-${demo.bookingSuffix}`,
      },
    });

    if (demo.seatCode) {
      await prisma.seatAssignment.create({
        data: {
          tourDateId: seatDemoTour.tourDateId,
          seatCode: demo.seatCode,
          reservationGuestId: guest.id,
          reservationId: reservation.id,
          assignedByAgencyStaffId: seatDemoAgency.ownerStaffId,
          assignedByAgencyId: seatDemoAgency.id,
          source: 'MANUAL',
        },
      });
    }

    const payment = await prisma.paymentTransaction.create({
      data: {
        reservationId: reservation.id,
        amount,
        currency: 'TRY',
        status: 'SUCCESS',
        method: 'CARD',
        provider: 'MOCK',
        conversationId: `seed-seat-conv-${demo.bookingSuffix}`,
        paidAt: new Date(),
      },
    });

    await prisma.invoice.create({
      data: {
        reservationId: reservation.id,
        paymentTransactionId: payment.id,
        userId: user.id,
        agencyId: seatDemoTour.agencyId,
        amount,
        currency: 'TRY',
        status: 'ISSUED',
        provider: 'MOCK',
        buyerSnapshot: { email: user.email, name: demo.fullName },
        sellerSnapshot: {
          agencyId: seatDemoTour.agencyId,
          legalTitle: seatDemoAgency.companyName,
          taxNumber: '2222222221',
          address: 'Seed adres',
        },
        linesSnapshot: [
          { title: seatDemoTour.slug, quantity: 1, unitPrice: amount },
        ],
      },
    });

    await prisma.agencyEarning.create({
      data: {
        agencyId: seatDemoTour.agencyId,
        reservationId: reservation.id,
        amount: amount * 0.9,
        grossAmount: amount,
        commissionAmount: amount * 0.1,
        commissionRatePercent: 10,
        currency: 'TRY',
        status: 'ACCRUED',
      },
    });

    await prisma.notification.create({
      data: {
        recipientType: 'USER',
        userId: user.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Rezervasyon onaylandı',
        body: `${bookingNumber} numaralı rezervasyonunuz onaylandı.`,
        data: { reservationId: reservation.id },
      },
    });
  }

  // Stable marker for E2E manage-seats (list sort is updatedAt desc; edits move others up).
  const seatDemoRow = await prisma.tour.findUniqueOrThrow({
    where: { id: seatDemoTour.id },
    select: { title: true },
  });
  await prisma.tour.update({
    where: { id: seatDemoTour.id },
    data: {
      featured: true,
      updatedAt: new Date(),
      title: seatDemoRow.title.includes('[SEAT-DEMO]')
        ? seatDemoRow.title
        : `${seatDemoRow.title} [SEAT-DEMO]`,
    },
  });

  // Other agencies: COMPLETED + review (valid numeric seat codes)
  for (let i = 1; i < 5; i++) {
    const tour = catalog.tours[i * 5];
    if (!tour) continue;
    const agency = identity.agencies.find((row) => row.id === tour.agencyId)!;
    const user = identity.customers[i % identity.customers.length];
    const bookingNumber = `SEED${String(10001 + i)}`;
    const amount = tour.price;

    const reservation = await prisma.reservation.create({
      data: {
        bookingNumber,
        userId: user.id,
        tourId: tour.id,
        tourDateId: tour.tourDateId,
        agencyId: tour.agencyId,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        adults: 2,
        children: 0,
        totalAmount: amount,
        boardingPickupPointId: tour.pickupPointId,
        contactEmail: user.email,
        contactPhone: '+905551112233',
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    const guest = await prisma.reservationGuest.create({
      data: {
        reservationId: reservation.id,
        fullName: `Misafir ${i + 1}`,
        identityNumber: `111111111${i}`,
        birthDate: new Date('1990-01-01'),
        isChild: false,
        sortOrder: 0,
      },
    });

    await prisma.reservationExtra.create({
      data: {
        reservationId: reservation.id,
        tourExtraId: tour.extraId,
        quantity: 2,
        unitPrice: 750,
        currency: 'TRY',
      },
    });

    await prisma.voucher.create({
      data: {
        reservationId: reservation.id,
        code: `VCH-SEED-${i + 1}`,
      },
    });

    await prisma.seatAssignment.create({
      data: {
        tourDateId: tour.tourDateId,
        seatCode: String(i + 1),
        reservationGuestId: guest.id,
        reservationId: reservation.id,
        assignedByAgencyStaffId: agency.ownerStaffId,
        assignedByAgencyId: agency.id,
        source: 'MANUAL',
      },
    });

    const payment = await prisma.paymentTransaction.create({
      data: {
        reservationId: reservation.id,
        amount,
        currency: 'TRY',
        status: 'SUCCESS',
        method: 'CARD',
        provider: 'MOCK',
        conversationId: `seed-conv-${i + 1}`,
        paidAt: new Date(),
      },
    });

    await prisma.invoice.create({
      data: {
        reservationId: reservation.id,
        paymentTransactionId: payment.id,
        userId: user.id,
        agencyId: tour.agencyId,
        amount,
        currency: 'TRY',
        status: 'ISSUED',
        provider: 'MOCK',
        buyerSnapshot: {
          email: user.email,
          name: `Misafir ${i + 1}`,
        },
        sellerSnapshot: {
          agencyId: tour.agencyId,
          legalTitle: agency.companyName,
          taxNumber: `222222222${i + 1}`,
          address: 'Seed adres',
        },
        linesSnapshot: [
          { title: tour.slug, quantity: 2, unitPrice: amount / 2 },
        ],
      },
    });

    const commissionRate = 10 + ((i % 5) + 1);
    const commissionAmount = (amount * commissionRate) / 100;
    const net = amount - commissionAmount;
    await prisma.agencyEarning.create({
      data: {
        agencyId: tour.agencyId,
        reservationId: reservation.id,
        amount: net,
        grossAmount: amount,
        commissionAmount,
        commissionRatePercent: commissionRate,
        currency: 'TRY',
        status: 'ACCRUED',
      },
    });

    // Reviews: seeded in seed/reviews.ts (COMPLETED + TourMetrics mirror)

    await prisma.notification.create({
      data: {
        recipientType: 'USER',
        userId: user.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Rezervasyon onaylandı',
        body: `${bookingNumber} numaralı rezervasyonunuz onaylandı.`,
        data: { reservationId: reservation.id },
      },
    });
  }

  // Pending holds for agency-01 (E2E confirm) + another agency leftover
  const holdTourAgency1 = catalog.tours[0];
  await prisma.reservation.create({
    data: {
      bookingNumber: 'SEEDHOLD01',
      userId: customer2.id,
      tourId: holdTourAgency1.id,
      tourDateId: holdTourAgency1.tourDateId,
      agencyId: holdTourAgency1.agencyId,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      adults: 1,
      children: 0,
      totalAmount: holdTourAgency1.price,
      boardingPickupPointId: holdTourAgency1.pickupPointId,
      contactEmail: customer2.email,
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      heldPartySize: 1,
    },
  });

  const holdTourAgency2 = catalog.tours[5];
  await prisma.reservation.create({
    data: {
      bookingNumber: 'SEEDHOLD02',
      userId: customer2.id,
      tourId: holdTourAgency2.id,
      tourDateId: holdTourAgency2.tourDateId,
      agencyId: holdTourAgency2.agencyId,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      adults: 1,
      children: 0,
      totalAmount: holdTourAgency2.price,
      boardingPickupPointId: holdTourAgency2.pickupPointId,
      contactEmail: customer2.email,
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      heldPartySize: 1,
    },
  });

  await prisma.agencyPayout.create({
    data: {
      agencyId: identity.agencies[0].id,
      amount: 5000,
      currency: 'TRY',
      status: 'PENDING',
    },
  });

  await prisma.outboxEvent.create({
    data: {
      aggregateType: 'Review',
      aggregateId: 'seed',
      eventType: 'ReviewCreated',
      payload: { source: 'seed' },
      status: 'PROCESSED',
      processedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'SYSTEM',
      action: 'SEED_COMPLETED',
      entityType: 'Seed',
      meta: { at: new Date().toISOString() },
    },
  });

  await prisma.idempotencyKey.create({
    data: {
      key: 'seed-demo-key-1',
      method: 'POST',
      path: '/api/v1/booking',
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  await prisma.emailOtp.create({
    data: {
      email: customer.email,
      purpose: 'REGISTER',
      codeHash: 'seed-unused-hash',
      expiresAt: new Date(Date.now() - 3600000),
    },
  });
}
