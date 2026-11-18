import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../core/database/prisma.service';
import { SubUserService } from '../services/sub-user.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { createPrismaMock } from '../../__tests__/test-helpers';

const ownerActor = {
  userId: 'staff-owner',
  role: 'AGENCY_OWNER',
  agencyId: 'a1',
  agencyStaffId: 'staff-owner',
};

describe('SubUserService', () => {
  let service: SubUserService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [SubUserService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(SubUserService);
  });

  it('should list AgencyStaff for agency owner', async () => {
    (prisma.agencyStaff.findMany as jest.Mock).mockResolvedValue([
      {
        id: 's1',
        agencyId: 'a1',
        name: 'Ayşe',
        email: 'ayse@acme.com',
        role: 'AGENCY_STAFF',
        status: 'ACTIVE',
        permissions: { tours: ['read'] },
        lastLoginAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      },
    ]);

    const result = await service.list('a1', ownerActor);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].email).toBe('ayse@acme.com');
    expect(result.data[0].partnerId).toBe('a1');
    expect(result.data[0].uiRole).toBe('AGENT');
  });

  it('should forbid listing for AGENCY_ADMIN (OWNER-only)', async () => {
    await expect(
      service.list('a1', {
        userId: 'admin-staff',
        role: 'AGENCY_ADMIN',
        agencyId: 'a1',
        agencyStaffId: 'admin-staff',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should forbid listing another agency users', async () => {
    await expect(
      service.list('a1', {
        userId: 'staff-other',
        role: 'AGENCY_OWNER',
        agencyId: 'a2',
        agencyStaffId: 'staff-other',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject duplicate email', async () => {
    (prisma.agency.findFirst as jest.Mock).mockResolvedValue({ id: 'a1' });
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({ id: 's1' });

    await expect(
      service.create(
        'a1',
        { name: 'Duplicate', email: 'ayse@acme.com', password: 'StaffPass1' },
        ownerActor,
      ),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('should create AgencyStaff with bcrypt-hashed password', async () => {
    (prisma.agency.findFirst as jest.Mock).mockResolvedValue({ id: 'a1' });
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.agencyStaff.create as jest.Mock).mockImplementation(
      async ({ data }) => ({
        id: 's2',
        agencyId: 'a1',
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status ?? 'ACTIVE',
        permissions: data.permissions ?? {},
        passwordHash: data.passwordHash,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await service.create(
      'a1',
      {
        name: 'Staff',
        email: 'staff@acme.com',
        password: 'StaffPass1',
        role: 'AGENT',
      },
      ownerActor,
    );

    expect(result.data.id).toBe('s2');
    expect(result.data.uiRole).toBe('AGENT');
    expect(prisma.agencyStaff.create).toHaveBeenCalled();
    const createArg = (prisma.agencyStaff.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(
      await bcrypt.compare('StaffPass1', createArg.data.passwordHash),
    ).toBe(true);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should update and soft-delete AgencyStaff', async () => {
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({
      id: 's1',
      agencyId: 'a1',
      email: 'ayse@acme.com',
      role: 'AGENCY_STAFF',
      status: 'ACTIVE',
      deletedAt: null,
    });
    (prisma.agencyStaff.update as jest.Mock).mockResolvedValue({
      id: 's1',
      agencyId: 'a1',
      name: 'Ayşe Y.',
      email: 'ayse@acme.com',
      role: 'AGENCY_STAFF',
      status: 'ACTIVE',
      permissions: {},
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await service.update(
      'a1',
      's1',
      { name: 'Ayşe Y.' },
      ownerActor,
    );
    expect(updated.data.name).toBe('Ayşe Y.');

    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({
      id: 's1',
      agencyId: 'a1',
      role: 'AGENCY_STAFF',
      deletedAt: null,
    });
    (prisma.agencyStaff.update as jest.Mock).mockResolvedValue({});
    const deleted = await service.softDelete('a1', 's1', {
      userId: 'admin',
      role: 'ADMIN',
      agencyId: undefined,
    });
    expect(deleted.data.deleted).toBe(true);
  });

  it('should block self-demotion of OWNER', async () => {
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({
      id: 'staff-owner',
      agencyId: 'a1',
      email: 'owner@acme.com',
      role: 'AGENCY_OWNER',
      status: 'ACTIVE',
      deletedAt: null,
    });

    await expect(
      service.update('a1', 'staff-owner', { role: 'AGENT' }, ownerActor),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('should block self-delete', async () => {
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({
      id: 'staff-owner',
      agencyId: 'a1',
      role: 'AGENCY_OWNER',
      deletedAt: null,
    });

    await expect(
      service.softDelete('a1', 'staff-owner', ownerActor),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('should block self-deactivate', async () => {
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({
      id: 'staff-owner',
      agencyId: 'a1',
      email: 'owner@acme.com',
      role: 'AGENCY_OWNER',
      status: 'ACTIVE',
      deletedAt: null,
    });

    await expect(
      service.update('a1', 'staff-owner', { status: 'INACTIVE' }, ownerActor),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('should protect last active OWNER from demotion', async () => {
    (prisma.agencyStaff.findFirst as jest.Mock).mockResolvedValue({
      id: 'other-owner',
      agencyId: 'a1',
      email: 'other@acme.com',
      role: 'AGENCY_OWNER',
      status: 'ACTIVE',
      deletedAt: null,
    });
    (prisma.agencyStaff.count as jest.Mock).mockResolvedValue(0);

    await expect(
      service.update('a1', 'other-owner', { role: 'MANAGER' }, ownerActor),
    ).rejects.toBeInstanceOf(BusinessException);
  });
});
