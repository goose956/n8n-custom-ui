# SaaS Factory - Multi-App n8n Platform

✅ **MVP Complete** — A fully functional multi-tenant SaaS platform for rapidly creating, managing, and scaling multiple applications with shared n8n workflow infrastructure.

### Key Features
- 🎯 **Projects Management** - Create and manage multiple SaaS applications
- 🔧 **Workflows** - View, validate, edit, and trigger n8n workflows
- 🔐 **Global API Keys** - Centralized credential management with encryption
- ⚡ **One-Click App Creation** - Automatic page and plan generation
- 🚀 **Three Services** - Backend (NestJS), Frontend (React), n8n integration

## Project Structure

```
n8n surface/
├── backend/                     # NestJS REST API (localhost:3000)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── apps/                # Multi-app management ✨ NEW
│   │   ├── settings/            # n8n connection
│   │   ├── api-keys/            # Global API key management
│   │   ├── workflows/           # Workflow management & validation
│   │   ├── types/               # TypeScript interfaces
│   │   └── health/              # Status endpoint
│   └── db.json                  # Multi-app JSON database
│
├── frontend/                    # React + Vite (localhost:5173)
│   ├── src/
│   │   ├── App.tsx              # Router + Top navigation
│   │   ├── components/
│   │   │   ├── ProjectsPage.tsx     # App management ✨ NEW
│   │   │   ├── WorkflowsPage.tsx    # Workflow manager ✨ CONSOLIDATED
│   │   │   ├── SettingsPage.tsx     # n8n + API Keys
│   │   │   └── nodeSchemas.ts
│   │   └── main.tsx
│   └── package.json
│
├── scripts/                     # Helper scripts
├── docs/                        # Documentation
├── package.json                 # Root monorepo
├── PROJECT_STATUS.md            # Detailed technical status
└── README.md                    # This file
```

## Quick Start

### Install Dependencies

From the root directory:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

### Start Development

```bash
# Start all three services (recommended)
npm run dev:full

# Or start individual services
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
npm run dev:n8n        # n8n only
```

This will start:
- **Backend**: http://localhost:3000 (NestJS API)
- **Frontend**: http://localhost:5173 (React UI)
- **n8n**: http://localhost:5678 (Workflow engine)

### Test It Out

1. **Create a Project**
   - Open http://localhost:5173
   - Go to **Projects** page (default landing)
   - Click **Create New**
   - Enter: Name, Slug (lowercase-hyphen), Description, Color
   - Click **Create** → Auto-generates pages and plans

2. **Configure n8n Connection**
   - Go to **Settings** page
   - Enter n8n URL: `http://localhost:5678`
   - Add n8n API key (get from n8n Settings → API)
   - Click **Test Connection**
   - Add any **Global API Keys** needed by workflows

3. **Manage Workflows**
   - Go to **Workflows** page
   - View all n8n workflows with validation status
   - Click **⚠ Issues** to see what needs configuration
   - Click **Edit** to configure missing fields
   - Click **Trigger** to execute with test data

---

## Main Features

### Projects Management
- **Create** new SaaS applications with custom branding
- **Edit** project metadata (name, description, color)
- **Delete** projects with automatic cleanup of related data
- **Auto-generated** default pages and payment plans

### Workflows
- **List** all n8n workflows with live status
- **Validate** workflow configurations (detect missing API keys, fields)
- **Edit** workflow parameters and save configurations
- **Trigger** workflows with custom JSON input
- **View** workflow details in n8n editor

### Settings
- **n8n Connection** - Add and test n8n instance
- **Global API Keys** - Centralized encrypted credential storage
- All sensitive data encrypted with AES-256-CBC

---

## API Endpoints

### Apps
- `GET /api/apps` - List all projects
- `POST /api/apps` - Create new project
- `GET /api/apps/:id` - Get project details
- `PUT /api/apps/:id` - Update project
- `DELETE /api/apps/:id` - Delete project

### Workflows
- `GET /api/workflows/validation` - List workflows with validation
- `GET /api/workflows/config/:id` - Get workflow configuration
- `PUT /api/workflows/config/:id` - Save workflow configuration
- `POST /api/workflows/:id/trigger` - Execute workflow

### Settings
- `GET /api/settings/load` - Load n8n settings
- `POST /api/settings/save` - Save n8n settings
- `GET /api/settings/test-connection` - Test n8n connectivity

### API Keys
- `GET /api/api-keys` - List all API keys
- `POST /api/api-keys` - Add new API key
- `DELETE /api/api-keys/:name` - Delete API key

### GET `/api/settings/test-connection`
Test the connection to n8n using saved credentials

## Complete Features

✅ **Multi-App Management** - Create, edit, delete SaaS projects
✅ **Workflow Management** - List, validate, configure, and trigger n8n workflows  
✅ **API Key Management** - Global encrypted credential storage
✅ **Workflow Validation** - Auto-detect missing API keys and fields
✅ **TypeScript** - Strict type checking in backend and frontend
✅ **NestJS Backend** - Enterprise-grade REST API architecture
✅ **React 18 Frontend** - Modern SPA with Material-UI components
✅ **AES-256 Encryption** - Secure credential storage
✅ **File-based Database** - Easy to backup and version control
✅ **Three Services** - Backend, Frontend, n8n integration

## Troubleshooting

### Backend won't start
- Check if port 3000 is available: `netstat -ano | findstr :3000`
- Verify `db.json` exists in the project root
- Check Node.js version: Requires 18+

### Frontend won't compile
- Delete `node_modules` and `package-lock.json`: `rm -r node_modules package-lock.json`
- Reinstall: `npm install`
- Clear Vite cache: `npm run dev:frontend -- --force`

### n8n connection fails
- Verify n8n is running: `http://localhost:5678`
- Check n8n API key has workflow access
- Ensure correct URL format: `http://localhost:5678`

### Workflows not loading
- Check browser console for fetch errors
- Verify backend API is responding: `http://localhost:3000/api/apps`
- Restart backend service

## Next Steps & Roadmap

**Phase 2**: Enhanced project management (dashboards, metrics)  
**Phase 3**: Advanced workflow features (history, scheduling, templates)  
**Phase 4**: Multi-tenancy & security (RBAC, audit logging)  
**Phase 5**: Infrastructure scaling (Docker, PostgreSQL)  
**Phase 6**: Frontend polish (mobile, dark mode, visual editor)

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for complete roadmap and technical details.

## Environment Variables

Create a `.env` file in the root to customize:

```
ENCRYPTION_KEY=your-secret-key-change-in-production
NODE_ENV=development
```

## Build for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend  
cd ../frontend && npm run build

# Output: backend/dist/ and frontend/dist/
```

## Learn More

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Complete technical documentation
- **[n8n Docs](https://docs.n8n.io/)** - n8n workflow engine
- **[NestJS Docs](https://docs.nestjs.com/)** - Backend framework
- **[React Docs](https://react.dev/)** - Frontend framework

## License

MIT - Feel free to use, fork, and contribute!
