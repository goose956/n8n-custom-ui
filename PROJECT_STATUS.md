# SaaS Factory - Project Status

**Last Updated:** February 12, 2026
**Status:** Active Development
**Repository:** github.com/goose956/n8n-custom-ui

---

## Current State

The platform is a fully functional multi-app SaaS management system with 15 backend modules and 10 frontend pages. All data scoped by `app_id` for per-app isolation. Both backend and frontend compile clean with zero TypeScript errors.

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
| ChatModule | `chat/` | AI chat messaging (OpenAI/OpenRouter) |
| PageAgentModule | `page-agent/` | AI page content generation |
| N8nBuilderModule | `n8n-builder/` | AI workflow JSON builder with validation and node schema reference |
| BlogModule | `blog/` | Blog post CRUD + OpenAI generation |
| ResearchModule | `research/` | Brave Search + Claude analysis pipeline |
| AppPlannerModule | `app-planner/` | AI feature planning and roadmap generation |
| AnalyticsModule | `analytics/` | Per-app usage statistics |
| HealthModule | `health/` | Service health check |
| MigrationsModule | `migrations/` | Legacy db.json to multi-app schema migration |

### Shared Infrastructure

- **CryptoService** - Single encrypt/decrypt (AES-256-CBC), replaces 8 duplicated implementations
- **DatabaseService** - Consistent db.json path resolution + sync/async read/write helpers
- **ValidationPipe** - Global input validation (whitelist + transform) in main.ts
- **Shutdown hooks** - Graceful process shutdown enabled

---

## Frontend Pages

| Page | Component | Features |
|------|-----------|----------|
| Projects | ProjectsPage.tsx | Card grid, create/edit/delete apps, color picker |
| Pages | PagesPage.tsx | JSON editor, live preview, AI chat, format toolbar |
| Workflows | WorkflowsPage.tsx | Table view, validation badges, edit/trigger/view |
| Workflow Builder | WorkflowBuilderPage.tsx | AI chat, template sidebar, JSON viewer, node reference |
| Apps | AppsPage.tsx | App planner interface |
| Blog | BlogPage.tsx | Blog management + AI generation |
| Research | ResearchPage.tsx | Brave + Claude research, PDF export, model picker |
| Analytics | AnalyticsPage.tsx | Stats cards, usage tables |
| Templates | TemplatesPage.tsx | Template previews |
| Settings | SettingsPage.tsx | n8n config, API keys, connection testing |

### Frontend Architecture

- Centralized API config in frontend/src/config/api.ts with VITE_API_URL env var support
- Zero hardcoded URLs - all 12 component files use the centralized API object
- XSS protection via DOMPurify on all 5 dangerouslySetInnerHTML usages
- Design system: dark nav (#1a1a2e), gradient accents (#667eea to #764ba2), light bg (#fafbfc), Inter font

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

## Recent Changes (Feb 12, 2026)

### Security Fixes (8)
- API key exposure - masked responses
- n8n encrypted key bug - proper decryption in workflow-config
- apps.service crash - undefined array guards
- pages.controller 404s - NotFoundException
- XSS vulnerabilities - DOMPurify
- No input validation - ValidationPipe
- Clone duplicates - skipDefaults parameter
- Shutdown hooks - enableShutdownHooks()

### Structural Improvements (3)
- Centralized API URL config (12 frontend files migrated)
- Shared CryptoService (removed ~120 lines of duplicate code across 8 services)
- Shared DatabaseService (standardized db.json path, 13 services migrated)

---

## Known Gaps

- workflowConfigs not scoped by app_id (minor, needs field addition)
- No authentication or user management yet
- db.json file-based storage (Supabase migration planned)
- Frontend chunk size warning in production build (non-blocking)

## Next Steps

1. Export Module - Generate standalone Next.js project zip from any app data
2. Supabase Migration - PostgreSQL + auth + Row Level Security
3. Per-App Deployment - Vercel/Railway pipeline
4. Docker - Containerized deployment
