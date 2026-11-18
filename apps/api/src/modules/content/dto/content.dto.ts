import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Kapadokya’da 3 Gün' })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @ApiProperty({ example: 'Bölge rehberi ve öneriler...' })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ description: 'SEO title override' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description override' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @ApiPropertyOptional({ type: [String], description: 'Category ids' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  categoryIds?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ description: 'SEO title override' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoTitle?: string | null;

  @ApiPropertyOptional({ description: 'SEO meta description override' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

export class SearchPostsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Admin: include drafts' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDrafts?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Rehberler' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Çok faydalı bir yazı olmuş.' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;
}

export class UpdateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;
}

export class UpdatePageCoverDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string | null;
}

export class UpdateRoutePageDto {
  @ApiPropertyOptional({ example: 'Kapadokya Balon Turları | turta' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @ApiPropertyOptional({
    description: 'Hero subtitle + listing card description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string | null;

  @ApiPropertyOptional({ description: 'Hakkında section body' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string | null;
}
