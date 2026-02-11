import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

interface PostChatRequest {
  message: string;
  apiProvider: string;
  model?: string;
  pageContent: string;
  pageTitle: string;
  pageType: string;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async handleChat(@Body() body: PostChatRequest) {
    const result = await this.chatService.sendChatMessage(body);

    if (result.success) {
      return {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: result.error || 'Chat request failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
