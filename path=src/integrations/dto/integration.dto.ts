import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';

export class CreateIntegrationDto {
  @IsString()
  name: string;

  @IsEnum(['webhook', 'api', 'database', 'file', 'email'])
  type: 'webhook' | 'api' | 'database' | 'file' | 'email';

  @IsString()
  provider: string;

  @IsObject()
  configuration: {
    endpoint?: string;
    apiKey?: string;
    credentials?: any;
    settings?: any;
  };

  @IsOptional()
  @IsEnum(['manual', 'hourly', 'daily', 'weekly', 'monthly'])
  syncFrequency?: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  testConnection?: boolean;
}

export class UpdateIntegrationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['webhook', 'api', 'database', 'file', 'email'])
  type?: 'webhook' | 'api' | 'database' | 'file' | 'email';

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsObject()
  configuration?: {
    endpoint?: string;
    apiKey?: string;
    credentials?: any;
    settings?: any;
  };

  @IsOptional()
  @IsEnum(['manual', 'hourly', 'daily', 'weekly', 'monthly'])
  syncFrequency?: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}