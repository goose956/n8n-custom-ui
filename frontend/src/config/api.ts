/**
 * Centralized API configuration.
 * Change API_BASE_URL here when deploying to a different environment.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ||'http://localhost:3000';

// Pre-built endpoint groups for convenience
export const API = {
 apps:`${API_BASE_URL}/api/apps`,
 pages:`${API_BASE_URL}/api/pages`,
 settings:`${API_BASE_URL}/api/settings`,
 apiKeys:`${API_BASE_URL}/api/api-keys`,
 workflows:`${API_BASE_URL}/api/workflows`,
 chat:`${API_BASE_URL}/api/chat`,
 analytics:`${API_BASE_URL}/api/analytics`,
 pageAgent:`${API_BASE_URL}/api/page-agent`,
 n8nBuilder:`${API_BASE_URL}/api/n8n-builder`,
 appPlanner:`${API_BASE_URL}/api/app-planner`,
 blog:`${API_BASE_URL}/api/blog`,
 research:`${API_BASE_URL}/api/research`,
 programmerAgent:`${API_BASE_URL}/api/programmer-agent`,
 health:`${API_BASE_URL}/api/health`,
 socialMonitor:`${API_BASE_URL}/api/social-monitor`,
 stripe:`${API_BASE_URL}/api/stripe`,
 preview:`${API_BASE_URL}/api/preview`,
 linkedinScraper: `${API_BASE_URL}/api/linkedin-scraper`,
} as const;