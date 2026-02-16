import { Module } from'@nestjs/common';
import { AppsController } from'./apps.controller';
import { AppManagementService } from'./apps.service';

@Module({
 controllers: [AppsController],
 providers: [AppManagementService],
 exports: [AppManagementService],
})
export class AppsModule {}
