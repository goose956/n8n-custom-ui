export interface CreateOptInPageDto {
  title: string;
  description?: string;
  campaignName: string;
  templateType: 'popup' | 'inline' | 'fullscreen' | 'sidebar';
  design: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    fontSize: number;
    fontFamily: string;
    customCSS?: string;
  };
  content: {
    headline: string;
    subheadline?: string;
    bodyText?: string;
    buttonText: string;
    privacyText?: string;
    thankYouMessage: string;
  };
  formFields: Array<{
    type: 'email' | 'text' | 'phone' | 'select' | 'checkbox';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
  }>;
  targeting: {
    pages?: string[];
    excludePages?: string[];
    devices?: string[];
    countries?: string[];
    timeDelay?: number;
    scrollPercentage?: number;
    exitIntent?: boolean;
  };
  settings: {
    showOnce?: boolean;
    frequency?: 'always' | 'once_per_session' | 'once_per_day' | 'once_per_week';
    priority?: number;
    timezone?: string;
  };
}

export interface UpdateOptInPageDto extends Partial<CreateOptInPageDto> {
  status?: 'draft' | 'active' | 'paused' | 'archived';
}

export interface ABTestDto {
  name: string;
  description?: string;
  trafficSplit: number; // Percentage for variant B (0-100)
  variantB: {
    content?: Partial<CreateOptInPageDto['content']>;
    design?: Partial<CreateOptInPageDto['design']>;
  };
  duration?: number; // Days to run the test
  conversionGoal: 'email_signup' | 'form_completion' | 'click_through';
}

export interface EmailIntegrationDto {
  provider: 'mailchimp' | 'constant_contact' | 'aweber' | 'getresponse' | 'webhook';
  apiKey?: string;
  listId?: string;
  webhookUrl?: string;
  fieldMapping: {
    [formField: string]: string; // Maps form field to provider field
  };
  doubleOptIn?: boolean;
  tags?: string[];
  autoResponder?: {
    enabled: boolean;
    templateId?: string;
    delay?: number; // Minutes
  };
}

export interface OptInPage extends CreateOptInPageDto {
  id: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
  analytics: {
    views: number;
    conversions: number;
    conversionRate: number;
    uniqueVisitors: number;
  };
  abTests: Array<{
    id: string;
    name: string;
    description?: string;
    trafficSplit: number;
    variantB: any;
    duration?: number;
    conversionGoal: string;
    status: 'draft' | 'running' | 'completed' | 'paused';
    createdAt: string;
    results: {
      variantA: {
        views: number;
        conversions: number;
        conversionRate: number;
      };
      variantB: {
        views: number;
        conversions: number;
        conversionRate: number;
      };
    };
  }>;
  emailIntegration?: {
    provider: string;
    apiKey?: string;
    listId?: string;
    webhookUrl?: string;
    fieldMapping: { [key: string]: string };
    doubleOptIn?: boolean;
    tags?: string[];
    autoResponder?: any;
    isActive: boolean;
    lastSync: string;
  };
}

export interface OptInPageResponseDto extends OptInPage {}
