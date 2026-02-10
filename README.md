# n8n Custom Interface

A complete project scaffold for building a custom n8n settings interface with encrypted credential storage.

## Project Structure

```
n8n-custom-ui/
├── backend/
│   ├── src/
│   │   ├── main.ts              # Backend entry point
│   │   ├── app.module.ts        # Main app module
│   │   └── settings/            # Settings module
│   │       ├── settings.controller.ts
│   │       ├── settings.service.ts
│   │       └── settings.module.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Frontend entry point
│   │   ├── App.tsx              # Main app component
│   │   └── components/
│   │       └── SettingsPage.tsx # Settings form
│   └── package.json
└── package.json                 # Root package for monorepo
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
npm run dev
```

This will start:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

### Test It Out

1. Open http://localhost:5173 in your browser
2. Enter your n8n instance details:
   - **n8n Instance URL**: e.g., `https://your-instance.app.n8n.cloud`
   - **n8n API Key**: Get this from Settings → API in your n8n instance
3. Click **Save Settings** - Your API key will be encrypted
4. Click **Test Connection** to verify the connection works

## API Endpoints

### GET `/api/settings/load`
Load existing settings (returns URL only, not the API key)

### POST `/api/settings/save`
Save n8n settings with encrypted API key
```json
{
  "n8nUrl": "https://your-instance.app.n8n.cloud",
  "n8nApiKey": "your-api-key"
}
```

### GET `/api/settings/test-connection`
Test the connection to n8n using saved credentials

## Features

✅ NestJS backend with settings management
✅ React + TypeScript frontend with Material-UI
✅ Encrypted credential storage using AES-256
✅ CORS configured for local development
✅ Settings persistence with JSON storage
✅ Test connection functionality

## Troubleshooting

### Port already in use?

**Backend (3000)**: Edit `backend/src/main.ts`
```typescript
const port = process.env.PORT || 3000; // Change 3000 to another port
```

**Frontend (5173)**: Edit `frontend/vite.config.ts`
```typescript
server: {
  port: 5173, // Change to another port
}
```

### Can't connect to n8n?
- Make sure your n8n instance is running
- Check that the API key is correct
- Verify the URL format includes `http://` or `https://`

### Dependencies not installing?
- Make sure you have Node.js 18+ installed
- Try deleting `node_modules` and `package-lock.json` and running `npm install` again

## Next Steps

1. **Add "Test Connection" Button**: Already implemented!
2. **List n8n Workflows**: Create a `/api/workflows` endpoint
3. **Add UI Pages**: Dashboard, Workflow Manager, etc.
4. **Add AI Chatbot**: Integrate OpenAI API for dynamic page generation

## Environment Variables

Create a `.env` file in the root to customize:

```
PORT=3000
ENCRYPTION_KEY=your-secret-key-change-in-production
FRONTEND_PORT=5173
```

## Build for Production

```bash
npm run build
```

This creates optimized builds in:
- `backend/dist/`
- `frontend/dist/`

## License

MIT
