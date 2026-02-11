# SaaS Factory - Complete Technical Architecture

**Version:** 1.0.0  
**Last Updated:** February 11, 2026

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Architecture](#frontend-architecture)
6. [Automation Scripts](#automation-scripts)
7. [Migration Guide](#migration-guide)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The SaaS Factory is a complete multi-tenant, multi-app scaffolding system that allows you to:

- **Create new apps in seconds** using automated scripts
- **Share a single database** across all your applications
- **Use reusable components** for common pages (landing, checkout, members, etc.)
- **Generate unique components** with AI for app-specific UI
- **Scale from 1 to 1000+ apps** without changing architecture
- **Deploy everything** from local to production with a single command

### Key Benefits

| Benefit | Impact |
|---------|--------|
| **Single Database** | No data silos, easy backups, simple migration |
| **Reusable Templates** | Build once, deploy everywhere |
| **AI Generation** | Reduce coding time from hours to minutes |
| **Multi-Tenant Ready** | Support multiple organizations per app |
| **Type-Safe** | Full TypeScript throughout |
| **Scalable** | Designed for 100+ apps and millions of users |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - Dynamic Routes: /[app_slug]                          │
│  - Reusable Components (SettingsPage, etc.)             │
│  - AI-Generated Components                              │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│                   API Layer (NestJS)                     │
│  - /api/apps (App Management)                           │
│  - /api/settings (Settings per app)                     │
│  - /api/workflows (n8n Integration)                     │
│  - /api/[app]/process (App-specific endpoints)          │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│              Database (Single Source of Truth)           │
│  - apps table (Master list)                             │
│  - pages table (Page templates)                         │
│  - plans table (Pricing)                                │
│  - users, subscriptions (Multi-tenant)                  │
│  - app_settings, api_keys, workflows                    │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│            External Services (n8n, Stripe, etc.)        │
│  - Workflow Execution via n8n                           │
│  - Payments via Stripe                                  │
│  - Email via SendGrid (optional)                        │
└─────────────────────────────────────────────────────────┘
```

### Multi-App Routing Flow

When a user visits `youtube-to-blog.yourdomain.com`:

1. Frontend catches route with `[app_slug]` dynamic parameter
2. Queries API for app by slug: `GET /api/apps/slug/youtube-to-blog`
3. Renders appropriate template based on `page_type`
4. Injects app-specific content from database
5. Uses either reusable component or AI-generated custom component
6. Calls app-specific API endpoints: `/api/youtube-to-blog/process`

---

## Database Schema

### Tables Overview

The multi-app database consists of 10 tables:

```sql
-- Master Tables
apps                    -- All applications
pages                   -- Template pages per app
plans                   -- Pricing tiers

-- User & Subscription
users                   -- Shared user database
subscriptions           -- Links users to apps + plans

-- Configuration
app_settings            -- Settings stored per app
api_keys                -- External API keys (encrypted)
workflows               -- n8n workflows
workflow_configs        -- Workflow field configurations

-- Analytics
app_usage               -- Track usage per app
```

### Key Relationships

```
apps (1) ──→ (many) pages
    ├──→ (many) plans
    ├──→ (many) app_settings
    ├──→ (many) api_keys
    └──→ (many) workflows ──→ (many) workflow_configs

users (1) ──→ (many) subscriptions ──→ (many) apps
```

### Table Schemas (Key Fields)

**apps**
```javascript
{
  id: int,
  name: string,           // e.g., "YouTube to Blog"
  slug: string,           // e.g., "youtube-to-blog"
  description: string,
  logo_url: string,
  primary_color: string,  // Branding color
  n8n_workflow_id: string,
  active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

**pages**
```javascript
{
  id: int,
  app_id: int,            // Foreign key to apps
  page_type: enum,        // 'index', 'thanks', 'members', 'checkout', 'admin'
  title: string,
  content_json: json,     // Flexible content storage
  custom_component_path: string,  // Path to AI-generated component
  created_at: timestamp,
  updated_at: timestamp
}
```

**subscriptions**
```javascript
{
  id: int,
  user_id: int,
  app_id: int,
  plan_id: int,
  status: enum,           // 'active', 'cancelled', 'past_due', 'free'
  stripe_subscription_id: string,
  current_period_end: timestamp,
  created_at: timestamp
}
```

---

## Backend Implementation

### Module Structure

```
backend/src/
├── apps/
│   ├── apps.service.ts       # App CRUD operations
│   ├── apps.controller.ts    # REST endpoints
│   └── apps.module.ts        # DI configuration
│
├── migrations/
│   └── migrate-to-saas-factory.ts
│
├── types/
│   └── saas-factory.types.ts
│
├── app.module.ts
└── main.ts
```

### Key Services

#### AppManagementService

Handles all app-level operations:

```typescript
class AppManagementService {
  // Core CRUD
  getAllApps()
  getAppById(id: number)
  getAppBySlug(slug: string)     // For routing
  createApp(dto: CreateAppDto)
  updateApp(id: number, dto: UpdateAppDto)
  deleteApp(id: number)

  // Advanced operations
  getAppStats(appId: number)     // Revenue, subscriptions, etc.
  cloneApp(sourceId: number, newDto: CreateAppDto)  // Template cloning
}
```

#### API Endpoints

```
GET    /api/apps                 # List all apps
GET    /api/apps/:id            # Get app by ID
GET    /api/apps/slug/:slug     # Get app by slug (routing)
POST   /api/apps                # Create new app
PUT    /api/apps/:id            # Update app
DELETE /api/apps/:id            # Delete app
GET    /api/apps/:id/stats      # Get app statistics
POST   /api/apps/:id/clone      # Clone app with new slug
```

### Creating a New App (Backend)

```
POST /api/apps {
  "name": "YouTube to Blog",
  "slug": "youtube-to-blog",
  "description": "...",
  "primary_color": "#3498db"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "YouTube to Blog",
    "slug": "youtube-to-blog",
    "created_at": "2026-02-11T10:00:00Z",
    ...
  }
}
```

The service automatically:
1. Creates 5 standard pages (index, thanks, members, checkout, admin)
2. Creates 2 default plans (Free, Pro)
3. Sets up encryption-ready app settings table

---

## Frontend Architecture

### Dynamic Routing Structure

```
frontend/src/app/
├── [app_slug]/              # Dynamic route parameter
│   ├── page.tsx            # Main app page
│   ├── thanks/page.tsx
│   ├── members/page.tsx
│   ├── checkout/page.tsx
│   ├── admin/page.tsx
│   └── AppUI.tsx            # AI-generated custom component
│
├── components/
│   ├── templates/
│   │   ├── IndexPage.tsx
│   │   ├── ThanksPage.tsx
│   │   ├── MembersAreaPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   └── AdminPage.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Form.tsx
│       └── ...
│
└── lib/
    ├── api.ts               # Fetch app data
    ├── auth.ts
    └── db.ts
```

### Routing Example: Serving youtube-to-blog App

```typescript
// pages/[app_slug]/page.tsx
import { AppManagementService } from '@/lib/api';
import IndexPage from '@/components/templates/IndexPage';

export default async function AppPage({ params }) {
  const app = await fetch(`/api/apps/slug/${params.app_slug}`);
  const appData = await app.json();

  return (
    <IndexPage
      appName={appData.name}
      primaryColor={appData.primary_color}
      logoUrl={appData.logo_url}
      content={appData.pages[0].content_json}  // From database
    />
  );
}
```

### Template Component (Reusable)

```typescript
// components/templates/IndexPage.tsx
interface IndexPageProps {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
  content: Record<string, any>;
}

export default function IndexPage({
  appName,
  primaryColor,
  logoUrl,
  content,
}: IndexPageProps) {
  return (
    <div style={{ backgroundColor: primaryColor }}>
      {logoUrl && <img src={logoUrl} alt={appName} />}
      <h1>{content.headline}</h1>
      <p>{content.subheading}</p>
      {/* ... */}
    </div>
  );
}
```

This single component serves ALL your apps - it only receives different data from the database.

---

## Automation Scripts

### Script 1: Standard App Creation

```bash
./create-new-app.sh "App Name" app-slug
```

**What it does:**
1. ✅ Creates app in database via API
2. ✅ Creates directory `frontend/src/app/[app-slug]`
3. ✅ Makes app immediately accessible
4. ≈ 5 seconds total

**Example:**
```bash
./create-new-app.sh "YouTube to Blog" youtube-to-blog \
  "Convert YouTube videos to blog posts"

# Output:
# ✅ App created with ID: 2
# 📋 Next steps:
#   - Frontend URL: http://localhost:5173/youtube-to-blog
#   - Backend API: http://localhost:3000/api/apps/2
```

### Script 2: AI-Powered App Generation

```bash
./ai-create-app.sh
```

**What it does:**
1. 💬 Prompts you for natural language app description
2. 🤖 Calls Claude API to generate React component
3. ✅ Creates app in database
4. 📁 Saves generated component to frontend
5. 🚀 Makes app live
6. ≈ 30 seconds total

**Example:**
```bash
./ai-create-app.sh

# Interactive prompts:
# ? What app do you want to build?
# > A tool that converts YouTube videos to blog posts
#
# ? What should users input?
# > A YouTube URL
#
# ? What should the app output?
# > A well-formatted blog post
#
# Output:
# ✨ App "YouTube to Blog" is ready!
#    - Frontend: http://localhost:5173/youtube-to-blog
#    - AI Component: frontend/src/app/[youtube-to-blog]/AppUI.tsx
```

---

## Migration Guide

### From Single-App to Multi-App

The migration script handles the transition automatically:

```bash
# In backend directory
npx ts-node src/migrations/migrate-to-saas-factory.ts

# Output:
# 🔄 Starting database migration...
# 📖 Reading current database...
# ✅ Read 4 data collections
# 💾 Creating backup...
# ✅ Backup created: db-backup-2026-02-11.json
# 🔄 Migrating data...
# ✅ Created 1 app (n8n-surface)
# ✅ Created 4 pages
# ✅ Migrated 0 workflow(s)
# 📝 Writing new database...
# ✨ Migration complete!
```

**What it does:**
1. 📖 Reads your existing db.json
2. 💾 Creates a backup (`db-backup-DATE.json`)
3. 🔄 Transforms to multi-app schema
4. ✅ Migrates existing n8n settings to "n8n-surface" app
5. 📝 Writes new structure back to db.json

### Backup Location

All backups stored in `backend/` directory:
```
backend/
├── db.json                           # Current database
├── db-backup-2026-02-10.json        # Backup 1
├── db-backup-2026-02-11.json        # Backup 2
└── ... (more backups)
```

**Recovery:** Simply restore from any backup:
```bash
cp backend/db-backup-2026-02-10.json backend/db.json
npm run dev:backend
```

---

## Deployment

### Local Development

```bash
# 1. Install all dependencies
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Run everything in parallel
npm run dev:full

# Access:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - n8n: http://localhost:5678
```

### Production Deployment

#### Step 1: Database Setup

```bash
# Export local database
mysqldump -u root -p saas_factory > saas_factory.sql

# On production server
mysql -u prod_user -p production_db < saas_factory.sql
```

#### Step 2: Environment Variables

```bash
# .env.production
DB_HOST=your-db-server.com
DB_USER=production_user
DB_PASSWORD=secure_password_here
DB_NAME=saas_factory
ENCRYPTION_KEY=unique_encryption_key_for_production
N8N_URL=https://n8n.yourdomain.com
ANTHROPIC_API_KEY=your_anthropic_key (for AI generation)
```

#### Step 3: Backend Deployment

**Option A: Using Vercel (Recommended)**
```bash
npm run build
vercel deploy --prod
```

**Option B: Using Railway**
```bash
# Railway automatically detects Next.js
git push railway main
```

**Option C: Using PM2 on VPS**
```bash
npm run build
pm2 start npm --name "saas-factory-api" -- start
pm2 save
pm2 startup
```

#### Step 4: Frontend Deployment

**Option A: Vercel (Recommended)**
```bash
cd frontend
vercel deploy --prod
```

**Option B: Netlify**
```bash
npm run build
netlify deploy --prod --dir=.next
```

**Option C: Self-Hosted**
```bash
npm run build
# Serve frontend/.next folder with nginx
```

---

## Configuration

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_HOST` | Database server | `localhost` or `db.example.com` |
| `DB_USER` | Database user | `saas_user` |
| `DB_PASSWORD` | Database password | `secure_pass_123` |
| `DB_NAME` | Database name | `saas_factory` |
| `ENCRYPTION_KEY` | For encrypting API keys | `your-secret-key` |
| `N8N_URL` | n8n instance URL | `http://localhost:5678` |
| `ANTHROPIC_API_KEY` | Claude API key (for AI generation) | `sk-ant-...` |

### App Customization

After creating an app, customize it via API:

```bash
# Update app branding
curl -X PUT http://localhost:3000/api/apps/1 \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#FF6B6B",
    "logo_url": "https://example.com/logo.png"
  }'

# Update a page template
curl -X PUT http://localhost:3000/api/apps/1/pages/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome",
    "content_json": {
      "headline": "Custom headline",
      "subheading": "Custom subheading"
    }
  }'

# Add a pricing plan
curl -X POST http://localhost:3000/api/apps/1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise",
    "price": 299,
    "billing_period": "monthly",
    "features_json": {
      "users": "unlimited",
      "support": "priority"
    }
  }'
```

---

## Troubleshooting

### Issue: "App with slug already exists"

**Cause:** Slug must be unique across all apps

**Solution:**
```bash
# Use a different slug:
./create-new-app.sh "My App" my-app-v2
```

### Issue: Claude API returns empty component

**Cause:** Might be rate limit or auth error

**Solution:**
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Verify it's set correctly:
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 10, "messages": [{"role": "user", "content": "hi"}]}'
```

### Issue: Database read/write errors

**Cause:** File permissions or running multiple processes

**Solution:**
```bash
# Check file permissions
ls -la backend/db.json

# Should be readable/writable by your user
chmod 664 backend/db.json

# Ensure only one process writes to db.json at a time
pkill -f "npm run dev"
npm run dev:full
```

### Issue: Frontend can't find app

**Cause:** App slug doesn't match database entry

**Solution:**
```bash
# Check database has the app
curl http://localhost:3000/api/apps/slug/your-app-slug

# Should return app data. If 404, the app doesn't exist.
# Create it:
./create-new-app.sh "Your App" your-app-slug
```

### Issue: AI-generated component has syntax errors

**Cause:** Claude API response sometimes has formatting issues

**Solution:**
```bash
# Manually fix the component in:
# frontend/src/app/[your-slug]/AppUI.tsx

# Or regenerate by running:
./ai-create-app.sh
# (Create with a new slug)
```

---

## Best Practices

### ✅ DO

- ✅ Use kebab-case for slugs: `youtube-to-blog`, `lead-scraper`
- ✅ Keep app descriptions under 100 characters
- ✅ Regularly backup `db.json`
- ✅ Use environment variables for all secrets
- ✅ Test apps locally before deploying
- ✅ Version your apps (keep old versions in database)

### ❌ DON'T

- ❌ Share `ENCRYPTION_KEY` or `ANTHROPIC_API_KEY` in code
- ❌ Use spaces in app slugs
- ❌ Delete database without backup
- ❌ Run multiple backend instances pointing to same db.json
- ❌ Commit `.env` files to git
- ❌ Change app slugs after creation (breaks URLs)

---

## Performance Considerations

### Database Size

Expected growth rates:
- **Per app:** ~1-10 KB (metadata + pages)
- **Per user:** ~500 bytes
- **1,000 apps + 100,000 users:** ~60 MB total

Current file-based approach works well for:
- Up to 100+ apps
- Up to 1M users
- 100K+ requests/day

### Migration to SQL Database

When you outgrow JSON:

```typescript
// Same service methods, different storage layer:
// Replace fs.readFile / fs.writeFile
// With MySQL client queries

// App creation would become:
async createApp(dto: CreateAppDto) {
  const result = await db.query(
    'INSERT INTO apps (name, slug, ...) VALUES (?, ?, ...)',
    [dto.name, dto.slug, ...]
  );
  return { id: result.insertId, ...dto };
}
```

The service interface stays the same - only the storage changes.

---

## Roadmap

### Completed ✅
- [x] Multi-app database schema
- [x] App CRUD operations
- [x] Automation scripts
- [x] AI component generation
- [x] Migration utilities
- [x] TypeScript types

### In Progress 🔄
- [ ] User authentication & authorization
- [ ] Stripe integration for payments
- [ ] Email notifications
- [ ] Analytics dashboard

### Coming Soon 🚀
- [ ] PostgreSQL migration guide
- [ ] Docker containerization
- [ ] Kubernetes deployment guide
- [ ] Admin dashboard
- [ ] CLI tool in npm
- [ ] Template marketplace

---

## Support & Documentation

- 📚 **Full Code Examples:** See `/examples` directory
- 🐛 **Issues:** GitHub issues
- 💬 **Discussion:** GitHub discussions
- 📧 **Contact:** support@example.com

---

**Last Updated:** February 11, 2026  
**Version:** 1.0.0
