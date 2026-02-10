# Getting Started - Complete Setup Guide

## What's Installed

✅ **n8n** - Automation and workflow platform (port 5678)
✅ **Backend API** - NestJS settings manager (port 3000)
✅ **Frontend UI** - React settings interface (port 5173)

## Starting Everything

### Option 1: Run Everything Together (Recommended)

```bash
npm run dev:full
```

This starts all three services in parallel:
- n8n: http://localhost:5678
- Backend API: http://localhost:3000
- Frontend UI: http://localhost:5173

### Option 2: Run Services Separately

**Terminal 1 - Start n8n:**
```bash
npx n8n start
```
Access at: http://localhost:5678

**Terminal 2 - Start Backend:**
```bash
npm run dev:backend
```
Running at: http://localhost:3000

**Terminal 3 - Start Frontend:**
```bash
npm run dev:frontend
```
Open: http://localhost:5173

## First Time Setup

### 1. Access n8n
Open http://localhost:5678 in your browser

### 2. Create Admin Account
- n8n will prompt you to set up the first admin account
- Create your username and password

### 3. Get API Key from n8n
- Go to Settings (gear icon)
- Click "API" 
- Generate a new API key
- Copy it to clipboard

### 4. Configure Your Custom Interface
Open http://localhost:5173 in another tab:
- **n8n Instance URL:** `http://localhost:5678`
- **n8n API Key:** Paste the key you copied
- Click **Save Settings**
- Click **Test Connection** to verify

## Troubleshooting

### Python Warning
If you see "Python 3 is missing..." - this is just a warning. n8n will still work fine.

### Port Already in Use?
Change ports in:
- n8n: Set `N8N_PORT=5679` before running
- Backend: Edit `backend/src/main.ts`
- Frontend: Edit `frontend/vite.config.ts`

### n8n not starting?
```bash
# Clear cache and try again
npm cache clean --force
npx n8n start
```

## Next Steps

1. ✅ Verify all three services are running
2. ✅ Create n8n admin account
3. ✅ Generate API key in n8n
4. ✅ Connect your custom UI to n8n
5. 📋 Build more pages in the UI (Workflows, Dashboard, etc.)

## Project Structure

```
n8n-custom-ui/
├── backend/           # NestJS API (port 3000)
├── frontend/          # React UI (port 5173)
├── node_modules/
│   └── n8n/          # n8n workflow engine (port 5678)
└── package.json
```

## Available npm Scripts

```bash
npm run dev              # Frontend + Backend only
npm run dev:full        # Frontend + Backend + n8n
npm run dev:n8n         # n8n only
npm run dev:backend     # Backend only
npm run dev:frontend    # Frontend only
npm run build           # Build for production
```

You're all set! 🚀
