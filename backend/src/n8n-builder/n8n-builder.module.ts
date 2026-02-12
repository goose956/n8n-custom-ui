import { Module } from '@nestjs/common';
import { N8nBuilderService } from './n8n-builder.service';
import { N8nBuilderController } from './n8n-builder.controller';

@Module({
  controllers: [N8nBuilderController],
  providers: [N8nBuilderService],
})
export class N8nBuilderModule {}
