import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TriggerDto {
  @IsString()
  type: 'keyword' | 'time_delay' | 'event';

  @IsString()
  value: string;

  @IsOptional()
  conditions?: any;
}

export class SettingsDto {
  @IsOptional()
  @IsNumber()
  delayMinutes?: number;

  @IsOptional()
  @IsNumber()
  maxSends?: number;

  @IsOptional()
  @IsBoolean()
  trackOpens?: boolean;

  @IsOptional()
  @IsBoolean()
  trackClicks?: boolean;
}

export class PersonalizationDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsString({ each: true })
  fields: string[];
}

export class CreateAutoResponseDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @ValidateNested()
  @Type(() => TriggerDto)
  trigger: TriggerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsDto)
  settings?: SettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalizationDto)
  personalization?: PersonalizationDto;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: 'active' | 'inactive' | 'draft';

  @IsString()
  userId: string;
}

export class UpdateAutoResponseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerDto)
  trigger?: TriggerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsDto)
  settings?: SettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalizationDto)
  personalization?: PersonalizationDto;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: 'active' | 'inactive' | 'draft';
}

export class AutoResponseQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: 'active' | 'inactive' | 'draft';

  @IsOptional()
  @IsString()
  trigger?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}