```typescript
import { IsString, IsArray, IsOptional, IsNumber, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ScrapingJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class SearchQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ScrapingSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(10000)
  delayBetweenRequests?: number;

  @IsOptional()
  @IsBoolean()
  includeConnections?: boolean;

  @IsOptional()
  @IsBoolean()
  includeExperience?: boolean;

  @IsOptional()
  @IsBoolean()
  includeEducation?: boolean;

  @IsOptional()
  @IsBoolean()
  includeSkills?: boolean;
}

export class CreateScrapingJobDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchQueryDto)
  searchQueries: SearchQueryDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxProfiles?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScrapingSettingsDto)
  settings?: ScrapingSettingsDto;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  duration: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  twitter?: string;
  website?: string;
}

export interface LinkedinProfile {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  profileImageUrl?: string;
  connectionDegree?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  contactInfo?: ContactInfo;
  scrapedAt: string;
  jobId?: string;
}

export interface ScrapingJob {
  id: string;
  name: string;
  searchQueries: SearchQueryDto[];
  maxProfiles: number;
  status: ScrapingJobStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  totalProfiles: number;
  scrapedProfiles: number;
  failedProfiles: number;
  error?: string;
  settings: {
    delayBetweenRequests: number;
    includeConnections: boolean;
    includeExperience: boolean;
    includeEducation: boolean;
    includeSkills: boolean;
  };
}
```