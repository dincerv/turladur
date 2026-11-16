import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { TRAVELER_PERSONAS } from '@turta/shared-validators';

export class PersonaMatchDto {
  @ApiProperty({ enum: TRAVELER_PERSONAS, example: 'CALM' })
  @IsIn([...TRAVELER_PERSONAS])
  persona!: (typeof TRAVELER_PERSONAS)[number];

  @ApiPropertyOptional({
    example: 'Sakinlik istiyorum, yüksek sesli dans istemem',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  intent?: string;
}
