import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AGENCY_OWNER_ONLY_ROLES } from '../../../core/auth/utils/role-access';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserPayload } from '../../../core/auth/types/auth.types';
import { CreateSubUserDto, UpdateSubUserDto } from '../dto/sub-user.dto';
import { SubUserService } from '../services/sub-user.service';

@ApiTags('Identity - Sub Users')
@ApiBearerAuth()
@Controller('identity/partners/:agencyId/users')
@Roles(...AGENCY_OWNER_ONLY_ROLES)
export class SubUserController {
  constructor(private readonly subUserService: SubUserService) {}

  @Get()
  @ApiOperation({ summary: 'List agency staff (OWNER only)' })
  list(@Param('agencyId') agencyId: string, @CurrentUser() user: UserPayload) {
    return this.subUserService.list(agencyId, {
      userId: user.userId,
      role: user.role,
      agencyId: user.agencyId,
      agencyStaffId: user.agencyStaffId,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create agency staff — password bcrypt-hashed' })
  create(
    @Param('agencyId') agencyId: string,
    @Body() dto: CreateSubUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.subUserService.create(agencyId, dto, {
      userId: user.userId,
      role: user.role,
      agencyId: user.agencyId,
      agencyStaffId: user.agencyStaffId,
    });
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update agency staff (self-demotion blocked)' })
  update(
    @Param('agencyId') agencyId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateSubUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.subUserService.update(agencyId, userId, dto, {
      userId: user.userId,
      role: user.role,
      agencyId: user.agencyId,
      agencyStaffId: user.agencyStaffId,
    });
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Soft-delete agency staff (self-delete blocked)' })
  remove(
    @Param('agencyId') agencyId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.subUserService.softDelete(agencyId, userId, {
      userId: user.userId,
      role: user.role,
      agencyId: user.agencyId,
      agencyStaffId: user.agencyStaffId,
    });
  }
}
