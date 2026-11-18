/**
 * Assert min row counts after full demo seed.
 * Çalıştır: pnpm --filter api seed:verify
 */
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const MIN: Record<string, number> = {
  user: 20, // 5×4 roles
  agency: 5,
  agencyStaff: 15, // 3 per agency
  guide: 5,
  busCompany: 5,
  vehicle: 5,
  guideAvailability: 100,
  vehicleAvailability: 100,
  agencyBankInfo: 5,
  tursabVerificationLog: 5,
  busSeatLayout: 5,
  tour: 25,
  tourDate: 50,
  tourDateAgeRange: 50,
  tourPickupPoint: 50,
  tourExtra: 25,
  tourAccommodation: 25,
  hotel: 10,
  experience: 25,
  activityDate: 25,
  experienceDateAgeRange: 25,
  tag: 5,
  tourTag: 25,
  tourMetrics: 25,
  tourDateAssignment: 25,
  tourDepartureRule: 25,
  reservation: 50,
  reservationGuest: 40,
  voucher: 40,
  paymentTransaction: 40,
  invoice: 40,
  agencyEarning: 9,
  agencyCommissionRate: 5,
  review: 30,
  favorite: 5,
  seatAssignment: 6,
  coupon: 1,
  campaign: 1,
  category: 1,
  post: 1,
  notification: 5,
};

async function main() {
  const failures: string[] = [];
  const report: Record<string, number> = {};

  for (const [key, min] of Object.entries(MIN)) {
    const model = (
      prisma as never as Record<string, { count: () => Promise<number> }>
    )[key];
    if (!model?.count) {
      failures.push(`${key}: model missing on PrismaClient`);
      continue;
    }
    const count = await model.count();
    report[key] = count;
    if (count < min) {
      failures.push(`${key}: ${count} < min ${min}`);
    }
  }

  // Checkout-critical: every PUBLISHED tour has date + pickup + age range
  const published = await prisma.tour.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    select: {
      id: true,
      slug: true,
      _count: {
        select: { dates: true, pickupPoints: true },
      },
    },
  });
  for (const tour of published) {
    if (tour._count.dates < 1) {
      failures.push(`tour ${tour.slug}: no TourDate`);
    }
    if (tour._count.pickupPoints < 1) {
      failures.push(`tour ${tour.slug}: no TourPickupPoint`);
    }
    const dates = await prisma.tourDate.findMany({
      where: { tourId: tour.id, deletedAt: null },
      select: { id: true, _count: { select: { ageRanges: true } } },
    });
    for (const date of dates) {
      if (date._count.ageRanges < 1) {
        failures.push(`tourDate ${date.id}: no age ranges`);
      }
    }
  }

  if (published.length < 5) {
    failures.push(`publishedTours: ${published.length} < min 5`);
  }

  console.log(
    JSON.stringify({ report, publishedTours: published.length }, null, 2),
  );

  if (failures.length) {
    console.error('VERIFY FAILED:');
    for (const line of failures) console.error(' -', line);
    process.exit(1);
  }

  console.log('VERIFY OK — all minimums met + published tours checkout-ready');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
