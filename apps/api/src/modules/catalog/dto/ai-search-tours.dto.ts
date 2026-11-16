import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import {
  AI_SEARCH_PROMPT_MAX,
  AI_SEARCH_PROMPT_MIN,
} from '@turta/shared-validators';

export class AiSearchToursDto {
  @ApiProperty({
    example: "Ankara'dan 3 gece Karadeniz turu, Uzungöl ve Ayder olsun",
    minLength: AI_SEARCH_PROMPT_MIN,
    maxLength: AI_SEARCH_PROMPT_MAX,
  })
  @IsString()
  @MinLength(AI_SEARCH_PROMPT_MIN)
  @MaxLength(AI_SEARCH_PROMPT_MAX)
  prompt!: string;
}
