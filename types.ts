export interface UserProfile {
    id: string; // Unique identifier for the user
    name: string; // User's full name
    email: string; // User's email address
    linkedInAccount: string; // LinkedIn profile URL
    aiPreferences: AiPreferences; // User's AI customization options
}

export interface AiPreferences {
    welcomes: boolean; // Enable personalized welcome messages
    responseTemplates: string[]; // List of AI response templates
}

export interface MessageStats {
    totalSent: number; // Total automated messages sent
    totalClicked: number; // Total messages that received clicks
    engagementRate: number; // Percentage of messages with engagement
}

export interface EngagementReport {
    profileViews: number; // Number of profile views
    messageOpenRate: number; // Percentage of messages opened
    responseTimeline: ResponseTimeline[]; // Time to respond to messages
}

export interface ResponseTimeline {
    date: string; // Date of interaction
    responseTime: number; // Time taken to respond in minutes
}

export interface AutomatedMessage {
    id: string; // Unique identifier for the message template
    content: string; // Content of the automated message
    successRate: number; // Success rate of the message template
}

export interface AdminAnalytics {
    overallSuccessRate: number; // Success rate across all users
    totalUsers: number; // Total number of users
    totalMessagesSent: number; // Total messages sent by users
    averageEngagement: number; // Average engagement across all messages
}

export interface SupportInquiry {
    userId: string; // The ID of the user submitting the inquiry
    message: string; // User's message or feedback
}