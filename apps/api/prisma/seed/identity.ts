import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma';
import { AGENCY_CITIES, COUNT, DEMO_PASSWORD } from './constants';

export type SeedIdentity = {
  passwordHash: string;
  customers: { id: string; email: string }[];
  admins: { id: string; email: string }[];
  platformAdmins: { id: string; email: string }[];
  superAdmins: { id: string; email: string }[];
  agencies: {
    id: string;
    companyName: string;
    ownerStaffId: string;
    adminStaffId: string;
    staffStaffId: string;
  }[];
  guides: { id: string; email: string }[];
  busCompanies: { id: string; email: string; vehicleId: string }[];
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Deterministic 11-digit identity numbers (demo only). */
function demoIdentityNumber(index: number) {
  return `10000000${100 + index}`;
}

export async function seedIdentity(
  prisma: PrismaClient,
): Promise<SeedIdentity> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const customers: SeedIdentity['customers'] = [];
  for (let i = 1; i <= COUNT; i++) {
    const email = `customer${pad(i)}@demo.turta.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: `Müşteri`,
        lastName: `${pad(i)}`,
        phone: `+90555100${10 + i}`,
        role: 'CUSTOMER',
        isActive: true,
      },
    });
    customers.push({ id: user.id, email });
  }

  const admins: SeedIdentity['admins'] = [];
  for (let i = 1; i <= COUNT; i++) {
    const email = `admin${pad(i)}@demo.turta.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: pad(i),
        role: 'ADMIN',
        isActive: true,
      },
    });
    admins.push({ id: user.id, email });
  }

  const platformAdmins: SeedIdentity['platformAdmins'] = [];
  for (let i = 1; i <= COUNT; i++) {
    const email = `platform-admin${pad(i)}@demo.turta.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Platform',
        lastName: `Admin${pad(i)}`,
        role: 'PLATFORM_ADMIN',
        isActive: true,
      },
    });
    platformAdmins.push({ id: user.id, email });
  }

  const superAdmins: SeedIdentity['superAdmins'] = [];
  for (let i = 1; i <= COUNT; i++) {
    const email = `superadmin${pad(i)}@demo.turta.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Super',
        lastName: pad(i),
        role: 'PLATFORM_SUPER_ADMIN',
        isActive: true,
      },
    });
    superAdmins.push({ id: user.id, email });
  }

  const agencies: SeedIdentity['agencies'] = [];
  for (let i = 1; i <= COUNT; i++) {
    const city = AGENCY_CITIES[i - 1];
    const taxNumber = `222222222${i}`;
    const contactEmail = `owner${pad(i)}@agency.demo.turta.com`;
    const agency = await prisma.agency.create({
      data: {
        id: `seed-agency-${pad(i)}`,
        companyName: `${city} Demo Acente ${pad(i)}`,
        taxNumber,
        legalTitle: `${city} Demo Acente ${pad(i)} A.Ş.`,
        address: `Atatürk Cad. No:${i} ${city}`,
        city,
        country: 'Türkiye',
        contactEmail,
        contactPhone: `+90312${5550000 + i}`,
        status: 'VERIFIED',
        sellerTier: i <= 2 ? 'GOLD' : i <= 4 ? 'SILVER' : 'BRONZE',
        capabilities: ['TOURS'],
        verifiedAt: new Date(),
        tursabBelgeNo: `A-${1000 + i}`,
        tursabUnvan: `${city} Demo Acente ${pad(i)} A.Ş.`,
        tursabCity: city,
        tursabVerificationStatus: 'VERIFIED',
        tursabVerifiedAt: new Date(),
        averageRating: 4 + (i % 10) / 10,
        reviewCount: i * 3,
      },
    });

    const owner = await prisma.agencyStaff.create({
      data: {
        agencyId: agency.id,
        name: `${city} Sahip`,
        email: contactEmail,
        passwordHash,
        role: 'AGENCY_OWNER',
        status: 'ACTIVE',
      },
    });
    const adminStaff = await prisma.agencyStaff.create({
      data: {
        agencyId: agency.id,
        name: `${city} Admin`,
        email: `admin${pad(i)}@agency.demo.turta.com`,
        passwordHash,
        role: 'AGENCY_ADMIN',
        status: 'ACTIVE',
      },
    });
    const staff = await prisma.agencyStaff.create({
      data: {
        agencyId: agency.id,
        name: `${city} Personel`,
        email: `staff${pad(i)}@agency.demo.turta.com`,
        passwordHash,
        role: 'AGENCY_STAFF',
        status: 'ACTIVE',
      },
    });

    await prisma.agencyBankInfo.create({
      data: {
        agencyId: agency.id,
        iban: `TR33000610051978645784132${i}`,
        accountName: agency.legalTitle,
        bankName: 'Demo Bank',
        isDefault: true,
      },
    });

    await prisma.tursabVerificationLog.create({
      data: {
        agencyId: agency.id,
        belgeNo: `A-${1000 + i}`,
        trigger: 'SEED',
        success: true,
        statusResult: 'VERIFIED',
        responseSummary: { source: 'seed' },
      },
    });

    await prisma.agencyCommissionRate.create({
      data: {
        agencyId: agency.id,
        ratePercent: 10 + i,
        effectiveFrom: new Date('2025-01-01'),
      },
    });

    agencies.push({
      id: agency.id,
      companyName: agency.companyName,
      ownerStaffId: owner.id,
      adminStaffId: adminStaff.id,
      staffStaffId: staff.id,
    });
  }

  const guides: SeedIdentity['guides'] = [];
  for (let i = 1; i <= COUNT; i++) {
    const email = `guide${pad(i)}@demo.turta.com`;
    const guide = await prisma.guide.create({
      data: {
        identityNumber: demoIdentityNumber(i),
        firstName: 'Rehber',
        lastName: pad(i),
        email,
        passwordHash,
        phone: `+90532100${20 + i}`,
        birthDate: new Date(`199${i}-06-15T00:00:00.000Z`),
        status: 'VERIFIED',
        languages: ['tr', 'en'],
        oda: AGENCY_CITIES[i - 1],
        sicilNo: `SIC-${pad(i)}`,
        ruhsatNo: `RH-${pad(i)}`,
        ruhsatExpiresAt: new Date('2028-12-31T00:00:00.000Z'),
        city: AGENCY_CITIES[i - 1],
        verifiedAt: new Date(),
        bio: `Demo rehber ${pad(i)} — yerel uzman.`,
      },
    });
    guides.push({ id: guide.id, email });

    const today = new Date();
    for (let d = 0; d < 45; d++) {
      const date = new Date(today);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() + d);
      await prisma.guideAvailability.create({
        data: {
          guideId: guide.id,
          date,
          isAvailable: d % 7 !== 0,
        },
      });
    }
  }

  const busCompanies: SeedIdentity['busCompanies'] = [];
  const layouts = [
    'BUS_19_PLUS_1',
    'BUS_31_PLUS_1',
    'BUS_35_PLUS_1',
    'BUS_46_PLUS_1',
    'BUS_50_PLUS_1',
  ] as const;
  const capacities = [19, 31, 35, 46, 50];

  for (let i = 1; i <= COUNT; i++) {
    const email = `bus${pad(i)}@demo.turta.com`;
    const bus = await prisma.busCompany.create({
      data: {
        companyName: `Demo Filo ${pad(i)}`,
        taxNumber: `333333333${i}`,
        contactEmail: email,
        passwordHash,
        contactPhone: `+90312${6660000 + i}`,
        status: 'VERIFIED',
        city: AGENCY_CITIES[i - 1],
        country: 'Türkiye',
        verifiedAt: new Date(),
        vehicleCount: 1,
      },
    });
    const vehicle = await prisma.vehicle.create({
      data: {
        busCompanyId: bus.id,
        plateNumber: `06 DEM ${pad(i)}`,
        modelYear: 2020 + i,
        seatLayoutKind: layouts[i - 1],
        capacity: capacities[i - 1],
        isActive: true,
        notes: 'Seed demo araç',
      },
    });

    const today = new Date();
    for (let d = 0; d < 45; d++) {
      const date = new Date(today);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() + d);
      await prisma.vehicleAvailability.create({
        data: {
          vehicleId: vehicle.id,
          date,
          isAvailable: d % 6 !== 0,
        },
      });
    }

    busCompanies.push({
      id: bus.id,
      email,
      vehicleId: vehicle.id,
    });
  }

  return {
    passwordHash,
    customers,
    admins,
    platformAdmins,
    superAdmins,
    agencies,
    guides,
    busCompanies,
  };
}
