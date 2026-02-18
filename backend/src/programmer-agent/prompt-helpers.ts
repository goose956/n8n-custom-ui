import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

/**
 * Prompt construction helpers and design system context.
 * Extracted from ProgrammerAgentService for maintainability.
 */
export class PromptHelpers {
  private readonly logger = new Logger('PromptHelpers');
  private readonly projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || path.resolve(__dirname, '..', '..', '..');
  }

  /** Full design system rules for generating React + MUI components */
  getDesignSystemContext(): string {
    return `
DESIGN SYSTEM RULES (must follow exactly):
- Framework: React 18 with TypeScript
- UI Library: Material-UI 5 (@mui/material)
- Import pattern: import { Box, Typography, ... } from '@mui/material';
- Icons: import { IconName } from '@mui/icons-material/IconName'; -- USE ICONS LIBERALLY throughout the UI
- Colors: primary=#667eea, secondary=#764ba2, dark=#1a1a2e, bg=#fafbfc
- Gradients: background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
- Font: Inter (via theme)
- Border radius: 2-3 for small, 16 for cards, 10 for buttons (theme default is 12)
- Shadows: boxShadow: '0 2px 12px rgba(0,0,0,0.06)' for cards, '0 4px 16px rgba(0,0,0,0.1)' for elevated, border: '1px solid rgba(0,0,0,0.06)' on cards
- Use sx prop for all styling, never CSS files
- Export components as named exports: export function ComponentName()
- Use functional components with hooks
- State: useState, useEffect, useCallback, useMemo
- API calls: use fetch() with const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : ''; -- do NOT import from config files. This ensures /api/ calls work in both local dev and production.
- Snackbar pattern for notifications
- Dialog pattern for modals
- Always include proper TypeScript types/interfaces -- define them inline, do NOT import from external type files
- Responsive: use MUI's Grid or Box with display: 'grid' / 'flex'
- Only import from: 'react', '@mui/material', '@mui/icons-material/*', 'react-router-dom' -- NO other packages

VISUAL RICHNESS (CRITICAL -- pages must look polished and premium):
- Use MUI icons next to EVERY label, heading, stat, button, and nav item (e.g. TrendingUp, Person, Settings, Dashboard, Analytics, Edit, Delete, Refresh, Search, FilterList, MoreVert, CheckCircle, Warning, Error, Star, Favorite, Visibility, Timeline, BarChart, PieChart, Speed)
- Stat cards: use gradient backgrounds or colored left borders with large numbers, icons, and trend indicators (ArrowUpward/ArrowDownward with green/red text)
- Cards: use elevation, subtle shadows, rounded corners (borderRadius: 3), hover effects (transform: 'translateY(-2px)', transition: '0.2s')
- Tables: use alternating row colors, icon status badges (Chip with icon), action buttons in last column
- Sections: use Paper with padding, section headers with icon + Typography variant="h6"
- Empty states: centered icon (large, 64px, muted color), helpful message, action button
- Loading: use Skeleton components (not just CircularProgress) to show content shape while loading
- Use Avatar, Chip, Badge, LinearProgress, Divider, Tooltip liberally
- Color-code statuses: success=green, warning=orange, error=red, info=blue (use MUI's color system)
- Add subtle background patterns or gradient headers to hero sections
- Use Grid containers for responsive card layouts (xs=12, sm=6, md=4 for stat cards)
`.trim();
  }

  /** Shared import rules prompt fragment */
  getImportRulesContext(filePath?: string): string {
    let apiImportPath = '../../config/api';
    if (filePath) {
      if (/frontend\/src\/components\/[^/]+\.tsx$/.test(filePath)) apiImportPath = '../config/api';
      else if (/frontend\/src\/components\/members\//.test(filePath)) apiImportPath = '../../config/api';
      else if (/frontend\/src\/components\/shared\//.test(filePath)) apiImportPath = '../../config/api';
    }
    return `
IMPORT RULES (CRITICAL -- follow exactly):
- API config: \`import { API } from '${apiImportPath}';\`. API is an OBJECT: use \`API.apps\`, \`API.chat\`, etc. NEVER \`\${API}/path\`.
- MUI components: \`import { Box, Typography, ... } from '@mui/material';\`
- React hooks: \`import { useState, useEffect, ... } from 'react';\`
- Do NOT import from paths that don't exist. If you need a type, define it INLINE in the component file.
- Do NOT import from \`../../types/\` or \`../../../types/\` -- these directories may not exist. Define interfaces inline.
`.trim();
  }

  /** Build API config context block for prompts */
  getApiConfigContext(): string {
    const apiConfigPath = path.join(this.projectRoot, 'frontend', 'src', 'config', 'api.ts');
    try {
      const apiConfig = fs.readFileSync(apiConfigPath, 'utf-8');
      return `\n## Frontend API Configuration (frontend/src/config/api.ts):\n\`\`\`typescript\n${apiConfig}\`\`\`\nIMPORTANT: Use the API object from this config for API calls (e.g. \`import { API } from '../../config/api'; fetch(API.apps)\`). The API object has named properties for each endpoint. Do NOT hardcode URLs or create mock endpoints.\n`;
    } catch {
      this.logger.debug('Could not read api.ts for prompt context');
      return '';
    }
  }

  /** Truncate content keeping head + tail for large files */
  smartTruncate(content: string, limit: number): string {
    if (content.length <= limit) return content;
    const headSize = Math.floor(limit * 0.6);
    const tailSize = limit - headSize - 40;
    return content.slice(0, headSize) + '\n\n// ... truncated ...\n\n' + content.slice(-tailSize);
  }
}
