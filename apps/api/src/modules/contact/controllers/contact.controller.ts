import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../../core/auth/decorators/public.decorator';
import { CreateContactMessageDto } from '../dto/contact.dto';
import { ContactService } from '../services/contact.service';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Submit the public contact form' })
  submit(@Body() dto: CreateContactMessageDto) {
    return this.contactService.submit(dto);
  }
}
