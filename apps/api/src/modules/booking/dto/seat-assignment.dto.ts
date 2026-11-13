import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AssignSeatManualDto {
  @ApiProperty({ example: '12' })
  @IsString()
  @MinLength(1)
  seatCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reservationGuestId!: string;

  @ApiPropertyOptional({
    description: 'URL tourId — TourDate.tourId ile eşleşmeli (IDOR)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  tourId?: string;
}

export class AssignSeatItemDto {
  @ApiProperty({ example: '10' })
  @IsString()
  @MinLength(1)
  seatCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reservationGuestId!: string;
}

export class AssignSeatBulkDto {
  @ApiProperty({ type: [AssignSeatItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssignSeatItemDto)
  assignments!: AssignSeatItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  tourId?: string;
}

export class SeatMapQueryDto {
  @ApiPropertyOptional({ description: 'URL tourId doğrulaması' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  tourId?: string;
}
