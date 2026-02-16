# SaaS Factory - Project Status

**Last Updated:** February 16, 2026 (Session 6)
**Status:** Active Development
**Repository:** github.com/goose956/n8n-custom-ui

---

## Current State

The platform is a fully functional multi-app SaaS management system with 19 backend modules and 15 frontend pages. All data scoped by `app_id` for per-app isolation. Both backend and frontend compile clean with zero TypeScript errors.

### Services

| Service | Port | Framework | Status |
|---------|------|-----------|--------|
| Backend API | 3000 | NestJS 10 | Running |
| Frontend | 5173 | React 18 + Vite 5 | Running |
| n8n | 5678 | n8n v2.6.4 | Running |

---

## Backend Modules

| Module | Path | Purpose |
|--------|------|---------|
| SharedModule | `shared/` | Global CryptoService (AES-256-CBC) + DatabaseService (db.json I/O) |
| AppsModule | `apps/` | Multi-app CRUD with auto-generated pages and plans, cloning |
| PagesModule | `pages/` | Per-app page management (create, update, delete) |
| WorkflowsModule | `workflows/` | n8n workflow listing, validation, config storage, triggering |
| SettingsModule | `settings/` | Platform settings (n8n URL, API key) |
| ApiKeysModule | `api-keys/` | Encrypted API key vault (masked for frontend, decrypted server-side) |
| ChatModule | `chat/` | AI chat messaging (OpenAI/OpenRouter, partial-patch mode) |
| PageAgentModule | `page-agent/` | AI page content generation |
| N8nBuilderModule | `n8n-builder/` | AI workflow JSON builder with validation and node schema reference |
| BlogModule | `blog/` | Blog post CRUD + OpenAI generation |
| ResearchModule | `research/` | Brave Search + Claude analysis pipeline |
| AppPlannerModule | `app-planner/` | AI feature planning and roadmap generation |
| AnalyticsModule | `analytics/` | Per-app usage statistics, error logging interceptor, **contact form API** |
| HealthModule | `health/` | Service health check |
| MigrationsModule | `migrations/` | Legacy db.json to multi-app schema migration |
| ProgrammerAgentModule | `programmer-agent/` | AI code generation with orchestrator + sub-agent model routing |
| SocialMonitorModule | `social-monitor/` | Reddit monitoring via Apify, keyword tracking, AI draft replies |
| StripeModule | `stripe/` | Stripe products, prices, checkout sessions, webhooks, payments |
| PreviewModule | `preview/` | Vite-based live preview (single page + full site) with safeProxy + mock data |

### Shared Infrastructure

- **CryptoService** - Single encrypt/decrypt (AES-256-CBC), replaces 8 duplicated implementations
- **DatabaseService** - Consistent db.json path resolution + sync/async read/write helpers
- **ValidationPipe** - Global input validation (whitelist + transform) in main.ts
- **Shutdown hooks** - Graceful process shutdown enabled

---

## Frontend Pages

| Page | Component | Features |
|------|-----------|----------|
| Dashboard | DashboardPage.tsx | Stats overview, quick actions, activity summary, recent projects |
| Projects | ProjectsPage.tsx | Card grid, create/edit/delete apps, locale selector, AI page gen |
| Pages | PagesPage.tsx | JSON editor, live preview, AI chat (partial-patch), format toolbar |
| Workflows | WorkflowsPage.tsx | Table view, validation badges, edit/trigger/view |
| Workflow Builder | WorkflowBuilderPage.tsx | AI architect chat, architecture summaries, message type chips |
| Apps | AppsPage.tsx | App planner interface |
| Blog | BlogPage.tsx | Blog management, AI generation, selection-aware generate-all |
| Research | ResearchPage.tsx | Brave + Claude/GPT research, PDF export, multi-model picker |
| Programmer Agent | ProgrammerAgentPage.tsx | AI code gen, orchestrator/sub-agent routing, file viewer, refine |
| Preview | AppPreviewPage.tsx | Full browser simulation, 11 page-type renderers, navigation history |
| Social Monitor | SocialMonitorPage.tsx | Reddit monitoring, keyword management, AI draft replies, post delete |
| Analytics | AnalyticsPage.tsx | Stats cards, usage tables |
| Templates | TemplatesPage.tsx | 9 template previews (index, thanks, members, checkout, admin, pricing, about, faq, contact) |
| Stripe | StripePage.tsx | Product/price management, payment history, Stripe sync |
| Settings | SettingsPage.tsx | n8n config, API keys, integration keys, Stripe tab |

### Frontend Architecture

- Centralized API config in frontend/src/config/api.ts with VITE_API_URL env var support
- Zero hardcoded URLs - all component files use the centralized API object
- XSS protection via DOMPurify on all dangerouslySetInnerHTML usages
- Design system: dark nav (#1a1a2e), gradient accents (#667eea to #764ba2), light bg (#fafbfc), Inter font
- Shared page renderers: RenderPage exports from AppPreviewPage used by both Preview and Pages editor
- Global search: Ctrl+K command palette via GlobalSearch component
- Shared components: StatCard extracted to `shared/` for reuse across pages

---

## Security Measures (Applied)

1. API key masking - getApiKeyMasked() returns masked keys to frontend
2. Server-side decryption - getApiKeyDecrypted() only used internally for API calls
3. n8n key fix - workflow-config.service.ts now decrypts n8n API key before HTTP headers
4. Crash prevention - apps.service.ts guards against undefined arrays in update/delete
5. Proper 404s - pages.controller.ts throws NotFoundException instead of returning 200
6. Input validation - Global ValidationPipe with whitelist mode
7. XSS protection - DOMPurify sanitizes all HTML injection points
8. Clone fix - cloneApp() prevents duplicate default pages via skipDefaults parameter

---

## Data Model

All app data scoped by app_id for clean per-app isolation:

| Table | Scoped By | Notes |
|-------|-----------|-------|
| apps | - | Master app list |
| pages | app_id | Per-app pages with content_json |
| plans | app_id | Pricing tiers |
| subscriptions | app_id | User subscriptions |
| app_settings | app_id | Per-app config |
| app_usage | app_id | Usage tracking |
| blog posts | projectId | Blog content |
| research | projectId | Research projects |
| api_keys | - | Shared (factory-level) |
| settings | - | Shared (n8n config) |
| workflowConfigs | - | Needs app_id (known gap) |

---

## Recent Changes (Feb 16, 2026 — Session 6)

### Full Site Preview (7 commits)
- **Full site preview mode** — Preview ALL pages together as a navigable website in a new browser tab
- Opens via `window.open()` instead of iframe, uses Vite programmatic API (ports 5200-5299)
- React Router with sidebar navigation, auto-generated routes from project pages
- **SafeProxy system** — Deep Proxy that handles array methods (.map, .filter), string methods (.toUpperCase, .toLowerCase), Symbol.iterator, and Symbol.toPrimitive
- **Mock data injection** — Rich mock data for billing, profile, settings, stats, trends (no real API calls needed in preview)
- **Auto-inject missing globals** — `injectMissingGlobals()` detects usage of API_BASE/API_URL without declaration and auto-injects
- **Icon deduplication** — `deduplicateIconImports()` resolves barrel import collisions between @mui/material and @mui/icons-material
- **Stale session recovery** — When `update()` fails (backend restarted), resets session so fresh `start()` happens

### Admin Template Overhaul
- **Slimmed admin template** to 2 tabs only: Analytics (page performance) + Contact Submissions (inbox with status management)
- Removed: Visitors, Errors, API Usage tabs (was 4 tabs)
- KPI cards: Active Users, Page Views, Revenue, Contact Messages (with new message count)
- Contact submissions table with name/email/subject/status/date + action menu (mark read, replied, archive, delete)

### Contact Form System (New)
- **ContactController** — `POST /api/contact` (submit), `GET /api/contact` (list with filters), `POST /api/contact/:id/status` (update), `DELETE /api/contact/:id`
- **contactFormTemplate()** — Static TSX template for members area contact page (posts to `/api/contact` with app_id)
- Added `'contact'` to `DEFAULT_MEMBERS_PAGES` (required, 0 AI tokens) and `TEMPLATE_PAGE_TYPES`
- Every new project gets analytics + contact form admin out of the box

### Session 5 Highlights (Coder Agent Rewrite)
- Line-based edit system replacing string-matching (array.splice, descending sort, dedup guard)
- Component library pre-reading for AI context
- ProgrammerAgentPage UI overhaul (browser chrome, split view, 3-tab chat panel)
- 13 members area components created by Coder Agent

### Session 4 Highlights
- StripeModule, DashboardPage, GlobalSearch, StatCard component
- Workflow Builder intelligence overhaul, AI-powered project creation
- Blog publish sync, Social Monitor fixes, 4 new page templates

---

## Known Gaps

- workflowConfigs not scoped by app_id (minor, needs field addition)
- No authentication or user management yet
- db.json file-based storage (Supabase migration planned)
- Frontend chunk size warning in production build (non-blocking)
- Preview mock data only — `generatePreviewData()` creates fake data; real API calls not made in preview

## Next Steps

1. Export Module - Generate standalone Next.js project zip from any app data
2. Supabase Migration - PostgreSQL + auth + Row Level Security
3. Per-App Deployment - Vercel/Railway pipeline
4. Docker - Containerized deployment
5. App cloning with admin template — duplicate admin database for instant setup
