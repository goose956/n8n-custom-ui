```typescript
export interface User {
 id: string;
 username: string;
 email: string;
 profileImage: string;
 connectedTikTokAccounts: TikTokAccount[];
}

export interface TikTokAccount {
 id: string;
 username: string;
 connected: boolean;
}

export interface Script {
 id: string;
 title: string;
 niche: string;
 content: string;
 createdAt: Date;
 editedAt?: Date;
}

export interface AnalyticsData {
 scriptId: string;
 views: number;
 likes: number;
 shares: number;
 comments: number;
 engagementRate: number;
}

export interface CommunityPost {
 id: string;
 author: User;
 content: string;
 createdAt: Date;
}

export interface Settings {
 notificationPreferences: {
 email: boolean;
 sms: boolean;
 push: boolean;
 };
 preferredLanguages: string[];
 linkedServices: string[];
}

export interface Ticket {
 id: string;
 user: User;
 issue: string;
 status:'open' |'in-progress' |'resolved';
 createdAt: Date;
}
```