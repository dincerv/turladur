import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { TRAVELER_CONTEXTS } from '../utils/review-scoring';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  reservationId!: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 5,
    description: 'Optional — overall is computed from criterion scores',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Rehberlik & Anlatım' })
  @IsInt()
  @Min(1)
  @Max(5)
  guideRating!: number;

  @ApiProperty({
    minimum: 1,
    maximum: 5,
    description: 'Program & Fiyat/Performans',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  valueRating!: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  transportRating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  accommodationRating?: number;

  @ApiProperty({ enum: TRAVELER_CONTEXTS })
  @IsIn([...TRAVELER_CONTEXTS])
  travelerContext!: (typeof TRAVELER_CONTEXTS)[number];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({ require_tld: false }, { each: true })
  photoUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guideFeedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  transportFeedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  accommodationFeedback?: string;
}
