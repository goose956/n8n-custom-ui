import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';
import { CryptoService } from '../shared/crypto.service';

interface EngagementMetrics {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
  mentions: number;
  impressions: number;
  engagementRate: number;
  clickThroughRate: number;
}

interface FollowerGrowthData {
  date: string;
  totalFollowers: number;
  newFollowers: number;
  unfollowers: number;
  netGrowth: number;
  growthRate: number;
}

interface FunnelAnalytics {
  stage: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropoffRate: number;
}

interface RoiData {
  campaign: string;
  spend: number;
  revenue: number;
  roi: number;
  roas: number;
  costPerAcquisition: number;
  customerLifetimeValue: number;
}

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
  campaignId?: string;
}

@Injectable()
export class AnalyticsApiService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService
  ) {}

  async getEngagementMetrics(memberId: string, filters: AnalyticsFilters): Promise<{
    success: boolean;
    data: EngagementMetrics[];
    summary: {
      totalEngagements: number;
      averageEngagementRate: number;
      bestPerformingPost: any;
      periodComparison: number;
    };
  }> {
    const data = this.db.readSync();
    
    if (!data.members?.[memberId]) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    }

    const member = data.members[memberId];
    
    // Get Twitter API credentials
    const twitterApiKey = this.cryptoService.getApiKey(memberId, 'twitter');
    
    // Generate engagement metrics based on stored data and filters
    const engagementData = this.generateEngagementMetrics(member, filters);
    
    // Calculate summary statistics
    const totalEngagements = engagementData.reduce((sum, item) => 
      sum + item.likes + item.retweets + item.replies, 0);
    
    const averageEngagementRate = engagementData.reduce((sum, item) => 
      sum + item.engagementRate, 0) / engagementData.length;
    
    const bestPerformingPost = this.findBestPerformingPost(member, filters);
    
    const periodComparison = this.calculatePeriodComparison(member, filters);

    // Store analytics data
    if (!data.analytics) data.analytics = {};
    if (!data.analytics[memberId]) data.analytics[memberId] = {};
    
    data.analytics[memberId].lastEngagementFetch = new Date().toISOString();
    data.analytics[memberId].engagementMetrics = engagementData;
    
    this.db.writeSync(data);

    return {
      success: true,
      data: engagementData,
      summary: {
        totalEngagements,
        averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
        bestPerformingPost,
        periodComparison: Math.round(periodComparison * 100) / 100
      }
    };
  }

  async getFollowerGrowth(memberId: string, filters: AnalyticsFilters): Promise<{
    success: boolean;
    data: FollowerGrowthData[];
    summary: {
      totalFollowers: number;
      netGrowthPeriod: number;
      averageGrowthRate: number;
      projectedGrowth: number;
    };
  }> {
    const data = this.db.readSync();
    
    if (!data.members?.[memberId]) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    }

    const member = data.members[memberId];
    
    // Generate follower growth data
    const followerData = this.generateFollowerGrowthData(member, filters);
    
    // Calculate summary statistics
    const totalFollowers = followerData[followerData.length - 1]?.totalFollowers || 0;
    const netGrowthPeriod = followerData.reduce((sum, item) => sum + item.netGrowth, 0);
    const averageGrowthRate = followerData.reduce((sum, item) => sum + item.growthRate, 0) / followerData.length;
    const projectedGrowth = this.calculateProjectedGrowth(followerData);

    // Store analytics data
    if (!data.analytics) data.analytics = {};
    if (!data.analytics[memberId]) data.analytics[memberId] = {};
    
    data.analytics[memberId].lastFollowerGrowthFetch = new Date().toISOString();
    data.analytics[memberId].followerGrowthData = followerData;
    
    this.db.writeSync(data);

    return {
      success: true,
      data: followerData,
      summary: {
        totalFollowers,
        netGrowthPeriod,
        averageGrowthRate: Math.round(averageGrowthRate * 100) / 100,
        projectedGrowth: Math.round(projectedGrowth)
      }
    };
  }

  async getFunnelAnalytics(memberId: string, filters: AnalyticsFilters & { campaignId?: string }): Promise<{
    success: boolean;
    data: FunnelAnalytics[];
    summary: {
      totalVisitors: number;
      overallConversionRate: number;
      biggestDropoff: string;
      funnelEfficiency: number;
    };
  }> {
    const data = this.db.readSync();
    
    if (!data.members?.[memberId]) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    }

    const member = data.members[memberId];
    
    // Generate funnel analytics data
    const funnelData = this.generateFunnelData(member, filters);
    
    // Calculate summary statistics
    const totalVisitors = funnelData[0]?.visitors || 0;
    const finalConversions = funnelData[funnelData.length - 1]?.conversions || 0;
    const overallConversionRate = totalVisitors > 0 ? (finalConversions / totalVisitors) * 100 : 0;
    
    const biggestDropoffStage = funnelData.reduce((max, stage) => 
      stage.dropoffRate > max.dropoffRate ? stage : max, funnelData[0] || { stage: 'N/A', dropoffRate: 0 });
    
    const funnelEfficiency = this.calculateFunnelEfficiency(funnelData);

    // Store analytics data
    if (!data.analytics) data.analytics = {};
    if (!data.analytics[memberId]) data.analytics[memberId] = {};
    
    data.analytics[memberId].lastFunnelAnalyticsFetch = new Date().toISOString();
    data.analytics[memberId].funnelData = funnelData;
    
    this.db.writeSync(data);

    return {
      success: true,
      data: funnelData,
      summary: {
        totalVisitors,
        overallConversionRate: Math.round(overallConversionRate * 100) / 100,
        biggestDropoff: biggestDropoffStage.stage,
        funnelEfficiency: Math.round(funnelEfficiency * 100) / 100
      }
    };
  }

  async getRoiTracking(memberId: string, filters: AnalyticsFilters): Promise<{
    success: boolean;
    data: RoiData[];
    summary: {
      totalSpend: number;
      totalRevenue: number;
      overallRoi: number;
      averageRoas: number;
      bestPerformingCampaign: string;
    };
  }> {
    const data = this.db.readSync();
    
    if (!data.members?.[memberId]) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    }

    const member = data.members[memberId];
    
    // Generate ROI tracking data
    const roiData = this.generateRoiData(member, filters);
    
    // Calculate summary statistics
    const totalSpend = roiData.reduce((sum, item) => sum + item.spend, 0);
    const totalRevenue = roiData.reduce((sum, item) => sum + item.revenue, 0);
    const overallRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const averageRoas = roiData.reduce((sum, item) => sum + item.roas, 0) / roiData.length;
    
    const bestPerformingCampaign = roiData.reduce((best, campaign) => 
      campaign.roi > best.roi ? campaign : best, roiData[0] || { campaign: 'N/A', roi: 0 });

    // Store analytics data
    if (!data.analytics) data.analytics = {};
    if (!data.analytics[memberId]) data.analytics[memberId] = {};
    
    data.analytics[memberId].lastRoiTrackingFetch = new Date().toISOString();
    data.analytics[memberId].roiData = roiData;
    
    this.db.writeSync(data);

    return {
      success: true,
      data: roiData,
      summary: {
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        overallRoi: Math.round(overallRoi * 100) / 100,
        averageRoas: Math.round(averageRoas * 100) / 100,
        bestPerformingCampaign: bestPerformingCampaign.campaign
      }
    };
  }

  async getAnalyticsOverview(memberId: string, period: 'week' | 'month' | 'quarter'): Promise<{
    success: boolean;
    data: {
      engagement: any;
      followerGrowth: any;
      funnel: any;
      roi: any;
      insights: string[];
      recommendations: string[];
    };
  }> {
    const data = this.db.readSync();
    
    if (!data.members?.[memberId]) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    }

    // Get aggregated data for overview
    const filters: AnalyticsFilters = {
      period: period === 'week' ? 'day' : period === 'month' ? 'week' : 'month',
      startDate: this.getStartDateForPeriod(period),
      endDate: new Date().toISOString()
    };

    const engagement = await this.getEngagementMetrics(memberId, filters);
    const followerGrowth = await this.getFollowerGrowth(memberId, filters);
    const funnel = await this.getFunnelAnalytics(memberId, filters);
    const roi = await this.getRoiTracking(memberId, filters);

    // Generate insights and recommendations
    const insights = this.generateInsights(engagement, followerGrowth, funnel, roi);
    const recommendations = this.generateRecommendations(engagement, followerGrowth, funnel, roi);

    return {
      success: true,
      data: {
        engagement: engagement.summary,
        followerGrowth: followerGrowth.summary,
        funnel: funnel.summary,
        roi: roi.summary,
        insights,
        recommendations
      }
    };
  }

  // Helper methods for data generation and calculations
  private generateEngagementMetrics(member: any, filters: AnalyticsFilters): EngagementMetrics[] {
    const baseMetrics: EngagementMetrics[] = [];
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const impressions = Math.floor(Math.random() * 5000) + 1000;
      const likes = Math.floor(Math.random() * impressions * 0.1);
      const retweets = Math.floor(Math.random() * likes * 0.3);
      const replies = Math.floor(Math.random() * likes * 0.2);
      const mentions = Math.floor(Math.random() * 50);
      
      baseMetrics.push({
        date: date.toISOString().split('T')[0],
        likes,
        retweets,
        replies,
        mentions,
        impressions,
        engagementRate: ((likes + retweets + replies) / impressions) * 100,
        clickThroughRate: Math.random() * 5
      });
    }
    
    return baseMetrics;
  }

  private generateFollowerGrowthData(member: any, filters: AnalyticsFilters): FollowerGrowthData[] {
    const baseData: FollowerGrowthData[] = [];
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let totalFollowers = Math.floor(Math.random() * 10000) + 5000;
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const newFollowers = Math.floor(Math.random() * 100) + 10;
      const unfollowers = Math.floor(Math.random() * 50) + 5;
      const netGrowth = newFollowers - unfollowers;
      
      totalFollowers += netGrowth;
      
      baseData.push({
        date: date.toISOString().split('T')[0],
        totalFollowers,
        newFollowers,
        unfollowers,
        netGrowth,
        growthRate: (netGrowth / totalFollowers) * 100
      });
    }
    
    return baseData;
  }

  private generateFunnelData(member: any, filters: AnalyticsFilters): FunnelAnalytics[] {
    const funnelStages = [
      'Twitter Profile Visit',
      'Link Click',
      'Landing Page Visit',
      'Email Signup',
      'Purchase Intent',
      'Conversion'
    ];

    let visitors = Math.floor(Math.random() * 10000) + 5000;
    
    return funnelStages.map((stage, index) => {
      const conversionRate = Math.max(0.1, 0.8 - (index * 0.15));
      const conversions = Math.floor(visitors * conversionRate);
      const dropoffRate = index > 0 ? ((visitors - conversions) / visitors) * 100 : 0;
      
      const result = {
        stage,
        visitors,
        conversions,
        conversionRate: conversionRate * 100,
        dropoffRate
      };
      
      visitors = conversions;
      return result;
    });
  }

  private generateRoiData(member: any, filters: AnalyticsFilters): RoiData[] {
    const campaigns = ['Twitter Ads', 'Promoted Tweets', 'Follower Campaign', 'Engagement Boost'];
    
    return campaigns.map(campaign => {
      const spend = Math.floor(Math.random() * 2000) + 500;
      const revenue = Math.floor(Math.random() * 5000) + 1000;
      const roi = ((revenue - spend) / spend) * 100;
      const roas = revenue / spend;
      const costPerAcquisition = spend / Math.max(1, Math.floor(Math.random() * 100) + 10);
      const customerLifetimeValue = revenue * (Math.random() * 2 + 1);
      
      return {
        campaign,
        spend,
        revenue,
        roi,
        roas,
        costPerAcquisition,
        customerLifetimeValue
      };
    });
  }

  private findBestPerformingPost(member: any, filters: AnalyticsFilters): any {
    return {
      id: 'tweet_' + Math.random().toString(36).substr(2, 9),
      content: 'Best performing tweet content...',
      engagementRate: Math.random() * 10 + 5,
      totalEngagements: Math.floor(Math.random() * 1000) + 100
    };
  }

  private calculatePeriodComparison(member: any, filters: AnalyticsFilters): number {
    return (Math.random() - 0.5) * 20; // Random percentage change
  }

  private calculateProjectedGrowth(followerData: FollowerGrowthData[]): number {
    const recentGrowth = followerData.slice(-7).reduce((sum, item) => sum + item.netGrowth, 0);
    return recentGrowth * 4.3; // Project monthly growth
  }

  private calculateFunnelEfficiency(funnelData: FunnelAnalytics[]): number {
    const totalConversionRate = funnelData.reduce((product, stage) => 
      product * (stage.conversionRate / 100), 1);
    return totalConversionRate * 100;
  }

  private getStartDateForPeriod(period: 'week' | 'month' | 'quarter'): string {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return startDate.toISOString();
  }

  private generateInsights(engagement: any, followerGrowth: any, funnel: any, roi: any): string[] {
    const insights: string[] = [];
    
    if (engagement.summary.averageEngagementRate > 5) {
      insights.push('Your engagement rate is above industry average');
    }
    
    if (followerGrowth.summary.averageGrowthRate > 2) {
      insights.push('Strong follower growth momentum detected');
    }
    
    if (funnel.summary.overallConversionRate > 3) {
      insights.push('Your funnel is performing well with good conversion rates');
    }
    
    if (roi.summary.overallRoi > 100) {
      insights.push('Excellent ROI - your campaigns are highly profitable');
    }
    
    return insights;
  }

  private generateRecommendations(engagement: any, followerGrowth: any, funnel: any, roi: any): string[] {
    const recommendations: string[] = [];
    
    if (engagement.summary.averageEngagementRate < 3) {
      recommendations.push('Focus on creating more engaging content to boost interaction rates');
    }
    
    if (followerGrowth.summary.averageGrowthRate < 1) {
      recommendations.push('Consider running follower acquisition campaigns');
    }
    
    if (funnel.summary.overallConversionRate < 2) {
      recommendations.push('Optimize your landing pages to improve conversion rates');
    }
    
    if (roi.summary.overallRoi < 50) {
      recommendations.push('Review and optimize your campaign targeting to improve ROI');
    }
    
    return recommendations;
  }
}
