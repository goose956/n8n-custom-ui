/**
 * Type definitions for SaaS Factory multi-app database structure
 */

// ==================== Apps ====================
export type AppLocale ='en-GB' |'en-US';

export interface App {
 id: number;
 name: string;
 slug: string;
 description?: string;
 logo_url?: string;
 primary_color: string;
 locale?: AppLocale;
 n8n_workflow_id?: string;
 version: string;
 active: boolean;
 created_at: string;
 updated_at: string;
}

export interface CreateAppDto {
 name: string;
 slug: string;
 description?: string;
 logo_url?: string;
 primary_color?: string;
 locale?: AppLocale;
 n8n_workflow_id?: string;
}

export interface UpdateAppDto {
 name?: string;
 description?: string;
 logo_url?: string;
 primary_color?: string;
 locale?: AppLocale;
 active?: boolean;
}

// ==================== Pages ====================
export interface Page {
 id: number;
 app_id: number;
 page_type:'index' |'thanks' |'members' |'checkout' |'admin' |'features' |'pricing' |'about' |'blog-page' |'login' |'register' |'custom';
 title: string;
 content_json?: Record<string, any>;
 custom_css?: string;
 custom_component_path?: string;
 created_at: string;
 updated_at: string;
}

export interface CreatePageDto {
 page_type: Page['page_type'];
 title: string;
 content_json?: Record<string, any>;
 custom_css?: string;
 custom_component_path?: string;
}

export interface UpdatePageDto {
 title?: string;
 content_json?: Record<string, any>;
 custom_css?: string;
 custom_component_path?: string;
}

// ==================== Plans ====================
export interface Plan {
 id: number;
 app_id: number;
 name: string;
 price: number;
 billing_period:'monthly' |'yearly';
 features_json?: Record<string, any>;
 stripe_price_id?: string;
 created_at: string;
}

export interface CreatePlanDto {
 name: string;
 price: number;
 billing_period?:'monthly' |'yearly';
 features_json?: Record<string, any>;
 stripe_price_id?: string;
}

// ==================== Users ====================
export interface User {
 id: number;
 email: string;
 password_hash?: string;
 name: string;
 created_at: string;
 updated_at: string;
}

export interface CreateUserDto {
 email: string;
 name: string;
 password?: string;
}

// ==================== Subscriptions ====================
export interface Subscription {
 id: number;
 user_id: number;
 app_id: number;
 plan_id: number;
 status:'active' |'cancelled' |'past_due' |'free';
 stripe_subscription_id?: string;
 current_period_end?: string;
 created_at: string;
 updated_at: string;
}

export interface CreateSubscriptionDto {
 user_id: number;
 app_id: number;
 plan_id: number;
 stripe_subscription_id?: string;
}

// ==================== App Settings ====================
export interface AppSetting {
 id: number;
 app_id: number;
 setting_key: string;
 setting_value: string;
 created_at: string;
 updated_at: string;
}

export interface CreateAppSettingDto {
 setting_key: string;
 setting_value: string;
}

export interface UpdateAppSettingDto {
 setting_value: string;
}

// ==================== API Keys ====================
export interface ApiKey {
 id: number;
 app_id: number;
 name: string;
 key_value: string; // Encrypted
 key_type?: string;
 last_used?: string;
 created_at: string;
}

export interface CreateApiKeyDto {
 name: string;
 key_value: string;
 key_type?: string;
}

// ==================== Workflows ====================
export interface Workflow {
 id: number;
 app_id: number;
 n8n_workflow_id: string;
 name: string;
 description?: string;
 is_active: boolean;
 last_execution?: string;
 created_at: string;
 updated_at: string;
}

export interface CreateWorkflowDto {
 n8n_workflow_id: string;
 name: string;
 description?: string;
 is_active?: boolean;
}

export interface UpdateWorkflowDto {
 name?: string;
 description?: string;
 is_active?: boolean;
}

// ==================== Workflow Configs ====================
export interface WorkflowConfig {
 id: number;
 workflow_id: number;
 config_key: string;
 config_value: string;
 created_at: string;
 updated_at: string;
}

export interface CreateWorkflowConfigDto {
 config_key: string;
 config_value: string;
}

export interface UpdateWorkflowConfigDto {
 config_value: string;
}

// ==================== App Usage ====================
export interface AppUsage {
 id: number;
 user_id: number;
 app_id: number;
 usage_type: string;
 usage_count: number;
 created_at: string;
}

export interface CreateAppUsageDto {
 user_id: number;
 app_id: number;
 usage_type: string;
 usage_count?: number;
}

// ==================== Database Root ====================
export interface SaaSDatabaseSchema {
 factory_version: string;
 last_updated: string;
 encryption_key_version: number;
 apps: App[];
 pages: Page[];
 plans: Plan[];
 users: User[];
 subscriptions: Subscription[];
 app_settings: AppSetting[];
 api_keys: ApiKey[];
 workflows: Workflow[];
 workflow_configs: WorkflowConfig[];
 app_usage: AppUsage[];
}

// ==================== Response Wrappers ====================
export interface ApiResponse<T> {
 success: boolean;
 data?: T;
 error?: string;
 timestamp: string;
}

export interface PaginatedResponse<T> {
 items: T[];
 total: number;
 page: number;
 per_page: number;
 total_pages: number;
}

export interface AppSummary {
 app: App;
 user_count: number;
 active_subscriptions: number;
 total_revenue: number;
 workflow_count: number;
}

// ==================== Request Context ====================
export interface MultiTenantContext {
 app_id: number;
 app_slug: string;
 user_id?: number;
 request_id: string;
 timestamp: string;
}
