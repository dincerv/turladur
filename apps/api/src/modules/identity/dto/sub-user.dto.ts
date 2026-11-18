import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  AGENCY_STAFF_STATUSES,
  AGENCY_STAFF_UI_ROLES,
} from '@turta/shared-validators';

export class CreateSubUserDto {
  @ApiProperty({ example: 'Ayşe Yılmaz' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'ayse@acme.com' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  email!: string;

  @ApiProperty({
    description: 'bcrypt ile hashlenir — düz metin saklanmaz',
    example: 'StaffPass1',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Şifre en az 1 büyük harf ve 1 rakam içermelidir',
  })
  password!: string;

  @ApiPropertyOptional({
    enum: AGENCY_STAFF_UI_ROLES,
    example: 'AGENT',
    default: 'AGENT',
  })
  @IsOptional()
  @IsIn([
    ...AGENCY_STAFF_UI_ROLES,
    'AGENCY_OWNER',
    'AGENCY_ADMIN',
    'AGENCY_STAFF',
    'USER',
  ])
  role?: string;

  @ApiPropertyOptional({
    example: { tours: ['read', 'write'], reservations: ['read'] },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, unknown>;
}

export class UpdateSubUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: AGENCY_STAFF_UI_ROLES, example: 'MANAGER' })
  @IsOptional()
  @IsIn([
    ...AGENCY_STAFF_UI_ROLES,
    'AGENCY_OWNER',
    'AGENCY_ADMIN',
    'AGENCY_STAFF',
  ])
  role?: string;

  @ApiPropertyOptional({ enum: AGENCY_STAFF_STATUSES, example: 'ACTIVE' })
  @IsOptional()
  @IsIn([...AGENCY_STAFF_STATUSES])
  status?: string;

  @ApiPropertyOptional({
    description: 'Opsiyonel yeni şifre (bcrypt)',
    example: 'StaffPass1',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Şifre en az 1 büyük harf ve 1 rakam içermelidir',
  })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  permissions?: Record<string, unknown>;
}
