import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TourCategory,
  TourDestinationScope,
  TourStayKind,
} from '@turta/shared-constants';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
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

import { AgePricingTypeDto } from './age-range.dto';

export class CreateTourAgeRangeNestedDto {
  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge!: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAge?: number | null;

  @ApiProperty({ enum: AgePricingTypeDto })
  @IsEnum(AgePricingTypeDto)
  pricingType!: AgePricingTypeDto;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;
}

export class CreateTourDateNestedDto {
  @ApiProperty({ example: '2026-08-15' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ example: 4200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @ApiPropertyOptional({ type: [CreateTourAgeRangeNestedDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourAgeRangeNestedDto)
  ageRanges?: CreateTourAgeRangeNestedDto[];
}

export class CreateTourPickupNestedDto {
  @ApiProperty({ example: 'Ankara' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'AŞTİ Terminal' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  location!: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  time!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateTourAccommodationNestedDto {
  @ApiProperty({ example: 'Kapadokya Cave Hotel' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/hotel.jpg' })
  @IsString()
  @MinLength(1)
  image!: string;

  @ApiProperty({ example: 'Nevşehir' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location!: string;

  @ApiProperty({ example: 'Otel' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  type!: string;
}

export class CreateTourDto {
  @ApiProperty({ example: 'Kapadokya Balon Turu' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Gün doğumunda balon turu...' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ example: 4500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 'TRY', default: 'TRY' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ enum: TourCategory, example: TourCategory.ADVENTURE })
  @IsEnum(TourCategory)
  category!: TourCategory;

  @ApiPropertyOptional({ example: 1, default: 1 })
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

  @ApiPropertyOptional({ type: [String], example: ['Ankara'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departureCities?: string[];

  @ApiPropertyOptional({ example: 'https://cdn.example.com/kapadokya.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @ApiPropertyOptional({
    description:
      'Legacy form fields: includes, excludes, healthPrivileges, itinerary, destinations, etc.',
  })
  @IsOptional()
  @IsObject()
  extras?: Record<string, unknown>;

  /** true → status DRAFT; false/omit → PENDING_REVIEW (partner publish queue) */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  asDraft?: boolean;

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
