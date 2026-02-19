import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class TargetAudienceDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  jobTitles: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  industries: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  locations: string[];

  @IsOptional()
  @IsString()
  companySize?: string;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'completed'])
  status?: 'draft' | 'active' | 'paused' | 'completed';

  @ValidateNested()
  @Type(() => TargetAudienceDto)
  targetAudience: TargetAudienceDto;

  @IsString()
  @IsNotEmpty()
  messageTemplate: string;

  @IsOptional()
  @IsString()
  linkedInCampaignId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'completed'])
  status?: 'draft' | 'active' | 'paused' | 'completed';

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetAudienceDto)
  targetAudience?: TargetAudienceDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  messageTemplate?: string;

  @IsOptional()
  @IsString()
  linkedInCampaignId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CampaignQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'completed'])
  status?: 'draft' | 'active' | 'paused' | 'completed';

  @IsOptional()
  @IsString()
  search?: string;

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
  @IsEnum(['name', 'createdAt', 'updatedAt', 'startDate'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'startDate';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}