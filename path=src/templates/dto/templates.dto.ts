import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, IsArray } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsIn(['email', 'sms', 'push'])
  type: 'email' | 'sms' | 'push';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  category?: string;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsIn(['email', 'sms', 'push'])
  @IsOptional()
  type?: 'email' | 'sms' | 'push';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  category?: string;
}