import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  ValidationPipe,
} from '@nestjs/common';
import { AutorespondersService } from './autoresponders.service';
import { CreateAutoresponderDto, UpdateAutoresponderDto } from './dto/autoresponder.dto';

@Controller('api/autoresponders')
export class AutorespondersController {
  constructor(private readonly autorespondersService: AutorespondersService) {}

  @Get()
  async findAll(@Query('userId') userId?: string) {
    try {
      if (userId) {
        return await this.autorespondersService.findByUserId(userId);
      }
      return await this.autorespondersService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch autoresponders',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const autoresponder = await this.autorespondersService.findOne(id);
      if (!autoresponder) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return autoresponder;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch autoresponder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Body(ValidationPipe) createAutoresponderDto: CreateAutoresponderDto) {
    try {
      return await this.autorespondersService.create(createAutoresponderDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create autoresponder',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAutoresponderDto: UpdateAutoresponderDto,
  ) {
    try {
      const updatedAutoresponder = await this.autorespondersService.update(id, updateAutoresponderDto);
      if (!updatedAutoresponder) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return updatedAutoresponder;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update autoresponder',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.autorespondersService.remove(id);
      if (!deleted) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Autoresponder deleted successfully', id };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete autoresponder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/test')
  async testAutoresponder(
    @Param('id') id: string,
    @Body() testData: { message: string; senderProfile?: any },
  ) {
    try {
      const result = await this.autorespondersService.testAutoresponder(id, testData);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to test autoresponder',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/toggle')
  async toggleAutoresponder(@Param('id') id: string) {
    try {
      const toggled = await this.autorespondersService.toggleActive(id);
      if (!toggled) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return toggled;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to toggle autoresponder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}