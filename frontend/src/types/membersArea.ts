export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  subscription: SubscriptionDetails;
}

export interface SubscriptionDetails {
  plan: string;
  status: 'active' | 'inactive' | 'expired';
  billingCycle: string;
  nextBillingDate: string;
}

export interface UserActivity {
  activityId: string;
  timestamp: string;
  description: string;
}

export interface Script {
  id: string;
  title: string;
  category: string;
  content: string;
  engagementRate: number;
  createdAt: string;
}

export interface AnalyticsData {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
}

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
}

export interface Ticket {
  ticketId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'closed' | 'pending';
}

export interface BillingInfo {
  paymentMethod: string;
  lastPaymentDate: string;
  paymentHistory: Array<PaymentRecord>;
}

export interface PaymentRecord {
  date: string;
  amount: number;
  status: 'completed' | 'failed' | 'pending';
}

export interface Tutorial {
  id: string;
  title: string;
  content: string;
}

export interface CommunityPost {
  postId: string;
  userId: string;
  title: string;
  content: string;
  replies: Array<CommunityReply>;
}

export interface CommunityReply {
  replyId: string;
  postId: string;
  userId: string;
  content: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  dataSharing: boolean;
  activityTracking: boolean;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
}

export interface ScriptCreationHistory {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'published';
}
