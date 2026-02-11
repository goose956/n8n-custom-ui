# Next Steps - Frontend Integration Guide

**Current Status:** Backend 100% complete, ready for frontend integration  
**Goal:** Make the SaaS Factory platform live and functional end-to-end  
**Time to Complete:** 2-4 hours for core features

---

## Step 1: Test Backend API (15 minutes)

Before building frontend, verify backend is working:

```bash
# 1. Terminal 1: Start backend
cd backend
npm run dev

# 2. Terminal 2: Test APIs
# List all apps
curl http://localhost:3000/api/apps

# Expected response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "name": "n8n Surface",
#       "slug": "n8n-surface",
#       "description": "n8n workflow management",
#       ...
#     }
#   ],
#   "timestamp": "2026-02-11T14:30:00Z"
# }

# Get app by slug
curl http://localhost:3000/api/apps/slug/n8n-surface

# Create new app
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "slug": "test-app",
    "description": "Testing",
    "primary_color": "#3498db"
  }'
```

**✅ Success Criteria:**
- GET /api/apps returns status 200
- Response contains at least one app
- GET /api/apps/slug/n8n-surface works
- POST /api/apps creates new app

---

## Step 2: Run Database Migration (5 minutes)

Migrate existing db.json to multi-app schema:

```bash
# 1. Backup current db.json manually
cp backend/db.json backend/db.json.original

# 2. Run migration
cd backend
npx ts-node src/migrations/migrate-to-saas-factory.ts

# 3. Check results
ls -la db*.json
# Should see: db.json and db-backup-2026-02-11.json

# 4. Verify structure
cat db.json | head -50
# Should see "apps", "pages", "plans", "users", etc.
```

**✅ Success Criteria:**
- Migration completes without errors
- db-backup-DATE.json created
- db.json has new structure with "apps" key
- "n8n-surface" app exists in apps array

---

## Step 3: Create Frontend Dynamic Route (30 minutes)

Create the main [app_slug] route that serves all apps:

### File: `frontend/src/app/[app_slug]/page.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { App } from '@/types/saas-factory';

export default function AppPage() {
  const params = useParams();
  const slug = params.app_slug as string;
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApp();
  }, [slug]);

  const fetchApp = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/apps/slug/${slug}`
      );
      
      if (!response.ok) {
        throw new Error(`App not found: ${slug}`);
      }
      
      const result = await response.json();
      setApp(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading app');
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading app...</h1>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>❌ App Not Found</h1>
        <p>{error}</p>
        <p>Try creating an app with: ./scripts/create-new-app.sh</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      borderTop: `4px solid ${app.primary_color || '#3498db'}`
    }}>
      <h1>{app.name}</h1>
      <p>{app.description}</p>
      
      {app.logo_url && (
        <img 
          src={app.logo_url} 
          alt={app.name}
          style={{ maxWidth: '200px', marginBottom: '1rem' }}
        />
      )}

      {/* TODO: Render page templates based on page_type */}
      {/* <IndexPage app={app} pages={app.pages} /> */}
    </div>
  );
}
```

**✅ Success Criteria:**
- File created at `frontend/src/app/[app_slug]/page.tsx`
- Compiles without TypeScript errors
- Running frontend, `/n8n-surface` displays app name and description
- `/invalid-slug` shows error message

---

## Step 4: Create API Client Utility (20 minutes)

Create typed API helper functions:

### File: `frontend/src/lib/api.ts`

```typescript
import { App, Page, Plan } from '@/types/saas-factory';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const api = {
  // Apps
  async getAllApps(): Promise<App[]> {
    const res = await fetch(`${API_BASE}/api/apps`);
    const data: ApiResponse<App[]> = await res.json();
    return data.data;
  },

  async getApp(slug: string): Promise<App> {
    const res = await fetch(`${API_BASE}/api/apps/slug/${slug}`);
    if (!res.ok) throw new Error(`App not found: ${slug}`);
    const data: ApiResponse<App> = await res.json();
    return data.data;
  },

  async getAppById(id: number): Promise<App> {
    const res = await fetch(`${API_BASE}/api/apps/${id}`);
    if (!res.ok) throw new Error(`App not found: ${id}`);
    const data: ApiResponse<App> = await res.json();
    return data.data;
  },

  async createApp(dto: {
    name: string;
    slug: string;
    description?: string;
    primary_color?: string;
  }): Promise<App> {
    const res = await fetch(`${API_BASE}/api/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create app');
    const data: ApiResponse<App> = await res.json();
    return data.data;
  },

  async updateApp(
    id: number,
    dto: Partial<App>
  ): Promise<App> {
    const res = await fetch(`${API_BASE}/api/apps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update app');
    const data: ApiResponse<App> = await res.json();
    return data.data;
  },

  async deleteApp(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/apps/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete app');
  },

  async getAppStats(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/apps/${id}/stats`);
    const data: ApiResponse<any> = await res.json();
    return data.data;
  },

  async cloneApp(sourceId: number, newDto: any): Promise<App> {
    const res = await fetch(`${API_BASE}/api/apps/${sourceId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDto),
    });
    if (!res.ok) throw new Error('Failed to clone app');
    const data: ApiResponse<App> = await res.json();
    return data.data;
  },
};
```

**✅ Success Criteria:**
- File created at `frontend/src/lib/api.ts`
- No TypeScript errors
- All functions properly typed with interfaces

---

## Step 5: Create Type Definitions (10 minutes)

Create TypeScript types for frontend to use backend types:

### File: `frontend/src/types/saas-factory.ts`

```typescript
// Copy from backend/src/types/saas-factory.types.ts

export interface App {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  n8n_workflow_id?: string;
  version: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  pages?: Page[];
  plans?: Plan[];
  settings?: Record<string, any>;
}

export interface Page {
  id: number;
  app_id: number;
  page_type: 'index' | 'thanks' | 'members' | 'checkout' | 'admin' | 'custom';
  title: string;
  content_json: Record<string, any>;
  custom_css?: string;
  custom_component_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  app_id: number;
  name: string;
  price: number;
  billing_period: 'monthly' | 'yearly' | 'one-time';
  features_json: Record<string, any>;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  app_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'past_due' | 'free';
  stripe_subscription_id?: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}
```

**✅ Success Criteria:**
- Types file created
- All interfaces available for use in components
- No conflicts with existing types

---

## Step 6: Create Index Page Template (30 minutes)

Create reusable template for rendering index pages:

### File: `frontend/src/components/templates/IndexPageTemplate.tsx`

```typescript
'use client';

import { App } from '@/types/saas-factory';

interface IndexPageTemplateProps {
  app: App;
}

export function IndexPageTemplate({ app }: IndexPageTemplateProps) {
  // Get the index page from app.pages
  const indexPage = app.pages?.find(p => p.page_type === 'index');
  
  if (!indexPage) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No index page configured</p>
      </div>
    );
  }

  const { content_json, custom_css } = indexPage;
  const { headline, subheading, cta_text, cta_url, features } = content_json;

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: '2rem',
    }}>
      <style>{custom_css}</style>

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 0',
        borderBottom: `1px solid #eee`,
      }}>
        {app.logo_url && (
          <img 
            src={app.logo_url} 
            alt={app.name}
            style={{ 
              maxWidth: '150px', 
              marginBottom: '1rem',
              maxHeight: '100px',
            }}
          />
        )}
        
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          color: app.primary_color || '#333',
        }}>
          {headline || app.name}
        </h1>

        {subheading && (
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '2rem',
          }}>
            {subheading}
          </p>
        )}

        {cta_text && cta_url && (
          <button
            onClick={() => window.location.href = cta_url}
            style={{
              backgroundColor: app.primary_color || '#3498db',
              color: 'white',
              padding: '12px 32px',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {cta_text}
          </button>
        )}
      </section>

      {/* Features Section */}
      {features && Array.isArray(features) && (
        <section style={{
          padding: '3rem 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
        }}>
          {features.map((feature: any, idx: number) => (
            <div key={idx} style={{
              padding: '1.5rem',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px',
              borderLeft: `4px solid ${app.primary_color || '#3498db'}`,
            }}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
```

**✅ Success Criteria:**
- Component created and compiles
- Renders app name, description, logo
- Shows features if provided in content_json
- CTA button navigates correctly

---

## Step 7: Update Main Page to Use Template (15 minutes)

Update the [app_slug]/page.tsx to use template:

### Update: `frontend/src/app/[app_slug]/page.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { App } from '@/types/saas-factory';
import { api } from '@/lib/api';
import { IndexPageTemplate } from '@/components/templates/IndexPageTemplate';

export default function AppPage() {
  const params = useParams();
  const slug = params.app_slug as string;
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApp();
  }, [slug]);

  const fetchApp = async () => {
    try {
      setLoading(true);
      const appData = await api.getApp(slug);
      setApp(appData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading app');
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !app) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>❌ App Not Found</h1>
        <p>{error}</p>
      </div>
    );
  }

  return <IndexPageTemplate app={app} />;
}
```

**✅ Success Criteria:**
- Page still compiles without errors
- Uses api.getApp instead of direct fetch
- Renders IndexPageTemplate correctly

---

## Step 8: Test End-to-End (30 minutes)

Run full system and test everything works:

```bash
# 1. Terminal 1: Backend
cd backend
npm run dev

# 2. Terminal 2: Frontend
cd frontend
npm run dev

# 3. Terminal 3: n8n (optional, but good to have)
cd .. && npm run dev:n8n

# 4. Browser: Test routes
# http://localhost:5173/n8n-surface
# Should show app with logo, name, description

# 5. Create new app
./scripts/create-new-app.sh "YouTube to Blog" youtube-to-blog

# 6. Browser: Test new app
# http://localhost:5173/youtube-to-blog
# Should render the newly created app

# 7. Test invalid URL
# http://localhost:5173/invalid-slug
# Should show "App Not Found" error

# 8. API Tests
curl http://localhost:3000/api/apps
curl http://localhost:3000/api/apps/slug/youtube-to-blog
```

**✅ Success Criteria:**
- Frontend starts without errors
- /n8n-surface loads and renders
- /youtube-to-blog loads after creation
- /invalid-slug shows error
- Backend API responds correctly

---

## Step 9: Create Additional Templates (60 minutes - Optional)

Once basic routing works, create more page templates:

### File: `frontend/src/components/templates/CheckoutPageTemplate.tsx`
- Display plans in a grid or table
- Integration point for Stripe
- Plan selection UI

### File: `frontend/src/components/templates/ThanksPageTemplate.tsx`
- Thank you message
- Next steps instruction
- Download/email trigger (future)

### File: `frontend/src/components/templates/MembersPageTemplate.tsx`
- User dashboard
- Subscription status
- Account settings

### File: `frontend/src/components/templates/AdminPageTemplate.tsx`
- App statistics
- Revenue chart
- User list
- Settings

---

## Step 10: Production Deployment (30 minutes - When Ready)

When ready to deploy:

```bash
# 1. Build backend
cd backend && npm run build

# 2. Build frontend
cd frontend && npm run build

# 3. Deploy backend to Railway/Heroku/self-hosted
# Deploy dist/ folder (compiled NestJS)
# Set environment variables (DATABASE_URL, etc.)

# 4. Deploy frontend to Vercel/Netlify/self-hosted
# Deploy dist/ folder (built Vite app)
# Set API_URL environment variable

# 5. Run migration on production
# npx ts-node migrations/migrate-to-saas-factory.ts

# 6. Test production URLs
# https://yourdomain.com/n8n-surface
# https://yourdomain.com/youtube-to-blog
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "App not found" | Ensure migration was run and backend is serving apps |
| 404 on app URL | Check slug matches exactly (case-sensitive lowercase) |
| API CORS error | Backend CORS must allow frontend origin |
| TypeScript errors | Run `npm install` to ensure all dependencies installed |
| Port already in use | Kill old process or change ports in npm scripts |

---

## Summary: What You Get After These Steps

✅ **Fully Functional Multi-App SaaS:**
- Each app has its own URL (`/app-name`)
- All apps share backend infrastructure
- Can create new apps in 5 seconds
- Can create AI-powered apps in 30 seconds
- Apps are logically isolated but share code

✅ **Ready for:**
- User authentication (next phase)
- Stripe payments (phase after that)
- Email notifications
- Analytics

✅ **Production Ready:**
- Can deploy to Vercel (frontend) + Railway (backend)
- Database migration path to PostgreSQL
- Monitoring and error tracking hookups

---

**Estimated Time to Completion:** 2-4 hours  
**Next Command to Run:** `npm run dev:full` in backend terminal first

Good luck! 🚀
