export interface UserProfile {
  id: string; // Unique identifier for the user
  name: string; // User's full name
  email: string; // User's email address
  linkedinProfileUrl: string; // URL to the user's LinkedIn profile
  influenceScore: number; // Score representing user's influence on the platform
  demographics: Demographics; // Demographic data of the user's contacts
}

export interface Demographics {
  ageGroup: string; // Age group of user's contacts
  industry: string; // Industry breakdown of user's contacts
  location: string; // Geographic distribution
}

export interface DashboardStats {
  totalSuccessfulDMs: number; // Total number of successful DMs sent
  responseRate: number; // Percentage of DMs that received a response
  recentActivities: RecentActivity[]; // List of recent activities
}

export interface RecentActivity {
  id: string; // Unique identifier for the activity
  message: string; // Description of the activity
  timestamp: string; // Time when the activity occurred
}

export interface Settings {
  notificationsEnabled: boolean; // Flag for enabling notifications
  privacySettings: PrivacySettings; // User's privacy preferences
  aiResponsePreferences: AIResponsePreferences; // User's preferences for AI responses
}

export interface PrivacySettings {
  shareProfilePublicly: boolean; // Flag for sharing profile publicly
  hideActivityStatus: boolean; // Flag to hide user activity status
}

export interface AIResponsePreferences {
  responseTone: 'formal' | 'casual'; // User preference for response tone
  useTemplates: boolean; // Flag for using message templates in responses
}

export interface AdminPanel {
  userAnalytics: UserAnalytics; // Analytics data on user engagement
  messageSuccessRates: MessageSuccessRate[]; // Message success rate data
  contactFormInquiries: Inquiry[]; // List of inquiries from the contact form
}

export interface UserAnalytics {
  activeUsers: number; // Number of active users on the platform
  totalDMsSent: number; // Total number of DMs sent across the platform
}

export interface MessageSuccessRate {
  messageType: string; // Type of message (e.g., connection request)
  successRate: number; // Success rate for that message type
}

export interface Inquiry {
  id: string; // Unique identifier for the inquiry
  category: string; // Category of the inquiry (e.g., feedback, support)
  message: string; // Content of the user message
}

export interface AnalyticsData {
  effectivenessByMessageType: EffectivenessByMessageType[]; // Breakdown of effectiveness by message type
  trendsOverTime: Trend[]; // Visualized trends for outreach effectiveness
}

export interface EffectivenessByMessageType {
  messageType: string; // Type of message
  engagementRate: number; // Engagement rate for that message type
}

export interface Trend {
  date: string; // Date of the trend
  engagement: number; // Engagement level on that date
}

export interface Template {
  id: string; // Unique identifier for the template
  content: string; // Text content of the message template
  industry: string; // Industry tag for the template
}

export interface MessageHistory {
  id: string; // Unique identifier for the message
  content: string; // Content of the sent message
  status: 'sent' | 'delivered' | 'read'; // Status of the message
  responseTime: string; // Time taken to receive a response
  engagementLevel: number; // Level of engagement with the message
}

export interface DataScraper {
  id: string; // Unique identifier for the scraper
  name: string; // Name of the scraper
  results: ScraperResult[]; // Results from the scraper
}

export interface ScraperResult {
  contactName: string; // Name of the scraped contact
  profileUrl: string; // LinkedIn profile URL of the scraped contact
  industry: string; // Industry of the scraped contact
}