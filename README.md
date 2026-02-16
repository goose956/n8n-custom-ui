# SaaS Factory

A multi-tenant SaaS management platform for creating, managing, and exporting standalone applications. Built with NestJS, React, and n8n workflow automation.

## Features

- **Multi-App Management** — Create, edit, clone, and delete SaaS applications with auto-generated pages and pricing plans
- **Page Builder** — Visual page editor with JSON editing, live preview, and AI chat assistant (partial-patch updates)
- **App Preview** — Full browser simulation to test apps page-by-page with navigation, history, and address bar
- **Full Site Preview** — Preview all pages together as a navigable website in a new browser tab (Vite dev server, ports 5200-5299)
- **Programmer Agent** — AI code generation with orchestrator + sub-agent model routing for cost optimization
- **Members Area Templates** — Static TSX templates for profile, settings, admin (analytics + contact), and contact form (0 AI tokens)
- **Social Monitor** — Reddit monitoring via Apify, keyword tracking, relevance scoring, and AI draft replies
- **n8n Workflow Integration** — View, validate, configure, and trigger n8n workflows
- **AI Workflow Builder** — Chat-based n8n workflow JSON generation with validation and node reference
- **Blog Manager** — AI-powered blog post generation with OpenAI integration
- **Research Tool** — Web research via Brave Search + Claude analysis with PDF export
- **App Planner** — AI-assisted feature planning and roadmap generation
- **Analytics Dashboard** — Per-app usage tracking and error logging
- **Contact Form API** — Contact form submissions with status management (new/read/replied/archived)
- **API Key Vault** — Centralized encrypted credential storage (AES-256-CBC)
- **Health Monitoring** — Live service status indicator

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript, Node.js |
| Frontend | React 18, Vite 5, Material-UI 5 |
| Automation | n8n (self-hosted) |
| Database | File-based JSON (Supabase/PostgreSQL planned) |
| Preview | Vite programmatic API (ports 5200-5299) |
| Encryption | AES-256-CBC via shared CryptoService |

## Project Structure

```
n8n surface/
┌── backend/                         # NestJS REST API (:3000)
│   └── src/
│       ├── shared/                  # Global CryptoService + DatabaseService
│       ├── apps/                    # Multi-app CRUD
│       ├── pages/                   # Page management
│       ├── workflows/               # n8n workflow management & validation
│       ├── settings/                # Platform configuration
│       ├── api-keys/                # Encrypted API key storage
│       ├── chat/                    # AI chat (page agent, partial-patch mode)
│       ├── page-agent/              # Page content generation
│       ├── n8n-builder/             # AI workflow builder
│       ├── blog/                    # Blog post management
│       ├── research/                # Brave Search + Claude research
│       ├── app-planner/             # AI app planning
│       ├── programmer-agent/        # AI code gen (orchestrator + sub-agent)
│       ├── preview/                 # Vite-based live preview (single + full site)
│       ├── social-monitor/          # Reddit monitoring + AI replies
│       ├── analytics/               # Usage analytics + error logging + contact API
│       ├── stripe/                  # Stripe payments integration
│       ├── health/                  # Health check endpoint
│       ├── migrations/              # Database migration tools
│       └── types/                   # Shared TypeScript types
├── frontend/                        # React + Vite SPA (:5173)
│   └── src/
│       ├── config/api.ts            # Centralized API URL config
│       ├── components/              # All page components (13 pages)
│       └── utils/                   # Utilities
├── database/schema.sql              # SQL schema reference
├── docs/                            # Architecture docs
├── scripts/                         # App creation scripts
└── ecosystem.config.js              # PM2 config
```

## Quick Start

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start all services
npm run dev:full
```

Services:
- **Frontend** — http://localhost:5173
- **Backend API** — http://localhost:3000
- **n8n** — http://localhost:5678

### First-Time Setup

1. Open http://localhost:5173
2. Go to **Settings** → configure n8n URL (`http://localhost:5678`) and API key
3. Add API keys (OpenAI, Anthropic, Brave Search) as needed
4. Go to **Projects** → create your first app

## API Reference

### Apps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/apps` | List all apps |
| POST | `/api/apps` | Create app (auto-generates pages & plans) |
| GET | `/api/apps/:id` | Get app by ID |
| PUT | `/api/apps/:id` | Update app |
| DELETE | `/api/apps/:id` | Delete app (cascade) |
| POST | `/api/apps/:id/clone` | Clone app |

### Pages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pages?app_id=:id` | List pages for app |
| POST | `/api/pages` | Create page |
| PUT | `/api/pages/:id` | Update page |
| DELETE | `/api/pages/:id` | Delete page |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows/validation` | List workflows with validation |
| GET | `/api/workflows/config/:id` | Get workflow config |
| PUT | `/api/workflows/config/:id` | Save workflow config |
| POST | `/api/workflows/:id/trigger` | Execute workflow |

### Settings & Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/load` | Load settings |
| POST | `/api/settings/save` | Save settings |
| GET | `/api/settings/test-connection` | Test n8n connection |
| GET | `/api/api-keys` | List API keys (masked) |
| POST | `/api/api-keys` | Store API key (encrypted) |
| DELETE | `/api/api-keys/:name` | Delete API key |

### Blog, Research, Chat, Analytics, Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog/posts` | List blog posts |
| POST | `/api/blog/generate` | AI-generate blog post |
| GET | `/api/research/projects` | List research projects |
| POST | `/api/research/run/:id` | Run research (Brave + Claude) |
| POST | `/api/chat/message` | Send chat message (partial-patch mode) |
| GET | `/api/analytics/stats` | Get analytics |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/contact` | List contact submissions (filterable by status/app_id) |
| POST | `/api/contact/:id/status` | Update submission status (new/read/replied/archived) |
| DELETE | `/api/contact/:id` | Delete contact submission |
| GET | `/api/health` | Health check |

### Programmer Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/programmer-agent/generate` | AI code generation with plan |
| POST | `/api/programmer-agent/refine` | Refine a generated file |
| POST | `/api/programmer-agent/sub-task` | Run sub-agent task (types, styles, etc.) |
| POST | `/api/programmer-agent/save` | Save generated files to project |
| GET | `/api/programmer-agent/models` | Get available models |
| GET | `/api/programmer-agent/stats` | Get usage statistics |

### Social Monitor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social-monitor/keywords` | List monitor keywords |
| POST | `/api/social-monitor/keywords` | Add keyword |
| DELETE | `/api/social-monitor/keywords/:id` | Delete keyword |
| POST | `/api/social-monitor/keywords/:id/toggle` | Toggle keyword |
| GET | `/api/social-monitor/posts` | List monitored posts (filterable) |
| POST | `/api/social-monitor/scan` | Scan Reddit via Apify |
| POST | `/api/social-monitor/posts/:id/generate-reply` | AI-generate draft reply |
| GET | `/api/social-monitor/stats` | Get monitor statistics |

## Architecture

### Backend Modules (20)

All services share a global `SharedModule` providing:
- **CryptoService** — Single AES-256-CBC encrypt/decrypt implementation
- **DatabaseService** — Consistent `db.json` read/write with path resolution

### Security

- API keys returned masked to frontend (`sk-••••••••xxxx`)
- Decrypted keys only used server-side for API calls
- Input validation via NestJS `ValidationPipe` (whitelist + transform)
- XSS protection via DOMPurify on all `dangerouslySetInnerHTML` usage
- n8n API key properly decrypted before use in workflow operations

### Frontend

- Centralized API config in `frontend/src/config/api.ts`
- Supports `VITE_API_URL` environment variable for deployment
- Design system: dark nav (#1a1a2e), gradient accents (#667eea → #764ba2), light backgrounds (#fafbfc)

## Environment Variables

```env
# Backend
ENCRYPTION_KEY=your-secret-key-change-in-production
NODE_ENV=development

# Frontend (.env in frontend/)
VITE_API_URL=http://localhost:3000
```

## Build for Production

```bash
npm run build:backend    # → backend/dist/
npm run build:frontend   # → frontend/dist/
```

PM2 support:
```bash
npm run pm2:start        # Start with ecosystem.config.js
npm run pm2:status       # Check status
npm run pm2:logs         # View logs
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `netstat -ano \| findstr :3000` then kill the process |
| Backend won't start | Check `db.json` exists in `backend/`, Node.js 18+ required |
| Frontend won't compile | Delete `node_modules` + `package-lock.json`, reinstall |
| n8n connection fails | Verify n8n running at :5678, check API key in Settings |
| Workflows not triggering | n8n API key was likely encrypted — fixed in latest update |

## Roadmap

- [ ] **Export Module** — One-click export of apps as standalone Next.js projects
- [ ] **Supabase Migration** — Replace db.json with PostgreSQL + auth + RLS
- [ ] **Per-App Deployment** — Vercel/Railway deployment pipeline
- [ ] **RBAC** — Role-based access control and audit logging
- [ ] **Docker** — Containerized deployment
- [ ] **Platform Conversion** — Export to Shopify, Android (Capacitor), Desktop (Electron), PWA

## License

MIT
