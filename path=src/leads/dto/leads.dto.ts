import { IsOptional, IsString, IsEmail, IsArray, IsNumber, IsIn, Min, Max } from 'class-validator';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  linkedInId?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsString()
  connectionDegree?: string;

  @IsOptional()
  @IsIn(['new', 'contacted', 'responded', 'interested', 'not_interested', 'converted'])
  engagementStatus?: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested' | 'converted';

  @IsOptional()
  @IsString()
  lastContactDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['manual', 'linkedin_search', 'linkedin_import', 'referral', 'other'])
  leadSource?: 'manual' | 'linkedin_search' | 'linkedin_import' | 'referral' | 'other';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  leadScore?: number;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  linkedInId?: string;

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
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsString()
  connectionDegree?: string;

  @IsOptional()
  @IsIn(['new', 'contacted', 'responded', 'interested', 'not_interested', 'converted'])
  engagementStatus?: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested' | 'converted';

  @IsOptional()
  @IsString()
  lastContactDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['manual', 'linkedin_search', 'linkedin_import', 'referral', 'other'])
  leadSource?: 'manual' | 'linkedin_search' | 'linkedin_import' | 'referral' | 'other';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  leadScore?: number;
}

export class LeadQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['new', 'contacted', 'responded', 'interested', 'not_interested', 'converted'])
  engagementStatus?: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested' | 'converted';

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsIn(['manual', 'linkedin_search', 'linkedin_import', 'referral', 'other'])
  leadSource?: 'manual' | 'linkedin_search' | 'linkedin_import' | 'referral' | 'other';

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'fullName', 'company', 'jobTitle', 'engagementStatus', 'createdAt', 'updatedAt', 'leadScore'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}