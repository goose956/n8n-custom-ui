/**
 * SkillOutputRenderer — Smart renderer for skill run output.
 *
 * Handles:
 * - Markdown (headings, bold, italic, links, lists, code blocks)
 * - Images (markdown syntax + auto-detected URLs)
 * - JSON (auto-formatted in a code block)
 * - Tables (via remark-gfm)
 */
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography } from '@mui/material';
import { API_BASE_URL } from '../config/api';

interface SkillOutputRendererProps {
  content: string;
  /** Optional format hint: 'markdown' | 'json' | 'html' | 'text'. Auto-detected if omitted. */
  format?: string;
}

// Auto-detect image URLs and wrap them in markdown image syntax
function preprocessImages(text: string): string {
  // Match standalone URLs that point to images (on their own line, or after whitespace)
  return text.replace(
    /(?<!\[.*?\]\()(?<!\()(https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:\?[^\s"')]*)?)/gi,
    (url) => `![image](${url})`,
  );
}

// Detect if content is JSON
function isJSON(text: string): boolean {
  const trimmed = text.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { JSON.parse(trimmed); return true; } catch { return false; }
  }
  return false;
}

// Detect format from content
function detectFormat(content: string, hint?: string): 'markdown' | 'json' | 'html' | 'text' {
  if (hint && ['markdown', 'json', 'html', 'text'].includes(hint)) return hint as any;
  if (isJSON(content)) return 'json';
  // If it has markdown markers, render as markdown
  if (/^#{1,6}\s|^\*\*|\*\*$|^- |\!\[.*\]\(|^\|.*\|/m.test(content)) return 'markdown';
  // Default to markdown (handles plain text fine too)
  return 'markdown';
}

export function SkillOutputRenderer({ content, format }: SkillOutputRendererProps) {
  const detected = useMemo(() => detectFormat(content, format), [content, format]);

  if (!content) {
    return <Typography sx={{ color: '#808080', fontStyle: 'italic' }}>(no output)</Typography>;
  }

  // JSON → formatted code block
  if (detected === 'json') {
    let formatted: string;
    try { formatted = JSON.stringify(JSON.parse(content), null, 2); } catch { formatted = content; }
    return (
      <Box
        component="pre"
        sx={{
          m: 0, p: 1.5, fontSize: 12, lineHeight: 1.6,
          color: '#b5cea8', overflow: 'auto', fontFamily: 'monospace',
        }}
      >
        {formatted}
      </Box>
    );
  }

  // HTML — render directly (rare, escape hatch)
  if (detected === 'html') {
    return (
      <Box
        sx={{ fontSize: 14, lineHeight: 1.8, '& img': { maxWidth: '100%', borderRadius: 1 } }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Markdown (default) — preprocess to catch raw image URLs, then render
  const processed = preprocessImages(content);

  return (
    <Box sx={{
      fontSize: 13,
      lineHeight: 1.8,
      color: '#d4d4d4',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      '& h1': { fontSize: 20, fontWeight: 700, color: '#569cd6', mt: 2, mb: 1, borderBottom: '1px solid #333', pb: 0.5 },
      '& h2': { fontSize: 17, fontWeight: 700, color: '#569cd6', mt: 2, mb: 1 },
      '& h3': { fontSize: 15, fontWeight: 600, color: '#9cdcfe', mt: 1.5, mb: 0.5 },
      '& h4': { fontSize: 14, fontWeight: 600, color: '#9cdcfe', mt: 1, mb: 0.5 },
      '& p': { mb: 1.5 },
      '& a': { color: '#4fc1ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
      '& strong': { color: '#e8e8e8', fontWeight: 600 },
      '& em': { color: '#ce9178' },
      '& ul, & ol': { pl: 2.5, mb: 1 },
      '& li': { mb: 0.5 },
      '& code': {
        fontFamily: 'monospace', fontSize: 12, bgcolor: '#252526',
        px: 0.75, py: 0.25, borderRadius: 0.5, color: '#d7ba7d',
      },
      '& pre': {
        bgcolor: '#1a1a1a', border: '1px solid #333', borderRadius: 1,
        p: 1.5, mb: 1.5, overflow: 'auto',
        '& code': { bgcolor: 'transparent', px: 0, py: 0, fontSize: 12, color: '#b5cea8' },
      },
      '& blockquote': {
        borderLeft: '3px solid #569cd6', pl: 2, ml: 0, color: '#999', fontStyle: 'italic',
      },
      '& table': {
        width: '100%', borderCollapse: 'collapse', mb: 1.5, fontSize: 12,
        '& th': { bgcolor: '#252526', fontWeight: 600, textAlign: 'left', p: 1, borderBottom: '2px solid #444' },
        '& td': { p: 1, borderBottom: '1px solid #333' },
        '& tr:hover td': { bgcolor: '#1e1e2e' },
      },
      '& hr': { border: 'none', borderTop: '1px solid #333', my: 2 },
      // Images
      '& img': {
        maxWidth: '100%',
        maxHeight: 500,
        borderRadius: 2,
        mt: 1,
        mb: 1,
        display: 'block',
        border: '1px solid #333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      },
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Open links in new tab, resolve relative paths (PDFs, etc.) to backend URL
          a: ({ children, href, ...props }) => {
            const resolvedHref = href && href.startsWith('/') ? `${API_BASE_URL}${href}` : href;
            return (
              <a href={resolvedHref} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
            );
          },
          // Image with error handling + resolve local paths to backend
          img: ({ src, alt, ...props }) => {
            // Convert relative paths (e.g. /skill-images/img_123.png) to full backend URL
            const resolvedSrc = src && src.startsWith('/') ? `${API_BASE_URL}${src}` : src;
            return (
              <img
                src={resolvedSrc}
                alt={alt || 'Skill output image'}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.textContent = `[Image failed to load: ${src}]`;
                  fallback.style.color = '#f48771';
                  fallback.style.fontSize = '12px';
                  target.parentNode?.insertBefore(fallback, target);
                }}
                {...props}
              />
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </Box>
  );
}
