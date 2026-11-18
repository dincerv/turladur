import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@turta/shared-constants';
import { hasStaffModuleAccess } from '@turta/shared-validators';

import { PrismaService } from '../../database/prisma.service';
import { STAFF_PERMISSIONS_KEY } from '../decorators/require-staff-permissions.decorator';
import { UserPayload } from '../types/auth.types';

function modeFromHttpMethod(method: string): 'read' | 'write' {
  const m = method.toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return 'read';
  return 'write';
}

@Injectable()
export class StaffPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      STAFF_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: UserPayload;
      method?: string;
    }>();
    const user = request.user;
    const mode = modeFromHttpMethod(request.method ?? 'GET');

    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok.',
      });
    }

    if (
      user.role === Role.PARTNER ||
      user.role === Role.AGENCY_OWNER ||
      user.role === Role.AGENCY_ADMIN ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN ||
      user.role === Role.PLATFORM_ADMIN ||
      user.role === Role.PLATFORM_SUPER_ADMIN
    ) {
      return true;
    }

    if (user.role === Role.AGENCY_STAFF) {
      const staff = await this.prisma.agencyStaff.findFirst({
        where: {
          id: user.agencyStaffId ?? user.userId,
          deletedAt: null,
          status: 'ACTIVE',
        },
        select: { permissions: true },
      });
      if (!staff) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Bu işlem için yetkiniz yok.',
        });
      }
      const allowed = required.some((key) =>
        hasStaffModuleAccess(staff.permissions, key, mode),
      );
      if (!allowed) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Bu işlem için yetkiniz yok.',
        });
      }
      return true;
    }

    if (user.role !== Role.PARTNER_STAFF) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok.',
      });
    }

    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.userId, deletedAt: null },
      select: { permissions: true, isActive: true },
    });

    if (!dbUser?.isActive) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok.',
      });
    }

    const allowed = required.some((key) =>
      hasStaffModuleAccess(dbUser.permissions, key, mode),
    );

    if (!allowed) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok.',
      });
    }

    return true;
  }
}
