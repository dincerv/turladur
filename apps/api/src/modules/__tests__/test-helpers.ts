/** Minimal Decimal-like value for Prisma mock rows. */
export function decimal(value: string | number) {
  return {
    toString: () => String(value),
    mul: (n: number) => decimal(Number(value) * n),
  };
}

export function createPrismaMock() {
  const prisma: Record<string, unknown> = {
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };

  const models = [
    'user',
    'hotel',
    'room',
    'experience',
    'activityDate',
    'tour',
    'tourDate',
    'tourDateAgeRange',
    'experienceDateAgeRange',
    'tourAccommodation',
    'tourPickupPoint',
    'tourExtra',
    'reservation',
    'reservationGuest',
    'reservationExtra',
    'voucher',
    'invoice',
    'partner',
    'agency',
    'legacyAgency',
    'agencyStaff',
    'busCompany',
    'guide',
    'vehicle',
    'guideAvailability',
    'vehicleAvailability',
    'tourDateAssignment',
    'busSeatLayout',
    'seatAssignment',
    'tourMetrics',
    'outboxEvent',
    'tag',
    'tourTag',
    'postTag',
    'refreshToken',
    'idempotencyKey',
    'auditLog',
    'post',
    'category',
    'comment',
    'sitePageCover',
    'routePage',
    'subUser',
    'review',
    'agencyCommissionRate',
    'agencyEarning',
    'agencyPayout',
    'agencyBankInfo',
    'favorite',
    'coupon',
    'couponUsage',
    'campaign',
  ];

  for (const model of models) {
    prisma[model] = {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    };
  }

  return prisma;
}

export function createCacheMock() {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
  };
}
