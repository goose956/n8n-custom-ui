import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateAutoresponderDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEnum(['keyword', 'time_based', 'event_based'])
  triggerType: 'keyword' | 'time_based' | 'event_based';

  @IsString()
  triggerValue: string;

  @IsEnum(['text', 'ai_generated', 'template'])
  responseType: 'text' | 'ai_generated' | 'template';

  @IsString()
  responseContent: string;

  @IsOptional()
  @IsEnum(['openai', 'anthropic', 'google'])
  aiProvider?: 'openai' | 'anthropic' | 'google';

  @IsOptional()
  @IsString()
  aiModel?: string;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ConditionsDto)
  conditions?: ConditionsDto;
}

export class UpdateAutoresponderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['keyword', 'time_based', 'event_based'])
  triggerType?: 'keyword' | 'time_based' | 'event_based';

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsEnum(['text', 'ai_generated', 'template'])
  responseType?: 'text' | 'ai_generated' | 'template';

  @IsOptional()
  @IsString()
  responseContent?: string;

  @IsOptional()
  @IsEnum(['openai', 'anthropic', 'google'])
  aiProvider?: 'openai' | 'anthropic' | 'google';

  @IsOptional()
  @IsString()
  aiModel?: string;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ConditionsDto)
  conditions?: ConditionsDto;
}

export class ConditionsDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TimeRangeDto)
  timeRange?: TimeRangeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  days?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userSegments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
}

export class TimeRangeDto {
  @IsString()
  start: string;

  @IsString()
  end: string;
}

export class AutoresponderQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['keyword', 'time_based', 'event_based'])
  triggerType?: 'keyword' | 'time_based' | 'event_based';

  @IsOptional()
  @IsEnum(['text', 'ai_generated', 'template'])
  responseType?: 'text' | 'ai_generated' | 'template';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['name', 'createdAt', 'updatedAt', 'triggerType', 'responseType'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'triggerType' | 'responseType';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}