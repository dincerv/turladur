import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  TourCategory,
  TourDestinationScope,
  TourStayKind,
  TourStatus,
} from '@turta/shared-constants';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  CreateTourAccommodationNestedDto,
  CreateTourDateNestedDto,
  CreateTourPickupNestedDto,
} from './create-tour.dto';

export class UpdateTourDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: TourCategory })
  @IsOptional()
  @IsEnum(TourCategory)
  category?: TourCategory;

  @ApiPropertyOptional({ enum: TourStatus })
  @IsOptional()
  @IsEnum(TourStatus)
  status?: TourStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({ enum: TourStayKind })
  @IsOptional()
  @IsEnum(TourStayKind)
  stayKind?: TourStayKind;

  @ApiPropertyOptional({ enum: TourDestinationScope })
  @IsOptional()
  @IsEnum(TourDestinationScope)
  destinationScope?: TourDestinationScope;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departureCities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @ApiPropertyOptional({
    description: 'Legacy form fields including healthPrivileges (string[]).',
  })
  @IsOptional()
  @IsObject()
  extras?: Record<string, unknown>;

  /** When true + pickupPoints provided → soft-delete existing then recreate. */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  replacePickupPoints?: boolean;

  @ApiPropertyOptional({ type: [CreateTourDateNestedDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourDateNestedDto)
  dates?: CreateTourDateNestedDto[];

  @ApiPropertyOptional({ type: [CreateTourPickupNestedDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourPickupNestedDto)
  pickupPoints?: CreateTourPickupNestedDto[];

  @ApiPropertyOptional({ type: CreateTourAccommodationNestedDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTourAccommodationNestedDto)
  accommodation?: CreateTourAccommodationNestedDto;
}
