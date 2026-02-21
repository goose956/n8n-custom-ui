# SaaS Factory - Project Status

**Last Updated:** February 21, 2026 (Session 10)
**Status:** Active Development
**Repository:** github.com/goose956/n8n-custom-ui

---

## Current State

The platform is a fully functional multi-app SaaS management system with 20 backend modules and 16 frontend pages. All data scoped by `app_id` for per-app isolation. Both backend and frontend compile clean with zero TypeScript errors.

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
| SkillsModule | `skills/` | Two-layer agent system: 15 tools + 31 skills, 14 capability types, 4 ctx methods (Excel, Email, QR, ZIP), PDF/image generation, agentic loop |

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
| Settings | SettingsPage.tsx | n8n config, API keys, integration keys (OpenAI, Brave, Apify, Stripe, etc.) |
| Skill Workshop | SkillWorkshopPage.tsx | Two-panel agent skill editor, tool editor, agentic output, AI builder chat, follow-up chaining |

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

## Recent Changes (Feb 21, 2026 — Sessions 8–10)

### Skills Expansion — 15 Tools, 31 Skills, Clean Architecture
- **Clean architecture refactor** — Single `buildPromptForTask()` entry point, 3-layer prompt pipeline (Planner → Assembler → Tool Filter), `artifact-registry.ts` for output tracking
- **15 tools** — brave-search, generate-image, apify-scraper, generate-pdf, generate-csv, generate-html, generate-qrcode, send-email, generate-json, generate-excel, generate-qr, create-zip, text-to-speech, generate-html-page, generate-vcard
- **31 skills** — from web-research to dashboard-generator, covering research, content, analysis, output generation
- **4 new ToolContext methods** — `generateExcel()` (ExcelJS), `sendEmail()` (Nodemailer), `generateQR()` (qrcode), `createZip()` (archiver)
- **14 capability types** — research, deep-research, write-article, content-ideation, summarise, translate, analyse, repurpose, generate-image, render-pdf, render-csv, render-html, render-qr, send-email, render-excel, render-tts, render-vcard, render-zip
- **Prompt system** — 22 capability prompt `.md` files, orchestrator prompt, CAPABILITY_REGISTRY + TOOL_TO_CAPABILITY + SKILL_ARCHETYPE maps
- **PDF fix** — URL demangling for any URI scheme, image embedding via PDFKit
- **29/50 catalogue skills built** (Input: 1/8, Processing: 17/19, Output: 11/15)

### Previous Sessions
- Session 7: Agent Skill Workshop v2, two-layer architecture, 4 tools, 6 skills
- Session 6: Full site preview, admin template, contact form API
- Session 5: Coder Agent rewrite, ProgrammerAgentPage overhaul
- Session 4: StripeModule, DashboardPage, GlobalSearch, Workflow Builder intelligence

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
