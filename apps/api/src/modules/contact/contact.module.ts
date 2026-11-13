import { Module } from '@nestjs/common';

import { QueueModule } from '../../core/queue/queue.module';
import { ContactController } from './controllers/contact.controller';
import { ContactService } from './services/contact.service';

@Module({
  imports: [QueueModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
