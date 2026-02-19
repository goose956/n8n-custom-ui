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
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AutorespondersService } from './autoresponders.service';
import {
  CreateAutoresponderDto,
  UpdateAutoresponderDto,
  AutoresponderQueryDto,
} from './dto/autoresponder.dto';

@Controller('api/autoresponders')
export class AutorespondersController {
  constructor(private readonly autorespondersService: AutorespondersService) {}

  @Get()
  async findAll(@Query() query: AutoresponderQueryDto) {
    try {
      return await this.autorespondersService.findAll(query);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch autoresponders',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
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
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateAutoresponderDto: UpdateAutoresponderDto,
  ) {
    try {
      const updatedAutoresponder = await this.autorespondersService.update(
        id,
        updateAutoresponderDto,
      );
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.autorespondersService.remove(id);
      if (!result) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Autoresponder deleted successfully' };
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

  @Post(':id/activate')
  async activate(@Param('id', ParseIntPipe) id: number) {
    try {
      const autoresponder = await this.autorespondersService.toggleStatus(id, true);
      if (!autoresponder) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return autoresponder;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to activate autoresponder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    try {
      const autoresponder = await this.autorespondersService.toggleStatus(id, false);
      if (!autoresponder) {
        throw new HttpException('Autoresponder not found', HttpStatus.NOT_FOUND);
      }
      return autoresponder;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to deactivate autoresponder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}