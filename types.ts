```typescript
// Type for User information
export interface UserProfile {
    id: string;  // Unique user ID
    username: string;  // User's TikTok username
    email: string;  // User's email address
    createdAt: string;  // Account creation date
    updatedAt: string;  // Last profile update date
}

// Type for TikTok script performance
export interface ScriptPerformance {
    scriptId: string;  // Unique script ID
    views: number;  // Number of views
    likes: number;  // Number of likes
    comments: number;  // Number of comments
    shares: number;  // Number of shares
    engagementRate: number;  // Engagement rate as a percentage
}

// Type for recent viral trends
export interface ViralTrend {
    trendId: string;  // Unique trend ID
    trendName: string;  // Name of the trend
    engagementRate: number;  // Engagement rate for the trend
    createdAt: string;  // Date trend was identified
}

// Type for user script history
export interface UserScriptHistory {
    historyId: string;  // Unique history ID
    scriptId: string;  // Unique script ID
    createdAt: string;  // Date script was created
    performance: ScriptPerformance;  // Performance metrics
}

// Type for billing details
export interface BillingInfo {
    subscriptionId: string;  // Unique subscription ID
    plan: string;  // Current plan name
    status: 'active' | 'inactive' | 'cancelled';  // Subscription status
    renewalDate: string;  // Next renewal date
    lastPayment: string;  // Date of last payment
    paymentMethod: 'credit_card' | 'paypal';  // Payment method
}
```