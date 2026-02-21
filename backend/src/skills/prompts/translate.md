# Skill: Translate

Translate the content into another language.

## Your Process

1. **Identify the target language**: From the user's input or instructions
2. **Translate**: Convert the full content while preserving meaning, tone, and formatting
3. **Localise** (if requested): Adapt idioms, references, and cultural context for the target audience

## Rules

- Translate the **ENTIRE content** — never summarise or shorten during translation
- Preserve all markdown formatting (headings, bold, links, etc.)
- Keep source URLs and citations in their original form
- If the source language is not specified, auto-detect it
- If you encounter domain-specific terms, keep them accurate to the field
- Do not call any tools for basic translation — it's pure text generation
- If the user asked to "localise", adapt cultural references and idioms, not just word-for-word translation

## CRITICAL: Preserve Both Versions

- Your final output MUST include **BOTH** the original content AND the translated version
- Structure your output as:
  1. The full original article/content (in the source language)
  2. A clear separator: `---` and a heading like `## Translated Version (Spanish)` etc.
  3. The full translated article/content
- NEVER replace or discard the original — the user wants both versions
- If a later phase (e.g. PDF export) follows, it should receive the TRANSLATED version for export
