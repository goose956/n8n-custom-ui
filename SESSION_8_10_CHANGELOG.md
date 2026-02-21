# Session 8–10 Changelog

**Date:** February 20–21, 2026
**Focus:** Skills Expansion — Clean Architecture, 15 New Tools, 31 New Skills

---

## Session 8 — Clean Architecture Refactor

### Architecture Overhaul
- **Single entry point**: `buildPromptForTask()` replaces ad-hoc prompt assembly
- **3-layer prompt pipeline**: Planner → Assembler → Tool Filter
  - Planner picks capabilities from the task description
  - Assembler concatenates orchestrator + capability prompt fragments
  - Tool Filter collects only the tools needed for selected capabilities
- **Both `run()` and `runChat()` now use ONE `generateText()` call** — no multi-phase splitting
- **Centralised types** in `skill.types.ts` — `CAPABILITY_REGISTRY`, `TOOL_TO_CAPABILITY`, `SKILL_ARCHETYPE`
- **New files created:**
  - `prompt-builder.service.ts` — `buildPromptForTask()`, `planCapabilities()`, `buildSystemPrompt()`, `getRequiredTools()`
  - `artifact-registry.ts` — tracks tool outputs, fixes mangled AI references, assembles final output

### Bug Fixes
- **PDF URL demangling** — ArtifactRegistry handles ANY URI scheme (`sandbox:`, `file:///`, `https://`) that AI invents
- **Image embedding in PDFs** — PDFKit `doc.image()` with URL demangling preprocessor in `savePdf()`
- **Translation overwriting** — Updated `translate.md` prompt with "Preserve Both Versions"

---

## Session 9 — Skills Batch 2 (11 AI-Powered Skills)

Added 11 new skills that work with existing tools:

| # | Skill | Description |
|---|-------|-------------|
| 1 | `data-enrichment` | Firmographic/demographic data from web research |
| 2 | `template-filler` | {{placeholder}} replacement, batch mode |
| 3 | `calculation-engine` | Financial, statistical, unit conversion |
| 4 | `compliance-checker` | GDPR, HIPAA, SOC2, PCI-DSS, ADA, ISO27001 |
| 5 | `document-comparator` | Side-by-side diff with severity ratings |
| 6 | `knowledge-qa` | Web research + cited answers |
| 7 | `price-comparator` | Comparison tables with recommendations |
| 8 | `proposal-generator` | Professional proposals with scope/pricing/terms |
| 9 | `html-page-generator` | Responsive landing pages, portfolios, email templates |
| 10 | `content-calendar` | Monthly content calendars with platform-specific posts |
| 11 | `deduplication-engine` | Fuzzy matching, confidence scores |

---

## Session 10 — New Tools + Skills Batch 3

### New ToolContext Methods (4)
Added to `buildToolContext()` in `skill-runner.service.ts`:

| Method | Package | Purpose |
|--------|---------|---------|
| `ctx.generateExcel(data, filename)` | ExcelJS | Multi-sheet workbooks with auto column widths |
| `ctx.sendEmail(to, subject, body, opts)` | Nodemailer | SMTP email delivery |
| `ctx.generateQR(text, opts)` | qrcode | QR code PNG generation |
| `ctx.createZip(files, filename)` | archiver | ZIP archive creation |

### New npm Packages
- `exceljs` — Excel spreadsheet generation
- `nodemailer` + `@types/nodemailer` — SMTP email sending
- `qrcode` + `@types/qrcode` — QR code generation
- `archiver` + `@types/archiver` — ZIP archive creation

### New Tools (8 added to db.json — total: 15)

| Tool | Purpose | ctx Method |
|------|---------|-----------|
| `generate-excel` | Create .xlsx from structured JSON data | `ctx.generateExcel()` |
| `generate-qr` | Generate QR code PNG images | `ctx.generateQR()` |
| `create-zip` | Bundle files into downloadable ZIP | `ctx.createZip()` |
| `text-to-speech` | OpenAI TTS API → MP3 audio files | `ctx.fetch()` + `ctx.saveFile()` |
| `generate-html-page` | Save HTML as downloadable .html file | `ctx.saveFile()` |
| `generate-vcard` | Generate vCard .vcf contact files | `ctx.saveFile()` |
| `generate-csv` | (pre-existing) Raw CSV file output | `ctx.saveFile()` |
| `send-email` | (pre-existing) Email via Resend API | `ctx.fetch()` |

### New Skills (9 added — total: 31)

| Skill | Tools Used | Category |
|-------|-----------|----------|
| `excel-report-generator` | brave-search, generate-excel, generate-pdf | Output |
| `email-composer` | brave-search, send-email, generate-pdf | Output |
| `qr-code-generator` | generate-qr, generate-vcard, generate-pdf | Output |
| `text-to-speech` | text-to-speech | Output |
| `archive-creator` | create-zip, generate-html-page, generate-csv, generate-vcard | Output |
| `contact-card-generator` | generate-vcard, generate-qr, create-zip, generate-pdf | Output |
| `dashboard-generator` | brave-search, apify-scraper, generate-html-page, generate-excel, generate-pdf | Output |
| `social-media-pack` | brave-search, generate-image, generate-pdf, generate-csv | Output |
| `data-validator` | generate-pdf, generate-csv, generate-excel | Processing |

### Capability Registry Updates
New capabilities added to `CAPABILITY_REGISTRY`:
- `render-excel` — Excel spreadsheet output
- `render-tts` — Text-to-speech audio output
- `render-vcard` — vCard contact file output
- `render-zip` — ZIP archive output

New prompt files created:
- `generate-excel.md`, `generate-tts.md`, `generate-vcard.md`, `generate-zip.md`

### Catalogue Progress
- **29/50 skills built** (was 20/50)
- Input: 1/8 | Processing: 17/19 | Output: 11/15

---

## Files Changed

### New Files
- `backend/src/skills/artifact-registry.ts`
- `backend/src/skills/prompt-builder.service.ts`
- `backend/src/skills/prompts/generate-excel.md`
- `backend/src/skills/prompts/generate-tts.md`
- `backend/src/skills/prompts/generate-vcard.md`
- `backend/src/skills/prompts/generate-zip.md`
- `backend/src/skills/prompts/` (22 capability prompt files total)
- `frontend/src/components/AgentChatPanel.tsx`
- `SKILLS_CATALOGUE_TRACKER.md`

### Modified Files
- `backend/src/skills/skill-runner.service.ts` — 4 new ctx methods, updated imports, MAX_CALLS_PER_TOOL
- `backend/src/skills/skill.types.ts` — ToolContext interface, CAPABILITY_REGISTRY, TOOL_TO_CAPABILITY, SKILL_ARCHETYPE
- `backend/src/skills/skills.controller.ts` — Chat endpoint
- `backend/src/skills/skills.module.ts` — Module providers
- `backend/package.json` — New dependencies (exceljs, nodemailer, qrcode, archiver)
- `backend/db.json` — 15 tools, 31 skills
- `frontend/src/components/SkillWorkshopPage.tsx` — Chat panel, output rendering
- `PROJECT_STATUS.md` — Updated documentation
