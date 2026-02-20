import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { DatabaseService } from '../shared/database.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, DatabaseService],
  exports: [ContactService],
})
export class ContactModule {}
