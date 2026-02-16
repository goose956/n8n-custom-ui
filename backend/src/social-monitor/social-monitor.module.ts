import { Module } from'@nestjs/common';
import { SocialMonitorController } from'./social-monitor.controller';
import { SocialMonitorService } from'./social-monitor.service';

@Module({
 controllers: [SocialMonitorController],
 providers: [SocialMonitorService],
})
export class SocialMonitorModule {}
