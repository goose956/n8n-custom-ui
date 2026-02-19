import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  IsUrl,
  IsDateString,
  Min,
  Max,
  ArrayMinSize,
  IsIn,
  Transform,
  Type,
} from 'class-validator';

export class CreateResourceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['article', 'video', 'course', 'book', 'tutorial', 'documentation', 'tool'])
  type: 'article' | 'video' | 'course' | 'book' | 'tutorial' | 'documentation' | 'tool';

  @IsString()
  category: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reviews?: number;

  @IsBoolean()
  isFree: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[];
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['article', 'video', 'course', 'book', 'tutorial', 'documentation', 'tool'])
  type?: 'article' | 'video' | 'course' | 'book' | 'tutorial' | 'documentation' | 'tool';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reviews?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionRate?: number;
}

export class ResourceQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['article', 'video', 'course', 'book', 'tutorial', 'documentation', 'tool'])
  type?: 'article' | 'video' | 'course' | 'book' | 'tutorial' | 'documentation' | 'tool';

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  tags?: string | string[];

  @IsOptional()
  @IsString()
  search?: string;

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
  @IsIn(['title', 'rating', 'createdAt', 'lastUpdated'])
  sortBy?: 'title' | 'rating' | 'createdAt' | 'lastUpdated';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}