import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { TweetQueueService } from './tweet-queue.service';
import {
  CreateTweetQueueDto,
  UpdateTweetQueueDto,
  BulkActionDto,
  TweetQueueQueryDto,
  PerformancePredictionDto,
} from './dto/tweet-queue.dto';

@Controller('api/tweet-queue')
export class TweetQueueController {
  constructor(private readonly tweetQueueService: TweetQueueService) {}

  @Get()
  async getAllTweets(@Query(ValidationPipe) query: TweetQueueQueryDto) {
    try {
      return await this.tweetQueueService.getAllTweets(query);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch tweet queue',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getTweetById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const tweet = await this.tweetQueueService.getTweetById(id);
      if (!tweet) {
        throw new HttpException('Tweet not found', HttpStatus.NOT_FOUND);
      }
      return tweet;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch tweet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance/prediction')
  async getPerformancePrediction(@Query(ValidationPipe) query: PerformancePredictionDto) {
    try {
      return await this.tweetQueueService.getPerformancePrediction(query);
    } catch (error) {
      throw new HttpException(
        'Failed to get performance prediction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/summary')
  async getAnalyticsSummary() {
    try {
      return await this.tweetQueueService.getAnalyticsSummary();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch analytics summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createTweet(@Body(ValidationPipe) createTweetDto: CreateTweetQueueDto) {
    try {
      return await this.tweetQueueService.createTweet(createTweetDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create tweet',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk-import')
  async bulkImportTweets(@Body() tweets: CreateTweetQueueDto[]) {
    try {
      return await this.tweetQueueService.bulkImportTweets(tweets);
    } catch (error) {
      throw new HttpException(
        'Failed to bulk import tweets',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk-action')
  async performBulkAction(@Body(ValidationPipe) bulkActionDto: BulkActionDto) {
    try {
      return await this.tweetQueueService.performBulkAction(bulkActionDto);
    } catch (error) {
      throw new HttpException(
        'Failed to perform bulk action',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateTweet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTweetDto: UpdateTweetQueueDto,
  ) {
    try {
      const updatedTweet = await this.tweetQueueService.updateTweet(id, updateTweetDto);
      if (!updatedTweet) {
        throw new HttpException('Tweet not found', HttpStatus.NOT_FOUND);
      }
      return updatedTweet;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update tweet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/schedule')
  async scheduleTweet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() scheduleData: { scheduledAt: string },
  ) {
    try {
      return await this.tweetQueueService.scheduleTweet(id, new Date(scheduleData.scheduledAt));
    } catch (error) {
      throw new HttpException(
        'Failed to schedule tweet',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/publish')
  async publishTweet(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.tweetQueueService.publishTweet(id);
    } catch (error) {
      throw new HttpException(
        'Failed to publish tweet',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteTweet(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const deleted = await this.tweetQueueService.deleteTweet(id);
      if (!deleted) {
        throw new HttpException('Tweet not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Tweet deleted successfully', id };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete tweet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('bulk/clear-completed')
  async clearCompletedTweets() {
    try {
      return await this.tweetQueueService.clearCompletedTweets();
    } catch (error) {
      throw new HttpException(
        'Failed to clear completed tweets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}