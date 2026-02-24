# Session 11 Changelog (February 23-24, 2026)

**Duration:** 2 days
**Focus Area:** Skill shortcodes for members area, per-app documents, file attachments, workflow scheduling, model fallback
**Status:** Complete
**Previous Session:** Session 10 (Clean architecture refactor, 15 tools, 31 skills)

---

## Summary

This session delivered several major features: (1) **Skill shortcodes** — `[skill-shortcode]` tags in custom page descriptions now generate a static template page with AI chat input + results output, replacing unreliable AI-generated widget code. (2) **Per-app document separation** — file paths now use `public/apps/{appId}/`. (3) **File attachment support** in skills chat. (4) **Workflow time/day picker** for scheduled workflows. (5) **AI model auto-fallback** — `callAI()` automatically switches between Anthropic↔OpenAI when one provider's key is missing.

---

## Backend Changes

### 1. Skill Shortcode Static Template (members-templates.ts)
- **Function:** `skillShortcodeTemplate(params, pageId, pageName, pageDescription)`
- **What:** Complete static page template for `[skill-shortcode]` custom pages — zero AI tokens
- **Contains:** Hero section, SSE chat input, rich results output panel, `parseSSE()`, `RichOutput` markdown renderer
- **Auto-strips** `[skill-shortcode]` tag from displayed description
- **Auto-generates** correct PascalCase export name from page ID (e.g. `blog-poster` → `MembersBlogPosterPage`)
- **Matches** existing template pattern (uses `sharedBlock()`, `heroSx`, `cardSx`, same design tokens)

### 2. Shortcode Detection in Page Generation (programmer-agent.service.ts)
- **Where:** Page generation loop, after static template check
- **Regex:** `/\[skills?[\s-]*shortcode\]/i` — matches `[skill-shortcode]`, `[skills-shortcode]`, `[skills shortcode]`
- **Flow:** If shortcode detected in `page.description` or `request.prompt` → use `skillShortcodeTemplate()` directly, skip AI generation entirely
- **Removed:** Old `skillWidgetGuide` prompt injection that tried to make AI copy widget code verbatim (kept failing with missing imports/undefined components)

### 3. AI Model Auto-Fallback (programmer-agent.service.ts)
- **What:** `callAI()` now auto-falls back between Anthropic↔OpenAI
- **Logic:** If requested provider's API key is missing but the other provider's key exists, automatically switches
- **Example:** Request for `claude-sonnet-4` with no Anthropic key → falls back to `gpt-4o`

### 4. Planner Shortcode Awareness (programmer-agent.service.ts)
- **Where:** `planMembersArea()` prompt
- **What:** Tells the AI planner about `[skill-shortcode]` support
- **Rule:** If user mentions content generation, AI processing, blog posting, research, writing → planner includes `[skill-shortcode]` in that page's description

### 5. Per-App Document Separation
- **What:** All file paths now use `public/apps/{appId}/skill-*` for per-app isolation
- **Scope:** Skills, documents, and generated outputs scoped by app ID

### 6. File Attachment Support (skills.controller.ts)
- **Endpoint:** `POST /api/skills/chat-stream` now accepts `attachments` field
- **What:** Users can attach files when chatting with skills

### 7. Workflow Time/Day Picker
- **What:** Backend model and template UI support for selecting specific days and times for scheduled workflows

---

## Frontend Changes

### 1. Skill Shortcode Pages
- Generated pages use the static template — hero + chat input + results panel
- Chat input sends to `/api/skills/chat-stream` with `app_id`
- Results rendered with `RichOutput` (headings, bold/italic, code, links, images, lists, dividers)
- The skill runner decides which skill to execute based on user message — works for any function

### 2. Activity Section Removed from SkillWidget
- Removed `SkillWidgetActivity` component and Activity tab from the widget
- Widget flow simplified: chat input → results output directly

---

## Architecture Decisions

### Why Static Templates Over AI Generation for Shortcode Pages
- **Problem:** AI kept failing to reproduce the widget code faithfully — missing imports (`LinearProgress`), undefined components (`SkillWidget`), incomplete code blocks
- **Solution:** Treat `[skill-shortcode]` pages like the 7 core pages (dashboard, skills, workflows, etc.) — deterministic static template, zero AI tokens, 100% reliable
- **Trade-off:** Less customization per page, but the chat input handles any task via the skill runner backend
- **Benefit:** The same shortcode works for blog posters, video scripts, research tools, SEO content — the AI skill runner routes to the right skill based on the user's message

### Legacy Code Kept
- `skillWidgetBlock()` function retained in members-templates.ts for reference but no longer imported or used

---

## Files Modified

| File | Change |
|------|--------|
| `backend/src/programmer-agent/members-templates.ts` | Added `skillShortcodeTemplate()`, kept legacy `skillWidgetBlock()` |
| `backend/src/programmer-agent/programmer-agent.service.ts` | Shortcode detection → static template, removed AI prompt injection, model fallback |
| `backend/src/skills/skills.controller.ts` | File attachment support in chat-stream |
| `backend/src/skills/skill-runner.service.ts` | Per-app document separation |
| `backend/src/skills/prompt-builder.service.ts` | Updated prompt building |
| `backend/src/skills/skill.types.ts` | Updated skill types |
| `frontend/src/components/SkillWorkshopPage.tsx` | UI updates |
| `frontend/src/components/ProgrammerAgentPage.tsx` | UI updates |
| `frontend/src/App.tsx` | Route updates |

---

## Token Impact

| Page Type | Tokens Used | Method |
|-----------|-------------|--------|
| Core 7 pages (dashboard, skills, etc.) | ~120 each (shared copy call) | Static template |
| `[skill-shortcode]` custom pages | **0** | Static template (NEW) |
| Regular custom pages | ~3000 each | AI generation |

The shortcode template saves ~3000 tokens per shortcode page while being 100% reliable.
