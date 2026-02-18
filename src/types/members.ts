export interface OutreachMetrics {
  profilesScanned: number; // Total number of profiles scanned
  dmsSent: number; // Total number of DMs sent
  repliesReceived: number; // Total number of replies received
  recentActivity: Activity[]; // Array of recent user activities
}

export interface Activity {
  timestamp: Date; // Date and time of the activity
  action: string; // Description of the action taken
}

export interface UserProfile {
  name: string; // User's name
  email: string; // User's email
  linkedInAccount: string; // LinkedIn account URL or ID
  resume: string; // Path or URL of the user's resume
  integrationSettings: IntegrationSettings; // Settings for integrating AI features
}

export interface IntegrationSettings {
  aiResponseCustomization: boolean; // Indicates if AI response customization is enabled
  autoFollow: boolean; // Indicates if auto-follow is enabled
}

export interface AccountSettings {
  notifications: NotificationPreferences; // User's notification preferences
  subscriptionPlan: string; // Current subscription plan
  billingInfo: BillingInfo; // Billing information of the user
  securitySettings: SecuritySettings; // Security options configuration
}

export interface NotificationPreferences {
  emailNotifications: boolean; // Email notifications preference
  smsNotifications: boolean; // SMS notifications preference
}

export interface BillingInfo {
  paymentMethod: string; // Current payment method
  billingCycle: string; // Billing cycle (monthly, yearly)
}

export interface SecuritySettings {
  password: string; // User's password
  linkedInAccountReauthentication: boolean; // Reauthentication requirement for LinkedIn account
}

export interface OutreachCampaign {
  id: string; // Unique identifier for the campaign
  targetDemographics: string[]; // Array of target demographics
  messageTemplates: MessageTemplate[]; // List of message templates used in the campaign
  schedule: Date; // Scheduled time for the campaign
}

export interface MessageTemplate {
  id: string; // Unique identifier for the template
  content: string; // Content of the message template
  dynamicFields: string[]; // List of dynamic fields that can be populated
}

export interface CampaignAnalytics {
  openRates: number; // Open rates percentage
  responseRates: number; // Response rates percentage
  engagementStatistics: EngagementStats; // Engagement statistics data
}

export interface EngagementStats {
  totalEngagement: number; // Total engagement count
  topPerformingMessages: string[]; // List of top performing messages
}

// Admin Panel Interfaces
export interface AdminAnalytics {
  userEngagement: UserEngagement[]; // Array of user engagement data
  messageSuccessRates: number[]; // Success rates for sent messages
}

export interface UserEngagement {
  userId: string; // User's unique identifier
  campaignIds: string[]; // List of campaigns the user is engaged in
  messagesSent: number; // Number of messages sent by the user
  repliesReceived: number; // Number of replies received by the user
}

// Contact Form Interface
export interface ContactMessage {
  subject: string; // Subject of the message
  details: string; // Detailed description of the query or issue
  priorityLevel: 'low' | 'medium' | 'high'; // Priority level of the message
}