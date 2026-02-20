# Session 7 Changelog (February 20, 2026)

**Duration:** Single session
**Focus Area:** Agent Skill Workshop v2, Apify integration, PDF generation, follow-up chaining
**Status:** Complete
**Previous Session:** Session 6 (Full site preview, admin template, contact form)

---

## Summary

This session delivered a **complete rewrite of the Skill Workshop** from a flat v1 system into a **two-layer agent architecture** (Tools + Skills) with an agentic loop, plus multiple new tools and skills, rich output rendering, image persistence, PDF generation, and a follow-up chat system for chaining skill actions.

---

## Architecture: Two-Layer Agent System

### Concept
- **Tools** — Executable TypeScript/JS functions that do one specific thing (e.g., search the web, generate an image, scrape a page)
- **Skills** — Markdown system prompts that tell the AI how to think + which tools it can use (e.g., "deep-research" uses brave-search + apify-scraper)
- **Agentic Loop** — AI reasons, calls tools via OpenAI function calling, gets results, loops up to 10 iterations until it produces a final answer

### Files Created/Rewritten
- `backend/src/skills/skill.types.ts` — ToolDefinition, SkillDefinition, ToolContext (with saveImage + savePdf), SkillRunResult, all DTOs
- `backend/src/skills/skill-runner.service.ts` — ~900 lines: tool CRUD, skill CRUD, agentic loop, tool execution sandbox, builder chat, follow-up endpoint
- `backend/src/skills/skills.controller.ts` — REST API with proper route ordering (static before parameterized)
- `backend/src/skills/skills.module.ts` — NestJS module registration
- `frontend/src/components/SkillWorkshopPage.tsx` — ~830 lines: two-panel layout (sidebar + editor/output)
- `frontend/src/components/SkillBuilderChat.tsx` — AI chat that generates both tools and skills from conversation
- `frontend/src/components/SkillOutputRenderer.tsx` — Smart auto-detecting output renderer (markdown, images, JSON, tables)

---

## Backend Changes

### 1. Skill Runner Service (skill-runner.service.ts)
- **Tool CRUD** — create, list, get, update, delete tools stored in `agentTools` collection
- **Skill CRUD** — create, list, get, update, delete skills stored in `agentSkills` collection
- **Agentic Loop** — `run()` method: builds system prompt from skill markdown + user inputs, converts tools to OpenAI function calling format, loops until AI returns text or max iterations (10)
- **Tool Execution** — `new Function('params', 'ctx', wrappedCode)` sandbox with ToolContext
- **ToolContext** provides: `getCredential()`, `fetch()`, `log()`, `saveImage()`, `savePdf()`
- **Builder Chat** — AI generates tool-json and skill-json blocks from conversation, includes existing tools list and stored API key names in context
- **Follow-up Endpoint** — `followUp()` takes previous output + user message, has access to ALL tools, enables chaining actions
- **Seed Data** — `onModuleInit()` seeds `brave-search` tool and `web-research` skill on first run
- **AI Routing** — OpenRouter first (cheapest), fallback to OpenAI, model gpt-4o-mini, 4000 max_tokens

### 2. ToolContext: saveImage (skill-runner.service.ts)
- Downloads remote images via axios with `responseType: 'arraybuffer'`
- Saves to `backend/public/skill-images/` directory
- Returns permanent local URL `/skill-images/filename.png`
- Solves DALL-E temporary signed URL expiry (~1 hour)

### 3. ToolContext: savePdf (skill-runner.service.ts)
- Uses `pdfkit` library for PDF generation
- Renders markdown to styled A4 PDF: headers (H1-H4 with accent colors), bullet/numbered lists, blockquotes, tables, horizontal rules
- Title header with gradient accent line
- Page numbers and generation date in footers
- Saves to `backend/public/skill-pdfs/`
- Returns permanent local URL `/skill-pdfs/filename.pdf`

### 4. Follow-Up System (skill-runner.service.ts + skills.controller.ts)
- **New endpoint:** `POST /api/skills/follow-up`
- Takes `{ previousOutput, message, previousSkillId? }`
- Has access to ALL tools (not limited to original skill's tools)
- Same agentic loop as `run()` but with previous output as context
- Enables: "save as PDF", "generate a header image", "summarize for LinkedIn", etc.

### 5. Skills Controller Route Ordering (skills.controller.ts)
- Static routes (`/tools`, `/runs/all`, `/builder/chat`, `/follow-up`) placed BEFORE parameterized `:id` routes
- Prevents NestJS from matching "tools" as a skill ID

### 6. Dependencies Added
- `pdfkit` + `@types/pdfkit` — PDF generation
- `react-markdown` + `remark-gfm` — Markdown rendering (frontend)

---

## Frontend Changes

### 1. Skill Workshop Page (SkillWorkshopPage.tsx)
- **Two-panel layout** — Left sidebar with Skills section + Tools section (both with add buttons)
- **Skill Editor** — name, description, tool selector (multi-select), markdown prompt editor, inputs param editor, credentials
- **Tool Editor** — name, description, parameters editor, code editor
- **Output Panel** — Run button + input fields + 3 tabs (Output, Logs, Tool Calls)
- **Follow-up Chat Box** — Appears below output after a skill run, text input + send button, chains actions on previous output

### 2. Skill Builder Chat (SkillBuilderChat.tsx)
- Floating chat panel for conversational tool+skill creation
- Handles both `tool-json` and `skill-json` blocks from AI
- Shows separate cards for generated tools (secondary color) and skills (success color)
- "Save & Load into Workshop" button creates both and selects the new skill

### 3. Skill Output Renderer (SkillOutputRenderer.tsx)
- Auto-detects output format: markdown, JSON, HTML, plain text
- Preprocesses raw image URLs into markdown syntax
- Renders via ReactMarkdown with remark-gfm
- Dark theme styling for all elements (h1-h4, links, code, tables, blockquotes, images)
- Resolves relative paths (`/skill-images/...`, `/skill-pdfs/...`) to full backend URLs
- Image error handling with fallback text

### 4. Settings Page Fix (SettingsPage.tsx)
- **Bug:** Apify and Stripe cards used `'********'` for Test/Delete button visibility check, but load function sets saved keys to `'--------'`
- **Fix:** Changed both to `'--------'` to match all other integration cards

---

## Tools Created (4 total)

| Tool | ID | Description |
|------|-----|-------------|
| **brave-search** | Seeded on init | Search the web via Brave Search API, returns titles/URLs/descriptions |
| **generate-image** | Created via API | Generate images using OpenAI DALL-E 3, saves locally via `ctx.saveImage()` |
| **apify-scraper** | Created via API | Scrape webpage content using Apify Website Content Crawler (cheerio mode), polls for completion, returns extracted text |
| **generate-pdf** | Created via API | Convert markdown/text to styled PDF via `ctx.savePdf()`, returns download URL |

---

## Skills Created (6 total)

| Skill | Tools Used | Description |
|-------|-----------|-------------|
| **web-research** | brave-search | Basic web research — search and synthesize findings |
| **image-creator** | generate-image | Generate images from text descriptions via DALL-E 3 |
| **content-writer** | brave-search, generate-image | Write content with research + generate a header image |
| **llm-content-writer** | brave-search, generate-image | Write LLM-optimized content with 13 mandatory sections for AI search engine visibility |
| **deep-research** | brave-search, apify-scraper | 5-step research: search → evaluate sources → scrape full content → analyze → write structured report with citations |
| **content-ideator** | brave-search, apify-scraper | Research trending topics + competitor content → generate 10-15 data-backed content ideas with titles, angles, keywords, format suggestions |

---

## API Endpoints Added

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/skills/tools` | List all tools |
| POST | `/api/skills/tools` | Create tool |
| GET | `/api/skills/tools/:id` | Get tool |
| PUT | `/api/skills/tools/:id` | Update tool |
| DELETE | `/api/skills/tools/:id` | Delete tool |
| GET | `/api/skills/runs/all` | All run history |
| POST | `/api/skills/builder/chat` | AI builder chat |
| POST | `/api/skills/follow-up` | Follow-up on previous output |
| GET | `/api/skills` | List all skills |
| POST | `/api/skills` | Create skill |
| GET | `/api/skills/:id` | Get skill |
| PUT | `/api/skills/:id` | Update skill |
| DELETE | `/api/skills/:id` | Delete skill |
| POST | `/api/skills/:id/run` | Run a skill (agentic loop) |
| GET | `/api/skills/:id/runs` | Run history for a skill |

---

## Database Collections Added (db.json)

| Collection | Purpose |
|------------|---------|
| `agentTools` | Tool definitions (name, description, parameters, code) |
| `agentSkills` | Skill definitions (name, description, prompt, tools, inputs, credentials) |
| `skillRuns` | Execution history (output, logs, tool calls, duration) |

---

## Bug Fixes

1. **DALL-E image expiry** — Temporary signed URLs expire after ~1 hour. Added `ctx.saveImage()` to download and save locally.
2. **Settings page: Apify key not saving** — `'********'` vs `'--------'` mismatch in Test/Delete button visibility check. Fixed to use `'--------'`.
3. **Settings page: Stripe key not saving** — Same `'********'` vs `'--------'` mismatch. Fixed.
4. **JSX fragment nesting** — Follow-up chat block needed `<>...</>` fragment wrapper for multiple children in conditional expression.

---

## Static File Serving

| Directory | URL Path | Purpose |
|-----------|----------|---------|
| `backend/public/skill-images/` | `/skill-images/` | Permanently saved generated images |
| `backend/public/skill-pdfs/` | `/skill-pdfs/` | Generated PDF documents |
| `backend/public/blog-images/` | `/blog-images/` | Blog post images (existing) |
