import { Module } from '@nestjs/common';
import { MemberProfilePageController } from './member-profile-page.controller';
import { MemberProfilePageService } from './member-profile-page.service';
import { DatabaseService } from '../shared/database.service';

@Module({
  imports: [],
  controllers: [MemberProfilePageController],
  providers: [MemberProfilePageService, DatabaseService],
})
export class MemberProfilePageModule {}