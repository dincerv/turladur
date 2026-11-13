import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const CONTACT_SUBJECTS = [
  'reservation',
  'cancellation',
  'support',
  'partnership',
  'other',
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Ayşe Yılmaz' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'ayse@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ example: '+90 532 000 00 00' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({
    enum: CONTACT_SUBJECTS,
    example: 'support',
  })
  @IsIn([...CONTACT_SUBJECTS])
  subject!: ContactSubject;

  @ApiProperty({ example: 'Rezervasyonum hakkında bilgi almak istiyorum.' })
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;

  /** Honeypot — bots fill this; service drops the message silently. */
  @ApiPropertyOptional({ description: 'Leave empty (anti-spam honeypot)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
