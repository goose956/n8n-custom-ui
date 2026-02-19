import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignType {
  CONNECTION_REQUEST = 'connection_request',
  MESSAGE_SEQUENCE = 'message_sequence',
  PROFILE_VIEW = 'profile_view',
  ENDORSEMENT = 'endorsement',
  FOLLOW = 'follow',
}

export class WorkingHoursDto {
  @IsString()
  start: string;

  @IsString()
  end: string;

  @IsString()
  timezone: string;
}

export class CampaignSettingsDto {
  @IsNumber()
  @Min(1)
  @Max(500)
  @IsOptional()
  dailyLimit?: number;

  @IsNumber()
  @Min(5)
  @Max(300)
  @IsOptional()
  delayBetweenActions?: number;

  @ValidateNested()
  @Type(() => WorkingHoursDto)
  @IsOptional()
  workingHours?: WorkingHoursDto;

  @IsBoolean()
  @IsOptional()
  weekends?: boolean;

  @IsBoolean()
  @IsOptional()
  autoReply?: boolean;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxFollowUps?: number;

  @IsNumber()
  @Min(1)
  @Max(30)
  @IsOptional()
  followUpDelay?: number;
}

export class MessageTemplateDto {
  @IsString()
  id: string;

  @IsString()
  subject?: string;

  @IsString()
  content: string;

  @IsNumber()
  @Min(0)
  delayDays: number;

  @IsEnum(['connection_request', 'follow_up', 'thank_you'])
  type: string;
}

export class TargetAudienceDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  industries?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locations?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  jobTitles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  companies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minConnections?: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  maxConnections?: number;

  @IsBoolean()
  @IsOptional()
  premiumOnly?: boolean;
}

export class CampaignStatisticsDto {
  @IsNumber()
  totalSent: number;

  @IsNumber()
  totalReplies: number;

  @IsNumber()
  totalConnections: number;

  @IsNumber()
  totalViews: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate: number;
}

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @ValidateNested()
  @Type(() => TargetAudienceDto)
  @IsOptional()
  targetAudience?: TargetAudienceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageTemplateDto)
  @IsOptional()
  messageSequence?: MessageTemplateDto[];

  @ValidateNested()
  @Type(() => CampaignSettingsDto)
  @IsOptional()
  settings?: CampaignSettingsDto;
}

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CampaignType)
  @IsOptional()
  type?: CampaignType;

  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @ValidateNested()
  @Type(() => TargetAudienceDto)
  @IsOptional()
  targetAudience?: TargetAudienceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageTemplateDto)
  @IsOptional()
  messageSequence?: MessageTemplateDto[];

  @ValidateNested()
  @Type(() => CampaignSettingsDto)
  @IsOptional()
  settings?: CampaignSettingsDto;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  targetAudience: TargetAudienceDto;
  messageSequence: MessageTemplateDto[];
  settings: CampaignSettingsDto;
  statistics: CampaignStatisticsDto;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export class CampaignResponseDto {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  targetAudience: TargetAudienceDto;
  messageSequence: MessageTemplateDto[];
  settings: CampaignSettingsDto;
  statistics: CampaignStatisticsDto;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}