/**
 * ArtifactRegistry — Deterministic tracking and rendering of tool-produced artifacts.
 *
 * This is the "intelligence layer" that replaces trusting the AI to format
 * file references correctly. Instead:
 *
 * 1. After every tool execution, registerToolOutput() inspects the result
 *    and automatically detects any artifacts (files with URLs).
 * 2. Each artifact is classified by type (image, pdf, document, etc.)
 * 3. assembleOutput() produces the final output deterministically:
 *    - Fixes any mangled URLs the AI wrote (invented domains, wrong format)
 *    - Appends any artifacts the AI forgot to reference
 *    - Uses correct markdown per type (![img]() vs [Download]())
 *
 * This works for ANY tool combination automatically — no special cases needed.
 */

export interface Artifact {
  id: string;
  toolName: string;
  type: 'image' | 'pdf' | 'document' | 'file';
  url: string;
  title: string;
  filename: string;
  createdAt: number;
}

const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i;
const PDF_EXT = /\.(pdf)$/i;
const DOC_EXT = /\.(doc|docx|txt|md|csv|xlsx|xls|pptx)$/i;

export class ArtifactRegistry {
  private artifacts: Artifact[] = [];

  // ── Registration ────────────────────────────────────────────────

  /**
   * Inspect a tool's output and register any artifacts found.
   * Handles many output shapes: { url }, { files: [{url}] }, [{url}], etc.
   */
  registerToolOutput(toolName: string, output: any): void {
    if (!output || typeof output !== 'object') return;

    // Single artifact: { url: '/skill-images/...', title: '...' }
    if (typeof output.url === 'string' && output.url.startsWith('/')) {
      this.add(toolName, output.url, output.title || output.filename);
    }

    // Array of artifacts (local paths only — skip external URLs from search results)
    if (Array.isArray(output)) {
      for (const item of output) {
        if (item?.url && typeof item.url === 'string' && item.url.startsWith('/')) {
          this.add(toolName, item.url, item.title || item.filename);
        }
      }
    }

    // Nested arrays under common keys (local paths only)
    for (const key of ['files', 'images', 'documents', 'artifacts', 'results']) {
      if (Array.isArray(output[key])) {
        for (const item of output[key]) {
          if (item?.url && typeof item.url === 'string' && item.url.startsWith('/')) {
            this.add(toolName, item.url, item.title || item.filename);
          }
        }
      }
    }
  }

  private add(toolName: string, url: string, title?: string): void {
    // Deduplicate by URL
    if (this.artifacts.some(a => a.url === url)) return;

    const filename = url.split('/').pop() || url;
    this.artifacts.push({
      id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      toolName,
      type: this.classify(url),
      url,
      title: title || this.humanize(filename),
      filename,
      createdAt: Date.now(),
    });
  }

  private classify(url: string): Artifact['type'] {
    if (IMAGE_EXT.test(url)) return 'image';
    if (PDF_EXT.test(url)) return 'pdf';
    if (DOC_EXT.test(url)) return 'document';
    return 'file';
  }

  private humanize(filename: string): string {
    return filename
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Accessors ───────────────────────────────────────────────────

  getAll(): Artifact[] { return [...this.artifacts]; }
  getByType(type: Artifact['type']): Artifact[] { return this.artifacts.filter(a => a.type === type); }
  get count(): number { return this.artifacts.length; }

  // ── Output Assembly (the key intelligence) ──────────────────────

  /**
   * Fix AI text + append missing artifacts. Single entry point for final output.
   *
   * 1. fixMangledReferences — repair any URLs the AI got wrong
   * 2. Detect which artifacts are already correctly referenced
   * 3. Append only the missing ones (images inline, PDFs as download links)
   */
  assembleOutput(aiText: string): string {
    if (this.artifacts.length === 0) return aiText;

    // Step 1: Fix mangled references
    let output = this.fixMangledReferences(aiText);

    // Step 2: Find artifacts NOT correctly referenced in the output
    const unreferenced = this.artifacts.filter(a => !output.includes(a.url));

    // Step 3: Append only unreferenced artifacts
    if (unreferenced.length > 0) {
      const lines: string[] = [];
      for (const a of unreferenced) {
        lines.push(this.toMarkdown(a));
      }
      output += '\n\n---\n' + lines.join('\n');
    }

    return output;
  }

  /**
   * Post-process AI text to fix common LLM mistakes:
   * - Invented domains/schemes: ![img](https://fake.com/img.png) or [dl](sandbox:/skill-pdfs/f.pdf)
   * - Wrong link type: [Download](/skill-images/img.png) -> ![title](/skill-images/img.png)
   * - Plain links to images: [click here](/skill-images/img.png) -> ![title](/skill-images/img.png)
   */
  private fixMangledReferences(text: string): string {
    let fixed = text;

    for (const artifact of this.artifacts) {
      const escaped = artifact.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Fix 1a: AI used wrong scheme/domain but real filename (image syntax: ![...](...))
      // Catches https://, http://, sandbox:, file://, ftp://, etc.
      const mangledImgDomain = new RegExp(
        '(!\\[[^\\]]*\\])\\([a-zA-Z][a-zA-Z0-9+.-]*:/?/?[^)]*?' + escaped + '\\)', 'g',
      );
      fixed = fixed.replace(mangledImgDomain, '$1(' + artifact.url + ')');

      // Fix 1b: AI used wrong scheme/domain but real filename (link syntax: [...](...))
      const mangledLinkDomain = new RegExp(
        '(?<!!)\\[([^\\]]*)\\]\\([a-zA-Z][a-zA-Z0-9+.-]*:/?/?[^)]*?' + escaped + '\\)', 'g',
      );
      fixed = fixed.replace(mangledLinkDomain, '[$1](' + artifact.url + ')');

      if (artifact.type === 'image') {
        const escapedUrl = artifact.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Fix 2: Download-link format for an image
        const downloadLink = new RegExp(
          '\\[\\u{1F4E5}[^\\]]*\\]\\(' + escapedUrl + '\\)', 'gu',
        );
        fixed = fixed.replace(downloadLink, '![' + artifact.title + '](' + artifact.url + ')');

        // Fix 3: Plain link to an image -> inline image
        const plainLink = new RegExp(
          '(?<!!)\\[([^\\]]*)\\]\\(' + escapedUrl + '\\)', 'g',
        );
        fixed = fixed.replace(plainLink, '![$1](' + artifact.url + ')');
      }
    }

    return fixed;
  }

  /** Convert a single artifact to its correct markdown representation */
  private toMarkdown(a: Artifact): string {
    switch (a.type) {
      case 'image':    return '![' + a.title + '](' + a.url + ')';
      case 'pdf':      return '[\u{1F4E5} Download ' + a.title + '](' + a.url + ')';
      case 'document': return '[\u{1F4CE} ' + a.title + '](' + a.url + ')';
      default:         return '[\u{1F4CE} ' + a.title + '](' + a.url + ')';
    }
  }
}
