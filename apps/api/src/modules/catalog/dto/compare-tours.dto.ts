import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

import { COMPARE_TOURS_MAX } from '@turta/shared-validators';

/**
 * Wire DTO for Nest ValidationPipe + Swagger.
 * Canonical validation (duplicates, trim) also runs via Zod in TourService.compareTours.
 */
export class CompareToursDto {
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: COMPARE_TOURS_MAX,
    description: `Tour ids to compare (1–${COMPARE_TOURS_MAX})`,
    example: ['clxxxxxxxx', 'clyyyyyyyy'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(COMPARE_TOURS_MAX)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  ids!: string[];
}
