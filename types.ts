export interface TweetPerformance {
    date: string; // Date of the performance metrics
    tweetsPosted: number; // Number of tweets posted
    engagementRate: number; // Percentage of engagement on tweets
    replyResponseRate: number; // Percentage of responses to replies
    conversions: number; // Number of opt-ins from tweets
}

export interface ScrapedContentQueue {
    status: 'pending' | 'processing' | 'completed'; // Current status of the content queue
    articles: ScrapedContent[]; // List of articles/articles in the queue
}

export interface ScrapedContent {
    id: string; // Unique identifier for scraped content
    title: string; // Title of the content
    sourceUrl: string; // URL of the original content
    approved: boolean; // Approval status for tweet processing
}

export interface UserProfile {
    twitterHandle: string; // User's Twitter handle
    accountStatus: 'connected' | 'disconnected'; // Twitter account connection status
    linkedAccounts: LinkedSocialMediaAccount[]; // List of linked social media accounts
}

export interface LinkedSocialMediaAccount {
    platform: string; // Social media platform name
    status: 'connected' | 'disconnected'; // Connection status
}

export interface AutomationSettings {
    notificationPreferences: NotificationPreference[]; // User's notification preferences
    automationSchedule: string; // Scheduling details for automation
    apiCredentials: APICredentials; // API connection details
}

export interface APICredentials {
    apiKey: string; // API Key for connection
    apiSecret: string; // API Secret for connection
}

export interface AdminPanelMetrics {
    totalUsers: number; // Total number of users
    systemHealthStatus: string; // System health status
    contactSubmissions: number; // Number of contact form submissions
}

export interface AnalyticsData {
    engagementRates: EngagementRate[]; // List of engagement rate data
    followerTrends: FollowerGrowthTrend[]; // Follower growth trend data
}

export interface EngagementRate {
    date: string; // Date of the engagement rate
    rate: number; // Engagement rate percentage
}

export interface FollowerGrowthTrend {
    date: string; // Date of the follower count
    count: number; // Number of followers
}

export interface AutomationRule {
    id: string; // Unique rule identifier
    ruleType: string; // Type of the rule (e.g., engagement, replies)
    conditions: string; // Conditions for the rule to apply
}