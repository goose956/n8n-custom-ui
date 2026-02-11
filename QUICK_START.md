# SaaS Factory - Quick Start Guide

Get your multi-app SaaS system up and running in 5 minutes.

## Pre-requisites

- Node.js 18+ installed
- npm or yarn
- MySQL or PostgreSQL (optional - uses JSON by default)

## Installation

```bash
# 1. Clone or navigate to your project
cd "n8n surface"

# 2. Install all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## 1. Migrate Your Database (One-Time Setup)

Convert your existing db.json to multi-app structure:

```bash
# This will:
# - Backup your current db.json
# - Transform to multi-app schema
# - Migrate existing data to "n8n-surface" app
cd backend
npx ts-node src/migrations/migrate-to-saas-factory.ts
cd ..
```

Output:
```
✨ Migration complete!
   Created 1 app (n8n-surface)
   Created 4 pages
   Backup: db-backup-2026-02-11.json
```

## 2. Start Development Server

```bash
npm run dev:full

# Starts:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - n8n: http://localhost:5678
```

## 3. Create Your First New App

### Option A: Quick Creation (≈ 5 seconds)

```bash
./scripts/create-new-app.sh "YouTube to Blog" youtube-to-blog
```

The app is now live at: `http://localhost:5173/youtube-to-blog`

### Option B: AI-Powered Generation (≈ 30 seconds)

First, set your Claude API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then:
```bash
./scripts/ai-create-app.sh

# Interactive prompts:
# What app do you want to build?
# > A tool that converts YouTube videos to blog posts
#
# What should users input?
# > A YouTube URL
#
# What should the app output?
# > A blog post with title and content
```

The AI generates a complete React component and creates the app.

Access at: `http://localhost:5173/youtube-to-blog`

## 4. Access API Endpoints

View all your apps:
```bash
curl http://localhost:3000/api/apps

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "name": "n8n Surface",
#       "slug": "n8n-surface",
#       "created_at": "2026-02-10T00:00:00Z"
#     },
#     {
#       "id": 2,
#       "name": "YouTube to Blog",
#       "slug": "youtube-to-blog",
#       "created_at": "2026-02-11T10:00:00Z"
#     }
#   ]
# }
```

Get a specific app:
```bash
curl http://localhost:3000/api/apps/slug/youtube-to-blog
```

## 5. Creating Multiple Apps

Create as many apps as you want:

```bash
# App 1
./scripts/create-new-app.sh "AI Image Generator" ai-image-generator

# App 2
./scripts/create-new-app.sh "Lead Scraper" lead-scraper

# App 3
./scripts/create-new-app.sh "Content Repurposer" content-repurposer

# ... and so on
```

Each app:
- ✅ Gets its own URL: `localhost:5173/{app-slug}`
- ✅ Has default pages (index, thanks, members, checkout, admin)
- ✅ Has pricing plans (Free, Pro)
- ✅ Can be customized independently
- ✅ Uses the same database and backend

## 6. Customizing Apps

### Change App Branding

```bash
curl -X PUT http://localhost:3000/api/apps/2 \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#FF6B6B",
    "logo_url": "https://example.com/logo.png"
  }'
```

### Update a Page

```bash
curl -X PUT http://localhost:3000/api/apps/2/pages/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome to YouTube to Blog",
    "content_json": {
      "headline": "Convert Videos to Amazing Posts",
      "subheading": "Powered by AI"
    }
  }'
```

### Add a Pricing Plan

```bash
curl -X POST http://localhost:3000/api/apps/2/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise",
    "price": 499,
    "billing_period": "monthly",
    "features_json": {
      "videos_per_month": "unlimited",
      "priority_support": true
    }
  }'
```

## Database Structure

### File-Based (Default)
```
backend/
├── db.json                    # Your multi-app database
├── db-backup-2026-02-11.json # Automatic backups
└── ...
```

### Apps Table Content
```json
{
  "apps": [
    {
      "id": 1,
      "name": "n8n Surface",
      "slug": "n8n-surface",
      "primary_color": "#3498db",
      ...
    },
    {
      "id": 2,
      "name": "YouTube to Blog",
      "slug": "youtube-to-blog",
      "primary_color": "#3498db",
      ...
    }
  ],
  "pages": [ /* pages per app */ ],
  "plans": [ /* pricing plans */ ],
  "users": [ /* user database */ ],
  "subscriptions": [ /* user subscriptions */ ],
  "app_settings": [ /* per-app settings */ ],
  ...
}
```

## Directory Structure

```
n8n surface/
├── backend/
│   ├── src/
│   │   ├── apps/              # New: Multi-app management
│   │   │   ├── apps.service.ts
│   │   │   ├── apps.controller.ts
│   │   │   └── apps.module.ts
│   │   ├── migrations/        # Database migrations
│   │   ├── types/            # TypeScript types
│   │   ├── settings/         # Existing n8n settings
│   │   ├── workflows/        # Existing workflows
│   │   └── app.module.ts     # Import AppsModule here
│   └── db.json              # Multi-app database
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── [app_slug]/   # Dynamic route for each app
│   │   │       ├── page.tsx
│   │   │       └── AppUI.tsx (AI-generated component)
│   │   ├── components/
│   │   │   ├── templates/    # Reusable page templates
│   │   │   └── ui/
│   │   └── lib/
│   │       └── api.ts        # Fetch app data from backend
│   └── vite.config.ts
│
├── docs/
│   ├── SAAS_FACTORY.md       # Complete documentation
│   └── QUICK_START.md        # This file
│
└── scripts/
    ├── create-new-app.sh     # Create app (5 seconds)
    └── ai-create-app.sh      # AI generate app (30 seconds)
```

## Common Commands

```bash
# Development
npm run dev:full        # Start everything
npm run dev:backend     # Just backend
npm run dev:frontend    # Just frontend
npm run dev:n8n        # Just n8n

# Building
cd backend && npm run build        # Build backend
cd frontend && npm run build       # Build frontend

# Creating apps
./scripts/create-new-app.sh "Name" app-slug
./scripts/ai-create-app.sh

# Backup database
cp backend/db.json backend/db-backup-manual.json

# Restore database
cp backend/db-backup-2026-02-11.json backend/db.json
npm run dev:backend    # Will reload
```

## API Reference

### Apps Management

```
GET    /api/apps                          # List all apps
GET    /api/apps/:id                      # Get app by ID
GET    /api/apps/slug/:slug               # Get app by slug
POST   /api/apps                          # Create new app
PUT    /api/apps/:id                      # Update app
DELETE /api/apps/:id                      # Delete app (and all data)
GET    /api/apps/:id/stats                # Get app statistics
POST   /api/apps/:id/clone                # Clone app to new slug
```

### Example Requests

Create app:
```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "YouTube to Blog",
    "slug": "youtube-to-blog",
    "description": "Convert YouTube videos to blog posts",
    "primary_color": "#3498db"
  }'
```

Get app stats:
```bash
curl http://localhost:3000/api/apps/2/stats
# Returns user count, subscriptions, revenue, etc.
```

## Troubleshooting

### Port Already In Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different ports
PORT=3001 npm run dev:backend
```

### Database Locked
```bash
# Multiple processes writing to db.json?
pkill -f "npm run dev"
npm run dev:full
```

### API Key Issues (AI Generation)
```bash
# Make sure API key is set
echo $ANTHROPIC_API_KEY

# Should return your key, not empty
# If empty:
export ANTHROPIC_API_KEY=sk-ant-your-key
./scripts/ai-create-app.sh
```

## Next Steps

1. ✅ **Understand the structure:** Read [SAAS_FACTORY.md](./docs/SAAS_FACTORY.md)
2. 🚀 **Create your first app:** `./scripts/create-new-app.sh`
3. 🤖 **Try AI generation:** `./scripts/ai-create-app.sh`
4. 🎨 **Customize pages:** Use API calls to edit content_json
5. 💳 **Add Stripe integration:** (in development)
6. 📤 **Deploy to production:** See [SAAS_FACTORY.md - Deployment](./docs/SAAS_FACTORY.md#deployment)

## Key Concepts

### Dynamic Routes
Each app gets its own URL based on slug: `/youtube-to-blog`, `/lead-scraper`, etc.

### Single Database
All apps share one `db.json` (or SQL database) but are logically separated by `app_id`.

### Reusable Components
You write a page component once (e.g., `IndexPage.tsx`) and all apps use it with different content from the database.

### AI Generation
Describe an app in natural language, Claude generates a complete React component, you get a working app in 30 seconds.

### App Cloning
Create a new app by cloning an existing one - copies structure, pages, and plans, just with a new slug.

## Example: From Zero to Live in 5 Minutes

```bash
# 1. Migrate database (30 seconds)
cd backend
npx ts-node src/migrations/migrate-to-saas-factory.ts
cd ..

# 2. Start servers (1 minute)
npm run dev:full

# 3. Create new app (5 seconds)
./scripts/create-new-app.sh "My Awesome App" my-awesome-app

# 4. LIVE!
# Frontend: http://localhost:5173/my-awesome-app
# API: http://localhost:3000/api/apps
# Admin: http://localhost:3000/admin
```

That's it! You now have a multi-app SaaS platform.

---

**For detailed information:** See [SAAS_FACTORY.md](./docs/SAAS_FACTORY.md)
