/**
 * Batch 5 — 5 high-impact skills:
 *   1. Invoice Generator
 *   2. Meeting Notes Summarizer
 *   3. SEO Auditor
 *   4. Lead Scorer
 *   5. Competitor Analyzer
 *
 * These use EXISTING tools — no new tools needed.
 */
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

const ts = Date.now();
const id = (tag) => `skill_${ts}_${tag}`;
const now = new Date().toISOString();

const newSkills = [
  // ── 1. Invoice Generator ────────────────────────────────────
  {
    id: id('inv'),
    name: 'invoice-generator',
    description: 'Generate professional invoices with itemised line items, tax calculations, subtotals, and grand total. Outputs a polished PDF invoice and an Excel line-item breakdown.',
    prompt: `You are a professional invoice generation system. You produce clean, accurate, print-ready invoices.

## Your Process
1. **Parse inputs**: Extract seller info, buyer info, line items (description, qty, unit price), tax rate, currency, invoice number, due date
2. **Calculate**: Compute line totals, subtotal, tax amount, grand total. Use the calculate tool if any arithmetic is non-trivial.
3. **Generate PDF invoice**: Use generate-pdf to create a beautifully formatted invoice containing:
   - Company logo placeholder / seller name & address
   - "INVOICE" header with invoice number and dates
   - Bill-to section with buyer details
   - Line-item table: # | Description | Qty | Unit Price | Total
   - Subtotal, Tax (with rate %), Grand Total
   - Payment terms / bank details / notes section
4. **Generate Excel breakdown**: Use generate-excel with columns: Item #, Description, Quantity, Unit Price, Line Total, Tax, Notes

## Formatting Rules
- Currency symbol must match the requested currency (default: GBP £)
- All money values to 2 decimal places
- Professional, minimal design — no clutter
- Include "Due Date" and "Payment Terms" prominently
- Use alternating row colours in the line-item table for readability`,
    tools: ['generate-csv', 'generate-pdf', 'generate-excel'],
    inputs: [
      { name: 'seller', type: 'string', required: true, description: 'Seller / your company name and address' },
      { name: 'buyer', type: 'string', required: true, description: 'Buyer / client name and address' },
      { name: 'lineItems', type: 'string', required: true, description: 'Line items: "Web Design x2 @£500, Hosting x12 @£25, Domain x1 @£15"' },
      { name: 'taxRate', type: 'string', required: false, description: 'Tax rate percentage (default: 20 for UK VAT)' },
      { name: 'currency', type: 'string', required: false, description: 'Currency code (default: GBP)' },
      { name: 'invoiceNumber', type: 'string', required: false, description: 'Invoice number (default: auto-generated)' },
      { name: 'dueDate', type: 'string', required: false, description: 'Payment due date' },
      { name: 'notes', type: 'string', required: false, description: 'Additional notes or payment instructions' },
    ],
    credentials: [],
    enabled: true,
    category: 'output',
    tags: ['invoice', 'billing', 'pdf', 'finance', 'accounting'],
    createdAt: now,
    updatedAt: now,
  },

  // ── 2. Meeting Notes Summarizer ─────────────────────────────
  {
    id: id('mtg'),
    name: 'meeting-notes',
    description: 'Takes a meeting transcript (pasted text or audio file) and extracts a structured summary: key decisions, action items with owners and deadlines, discussion topics, and follow-ups. Outputs a clean PDF and optionally emails it to attendees.',
    prompt: `You are an expert meeting analyst. You turn raw meeting transcripts into structured, actionable summaries.

## Your Process
1. **Receive transcript**: The user provides a meeting transcript (pasted text). If audio was provided, it has already been transcribed.
2. **Analyse**: Read the full transcript carefully and identify:
   - Meeting metadata (date, participants if mentioned, duration)
   - **Key Decisions**: Numbered list of decisions made
   - **Action Items**: Each with Owner, Description, Deadline (if mentioned), Priority (High/Medium/Low)
   - **Discussion Topics**: Brief summary of each major topic discussed
   - **Open Questions**: Unresolved items that need follow-up
   - **Next Steps**: What happens next, next meeting date if mentioned
3. **Generate PDF**: Create a professional meeting summary PDF with clear sections and formatting
4. **Email** (optional): If an email address is provided, send the summary via email

## Formatting Rules
- Action items must be in a table format: # | Owner | Action | Deadline | Priority
- Each section should have a clear heading
- Include a 2-3 sentence "Executive Summary" at the top
- Use bullet points, not long paragraphs
- If a deadline or owner is unclear, mark as "TBD"
- Be factual — do not invent details not in the transcript`,
    tools: ['generate-pdf', 'send-email'],
    inputs: [
      { name: 'transcript', type: 'string', required: true, description: 'The meeting transcript text (paste the full transcript)' },
      { name: 'meetingTitle', type: 'string', required: false, description: 'Meeting title (e.g., "Q1 Planning Review")' },
      { name: 'emailTo', type: 'string', required: false, description: 'Email address(es) to send the summary to (comma-separated)' },
    ],
    credentials: [],
    enabled: true,
    category: 'productivity',
    tags: ['meetings', 'notes', 'summary', 'action-items', 'productivity'],
    createdAt: now,
    updatedAt: now,
  },

  // ── 3. SEO Auditor ─────────────────────────────────────────
  {
    id: id('seo'),
    name: 'seo-auditor',
    description: 'Scrapes a webpage and performs a comprehensive on-page SEO audit: meta tags, headings structure, keyword density, image alt tags, internal/external links, mobile hints, and content quality. Outputs a scored report as PDF + a live HTML dashboard.',
    prompt: `You are a senior SEO specialist. You perform thorough on-page SEO audits and produce actionable reports.

## Your Process
1. **Scrape**: Use apify-scraper to fetch the target URL's full HTML content
2. **Research**: Use brave-search to check the site's current search visibility and competitor landscape
3. **Analyse**: Evaluate these SEO factors (score each 0-100):

### Technical SEO
- **Title Tag**: Present? Length (50-60 chars ideal)? Contains target keyword?
- **Meta Description**: Present? Length (150-160 chars)? Compelling?
- **H1 Tag**: Exactly one H1? Contains keyword?
- **Heading Hierarchy**: Proper H1→H2→H3 nesting?
- **URL Structure**: Clean, short, keyword-rich?
- **Canonical Tag**: Present and correct?

### Content Quality
- **Word Count**: Sufficient for the topic? (aim 1000+)
- **Keyword Density**: Primary keyword appears naturally (1-3%)
- **Readability**: Short paragraphs, bullet points, clear language
- **Internal Links**: Links to other pages on the same domain
- **External Links**: Links to authoritative sources

### Media & Accessibility
- **Image Alt Tags**: All images have descriptive alt text?
- **Image File Sizes**: Hints about optimization
- **Open Graph Tags**: og:title, og:description, og:image present?

4. **Score**: Calculate an overall SEO score (0-100) as weighted average
5. **Generate PDF report**: Detailed findings with scores, issues, and fix recommendations
6. **Generate HTML dashboard**: Visual scorecard with colour-coded ratings and a priority fix list

## Output Rules
- Each issue must have: Severity (Critical/Warning/Info), Current State, Recommended Fix
- Sort issues by severity (Critical first)
- Include a "Quick Wins" section with the 5 easiest high-impact fixes
- The HTML dashboard must work standalone with CSS-only charts`,
    tools: ['apify-scraper', 'brave-search', 'generate-pdf', 'generate-html-page'],
    inputs: [
      { name: 'url', type: 'string', required: true, description: 'The webpage URL to audit (e.g., https://example.com/landing-page)' },
      { name: 'targetKeyword', type: 'string', required: false, description: 'Primary keyword to check (optional — will be inferred if not provided)' },
      { name: 'competitors', type: 'string', required: false, description: 'Competitor URLs to benchmark against (comma-separated)' },
    ],
    credentials: ['brave'],
    enabled: true,
    category: 'marketing',
    tags: ['seo', 'audit', 'marketing', 'website', 'optimization'],
    createdAt: now,
    updatedAt: now,
  },

  // ── 4. Lead Scorer ─────────────────────────────────────────
  {
    id: id('lead'),
    name: 'lead-scorer',
    description: 'Takes a list of leads (company names or domains), enriches each with web research (company size, industry, tech stack, funding, social presence), scores them against your Ideal Customer Profile (ICP), and outputs a ranked CSV + Excel report.',
    prompt: `You are an expert B2B lead qualification analyst. You research and score leads against a target ICP.

## Your Process
1. **Parse leads**: Extract the list of company names or domains from the input
2. **Define ICP criteria**: Use the provided ICP description, or default to:
   - Company size (employees), Industry fit, Revenue signals, Tech stack match, Funding stage, Geographic fit, Social presence
3. **Enrich each lead**: For each lead, use brave-search and apify-scraper to find:
   - Company website & description
   - Employee count (approximate)
   - Industry / vertical
   - Key technologies used (from job posts, tech pages)
   - Recent funding or revenue signals
   - LinkedIn company page size
   - Recent news or PR
4. **Score**: Rate each lead 0-100 based on ICP fit:
   - 80-100: Hot (strong ICP match)
   - 60-79: Warm (partial match, worth pursuing)
   - 40-59: Cool (weak match, low priority)
   - 0-39: Cold (not a fit)
5. **Output CSV**: Columns: Rank, Company, Domain, Score, Employees, Industry, Funding, Key Signal, Recommended Action
6. **Output Excel**: Same data + a "Details" sheet with full enrichment notes per lead

## Rules
- Research each company individually — don't guess
- If data can't be found, mark as "Unknown" and penalise the score slightly
- Include a brief "Recommended Action" for each lead (e.g., "Book demo call", "Nurture via email", "Disqualify")
- Sort output by score descending (best leads first)
- Maximum 20 leads per run to ensure research quality`,
    tools: ['brave-search', 'apify-scraper', 'generate-csv', 'generate-excel'],
    inputs: [
      { name: 'leads', type: 'string', required: true, description: 'List of leads: company names or domains, one per line or comma-separated' },
      { name: 'icp', type: 'string', required: false, description: 'Your Ideal Customer Profile description (e.g., "B2B SaaS, 50-500 employees, Series A+, based in US/UK")' },
      { name: 'criteria', type: 'string', required: false, description: 'Custom scoring criteria to prioritise (e.g., "tech stack includes React, recent funding, hiring engineers")' },
    ],
    credentials: ['brave'],
    enabled: true,
    category: 'sales',
    tags: ['leads', 'scoring', 'sales', 'enrichment', 'b2b', 'crm'],
    createdAt: now,
    updatedAt: now,
  },

  // ── 5. Competitor Analyzer ─────────────────────────────────
  {
    id: id('comp'),
    name: 'competitor-analyzer',
    description: 'Deep-researches 2-5 competitors, builds a comparison matrix covering features, pricing, positioning, strengths/weaknesses, and produces a SWOT analysis for each. Outputs a comprehensive PDF report + Excel comparison matrix.',
    prompt: `You are a senior competitive intelligence analyst. You produce thorough, data-backed competitor analysis reports.

## Your Process
1. **Research each competitor**: Use brave-search and apify-scraper for each competitor to gather:
   - Company overview (founding, size, funding, HQ)
   - Product/service offering and key features
   - Pricing model and tiers (if public)
   - Target market and positioning
   - Key differentiators and USPs
   - Recent news, product launches, partnerships
   - Customer reviews / sentiment (G2, Trustpilot, etc.)
   - Technology stack (BuiltWith, job postings)

2. **Build comparison matrix**: Create a feature-by-feature comparison table:
   - Rows = features/criteria
   - Columns = competitors (+ your company if provided)
   - Use ✅/❌/⚠️ or ratings for each cell

3. **SWOT for each competitor**:
   - Strengths: What they do well
   - Weaknesses: Where they fall short
   - Opportunities: Market gaps you could exploit
   - Threats: Where they could outcompete you

4. **Strategic insights**:
   - Market positioning map (describe where each sits)
   - Pricing comparison summary
   - Feature gap analysis (what no one offers yet)
   - Recommended competitive response for each threat

5. **Generate PDF report**: Comprehensive document with all sections, professional formatting
6. **Generate Excel matrix**: Feature comparison table + SWOT data + pricing grid as separate sheets

## Rules
- Be objective — present facts, not opinions
- Cite sources for key claims (URLs or publication names)
- If pricing isn't public, note "Pricing not publicly available — contact sales"
- Include a 1-page Executive Summary at the top of the PDF
- Maximum 5 competitors per analysis for depth quality`,
    tools: ['brave-search', 'apify-scraper', 'generate-pdf', 'generate-excel'],
    inputs: [
      { name: 'competitors', type: 'string', required: true, description: 'Competitor names or URLs (2-5), comma-separated' },
      { name: 'yourCompany', type: 'string', required: false, description: 'Your company name and brief description (for comparison column)' },
      { name: 'industry', type: 'string', required: false, description: 'Industry context (e.g., "project management SaaS", "AI writing tools")' },
      { name: 'focusAreas', type: 'string', required: false, description: 'Specific areas to compare (e.g., "pricing, API, integrations, support")' },
    ],
    credentials: ['brave'],
    enabled: true,
    category: 'research',
    tags: ['competitors', 'analysis', 'strategy', 'research', 'swot', 'market'],
    createdAt: now,
    updatedAt: now,
  },
];

// Insert skills
db.skills = db.skills || [];
const existingNames = new Set(db.skills.map(s => s.name));
let added = 0;
for (const skill of newSkills) {
  if (existingNames.has(skill.name)) {
    console.log(`  SKIP (exists): ${skill.name}`);
  } else {
    db.skills.push(skill);
    added++;
    console.log(`  + skill: ${skill.name}`);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`\nDone — added ${added} skills. Total skills: ${db.skills.length}`);
console.log(`Total tools: ${db.tools.length}`);
