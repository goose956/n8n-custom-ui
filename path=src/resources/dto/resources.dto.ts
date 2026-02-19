import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  ArrayMinSize,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(['article', 'video', 'course', 'tutorial', 'template', 'guide'])
  type: 'article' | 'video' | 'course' | 'tutorial' | 'template' | 'guide';

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @IsNumber()
  @Min(1)
  estimatedTime: number;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedResources?: string[];
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @IsOptional()
  @IsEnum(['article', 'video', 'course', 'tutorial', 'template', 'guide'])
  type?: 'article' | 'video' | 'course' | 'tutorial' | 'template' | 'guide';

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedTime?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  author?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedResources?: string[];
}

export class ResourceFilterDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['article', 'video', 'course', 'tutorial', 'template', 'guide'])
  type?: 'article' | 'video' | 'course' | 'tutorial' | 'template' | 'guide';

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim());
    }
    return value;
  })
  tags?: string | string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsIn(['title', 'createdAt', 'rating', 'viewCount', 'difficulty'])
  sortBy?: 'title' | 'createdAt' | 'rating' | 'viewCount' | 'difficulty';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

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
}

export class RatingDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;
}