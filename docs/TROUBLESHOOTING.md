# Troubleshooting Guide

## Table of Contents
- [Frontend: `vite` not recognized / `.bin` directory missing](#frontend-vite-not-recognized--bin-directory-missing)
- [Backend: `EADDRINUSE` port 3000 already in use](#backend-eaddrinuse-port-3000-already-in-use)
- [Starting all services](#starting-all-services)

---

## Frontend: `vite` not recognized / `.bin` directory missing

### Symptoms
- `'vite' is not recognized as an internal or external command`
- `npm run dev` fails in the frontend directory
- `node_modules/.bin/` directory does not exist
- `package-lock.json` is missing after running `npm install`
- `node_modules/vite/` exists but `node_modules/.bin/vite.cmd` does not

### Root Cause
`npm install` was being **interrupted before completion**. npm downloads all packages first, then performs a "reification" step at the end where it:
1. Creates the `node_modules/.bin/` directory with executable symlinks
2. Writes `package-lock.json`
3. Writes `node_modules/.package-lock.json`

If the install process is interrupted (e.g., by terminal polling, SIGINT, Ctrl+C, or another process interfering), the packages appear to be installed (folders exist in `node_modules/`) but **the `.bin` symlinks are never created**. This makes it look like a broken install even though 200+ packages are present.

### How to Diagnose
Check these three things:
```powershell
# 1. Does the .bin directory exist?
Test-Path "frontend\node_modules\.bin"
# Expected: True

# 2. Does the vite binary exist?
Test-Path "frontend\node_modules\.bin\vite.cmd"
# Expected: True

# 3. Does package-lock.json exist?
Test-Path "frontend\package-lock.json"
# Expected: True
```

If any of these return `False`, the install was interrupted.

### How to Fix
**Clean install with output redirected to prevent interruption:**

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install 2>&1 | Out-File "$env:TEMP\npm-install-output.txt"
echo "EXIT_CODE: $LASTEXITCODE"
```

The key fix is `| Out-File "$env:TEMP\npm-install-output.txt"` — this redirects output to a file, which prevents any terminal tool or process from polling the terminal and accidentally sending a signal that interrupts npm.

After the install completes (exit code 0), verify:
```powershell
Test-Path "frontend\node_modules\.bin\vite.cmd"  # Should be True
Test-Path "frontend\package-lock.json"            # Should be True
```

### ⚠️ WARNING: What NOT to Do

1. **DO NOT run multiple terminal commands while `npm install` is running.** Polling the terminal or sending input can send SIGINT and kill the install silently.

2. **DO NOT assume the install succeeded just because packages are in `node_modules/`.** Always check for `.bin/` and `package-lock.json`.

3. **DO NOT repeatedly run `npm install` without cleaning first.** If node_modules is in a half-installed state, npm may skip the reification step thinking everything is already done. Always delete `node_modules` AND `package-lock.json` first.

4. **DO NOT use `npx vite` as a workaround** in package.json scripts — it masks the real problem and can download a different version of vite than what's in your dependencies.

5. **DO NOT run `npm cache clean --force` expecting it to fix this.** The cache is fine — the issue is interrupted installation, not corrupted cache.

---

## Backend: `EADDRINUSE` port 3000 already in use

### Symptoms
```
Error: listen EADDRINUSE: address already in use :::3000
```

### How to Fix
Find and kill the process using port 3000:
```powershell
# Find the PID
netstat -ano | findstr ":3000"

# Kill it (replace PID_NUMBER with the actual PID)
taskkill /PID PID_NUMBER /F
```

Then restart the backend:
```powershell
cd backend
npm run start:dev
```

---

## Starting All Services

The project requires three services running simultaneously:

| Service  | Port | Command                                      |
|----------|------|----------------------------------------------|
| n8n      | 5678 | `npx n8n start` (from project root)          |
| Backend  | 3000 | `npm run start:dev` (from `backend/`)        |
| Frontend | 5173 | `npx vite` (from `frontend/`)                |

### Recommended startup order:
1. **n8n first** — the backend connects to n8n for workflow data
2. **Backend second** — the frontend makes API calls to the backend
3. **Frontend last** — depends on the backend being available

### Quick start from project root:
```powershell
# Terminal 1: Start n8n
npx n8n start

# Terminal 2: Start backend
cd backend; npm run start:dev

# Terminal 3: Start frontend
cd frontend; npx vite
```

### Verify all services:
```powershell
# Check n8n
Invoke-RestMethod -Uri "http://localhost:5678" -TimeoutSec 5

# Check backend
Invoke-RestMethod -Uri "http://localhost:3000" -TimeoutSec 5

# Check frontend
Invoke-RestMethod -Uri "http://localhost:5173" -TimeoutSec 5
```

---

## Environment Info (for reference)
- **Node.js**: v24.13.0
- **npm**: 11.6.2
- **OS**: Windows 11
- **n8n**: 2.6.4 (installed as devDependency)
- **Vite**: 5.4.21
- **Date this was documented**: February 11, 2026
