export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  bio: string;
  connectedYouTubeAccounts: YouTubeAccount[];
}

export interface YouTubeAccount {
  id: string;
  channelName: string;
  subscribers: number;
  totalViews: number;
  engagementRate: number;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface EmailContact {
  id: string;
  name: string;
  email: string;
  channelName: string;
}

export interface Transcription {
  id: string;
  videoId: string;
  content: string;
  createdAt: Date;
}

export interface Thumbnail {
  id: string;
  videoId: string;
  imageUrl: string;
}

export interface Analytics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  audienceDemographics: AudienceDemographic[];
}

export interface AudienceDemographic {
  ageGroup: string;
  percentage: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface UserSettings {
  privacyOptions: boolean;
  notificationSettings: NotificationSettings;
}