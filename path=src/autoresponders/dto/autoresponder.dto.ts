import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  ValidateNested,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class SenderCriteriaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobTitles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  connectionDegree?: number[];
}

class MessageCriteriaDto {
  @IsOptional()
  @IsBoolean()
  isFirstMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  containsLinks?: boolean;

  @IsOptional()
  @IsObject()
  messageLength?: { min?: number; max?: number };
}

class TriggersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SenderCriteriaDto)
  senderCriteria?: SenderCriteriaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageCriteriaDto)
  messageCriteria?: MessageCriteriaDto;
}

class TimeRestrictionsDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsObject()
  hoursOfDay?: { start: number; end: number };

  @IsOptional()
  @IsString()
  timezone?: string;
}

class RateLimitingDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxResponsesPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cooldownHours?: number;
}

class ConditionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRestrictionsDto)
  timeRestrictions?: TimeRestrictionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitingDto)
  rateLimiting?: RateLimitingDto;
}

class FollowUpActionsDto {
  @IsOptional()
  @IsObject()
  scheduleFollowUp?: { delayHours: number; message: string };

  @IsOptional()
  @IsString()
  addToList?: string;

  @IsOptional()
  @IsObject()
  setReminder?: { delayHours: number; note: string };
}

class ResponseDto {
  @IsString()
  @IsIn(['template', 'ai_generated'])
  type: 'template' | 'ai_generated';

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalizationFields?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FollowUpActionsDto)
  followUpActions?: FollowUpActionsDto;
}

export class CreateAutoresponderDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ValidateNested()
  @Type(() => TriggersDto)
  triggers: TriggersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConditionsDto)
  conditions?: ConditionsDto;

  @ValidateNested()
  @Type(() => ResponseDto)
  response: ResponseDto;
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
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => TriggersDto)
  triggers?: TriggersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConditionsDto)
  conditions?: ConditionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseDto)
  response?: ResponseDto;
}