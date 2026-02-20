import { Controller, Get, Post, Body } from '@nestjs/common';
import { TranscriptionsService } from './transcriptions.service';

@Controller('api/transcriptions')
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Get()
  async getAllTranscriptions() {
    return await this.transcriptionsService.fetchAllTranscriptions();
  }

  @Post()
  async createTranscription(@Body() createTranscriptionDto: { text: string }) {
    return await this.transcriptionsService.createTranscription(createTranscriptionDto.text);
  }
}
