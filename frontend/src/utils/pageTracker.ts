/**
 * Analytics Tracking Script
 * Include this script in any page template to track page views
 */
import { API_BASE_URL } from '../config/api';

class PageTracker {
  private backendUrl: string = API_BASE_URL;
  private visitorId: string;

  constructor(backendUrl?: string) {
    if (backendUrl) {
      this.backendUrl = backendUrl;
    }
    this.visitorId = this.getOrCreateVisitorId();
  }

  /**
   * Get or create a unique visitor ID stored in localStorage
   */
  private getOrCreateVisitorId(): string {
    const storageKey = 'n8n_visitor_id';
    let visitorId = localStorage.getItem(storageKey);

    if (!visitorId) {
      // Generate a unique visitor ID
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
  }

  /**
   * Track a page view
   * @param appId - The app ID to track for
   * @param pageTitle - Title of the page being viewed
   * @param pageUrl - URL of the page (optional, defaults to current location)
   */
  async trackPageView(
    appId: number,
    pageTitle: string,
    pageUrl?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          page_title: pageTitle,
          page_url: pageUrl || window.location.href,
          visitor_id: this.visitorId,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          location: window.location.pathname,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to track page view:', error);
      return false;
    }
  }

  /**
   * Get the current visitor ID
   */
  getVisitorId(): string {
    return this.visitorId;
  }
}

export default PageTracker;

