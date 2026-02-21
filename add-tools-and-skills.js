/**
 * Add new tools and update skills in db.json
 * Tools use ctx.fetch(), ctx.saveFile(), ctx.generateExcel(), ctx.sendEmail(),
 * ctx.generateQR(), ctx.createZip() which are exposed by buildToolContext.
 */
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./backend/db.json', 'utf-8'));
const tools = data.agentTools || [];
const skills = data.agentSkills || [];
const now = new Date().toISOString();
const ts = Date.now();

// Helper to check if tool already exists
function hasT(name) { return tools.some(t => t.name === name); }

const newTools = [];

// ═══════════════════════════════════════════════════════════════════
// 1. GENERATE EXCEL
// ═══════════════════════════════════════════════════════════════════
if (!hasT('generate-excel')) {
  newTools.push({
    id: `tool_${ts}_excel`,
    name: "generate-excel",
    description: "Generate an Excel spreadsheet (.xlsx) from structured data. Accepts JSON data (array of objects or multi-sheet format). Returns the download URL. Use when the user wants a spreadsheet, table export, or data in Excel format.",
    parameters: [
      { name: "data", type: "string", required: true, description: "JSON string: either an array of row objects [{col1: val, col2: val}] or multi-sheet format {sheets: [{name: 'Sheet1', rows: [...]}]}" },
      { name: "title", type: "string", required: false, description: "Title for the spreadsheet (used in filename)" },
      { name: "filename", type: "string", required: false, description: "Custom filename (e.g., 'sales-report.xlsx')" }
    ],
    code: `ctx.log('Generating Excel spreadsheet...');

if (!params.data) throw new Error('No data provided for Excel generation');

let parsed;
try {
  parsed = JSON.parse(params.data);
} catch(e) {
  throw new Error('Invalid JSON data: ' + e.message);
}

const filename = params.filename || ((params.title || 'spreadsheet').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.xlsx');
ctx.log('Rows: ' + (Array.isArray(parsed) ? parsed.length : 'multi-sheet'));

const url = await ctx.generateExcel(parsed, filename);
ctx.log('Excel saved: ' + url);

return {
  url: url,
  filename: filename,
  message: 'Excel spreadsheet generated. [Download Excel](' + url + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 2. SEND EMAIL
// ═══════════════════════════════════════════════════════════════════
if (!hasT('send-email')) {
  newTools.push({
    id: `tool_${ts}_email`,
    name: "send-email",
    description: "Send an email via SMTP. Requires smtp_host, smtp_user, smtp_pass credentials configured in Settings. Use when the user wants to send, deliver, or email content to someone.",
    parameters: [
      { name: "to", type: "string", required: true, description: "Recipient email address" },
      { name: "subject", type: "string", required: true, description: "Email subject line" },
      { name: "body", type: "string", required: true, description: "Email body content (plain text or HTML)" },
      { name: "html", type: "boolean", required: false, description: "Set to true if body contains HTML (default: false)" }
    ],
    code: `ctx.log('Sending email to: ' + params.to);
ctx.log('Subject: ' + params.subject);

const result = await ctx.sendEmail(
  params.to,
  params.subject,
  params.body,
  { html: params.html || false }
);

ctx.log('Email sent successfully. Message ID: ' + result.messageId);

return {
  success: true,
  messageId: result.messageId,
  to: params.to,
  subject: params.subject,
  message: 'Email sent successfully to ' + params.to
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 3. GENERATE QR CODE
// ═══════════════════════════════════════════════════════════════════
if (!hasT('generate-qr')) {
  newTools.push({
    id: `tool_${ts}_qr`,
    name: "generate-qr",
    description: "Generate a QR code PNG image from text, URL, or data. Returns the image URL. Use when the user wants a QR code for a link, contact info, WiFi, or any text.",
    parameters: [
      { name: "text", type: "string", required: true, description: "The text, URL, or data to encode in the QR code" },
      { name: "size", type: "number", required: false, description: "QR code size in pixels (default: 400)" },
      { name: "label", type: "string", required: false, description: "Optional label to identify this QR code" }
    ],
    code: `ctx.log('Generating QR code...');
ctx.log('Data: ' + params.text.substring(0, 100) + (params.text.length > 100 ? '...' : ''));

const url = await ctx.generateQR(params.text, {
  size: params.size || 400
});

ctx.log('QR code saved: ' + url);

return {
  url: url,
  text: params.text,
  label: params.label || 'QR Code',
  message: 'QR code generated. ![QR Code](' + url + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 4. CREATE ZIP ARCHIVE
// ═══════════════════════════════════════════════════════════════════
if (!hasT('create-zip')) {
  newTools.push({
    id: `tool_${ts}_zip`,
    name: "create-zip",
    description: "Create a ZIP archive containing multiple files. Pass an array of {name, content} objects. Returns the download URL. Use when the user wants to bundle multiple files into a downloadable archive.",
    parameters: [
      { name: "files", type: "string", required: true, description: "JSON array of files: [{name: 'file.txt', content: 'text...'}, ...]" },
      { name: "filename", type: "string", required: false, description: "Name for the zip file (default: 'archive.zip')" }
    ],
    code: `ctx.log('Creating ZIP archive...');

let parsed;
try {
  parsed = JSON.parse(params.files);
} catch(e) {
  throw new Error('Invalid JSON files array: ' + e.message);
}

if (!Array.isArray(parsed) || parsed.length === 0) {
  throw new Error('Files must be a non-empty array of {name, content} objects');
}

ctx.log('Files to archive: ' + parsed.length);
parsed.forEach(function(f) { ctx.log('  - ' + f.name); });

const url = await ctx.createZip(parsed, params.filename || 'archive.zip');
ctx.log('ZIP created: ' + url);

return {
  url: url,
  fileCount: parsed.length,
  message: 'ZIP archive created with ' + parsed.length + ' files. [Download ZIP](' + url + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 5. TEXT TO SPEECH (OpenAI TTS API)
// ═══════════════════════════════════════════════════════════════════
if (!hasT('text-to-speech')) {
  newTools.push({
    id: `tool_${ts}_tts`,
    name: "text-to-speech",
    description: "Convert text to spoken audio using OpenAI TTS API. Returns an audio file URL (MP3). Use when the user wants to create audio, voiceover, podcast, or narration from text.",
    parameters: [
      { name: "text", type: "string", required: true, description: "The text to convert to speech (max ~4000 chars)" },
      { name: "voice", type: "string", required: false, description: "Voice: alloy, echo, fable, onyx, nova, shimmer (default: alloy)" },
      { name: "speed", type: "number", required: false, description: "Speed multiplier 0.25-4.0 (default: 1.0)" }
    ],
    code: `const key = ctx.getCredential('openai');
if (!key) throw new Error('OpenAI API key not configured. Add it in Settings -> API Keys.');

const voice = params.voice || 'alloy';
const speed = params.speed || 1.0;
ctx.log('Generating speech with voice: ' + voice + ', speed: ' + speed);
ctx.log('Text length: ' + params.text.length + ' characters');

const resp = await ctx.fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'tts-1-hd',
    input: params.text.substring(0, 4096),
    voice: voice,
    speed: speed,
    response_format: 'mp3'
  })
});

if (resp.status !== 200) {
  const errMsg = typeof resp.body === 'object' ? JSON.stringify(resp.body) : resp.body;
  throw new Error('OpenAI TTS API error (' + resp.status + '): ' + errMsg);
}

// resp.body is an ArrayBuffer/Buffer when response is binary
// Save as base64 file
const b64 = typeof resp.body === 'string' ? resp.body : Buffer.from(resp.body).toString('base64');
const audioUrl = await ctx.saveFile('data:audio/mpeg;base64,' + b64, 'speech.mp3', 'skill-audio');

ctx.log('Audio saved: ' + audioUrl);

return {
  url: audioUrl,
  voice: voice,
  duration_estimate: Math.ceil(params.text.length / 15) + 's',
  message: 'Audio generated. [Download Audio](' + audioUrl + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 6. GENERATE HTML PAGE (save to file)
// ═══════════════════════════════════════════════════════════════════
if (!hasT('generate-html-page')) {
  newTools.push({
    id: `tool_${ts}_html`,
    name: "generate-html-page",
    description: "Save HTML content as a downloadable .html file and return the URL. Use when the user wants to create a web page, landing page, email template, or any HTML document. The AI should generate the HTML content; this tool just saves it to a file.",
    parameters: [
      { name: "html", type: "string", required: true, description: "The complete HTML content to save" },
      { name: "title", type: "string", required: false, description: "Page title (used in filename)" },
      { name: "filename", type: "string", required: false, description: "Custom filename (e.g., 'landing-page.html')" }
    ],
    code: `ctx.log('Saving HTML page...');

if (!params.html || params.html.trim().length === 0) {
  throw new Error('No HTML content provided');
}

const filename = params.filename || ((params.title || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html');
ctx.log('Content length: ' + params.html.length + ' characters');

const url = await ctx.saveFile(params.html, filename, 'skill-pages');
ctx.log('HTML page saved: ' + url);

return {
  url: url,
  filename: filename,
  message: 'HTML page created. [View Page](' + url + ') | [Download](' + url + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 7. GENERATE CSV
// ═══════════════════════════════════════════════════════════════════
if (!hasT('generate-csv')) {
  newTools.push({
    id: `tool_${ts}_csv`,
    name: "generate-csv",
    description: "Generate a CSV file from structured data. Accepts JSON array of objects. Returns the download URL. Use when the user wants data exported as CSV.",
    parameters: [
      { name: "data", type: "string", required: true, description: "JSON array of row objects: [{col1: val, col2: val}, ...]" },
      { name: "filename", type: "string", required: false, description: "Custom filename (e.g., 'export.csv')" }
    ],
    code: `ctx.log('Generating CSV file...');

let rows;
try {
  rows = JSON.parse(params.data);
} catch(e) {
  throw new Error('Invalid JSON data: ' + e.message);
}

if (!Array.isArray(rows) || rows.length === 0) {
  throw new Error('Data must be a non-empty array of objects');
}

// Build CSV
const headers = Object.keys(rows[0]);
const csvLines = [headers.join(',')];
for (const row of rows) {
  const vals = headers.map(function(h) {
    const v = String(row[h] || '');
    // Escape commas and quotes
    if (v.includes(',') || v.includes('"') || v.includes('\\n')) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  });
  csvLines.push(vals.join(','));
}

const csv = csvLines.join('\\n');
const filename = params.filename || 'export.csv';
const url = await ctx.saveFile(csv, filename, 'skill-files');
ctx.log('CSV saved: ' + url + ' (' + rows.length + ' rows)');

return {
  url: url,
  rowCount: rows.length,
  columns: headers,
  message: 'CSV file generated with ' + rows.length + ' rows. [Download CSV](' + url + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// 8. GENERATE VCARD (Contact Card)
// ═══════════════════════════════════════════════════════════════════
if (!hasT('generate-vcard')) {
  newTools.push({
    id: `tool_${ts}_vcard`,
    name: "generate-vcard",
    description: "Generate a vCard (.vcf) contact file. Returns the download URL. Use when the user wants to create a digital business card or contact file.",
    parameters: [
      { name: "firstName", type: "string", required: true, description: "First name" },
      { name: "lastName", type: "string", required: true, description: "Last name" },
      { name: "email", type: "string", required: false, description: "Email address" },
      { name: "phone", type: "string", required: false, description: "Phone number" },
      { name: "company", type: "string", required: false, description: "Company/organisation name" },
      { name: "title", type: "string", required: false, description: "Job title" }
    ],
    code: `ctx.log('Generating vCard for ' + params.firstName + ' ' + params.lastName);

const lines = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:' + params.lastName + ';' + params.firstName + ';;;',
  'FN:' + params.firstName + ' ' + params.lastName
];

if (params.company) lines.push('ORG:' + params.company);
if (params.title) lines.push('TITLE:' + params.title);
if (params.email) lines.push('EMAIL;TYPE=INTERNET:' + params.email);
if (params.phone) lines.push('TEL;TYPE=CELL:' + params.phone);
lines.push('REV:' + new Date().toISOString());
lines.push('END:VCARD');

const vcf = lines.join('\\r\\n');
const filename = (params.firstName + '_' + params.lastName).toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.vcf';
const url = await ctx.saveFile(vcf, filename, 'skill-files');

ctx.log('vCard saved: ' + url);

return {
  url: url,
  name: params.firstName + ' ' + params.lastName,
  message: 'Contact card created for ' + params.firstName + ' ' + params.lastName + '. [Download vCard](' + url + ')'
};`,
    createdAt: now,
    updatedAt: now
  });
}

// ═══════════════════════════════════════════════════════════════════
// ADD ALL NEW TOOLS
// ═══════════════════════════════════════════════════════════════════
tools.push(...newTools);
data.agentTools = tools;

console.log(`Added ${newTools.length} new tools:`);
newTools.forEach((t, i) => console.log(`  ${i+1}. ${t.name}: ${t.description.substring(0, 60)}...`));

// ═══════════════════════════════════════════════════════════════════
// NOW UPDATE EXISTING SKILLS TO USE NEW TOOLS
// AND CREATE NEW SKILLS THAT NEED THE NEW TOOLS
// ═══════════════════════════════════════════════════════════════════

// Helper to update a skill's tools array
function addToolToSkill(skillName, toolName) {
  const skill = skills.find(s => s.name === skillName);
  if (skill && !skill.tools.includes(toolName)) {
    skill.tools.push(toolName);
  }
}

// Update html-page-generator to use the actual file-saving tool
addToolToSkill('html-page-generator', 'generate-html-page');

// Update proposal-generator to also generate Excel quotes
addToolToSkill('proposal-generator', 'generate-excel');

// Update content-calendar to generate CSV exports
addToolToSkill('content-calendar', 'generate-csv');

// ─── New skills that leverage new tools ──────────────────────────

const newSkills = [];

// SKILL: Excel Report Generator
newSkills.push({
  id: `skill_${ts}_xlrpt`,
  name: "excel-report-generator",
  description: "Generate professional Excel spreadsheets and reports from data. Supports multi-sheet workbooks, formatted tables, and structured exports. Perfect for financial reports, data exports, and analytics summaries.",
  prompt: `You are an expert data analyst who generates professional Excel reports.

## Your Process
1. **Understand the data**: Parse and structure the user's data request
2. **Research** (if needed): Use brave-search to find relevant data
3. **Structure**: Organize data into logical sheets and columns
4. **Generate**: Use generate-excel to create the spreadsheet
5. **Summarize**: Provide a summary of what was generated

## Data Format for generate-excel
You must pass a JSON string to the generate-excel tool. Two formats:
- **Simple**: An array of objects — \`[{"Name": "Alice", "Score": 95}, {"Name": "Bob", "Score": 87}]\`
- **Multi-sheet**: \`{"sheets": [{"name": "Sales", "rows": [...]}, {"name": "Costs", "rows": [...]}]}\`

## Rules
- Always use descriptive column headers
- Sort data logically (alphabetical, chronological, or by value)
- Use consistent data types within columns
- For financial data: include totals/subtotals as rows
- For dates: use ISO format (YYYY-MM-DD)
- If data needs research, search first then compile
- Generate the Excel file — don't just describe what it would contain`,
  tools: ["brave-search", "generate-excel", "generate-pdf"],
  inputs: [
    { name: "description", type: "string", required: true, description: "What data/report to generate (e.g., 'Monthly budget template', 'Product comparison matrix')" },
    { name: "data", type: "string", required: false, description: "Raw data to include (JSON, CSV text, or description). If not provided, sample/template data will be generated." }
  ],
  credentials: ["brave"],
  enabled: true,
  category: "output",
  tags: ["excel", "spreadsheet", "report", "data", "export"],
  createdAt: now, updatedAt: now
});

// SKILL: Email Composer & Sender
newSkills.push({
  id: `skill_${ts}_emlsk`,
  name: "email-composer",
  description: "Compose and optionally send professional emails. Research context about the recipient or topic, write the email with appropriate tone, and deliver it via SMTP. Supports plain text and HTML emails.",
  prompt: `You are an expert email communication specialist. You compose professional, effective emails.

## Your Process
1. **Research** (if needed): Use brave-search to understand the recipient's company or topic context
2. **Compose**: Write the email with appropriate tone, structure, and call-to-action
3. **Review**: Ensure proper grammar, formatting, and professional tone
4. **Send** (if requested): Use send-email to deliver the email

## Email Structure
- **Subject line**: Clear, specific, action-oriented (under 60 chars)
- **Opening**: Personalized greeting, context setter
- **Body**: Key message, supporting points, value proposition
- **CTA**: Clear next step or request
- **Closing**: Professional sign-off

## Tone Guide
- **Professional**: formal language, structured, corporate
- **Friendly**: warm, conversational, approachable
- **Persuasive**: benefit-focused, urgency, social proof
- **Follow-up**: reference previous interaction, gentle reminder
- **Cold outreach**: personalized, concise, clear value prop

## Rules
- ONLY send the email if the user explicitly asks to send it
- If just composing, present the email in the output for review
- For HTML emails, use clean, email-client-compatible HTML
- Include subject line recommendation
- If researching the recipient, use that context to personalize
- Never include sensitive/fictional data in sent emails`,
  tools: ["brave-search", "send-email", "generate-pdf"],
  inputs: [
    { name: "purpose", type: "string", required: true, description: "Purpose of the email (e.g., 'Follow up on sales meeting with Acme Corp', 'Cold outreach to marketing directors')" },
    { name: "recipient", type: "string", required: false, description: "Recipient name, email, or company (for personalization research)" },
    { name: "tone", type: "string", required: false, description: "Tone: professional, friendly, persuasive, follow-up, cold-outreach (default: professional)" },
    { name: "sendTo", type: "string", required: false, description: "Email address to actually send to (if omitted, email is composed but not sent)" }
  ],
  credentials: ["brave", "smtp_host", "smtp_user", "smtp_pass"],
  enabled: true,
  category: "output",
  tags: ["email", "compose", "send", "communication", "outreach"],
  createdAt: now, updatedAt: now
});

// SKILL: QR Code Generator
newSkills.push({
  id: `skill_${ts}_qrsk`,
  name: "qr-code-generator",
  description: "Generate QR codes for URLs, contact info, WiFi credentials, text, or any data. Returns a PNG image ready to download, print, or embed.",
  prompt: `You are a QR code generation assistant. You create QR codes for various data types.

## Supported QR Types
- **URL**: Any web address
- **Contact (vCard)**: Generate vCard text then encode as QR
- **WiFi**: Format: WIFI:T:WPA;S:network_name;P:password;;
- **Email**: Format: mailto:email@example.com?subject=Hello
- **Phone**: Format: tel:+44123456789
- **SMS**: Format: smsto:+44123456789:message
- **Text**: Any plain text
- **Calendar Event**: VCALENDAR format

## Your Process
1. **Parse request**: Determine what type of QR code is needed
2. **Format data**: Convert to the correct QR code format for the type
3. **Generate**: Use generate-qr to create the QR code image
4. **Embed**: Include the QR code image in output using markdown

## Rules
- Always use the correct format for the QR type (WiFi, vCard, etc.)
- For URLs, ensure they start with http:// or https://
- Display the QR code image inline in the output
- If creating a vCard QR, also generate a downloadable .vcf file using generate-vcard
- State what data is encoded in the QR code`,
  tools: ["generate-qr", "generate-vcard", "generate-pdf"],
  inputs: [
    { name: "content", type: "string", required: true, description: "What to encode: a URL, text, contact info, WiFi details, etc." },
    { name: "type", type: "string", required: false, description: "QR type: url, contact, wifi, email, phone, text (default: auto-detect)" }
  ],
  credentials: [],
  enabled: true,
  category: "output",
  tags: ["qr", "barcode", "image", "generator"],
  createdAt: now, updatedAt: now
});

// SKILL: Text to Speech
newSkills.push({
  id: `skill_${ts}_ttssk`,
  name: "text-to-speech",
  description: "Convert text or articles into spoken audio (MP3) using OpenAI voices. Choose from 6 voices and adjustable speed. Perfect for podcast intros, voiceovers, narration, and accessibility.",
  prompt: `You are an audio production assistant specializing in text-to-speech conversion.

## Your Process
1. **Prepare text**: Clean, format, and optionally enhance the text for spoken delivery
2. **Choose voice**: Select appropriate voice based on content type and user preference
3. **Generate**: Use text-to-speech tool to create the audio
4. **Deliver**: Return the audio file link

## Voice Guide
- **alloy**: Neutral, versatile — good default
- **echo**: Warm, smooth — good for narration
- **fable**: Expressive, animated — good for storytelling
- **onyx**: Deep, authoritative — good for professional content
- **nova**: Bright, friendly — good for casual content
- **shimmer**: Gentle, soft — good for meditation, calm content

## Speed Guide
- 0.5: Very slow (meditation, language learning)
- 0.75: Slow (careful dictation)
- 1.0: Normal (default)
- 1.25: Slightly fast (podcast-style)
- 1.5: Fast (efficient listening)

## Rules
- Text is limited to ~4000 characters per generation
- For longer texts, split into logical sections (paragraphs or chapters)
- Clean up the text for speech: remove markdown formatting, URLs, code blocks
- Replace abbreviations with full words for natural speech
- Add natural pauses with punctuation if the source text lacks them
- Always state which voice and speed were used`,
  tools: ["text-to-speech"],
  inputs: [
    { name: "text", type: "string", required: true, description: "The text to convert to speech" },
    { name: "voice", type: "string", required: false, description: "Voice: alloy, echo, fable, onyx, nova, shimmer (default: alloy)" },
    { name: "speed", type: "string", required: false, description: "Speed: 0.25-4.0 (default: 1.0)" }
  ],
  credentials: ["openai"],
  enabled: true,
  category: "output",
  tags: ["audio", "speech", "tts", "voice", "podcast"],
  createdAt: now, updatedAt: now
});

// SKILL: Archive/Zip Creator
newSkills.push({
  id: `skill_${ts}_zipsk`,
  name: "archive-creator",
  description: "Bundle multiple generated files (HTML pages, documents, data files) into a downloadable ZIP archive. Perfect for delivering multi-file projects, report bundles, or content packages.",
  prompt: `You are a file packaging assistant. You create ZIP archives containing multiple files.

## Your Process
1. **Generate content**: Create all the individual files needed
2. **Bundle**: Use create-zip to package them all into a single archive
3. **Deliver**: Return the download link

## File Types You Can Package
- HTML pages (landing pages, email templates)
- CSV/text data files
- vCard contact files
- Markdown documents
- JSON data files
- Any text-based file format

## Rules
- Generate all content BEFORE creating the archive
- List all files included in the archive
- Use meaningful filenames (not random strings)
- Organize files with subdirectories if there are many (e.g., "images/", "data/")
- Always report the total number of files and approximate size`,
  tools: ["create-zip", "generate-html-page", "generate-csv", "generate-vcard"],
  inputs: [
    { name: "description", type: "string", required: true, description: "What files to generate and bundle (e.g., 'Landing page + matching email template + contact card')" },
    { name: "format", type: "string", required: false, description: "Preferred file format for content: html, markdown, text (default: html)" }
  ],
  credentials: [],
  enabled: true,
  category: "output",
  tags: ["zip", "archive", "bundle", "files", "package"],
  createdAt: now, updatedAt: now
});

// SKILL: Contact Card Generator
newSkills.push({
  id: `skill_${ts}_vcardsk`,
  name: "contact-card-generator",
  description: "Generate digital business cards (vCard .vcf files) with optional QR code for easy sharing. Supports batch generation for teams.",
  prompt: `You are a digital business card specialist. You create professional vCard contact files with QR codes.

## Your Process
1. **Gather info**: Parse the user's contact information
2. **Generate vCard**: Use generate-vcard to create the .vcf file
3. **Generate QR**: Use generate-qr to create a scannable QR code with the vCard data
4. **Present**: Show the QR code and download link

## vCard QR Format
For contact QR codes, encode the full vCard text:
\`BEGIN:VCARD\\nVERSION:3.0\\nN:Last;First\\nFN:First Last\\nORG:Company\\nTITLE:Title\\nEMAIL:email\\nTEL:phone\\nEND:VCARD\`

## Rules
- Always generate BOTH the .vcf file AND the QR code
- Display the QR code inline in the output
- For batch/team cards, generate one per person
- Include all provided information — don't skip fields
- If creating for a team, offer a ZIP bundle of all cards`,
  tools: ["generate-vcard", "generate-qr", "create-zip", "generate-pdf"],
  inputs: [
    { name: "name", type: "string", required: true, description: "Full name (e.g., 'John Smith') or multiple names for batch" },
    { name: "company", type: "string", required: false, description: "Company or organisation name" },
    { name: "title", type: "string", required: false, description: "Job title" },
    { name: "email", type: "string", required: false, description: "Email address" },
    { name: "phone", type: "string", required: false, description: "Phone number" }
  ],
  credentials: [],
  enabled: true,
  category: "output",
  tags: ["vcard", "contact", "business-card", "qr"],
  createdAt: now, updatedAt: now
});

// SKILL: Dashboard / Chart Data Generator
newSkills.push({
  id: `skill_${ts}_dashsk`,
  name: "dashboard-generator",
  description: "Research data on a topic and generate a visual dashboard as an HTML page with CSS-only charts, KPI cards, and data tables. Includes the raw data as a downloadable Excel/CSV file.",
  prompt: `You are an expert data visualization designer. You create beautiful HTML dashboards with real data.

## Your Process
1. **Research**: Use brave-search and apify-scraper to gather real data on the topic
2. **Analyze**: Identify key metrics, trends, and comparisons
3. **Design**: Create a responsive HTML dashboard with visual elements
4. **Export**: Save as HTML page + export raw data as Excel

## Dashboard Components (CSS-only, no JavaScript charting libraries)
- **KPI Cards**: Large numbers with labels and trend indicators
- **Bar Charts**: CSS flexbox-based horizontal/vertical bars
- **Progress Bars**: Percentage completion indicators
- **Data Tables**: Styled, sortable-looking tables
- **Stat Grids**: 2x2 or 3x3 metric cards
- **Comparison Tables**: Side-by-side feature/metric comparisons

## CSS Chart Techniques
Use these CSS-only approaches:
- Bars: \`<div style="width: 75%; background: #667eea; height: 30px; border-radius: 4px;">\`
- Donut: conic-gradient on a rounded div
- Progress: Linear gradient background with percentage width
- Sparklines: Multiple thin divs with varying heights

## Design Standards
- Dark or light theme based on user preference
- Responsive grid layout (CSS Grid)
- Professional color palette (default: indigo/purple gradients)
- Clear labels, units, and source citations
- Cohesive typography (system fonts)

## Rules
- All charts must be pure CSS — no canvas, no SVG, no JavaScript chart libraries
- Include real data from research, not placeholder numbers
- Cite sources in a footer
- Generate both the HTML dashboard (generate-html-page) AND raw data (generate-excel)
- The HTML must work standalone when opened in a browser`,
  tools: ["brave-search", "apify-scraper", "generate-html-page", "generate-excel", "generate-pdf"],
  inputs: [
    { name: "topic", type: "string", required: true, description: "Dashboard topic (e.g., 'UK housing market 2026', 'AI startup funding trends')" },
    { name: "metrics", type: "string", required: false, description: "Specific metrics to include (comma-separated)" },
    { name: "theme", type: "string", required: false, description: "Visual theme: dark, light, corporate (default: dark)" }
  ],
  credentials: ["brave"],
  enabled: true,
  category: "output",
  tags: ["dashboard", "charts", "visualization", "data", "html"],
  createdAt: now, updatedAt: now
});

// SKILL: Social Media Publisher (compose for multiple platforms)
newSkills.push({
  id: `skill_${ts}_socpub`,
  name: "social-media-pack",
  description: "Generate a complete social media content pack: platform-specific posts, images, hashtags, and scheduling notes for LinkedIn, Twitter/X, Instagram, and Facebook. Exports as a ready-to-publish bundle.",
  prompt: `You are an expert social media manager. You create complete content packs ready for publishing.

## Your Process
1. **Research**: Use brave-search to understand trending angles on the topic
2. **Create content**: Write platform-specific posts for each platform
3. **Generate image**: Use generate-image for a shared hero/thumbnail image
4. **Export**: Generate PDF summary + CSV content calendar

## Platform Specifications
### LinkedIn
- Max: 3000 chars, professional tone, no more than 5 hashtags
- Focus: insights, data, thought leadership
- Include line breaks for readability

### Twitter/X
- Max: 280 chars per tweet, or thread format (numbered)
- Focus: punchy, hook-driven, conversation starters
- 2-3 hashtags max

### Instagram
- Caption: up to 2200 chars, storytelling format
- 20-30 hashtags (mix of popular + niche)
- Focus: visual story, emotional connection

### Facebook
- Max: ~500 chars ideal, link-friendly
- Focus: community, discussion prompts, shares

## Output Format
For each platform:
1. The ready-to-post content (copy-paste ready)
2. Suggested hashtags
3. Best posting time
4. Content type (text, carousel, image, video script)

## Rules
- Each platform gets UNIQUE content (not just reformatted copies)
- Research trending hashtags for the topic
- Generate at least one shared image
- Export everything as a PDF summary for easy reference
- If requested, also generate a CSV for scheduling tools (Hootsuite/Buffer format)`,
  tools: ["brave-search", "generate-image", "generate-pdf", "generate-csv"],
  inputs: [
    { name: "topic", type: "string", required: true, description: "Content topic or message to promote" },
    { name: "platforms", type: "string", required: false, description: "Target platforms (comma-separated): LinkedIn, Twitter, Instagram, Facebook (default: all)" },
    { name: "tone", type: "string", required: false, description: "Brand voice: professional, casual, witty, inspirational (default: professional)" },
    { name: "includeImage", type: "string", required: false, description: "Generate an image: yes/no (default: yes)" }
  ],
  credentials: ["brave", "openai"],
  enabled: true,
  category: "output",
  tags: ["social-media", "publisher", "linkedin", "twitter", "instagram"],
  createdAt: now, updatedAt: now
});

// SKILL: Data Validation & Formatting
newSkills.push({
  id: `skill_${ts}_dvalsk`,
  name: "data-validator",
  description: "Validate and format datasets — check for missing fields, invalid formats, inconsistencies, outliers. Returns a quality report and cleaned dataset. Perfect for pre-import data checks.",
  prompt: `You are an expert data quality analyst. You validate, clean, and format datasets.

## Your Process
1. **Parse input**: Accept data as JSON, CSV, or plain text
2. **Validate**: Check every record against rules
3. **Report**: Generate a detailed quality report
4. **Clean**: Return the corrected/formatted dataset

## Validation Checks
- **Completeness**: Missing required fields
- **Format**: Email, phone, date, URL, postcode format validation
- **Consistency**: Mixed units, inconsistent naming, case issues
- **Duplicates**: Exact and near-duplicate records
- **Outliers**: Values outside expected ranges (if context given)
- **Type checking**: Numbers in text fields, text in number fields
- **Referential**: Cross-field logic (end date > start date, etc.)

## Output Format
### Data Quality Report
- **Total Records**: X
- **Valid Records**: Y (Z%)
- **Issues Found**: N

### Issues by Type
| Issue Type | Count | Severity | Examples |
|-----------|-------|----------|----------|
| Missing email | 5 | High | Row 3, 7, 12, 15, 20 |
| Invalid date format | 3 | Medium | Row 8: "31/13/2026" |

### Cleaned Dataset
[Corrected data in the same format as input]

### Corrections Made
- Row 3: Added missing country code to phone
- Row 8: Fixed date format from DD/MM to ISO

## Rules
- Report ALL issues — don't silently fix without reporting
- Severity levels: Critical (data unusable), High (likely wrong), Medium (inconsistent), Low (formatting)
- Export cleaned data in the original format (JSON/CSV)
- If unable to determine correct value, flag it rather than guessing`,
  tools: ["generate-pdf", "generate-csv", "generate-excel"],
  inputs: [
    { name: "data", type: "string", required: true, description: "The dataset to validate (JSON array, CSV text, or describe the data)" },
    { name: "rules", type: "string", required: false, description: "Specific validation rules (e.g., 'email required, phone must be UK format, age 18-100')" },
    { name: "outputFormat", type: "string", required: false, description: "Output format for cleaned data: json, csv, excel (default: same as input)" }
  ],
  credentials: [],
  enabled: true,
  category: "processing",
  tags: ["validation", "data-quality", "cleaning", "formatting"],
  createdAt: now, updatedAt: now
});

// ═══════════════════════════════════════════════════════════════════
// ADD ALL NEW SKILLS
// ═══════════════════════════════════════════════════════════════════
skills.push(...newSkills);
data.agentSkills = skills;

console.log(`\nAdded ${newSkills.length} new skills:`);
newSkills.forEach((s, i) => console.log(`  ${i+1}. ${s.name} [${s.tools.join(', ')}]`));

// ═══════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════
fs.writeFileSync('./backend/db.json', JSON.stringify(data, null, 2));
console.log(`\nSaved. Total: ${tools.length} tools, ${skills.length} skills`);
