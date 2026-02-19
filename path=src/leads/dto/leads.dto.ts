import { IsString, IsEmail, IsOptional, IsArray, IsEnum, IsNumber, IsUrl, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  linkedinId?: string;

  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  connections?: number;

  @IsOptional()
  @IsEnum(['new', 'contacted', 'interested', 'qualified', 'converted', 'rejected'])
  status?: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'rejected';

  @IsOptional()
  @IsEnum(['linkedin', 'manual', 'imported'])
  source?: 'linkedin' | 'manual' | 'imported';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  linkedinId?: string;

  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  connections?: number;

  @IsOptional()
  @IsEnum(['new', 'contacted', 'interested', 'qualified', 'converted', 'rejected'])
  status?: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'rejected';

  @IsOptional()
  @IsEnum(['linkedin', 'manual', 'imported'])
  source?: 'linkedin' | 'manual' | 'imported';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  linkedinData?: {
    headline?: string;
    summary?: string;
    experience?: any[];
    education?: any[];
    skills?: string[];
    lastUpdated?: Date;
  };
}

export class LeadQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['new', 'contacted', 'interested', 'qualified', 'converted', 'rejected'])
  status?: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'rejected';

  @IsOptional()
  @IsEnum(['linkedin', 'manual', 'imported'])
  source?: 'linkedin' | 'manual' | 'imported';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}