export interface LinkedInUserProfile {
  id: string; // Unique identifier for the user
  name: string; // User's full name
  email: string; // User's email address
  profilePictureUrl: string; // URL of the user's LinkedIn profile picture
  connectivityStatus: 'connected' | 'pending' | 'not_connected'; // User's LinkedIn connectivity status
}

export interface OutreachCampaign {
  id: string; // Unique identifier for the campaign
  title: string; // Title of the campaign
  status: 'active' | 'paused' | 'completed'; // Current status of the campaign
  startDate: string; // Start date of the campaign
  endDate: string; // End date of the campaign
  totalMessagesSent: number; // Total messages sent in the campaign
  engagementRate: number; // Engagement rate of the campaign
}

export interface UserAnalytics {
  userId: string; // Unique identifier for the user
  openRate: number; // Percentage of messages opened
  responseRate: number; // Percentage of messages that received a response
  engagementMetrics: Array<{
    date: string; // Date of the metric
    messagesSent: number; // Number of messages sent on that date
    responsesReceived: number; // Number of responses received on that date
  }>; // Array of daily metrics
}

export interface UserSettings {
  notificationSettings: {
    emailNotifications: boolean; // Whether the user wants email notifications
    smsNotifications: boolean; // Whether the user wants SMS notifications
  };
  billingInfo: {
    paymentMethod: string; // Current payment method
    billingCycle: 'monthly' | 'annually'; // Billing cycle choice
  };
  aiMessageTemplates: string[]; // Array of user-defined AI message templates
}

export interface AdminAnalytics {
  totalUsers: number; // Total number of users
  monthlyActiveUsers: number; // Number of users active in the last month
  messageEngagementTrends: Array<{
    month: string; // Month of the trend
    engagementRate: number; // Engagement rate for that month
  }>; // Monthly engagement statistics
}