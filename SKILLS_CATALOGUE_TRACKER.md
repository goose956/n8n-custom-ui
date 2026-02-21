# Skills Catalogue Implementation Tracker

Tracking progress against the **High-Impact Skill Catalogue** (50 skills).

## Legend
- ✅ = Built and available in Skill Workshop
- ⬜ = Not yet built

---

## INPUT SKILLS — Getting Data In

| # | Skill Name | Status | Skill ID / Notes |
|---|-----------|--------|-----------------|
| 1 | Email Ingest & Parse | ⬜ | |
| 2 | Document / PDF Data Extraction | ⬜ | |
| 3 | Web Scrape & Collect | ✅ | `apify-scraper` tool + `web-research` & `deep-research` skills |
| 4 | CSV / Spreadsheet Normaliser | ⬜ | |
| 5 | Image & Receipt OCR | ⬜ | |
| 6 | Form / Survey Response Collector | ⬜ | |
| 21 | Audio / Video Transcription | ⬜ | |
| 22 | QR / Barcode Scanner | ⬜ | |

## PROCESSING SKILLS — Transforming & Enriching

| # | Skill Name | Status | Skill ID / Notes |
|---|-----------|--------|-----------------|
| 7 | Text Summariser | ✅ | `text-summariser` — bullets/executive/oneliner/detailed formats |
| 8 | Sentiment & Tone Analyser | ✅ | `sentiment-analyser` — scores, tone labels, urgency, routing |
| 9 | Data Enrichment & Lookup | ✅ | `data-enrichment` — firmographic/demographic data from web research |
| 10 | Classifier & Triage Router | ✅ | `classifier-router` — categories, entities, routing rules |
| 11 | Template Filler / Mail-Merge | ✅ | `template-filler` — {{placeholder}} replacement, batch mode |
| 12 | Translation & Localisation | ✅ | `translator` — multi-language, locale-aware formatting |
| 13 | Calculation & Formula Engine | ✅ | `calculation-engine` — financial, statistical, unit conversion |
| 14 | Compliance & Policy Checker | ✅ | `compliance-checker` — GDPR, HIPAA, SOC2, PCI-DSS, ADA, ISO27001 |
| 23 | Data Validation & Formatting | ✅ | `data-validator` — missing fields, format checks, duplicates, outliers |
| 24 | Document Comparison (Diff & Redline) | ✅ | `document-comparator` — side-by-side diff with severity ratings |
| 25 | Approval Chain Router | ⬜ | |
| 26 | Deadline & Reminder Engine | ⬜ | |
| 27 | Content Generation (Blog Post) | ✅ | `content-writer` & `llm-content-writer` skills |
| 28 | Content Repurposing (Long→Social) | ✅ | `content-repurposer` — LinkedIn, Twitter/X, Facebook, Instagram |
| 29 | Knowledge Base Q&A | ✅ | `knowledge-qa` — web research + cited answers |
| 30 | File Format Converter | ⬜ | |
| 31 | Document Merger / Splitter | ⬜ | |
| 32 | Deduplication Engine | ✅ | `deduplication-engine` — fuzzy matching, confidence scores |
| 33 | Price & Feature Comparator | ✅ | `price-comparator` — comparison tables with recommendations |
| 34 | Image Editor (Resize, Crop, Watermark) | ⬜ | |
| 35 | Proposal & Quote Generator | ✅ | `proposal-generator` — professional proposals with scope/pricing/terms |

## OUTPUT SKILLS — Delivering Results

| # | Skill Name | Status | Skill ID / Notes |
|---|-----------|--------|-----------------|
| 15 | Generate PDF Report | ✅ | `generate-pdf` tool (available to all skills) |
| 16 | Generate Excel / Spreadsheet | ✅ | `excel-report-generator` — multi-sheet workbooks, formatted tables, data exports |
| 17 | Send Email (Compose & Deliver) | ✅ | `email-composer` — compose + optionally send via SMTP, tone selection |
| 18 | Calendar Event Creator | ⬜ | |
| 19 | Structured Data Push (API/Webhook) | ⬜ | |
| 20 | Dashboard / Chart Generator | ✅ | `dashboard-generator` — CSS-only charts, KPI cards, HTML dashboards + Excel data |
| 36 | Text-to-Speech (Audio Generation) | ✅ | `text-to-speech` — OpenAI TTS API, 6 voices, adjustable speed, MP3 output |
| 37 | Image Generation | ✅ | `generate-image` tool + `image-creator` skill |
| 38 | QR / Barcode Generator | ✅ | `qr-code-generator` — URLs, contacts, WiFi, email, phone, text QR codes |
| 39 | Digital Signature Requester | ⬜ | |
| 40 | File Encryption & Password Protection | ⬜ | |
| 41 | Social Media Publisher | ✅ | `social-media-pack` — LinkedIn, Twitter/X, Instagram, Facebook content packs |
| 42 | Database Row Inserter / Updater | ⬜ | |
| 43 | HTML Page Generator | ✅ | `html-page-generator` — responsive landing pages, portfolios, email templates |
| 44 | Archive Creator (Zip) | ✅ | `archive-creator` — bundle HTML, CSV, vCards, text files into ZIP downloads |
| 45 | Personalized Video Generator | ⬜ | |
| 46 | Voice Call Placer (IVR) | ⬜ | |
| 47 | Chat Message Sender (Slack/Teams) | ⬜ | |
| 48 | Contact Card Generator (vCard) | ✅ | `contact-card-generator` — vCard .vcf files + QR codes, batch support |
| 49 | Word Document Generator | ⬜ | |
| 50 | Task Creator (Asana, Jira, etc.) | ⬜ | |

---

## Summary

| Category | Total | Built | Remaining |
|----------|-------|-------|-----------|
| Input | 8 | 1 | 7 |
| Processing | 19 | 17 | 2 |
| Output | 15 | 11 | 4 |
| **Total** | **50** | **29** | **21** |

## Build Log

| Date | Skills Built | Session |
|------|-------------|---------|
| 2026-02-20 | #3 Web Scrape, #15 Generate PDF, #27 Content Generation, #37 Image Generation | Session 7 (original tools) |
| 2026-02-20 | #7 Text Summariser, #8 Sentiment Analyser, #10 Classifier Router, #12 Translator, #28 Content Repurposer | Session 8 (batch 1) |
| 2026-02-21 | #9 Data Enrichment, #11 Template Filler, #13 Calculation Engine, #14 Compliance Checker, #24 Doc Comparator, #29 Knowledge QA, #32 Dedup Engine, #33 Price Comparator, #35 Proposal Generator, #43 HTML Page Generator, Content Calendar | Session 9 (batch 2) |
| 2026-02-21 | #16 Excel, #17 Email, #20 Dashboard, #23 Data Validator, #36 TTS, #38 QR Generator, #41 Social Media Pack, #44 Archive/Zip, #48 Contact Card — plus 8 new tools (generate-excel, send-email, generate-qr, create-zip, text-to-speech, generate-html-page, generate-csv, generate-vcard) | Session 10 (tools + skills batch 3) |
