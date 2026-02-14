import { useState, useEffect, useRef, useCallback, useMemo, Component } from 'react';
import { API } from '../config/api';
import { RenderPage } from './AppPreviewPage';
import {
  Box, Typography, TextField, Button, Paper, Select, MenuItem,
  FormControl, InputLabel, Chip, CircularProgress,
  Snackbar, Alert, Tooltip, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, Grid, Checkbox, Stepper, Step, StepLabel,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Send as SendIcon,
  Code as CodeIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Psychology as OrchestratorIcon,
  Speed as SpeedIcon,
  Token as TokenIcon,
  CheckCircle as DoneIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunningIcon,
  AutoFixHigh as RefineIcon,
  Description as FileIcon,
  Visibility as PreviewIcon,
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  SupportAgent as SupportIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Key as KeyIcon,
  CheckCircleOutline as ConfiguredIcon,
  WarningAmber as MissingIcon,
  TravelExplore as BraveIcon,
  Storage as ApifyIcon,
  ViewModule as PagesIcon,
  Build as BuildIcon,
  Dns as DbIcon,
  Api as ApiIcon,
  Lock as SecurityIcon,
  Link as IntegrationIcon,
  BarChart as DataIcon,
  Bolt as AutoIcon,
  Handyman as ManualIcon,
  RocketLaunch as FinalizeIcon,
  BugReport as BugIcon,
  VerifiedUser as QaPassIcon,
  MenuBook as DocsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Replay as RetryIcon,
  AttachMoney as CostIcon,
  VerticalSplit as SplitIcon,
} from '@mui/icons-material';

/* ─── Preview Error Boundary (same pattern as Pages tab) ─── */
class PreviewErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }
  componentDidCatch(error: Error) {
    console.error('Preview render crash:', error);
  }
  componentDidUpdate(prevProps: any) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: '#e74c3c', fontWeight: 700, mb: 1 }}>Preview crashed</Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
            The generated content could not be previewed. Switch to Code view to inspect the output.
          </Typography>
          <Typography variant="caption" sx={{ color: '#ccc', fontFamily: 'monospace' }}>{this.state.errorMessage}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

/* ─── Smart preview: thinks about what would actually be on each page ─── */
interface PreviewContext {
  appName: string;
  appDescription: string;
  prompt: string;
  pages: { name: string; description: string; type: string }[];
  allFiles: GeneratedFile[];
}

function titleCase(s: string) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Strip "Generated file: path/to/file.tsx" prefix that the AI prepends to descriptions */
function cleanDescription(raw: string): string {
  return raw.replace(/^generated\s+file:\s*\S+\s*/i, '').trim();
}

/** Build nav links from the other pages in the project */
function navLinksFromPages(pages: { name: string }[], exclude?: string): string[] {
  return pages
    .filter(p => p.name.toLowerCase() !== (exclude || '').toLowerCase())
    .map(p => titleCase(p.name))
    .slice(0, 4);
}

/**
 * The core idea: read the description and figure out what UI elements belong on this page.
 * Most pages are NOT dashboards. They are functional tool pages with:
 *  - A title + description paragraph explaining what the page does
 *  - Maybe an input form (for generators, creators, search)
 *  - Maybe a list of items (for management, library, history)
 *  - Maybe settings toggles
 *  - Maybe notifications
 *  - Tips on how to use the page
 */
function generatePreviewData(file: GeneratedFile, _appNameLegacy?: string, ctx?: PreviewContext): { data: any; pageType: string } {
  const fileName = file.path.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '').toLowerCase() || '';
  const rawDesc = file.description || '';
  const fileDesc = cleanDescription(rawDesc);
  const desc = fileDesc.toLowerCase();
  const appName = ctx?.appName || _appNameLegacy || 'My App';
  const appDesc = cleanDescription(ctx?.appDescription || '');
  const pagesCtx = ctx?.pages || [];

  const pageName = titleCase(fileName.replace(/page$/i, ''));
  const navLinks = navLinksFromPages(pagesCtx, fileName);

  // ─── Priority 1: Exact structural pages (admin, checkout, landing) ───

  // Admin panel — the ONLY page that should look like a dashboard with KPIs
  if (/admin/i.test(fileName) || /\badmin\b/i.test(desc)) {
    return {
      pageType: 'admin',
      data: {
        page_type: 'admin',
        dashboard_title: fileDesc || `${appName} Admin`,
        kpis: [
          { label: 'Total Users', value: '1,247', change: '+12%', up: true },
          { label: 'Revenue', value: '$12,450', change: '+8.3%', up: true },
          { label: 'Active Today', value: '89', change: '+5', up: true },
          { label: 'Churn Rate', value: '2.1%', change: '-0.3%', up: true },
        ],
        revenue_chart: {
          title: 'Growth Trend', periods: ['7D', '30D', '90D', '1Y'], default_period: '30D',
          months: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
          data: [4200, 5100, 4800, 6200, 7100, 8400, 9200, 10800],
        },
        recent_users: [
          { name: 'Sarah Chen', email: 'sarah@example.com', plan: 'Pro', status: 'Active', mrr: '$39/mo' },
          { name: 'James Wilson', email: 'james@company.co', plan: 'Enterprise', status: 'Active', mrr: '$99/mo' },
          { name: 'Maria Garcia', email: 'maria@studio.com', plan: 'Starter', status: 'Trial', mrr: '$9/mo' },
        ],
        system_health: [
          { label: 'API Gateway', status: 'Operational' },
          { label: 'Application Server', status: 'Operational' },
          { label: 'Database', status: 'Operational' },
        ],
        recent_activity: [
          { text: 'New Enterprise signup', time: '2m ago' },
          { text: 'System update deployed', time: '1h ago' },
          { text: 'Monthly report generated', time: '3h ago' },
        ],
      },
    };
  }

  // Checkout / Pricing / Plans
  if (/checkout|pricing|plan|billing|subscription/i.test(fileName) || /\b(checkout|pricing|billing|subscription)\b/i.test(desc)) {
    const what = desc.includes('hour') ? 'hours' : desc.includes('seat') ? 'seats' : desc.includes('project') ? 'projects' : 'features';
    return {
      pageType: 'checkout',
      data: {
        page_type: 'checkout',
        headline: fileDesc || `Choose Your ${appName} Plan`,
        subheading: appDesc || 'Start with a free trial. Upgrade as you grow.',
        plans: [
          { name: 'Starter', description: 'For individuals', price: '$9', period: '/mo', features: [`3 ${what}`, 'Core access', 'Email support', 'Community'], cta: 'Start Free' },
          { name: 'Professional', description: 'For growing teams', price: '$39', period: '/mo', popular: true, features: [`Unlimited ${what}`, 'Everything in Starter', 'Priority support', 'API access', 'Team collaboration', 'Advanced analytics'], cta: 'Go Pro' },
          { name: 'Enterprise', description: 'For organizations', price: '$99', period: '/mo', features: ['Everything in Pro', 'Custom integrations', 'Dedicated account manager', 'SSO & SAML', 'SLA guarantee'], cta: 'Contact Sales' },
        ],
        guarantee: '14-day free trial. No credit card required. Cancel anytime.',
        trust_badges: ['SSL Secured', 'Cancel Anytime', 'Instant Access', '99.9% Uptime'],
      },
    };
  }

  // Landing / Index / Home — the ONLY page that should look like a marketing site
  if (/^(index|landing|home|welcome)$/i.test(fileName) || /\b(landing page|home page|welcome page)\b/i.test(desc)) {
    return {
      pageType: 'index',
      data: {
        page_type: 'index',
        nav: { brand: appName, links: navLinks.length ? navLinks : ['Features', 'Pricing', 'About'], cta: 'Get Started' },
        hero: {
          headline: appName,
          subheading: appDesc || fileDesc || 'Everything you need to grow and succeed',
          cta: 'Start Free Trial', secondary_cta: 'Watch Demo',
          social_proof: '★ Trusted by thousands of professionals worldwide',
        },
        features_section: {
          headline: 'Everything You Need',
          subheading: appDesc || 'Powerful features for modern teams',
          items: pagesCtx.slice(0, 6).map((p, i) => {
            const icons = ['🚀', '⚡', '🔧', '📊', '🔒', '🤝'];
            const pDesc = cleanDescription(p.description || '');
            return { icon: icons[i % icons.length], title: titleCase(p.name), description: pDesc || `${titleCase(p.name)} functionality` };
          }),
        },
        testimonials: [
          { quote: `${appName} completely transformed our workflow. What used to take hours now takes minutes.`, author: 'Sarah Chen', title: 'Operations Director', avatar: '👩‍💼' },
          { quote: `The best investment we made this year. Our team productivity doubled within weeks.`, author: 'James Wilson', title: 'Head of Product', avatar: '👨‍💻' },
        ],
        faq: [
          { question: `How do I get started with ${appName}?`, answer: `Sign up for a free account and follow our quick-start guide. You'll be up and running in under 5 minutes.` },
          { question: 'Can I try before I buy?', answer: 'Yes! We offer a 14-day free trial with full access. No credit card required.' },
          { question: 'Do you offer team plans?', answer: 'Absolutely. Our Professional and Enterprise plans include team features, advanced permissions, and dedicated support.' },
        ],
        cta_footer: {
          headline: `Ready to Get Started?`,
          subheading: `Join ${appName} today — free trial, no credit card required.`,
          button_text: 'Start Free Trial',
        },
      },
    };
  }

  // Contact / Support page — use contact renderer
  if (/support|help|contact|ticket/i.test(fileName) || /\b(support|help desk|contact us|submit.?ticket)\b/i.test(desc)) {
    return {
      pageType: 'contact',
      data: {
        page_type: 'contact',
        form: {
          headline: fileDesc || `${appName} Support`,
          subheading: 'Our team typically responds within 2 hours',
          fields: [
            { label: 'Subject', type: 'text', placeholder: 'What do you need help with?' },
            { label: 'Category', type: 'text', placeholder: 'General / Billing / Technical / Feature Request' },
            { label: 'Message', type: 'textarea', placeholder: 'Describe your issue in detail...', rows: 5 },
          ],
          submit_text: 'Submit Ticket',
        },
        contact_info: {
          headline: 'Other Ways to Get Help',
          items: [
            { icon: '📧', label: 'Email', value: `support@${appName.toLowerCase().replace(/\s+/g, '')}.com` },
            { icon: '💬', label: 'Live Chat', value: 'Available Mon–Fri, 9am–6pm' },
            { icon: '📚', label: 'Knowledge Base', value: '200+ articles & guides' },
          ],
        },
      },
    };
  }

  // ─── Priority 2: Description-driven tool pages ───
  // This is the key insight: READ the description, figure out what would actually be on the page.

  // AI / Generator / Creator pages → input form + recent output
  if (/\b(ai|generat|creat|build|design|compos|convert|transform|process|produc|automat)\b/i.test(desc) ||
      /\b(generator|creator|builder|converter|composer|maker)\b/i.test(fileName)) {
    // Parse the description to figure out WHAT is being generated/created
    const subjectMatch = desc.match(/(?:ai\s+)?(\w[\w\s]{2,30}?)(?:\s+generator|\s+creator|\s+builder|\s+maker|\s+tool|\s+conversion|\s+processing)/i);
    const subject = subjectMatch ? titleCase(subjectMatch[1].trim()) : pageName;
    const isImage = /image|photo|thumbnail|avatar|logo|icon|banner|graphic|visual|picture/i.test(desc);
    const isText = /text|copy|content|article|blog|email|description|summary|caption|headline|title|script|story/i.test(desc);
    const isAudio = /audio|sound|music|voice|speech|podcast|narration/i.test(desc);
    const isVideo = /video|animation|clip|reel/i.test(desc);
    const isCode = /code|script|program|function|component|template/i.test(desc);
    const isData = /data|report|spreadsheet|csv|analysis|chart/i.test(desc);

    // Build input fields based on what's being generated
    const fields: any[] = [];
    if (isImage) {
      fields.push({ label: 'Description', type: 'textarea', placeholder: `Describe the ${subject.toLowerCase()} you want to generate...`, rows: 3 });
      fields.push({ label: 'Style', type: 'select', options: ['Professional', 'Minimalist', 'Vibrant', 'Cinematic', 'Illustrative', 'Watercolor'] });
      fields.push({ label: 'Size', type: 'select', options: ['1024x1024', '1920x1080', '1080x1080', '800x600', 'Custom'] });
    } else if (isAudio) {
      fields.push({ label: 'Input Text or Description', type: 'textarea', placeholder: `Enter text or describe the ${subject.toLowerCase()} you need...`, rows: 3 });
      fields.push({ label: 'Voice / Style', type: 'select', options: ['Natural', 'Professional', 'Casual', 'Dramatic', 'Whisper'] });
      fields.push({ label: 'Format', type: 'select', options: ['MP3', 'WAV', 'M4A', 'OGG'] });
    } else if (isCode) {
      fields.push({ label: 'What should it do?', type: 'textarea', placeholder: 'Describe the functionality you need...', rows: 4 });
      fields.push({ label: 'Language', type: 'select', options: ['TypeScript', 'Python', 'JavaScript', 'React', 'HTML/CSS'] });
    } else if (isData) {
      fields.push({ label: 'What data do you need?', type: 'textarea', placeholder: `Describe the ${subject.toLowerCase()} you want to generate...`, rows: 3 });
      fields.push({ label: 'Format', type: 'select', options: ['Table', 'Chart', 'CSV', 'JSON', 'PDF Report'] });
    } else {
      // Generic text/content or unknown — still give a good input
      fields.push({ label: 'Description', type: 'textarea', placeholder: `Describe what you want to ${desc.includes('convert') || desc.includes('transform') ? 'convert' : 'create'}...`, rows: 3 });
      if (isText) {
        fields.push({ label: 'Tone', type: 'select', options: ['Professional', 'Casual', 'Formal', 'Persuasive', 'Friendly'] });
        fields.push({ label: 'Length', type: 'select', options: ['Short (1-2 paragraphs)', 'Medium (3-5 paragraphs)', 'Long (article-length)'] });
      }
    }

    // Build output preview items
    const outputItems = [];
    const typeLabel = isImage ? 'image' : isAudio ? 'audio' : isVideo ? 'video' : isCode ? 'snippet' : isData ? 'report' : 'item';
    outputItems.push({ title: `${subject} #1 — Summer Campaign`, subtitle: `Generated ${typeLabel} · 2 min ago`, status: 'Done', time: '2m ago' });
    outputItems.push({ title: `${subject} #2 — Product Launch`, subtitle: `Generated ${typeLabel} · 15 min ago`, status: 'Done', time: '15m ago' });
    outputItems.push({ title: `${subject} #3 — Weekly Batch`, subtitle: `3 ${typeLabel}s · Processing`, status: 'Processing', time: '1h ago' });

    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc,
        info: appDesc ? `Part of ${appName}: ${appDesc}` : undefined,
        tool_input: {
          headline: `Create New ${subject}`,
          fields,
          submit_text: desc.includes('convert') || desc.includes('transform') ? 'Convert' : desc.includes('process') ? 'Process' : 'Generate',
          hint: isImage ? 'Tip: Be specific about colors, style, and composition for better results.' : isText ? 'Tip: Provide context about your audience and goal for better output.' : `Tip: The more detail you provide, the better the result.`,
        },
        output_preview: { headline: 'Recent Results', items: outputItems },
        tips: [
          `Be specific in your description for better results`,
          `You can regenerate any result by clicking on it`,
          `All generated content is saved to your library`,
        ],
      },
    };
  }

  // Notification / Alert / Feed pages → notification list
  if (/notification|alert|feed|inbox|announce|update/i.test(fileName) || /\b(notification|alert|inbox|announcement|update|feed)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || `Stay up to date with your ${appName} notifications.`,
        notifications: [
          { title: 'New Feature Available', message: `${appName} has been updated with new capabilities. Check it out!`, time: '5m ago', read: false },
          { title: 'Welcome to the Team!', message: 'A new team member has joined your workspace.', time: '1h ago', read: false },
          { title: 'Weekly Summary', message: 'Your weekly activity report is ready to view.', time: '3h ago', read: true },
          { title: 'Maintenance Complete', message: 'Scheduled maintenance has been completed successfully.', time: '1d ago', read: true },
          { title: 'Billing Update', message: 'Your invoice for this month has been generated.', time: '2d ago', read: true },
        ],
        quick_actions: ['Mark All Read', 'Notification Settings', 'Filter'],
      },
    };
  }

  // Settings / Config / Preferences → settings sections
  if (/settings|config|preference/i.test(fileName) || /\b(settings|configuration|preferences)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || `Configure your ${appName} experience.`,
        settings_sections: [
          {
            title: 'General',
            items: [
              { label: 'Display Name', value: 'John Doe', hint: 'Visible to other members' },
              { label: 'Email', value: 'john@example.com', hint: 'Used for notifications' },
              { label: 'Language', value: 'English', hint: 'Interface language' },
              { label: 'Timezone', value: 'UTC-5 (Eastern)', hint: 'For scheduling and dates' },
            ],
          },
          {
            title: 'Notifications',
            items: [
              { label: 'Email Notifications', value: 'Enabled', hint: 'Receive updates via email' },
              { label: 'Push Notifications', value: 'Enabled', hint: 'Browser push alerts' },
              { label: 'Weekly Digest', value: 'Enabled', hint: 'Summary email every Monday' },
            ],
          },
          {
            title: 'Privacy & Security',
            items: [
              { label: 'Two-Factor Auth', value: 'Enabled', hint: 'Extra security for your account' },
              { label: 'Profile Visibility', value: 'Team Only', hint: 'Who can see your profile' },
              { label: 'Data Export', value: 'Available', hint: 'Download all your data' },
            ],
          },
        ],
        quick_actions: ['Change Password', 'Connected Apps', 'API Keys', 'Delete Account'],
      },
    };
  }

  // Content Management / Library / List / Gallery / Collection pages → content list
  if (/manage|library|collection|gallery|list|directory|catalog|inventory|archive/i.test(fileName) ||
      /\b(manage|library|collection|gallery|browse|catalog|inventory|directory|archive|organiz)\b/i.test(desc)) {
    // Figure out what's being managed from the description
    const itemMatch = desc.match(/(?:manage|browse|view|organize|list)\s+(?:your\s+)?(\w[\w\s]{2,25})/i);
    const itemType = itemMatch ? titleCase(itemMatch[1].trim()) : pageName.replace(/Management|Library|Collection|Gallery|List/i, '').trim() || 'Items';
    const icons = ['📄', '🎨', '📸', '📊', '🔗', '📁'];
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || `Browse and manage your ${itemType.toLowerCase()}.`,
        content_list: {
          search_placeholder: `Search ${itemType.toLowerCase()}...`,
          actions: [`New ${itemType.replace(/s$/i, '')}`, 'Filter', 'Sort', 'Export'],
          items: [
            { icon: icons[0], title: `${itemType.replace(/s$/i, '')} — Summer Campaign`, subtitle: 'Created 2 days ago', type: 'Active', status: 'Published', date: 'Feb 12' },
            { icon: icons[1], title: `${itemType.replace(/s$/i, '')} — Product Launch`, subtitle: 'Updated yesterday', type: 'Active', status: 'Published', date: 'Feb 11' },
            { icon: icons[2], title: `${itemType.replace(/s$/i, '')} — Q1 Planning`, subtitle: 'In review', type: 'Review', status: 'Draft', date: 'Feb 10' },
            { icon: icons[3], title: `${itemType.replace(/s$/i, '')} — Onboarding v2`, subtitle: 'Awaiting approval', type: 'Pending', status: 'Draft', date: 'Feb 8' },
            { icon: icons[4], title: `${itemType.replace(/s$/i, '')} — Archive sample`, subtitle: 'Completed last week', type: 'Archive', status: 'Published', date: 'Feb 5' },
          ],
        },
        quick_actions: [`New ${itemType.replace(/s$/i, '')}`, 'Import', 'Bulk Actions', 'Trash'],
      },
    };
  }

  // Profile / Account page → settings-style
  if (/profile|account|my-account/i.test(fileName) || /\b(profile|account|my account)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: 'My Profile',
        description: fileDesc || `View and edit your ${appName} profile.`,
        settings_sections: [
          {
            title: 'Account Details',
            items: [
              { label: 'Name', value: 'John Doe' },
              { label: 'Email', value: 'john@example.com' },
              { label: 'Member Since', value: 'January 2025' },
              { label: 'Plan', value: 'Professional' },
            ],
          },
          {
            title: 'Usage',
            items: [
              { label: 'Current Usage', value: '78%', hint: 'Of monthly plan limit' },
              { label: 'Storage', value: '2.4 GB / 10 GB', hint: 'Files and media' },
            ],
          },
        ],
        quick_actions: ['Edit Profile', 'Change Password', 'Billing & Plans', 'Download Data'],
      },
    };
  }

  // History / Activity / Logs → content list with time-based items
  if (/history|activity|log|timeline|audit/i.test(fileName) || /\b(history|activity log|timeline|audit)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || `View your recent ${appName} activity.`,
        content_list: {
          search_placeholder: 'Search activity...',
          actions: ['Filter by Date', 'Export CSV'],
          items: [
            { icon: '✅', title: 'Completed task: Review submission', subtitle: 'Marked as done', date: '2 hours ago', status: 'Active' },
            { icon: '📤', title: 'Exported monthly report', subtitle: 'PDF · 2.4 MB', date: 'Yesterday', status: 'Active' },
            { icon: '🔄', title: 'Updated settings', subtitle: 'Changed notification preferences', date: '2 days ago', status: 'Active' },
            { icon: '👤', title: 'Profile updated', subtitle: 'Changed display name and avatar', date: '3 days ago', status: 'Active' },
            { icon: '📥', title: 'Imported data', subtitle: 'CSV file · 148 records', date: 'Last week', status: 'Active' },
          ],
        },
        quick_actions: ['Clear History', 'Export All'],
      },
    };
  }

  // Upload / Import → tool input for file upload
  if (/upload|import/i.test(fileName) || /\b(upload|import|file upload)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || 'Upload and import your files.',
        tool_input: {
          headline: 'Upload Files',
          fields: [
            { label: 'Select Files', type: 'text', placeholder: 'Drag & drop files here or click to browse' },
            { label: 'Category', type: 'select', options: ['General', 'Documents', 'Images', 'Media', 'Data'] },
          ],
          submit_text: 'Upload',
          hint: 'Supported formats: PDF, DOCX, JPG, PNG, MP4, CSV and more. Max 2 GB per file.',
        },
        output_preview: {
          headline: 'Recent Uploads',
          items: [
            { title: 'report-q4.pdf', subtitle: '2.4 MB · PDF', status: 'Done', time: '10m ago' },
            { title: 'team-photo.jpg', subtitle: '1.1 MB · Image', status: 'Done', time: '1h ago' },
            { title: 'data-export.csv', subtitle: '450 KB · CSV', status: 'Done', time: '2h ago' },
          ],
        },
        tips: [`You can upload multiple files at once`, `Files are automatically organized by type`],
      },
    };
  }

  // Analytics / Reports / Metrics → keep as admin (the only other dashboard-like page)
  if (/analytic|report|metric|insight|stat/i.test(fileName) || /\b(analytics|report|metrics|insight|statistics)\b/i.test(desc)) {
    return {
      pageType: 'admin',
      data: {
        page_type: 'admin',
        dashboard_title: fileDesc || pageName,
        kpis: [
          { label: 'Total Views', value: '24,891', change: '+18%', up: true },
          { label: 'Engagement', value: '67%', change: '+5.2%', up: true },
          { label: 'Growth', value: '+23%', change: '+3%', up: true },
          { label: 'Retention', value: '89%', change: '+1.4%', up: true },
        ],
        revenue_chart: {
          title: 'Activity Over Time', periods: ['7D', '30D', '90D'], default_period: '30D',
          months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
          data: [2100, 3400, 2900, 4100, 5200, 6800],
        },
      },
    };
  }

  // Dashboard / Overview — the main member dashboard (only for explicitly named dashboards)
  if (/dashboard|overview/i.test(fileName) || /\b(dashboard|overview)\b/i.test(desc)) {
    const pageLinks = pagesCtx.map(p => titleCase(p.name)).slice(0, 6);
    return {
      pageType: 'members',
      data: {
        page_type: 'members',
        welcome: { headline: `Welcome to ${appName}`, subheading: appDesc || fileDesc || 'Your dashboard — everything at a glance' },
        stats: [
          { label: 'Status', value: 'Active', sub: 'All systems go' },
          { label: 'Last Login', value: 'Today', sub: '2 hours ago' },
          { label: 'Tasks', value: '3', sub: 'Pending' },
        ],
        quick_actions: pageLinks.length >= 3 ? pageLinks : ['Getting Started', 'Settings', 'Support', 'Browse', 'Upgrade'],
      },
    };
  }

  // API / Integrations / Developer → tool page with code-like input
  if (/api|integrat|develop|webhook/i.test(fileName) || /\b(api|integration|developer|webhook)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || `Connect ${appName} with your existing tools and automate your workflow.`,
        badge: 'Developer',
        info: 'Use API keys to authenticate requests. Keep your keys private and never share them in client-side code.',
        settings_sections: [
          {
            title: 'API Keys',
            items: [
              { label: 'Production Key', value: 'sk_live_••••••••4f2a', hint: 'For live requests' },
              { label: 'Test Key', value: 'sk_test_••••••••8b1c', hint: 'For development' },
              { label: 'Rate Limit', value: '1,000 req/min', hint: 'Current plan limit' },
            ],
          },
        ],
        output_preview: {
          headline: 'Recent API Activity',
          items: [
            { title: 'POST /api/create', subtitle: '200 OK · 142ms', status: 'Done', time: '2m ago' },
            { title: 'GET /api/list', subtitle: '200 OK · 89ms', status: 'Done', time: '15m ago' },
            { title: 'POST /api/batch', subtitle: '202 Accepted · 1.2s', status: 'Processing', time: '1h ago' },
          ],
        },
        quick_actions: ['Generate New Key', 'View Docs', 'Test Endpoint', 'Webhook Setup', 'Usage Logs'],
      },
    };
  }

  // Blog / Resources / Library / Docs / Guide → content list
  if (/blog|resource|library|docs|guide|tutorial|article|knowledge/i.test(fileName) ||
      /\b(blog|resource|guide|tutorial|article|knowledge base|documentation)\b/i.test(desc)) {
    return {
      pageType: 'tool',
      data: {
        page_type: 'tool',
        title: pageName,
        description: fileDesc || `Explore ${appName} resources, guides, and tutorials.`,
        content_list: {
          search_placeholder: 'Search resources...',
          actions: ['All', 'Guides', 'Tutorials', 'FAQs'],
          items: [
            { icon: '📖', title: 'Getting Started Guide', subtitle: 'Step-by-step setup walkthrough', type: 'Guide', status: 'Published', date: 'Updated 3d ago' },
            { icon: '🎯', title: 'Best Practices', subtitle: 'Tips from power users', type: 'Guide', status: 'Published', date: 'Updated 1w ago' },
            { icon: '🔌', title: 'Integration Guide', subtitle: 'Connect with your tools', type: 'Tutorial', status: 'Published', date: 'Updated 2w ago' },
            { icon: '💡', title: 'Tips & Tricks', subtitle: 'Hidden features you should know', type: 'Article', status: 'Published', date: 'Updated 3w ago' },
          ],
        },
      },
    };
  }

  // ─── Priority 3: Fallback — description-driven tool page ───
  // Every other page becomes a clean tool page with description text
  // and contextual elements based on what the description mentions.

  const data: any = {
    page_type: 'tool',
    title: pageName,
    description: fileDesc || `${pageName} functionality for ${appName}.`,
  };

  // Add an info callout from the app description if available
  if (appDesc && appDesc !== fileDesc) {
    data.info = appDesc;
  }

  // If the description suggests this page has some kind of input/action
  const hasInputAction = /\b(enter|input|submit|create|generate|search|write|compose|send|upload|type|describe|select|choose|pick|fill|provide)\b/i.test(desc);
  const hasListContent = /\b(list|browse|view|see|find|show|display|all|recent|your|history|saved|favorite|archive|items|records|entries|results)\b/i.test(desc);

  if (hasInputAction && !hasListContent) {
    // Page seems interactive — give it an input form
    const actionVerb = desc.match(/\b(create|generate|search|send|compose|build|upload|convert|write|submit|enter)\b/i)?.[1] || 'Submit';
    data.tool_input = {
      headline: fileDesc || `${pageName}`,
      fields: [
        { label: 'Input', type: 'textarea', placeholder: `Enter your ${pageName.toLowerCase()} details here...`, rows: 3 },
      ],
      submit_text: titleCase(actionVerb),
    };
    data.tips = [
      `Be as specific as possible for better results`,
      `Your previous results are saved automatically`,
    ];
  } else if (hasListContent) {
    // Page seems to show a list of things
    data.content_list = {
      search_placeholder: `Search ${pageName.toLowerCase()}...`,
      actions: ['All', 'Recent', 'Favorites'],
      items: [
        { icon: '📄', title: `${pageName} Item 1`, subtitle: 'Most recent', status: 'Active', date: 'Today' },
        { icon: '📄', title: `${pageName} Item 2`, subtitle: 'Updated recently', status: 'Active', date: 'Yesterday' },
        { icon: '📄', title: `${pageName} Item 3`, subtitle: 'From last week', status: 'Active', date: 'Feb 7' },
      ],
    };
  } else {
    // Purely informational page — just clean text with tips
    data.tips = [
      fileDesc || `This is the ${pageName.toLowerCase()} section of ${appName}`,
      `Use the navigation to explore other areas of ${appName}`,
    ];
    // Add related pages as quick actions so the page isn't empty
    const relatedPages = pagesCtx.filter(p => p.name.toLowerCase() !== fileName).map(p => titleCase(p.name)).slice(0, 5);
    if (relatedPages.length >= 2) {
      data.quick_actions = relatedPages;
    }
  }

  return { pageType: 'tool', data };
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

interface PlanStep {
  id: number;
  title: string;
  description: string;
  agent: 'orchestrator' | 'sub-agent';
  status: 'pending' | 'running' | 'complete' | 'failed';
  model?: string;
}

interface MembersPage {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'profile' | 'support' | 'settings' | 'custom';
  required: boolean;
  enabled?: boolean;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'openrouter';
  tier: 'orchestrator' | 'sub-agent' | 'both';
  costPer1kTokens: number;
}

interface ModelsResponse {
  success: boolean;
  models: ModelConfig[];
  configured: { anthropic: boolean; openai: boolean; brave: boolean; apify: boolean };
  defaults: { orchestrator: string; subAgent: string };
}

interface StatsData {
  sessions: number;
  totalTokens: number;
  orchestratorTokens: number;
  subAgentTokens: number;
  filesGenerated: number;
  history: { date: string; orchestratorModel: string; subAgentModel: string; orchestratorTokens: number; subAgentTokens: number }[];
}

interface AppInfo {
  id: number;
  name: string;
  slug: string;
  primary_color: string;
  description?: string;
  active: boolean;
}

interface ApiKeyStatus {
  key: string;
  reason: string;
  configured: boolean;
}

interface BackendTask {
  id: string;
  category: 'database' | 'api' | 'integration' | 'security' | 'data';
  title: string;
  description: string;
  status: 'pending' | 'done' | 'in-progress';
  priority: 'high' | 'medium' | 'low';
  implementation?: {
    type: 'db_seed' | 'api_route' | 'config' | 'schema';
    payload: Record<string, any>;
  };
}

interface QaIssue {
  id: string;
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  category: 'import' | 'type' | 'logic' | 'style' | 'naming' | 'api' | 'missing';
  title: string;
  description: string;
  autoFix?: string;
}

type Phase = 'setup' | 'planning' | 'pages' | 'generating' | 'results' | 'finalizing' | 'finalized' | 'qa-running' | 'qa-results' | 'documenting' | 'documented';

/* ─── Simple syntax highlighter ─────────────────────────────────────── */

function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  const highlighted = useMemo(() => {
    if (!code) return '';
    const isTsx = /tsx?|typescript|javascript|jsx/.test(language);
    if (!isTsx) return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Comments
      .replace(/(\/{2}.*$)/gm, '<span style="color:#6a9955">$1</span>')
      // Strings
      .replace(/('[^']*')/g, '<span style="color:#ce9178">$1</span>')
      .replace(/("[^"]*")/g, '<span style="color:#ce9178">$1</span>')
      .replace(/(`[^`]*`)/gs, '<span style="color:#ce9178">$1</span>')
      // Keywords
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|default|new|typeof|instanceof|async|await|try|catch|throw|class|extends|interface|type|enum)\b/g, '<span style="color:#c586c0">$1</span>')
      // JSX tags
      .replace(/(&lt;\/?)([A-Z]\w*)/g, '$1<span style="color:#4ec9b0">$2</span>')
      // Types after colon
      .replace(/(:\s*)(string|number|boolean|any|void|null|undefined|never|unknown)/g, '$1<span style="color:#4ec9b0">$2</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
      // true/false/null
      .replace(/\b(true|false|null|undefined)\b/g, '<span style="color:#569cd6">$1</span>');
  }, [code, language]);

  return (
    <pre
      style={{
        margin: 0,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
        fontSize: '0.82rem', lineHeight: 1.6, color: '#cdd6f4',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

/* ─── Phase stepper config ───────────────────────────────────────────── */

const PHASE_STEPS = [
  { key: 'setup', label: 'Setup' },
  { key: 'planning', label: 'Plan' },
  { key: 'pages', label: 'Pages' },
  { key: 'generating', label: 'Generate' },
  { key: 'results', label: 'Review' },
  { key: 'finalized', label: 'Finalize' },
  { key: 'qa-results', label: 'QA' },
  { key: 'documented', label: 'Docs' },
] as const;

function getStepIndex(phase: Phase): number {
  const map: Record<Phase, number> = {
    setup: 0, planning: 1, pages: 2, generating: 3, results: 4,
    finalizing: 5, finalized: 5, 'qa-running': 6, 'qa-results': 6,
    documenting: 7, documented: 7,
  };
  return map[phase] ?? 0;
}

/* ─── Page type icon helper ──────────────────────────────────────────────── */

function PageTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'dashboard': return <DashboardIcon sx={{ fontSize: 18 }} />;
    case 'profile': return <ProfileIcon sx={{ fontSize: 18 }} />;
    case 'support': return <SupportIcon sx={{ fontSize: 18 }} />;
    case 'settings': return <SettingsIcon sx={{ fontSize: 18 }} />;
    default: return <PagesIcon sx={{ fontSize: 18 }} />;
  }
}

/* ─── Main component ─────────────────────────────────────────────────── */

export function ProgrammerAgentPage() {
  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');

  // Setup state
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [prompt, setPrompt] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);

  // Model state
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [orchestratorModel, setOrchestratorModel] = useState('');
  const [subAgentModel, setSubAgentModel] = useState('');
  const [configured, setConfigured] = useState({ anthropic: false, openai: false, brave: false, apify: false });

  // Planning state
  const [pages, setPages] = useState<MembersPage[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{ query: string; results: { title: string; url: string; description: string }[] }[]>([]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [summary, setSummary] = useState('');
  const [tokensUsed, setTokensUsed] = useState<{ orchestrator: number; subAgent: number; total: number } | null>(null);
  const [activeFileTab, setActiveFileTab] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [splitView, setSplitView] = useState(false);

  // Chat panel state (same as Pages tab)
  const [chatPanelOpen, setChatPanelOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'design' | 'backend' | 'coder'>('design');
  const [designMessages, setDesignMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([]);
  const [backendMessages, setBackendMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([]);
  const [coderMessages, setCoderMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([]);
  // Active messages getter/setter based on current tab
  const chatMessages = chatMode === 'design' ? designMessages : chatMode === 'backend' ? backendMessages : coderMessages;
  const setChatMessages = chatMode === 'design' ? setDesignMessages : chatMode === 'backend' ? setBackendMessages : setCoderMessages;
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [coderHistory, setCoderHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [coderPendingFiles, setCoderPendingFiles] = useState<{ generated: any[]; modified: any[] }>({ generated: [], modified: [] });

  // Refine state
  const [refineDialog, setRefineDialog] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stats
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  // UI
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });
  const [showPlan, setShowPlan] = useState(true);
  const [addPageDialog, setAddPageDialog] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageDesc, setNewPageDesc] = useState('');

  // Finalize state
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [, setFinalizeLoading] = useState(false);
  const [finalizeSummary, setFinalizeSummary] = useState('');
  const [implementingTask, setImplementingTask] = useState<string | null>(null);
  const [implementingAll, setImplementingAll] = useState(false);

  // QA & Docs state
  const [qaIssues, setQaIssues] = useState<QaIssue[]>([]);
  const [qaSummary, setQaSummary] = useState('');
  const [, setQaLoading] = useState(false);
  const [fixingIssue, setFixingIssue] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [docsFiles, setDocsFiles] = useState<GeneratedFile[]>([]);
  const [, setDocsLoading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState(0);

  // Cost estimation
  const [costEstimate, setCostEstimate] = useState<{ estimatedTokens: number; estimatedCost: number; breakdown: { role: string; model: string; tokens: number; cost: number }[] } | null>(null);

  // Refinement history
  const [refineHistory, setRefineHistory] = useState<{ instruction: string; fileIndex: number; timestamp: string }[]>([]);

  // Retry state
  const [retryingSteps, setRetryingSteps] = useState<string[]>([]);

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const coderChatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll coder chat when messages change
  useEffect(() => {
    if (chatMode === 'coder' && coderChatEndRef.current) {
      coderChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [coderMessages, chatMode]);

  const selectedApp = apps.find(a => a.id === selectedAppId) || null;
  const primaryColor = selectedApp?.primary_color || '#667eea';

  // Load on mount
  useEffect(() => {
    loadModels();
    loadStats();
    loadApps();
    loadApiKeys();
  }, []);

  const loadApps = async () => {
    try {
      const res = await fetch(API.apps);
      const json = await res.json();
      const appList = Array.isArray(json) ? json : json.data || json.apps || [];
      setApps(appList.filter((a: AppInfo) => a.active));
    } catch { /* ignore */ }
  };

  const loadModels = async () => {
    try {
      const res = await fetch(`${API.programmerAgent}/models`);
      const data: ModelsResponse = await res.json();
      if (data.success) {
        setModels(data.models);
        setConfigured(data.configured);
        setOrchestratorModel(data.defaults.orchestrator);
        setSubAgentModel(data.defaults.subAgent);
      }
    } catch { /* ignore */ }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API.programmerAgent}/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* ignore */ }
  };

  const loadApiKeys = async () => {
    try {
      const res = await fetch(`${API.programmerAgent}/api-keys`);
      const data = await res.json();
      if (data.success) setApiKeys(data.keys);
    } catch { /* ignore */ }
  };

  const orchestratorModels = models.filter(m => m.tier === 'orchestrator' || m.tier === 'both');
  const subAgentModels = models.filter(m => m.tier === 'sub-agent' || m.tier === 'both');
  const noKeysConfigured = !configured.anthropic && !configured.openai;

  // Fetch cost estimate when pages change
  useEffect(() => {
    if (pages.length === 0 || !orchestratorModel || !subAgentModel) { setCostEstimate(null); return; }
    const enabled = pages.filter(p => p.enabled !== false);
    if (enabled.length === 0) { setCostEstimate(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API.programmerAgent}/estimate-cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: enabled.map(p => ({ id: p.id, type: p.type })), orchestratorModel, subAgentModel }),
        });
        const data = await res.json();
        setCostEstimate(data);
      } catch { setCostEstimate(null); }
    }, 300);
    return () => clearTimeout(timer);
  }, [pages, orchestratorModel, subAgentModel]);

  const activeStepIndex = getStepIndex(phase);
  const failedSteps = Array.isArray(plan) ? plan.filter((s: any) => s.status === 'failed') : [];

  /* ─── Plan Members Area ────────────────────────────────────────────── */

  const handlePlan = async () => {
    if (!prompt.trim() || !selectedAppId) return;
    setPlanLoading(true);
    setPhase('planning');

    try {
      const res = await fetch(`${API.programmerAgent}/plan-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          appId: selectedAppId,
          orchestratorModel: orchestratorModel || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPages(data.pages.map((p: MembersPage) => ({ ...p, enabled: true })));
        setApiKeys(data.apiKeysNeeded || []);
        setSearchResults(data.searchResults || []);
        setPhase('pages');
        setSnack({ open: true, msg: `AI suggested ${data.pages.length} pages for the members area`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Planning failed', severity: 'error' });
        setPhase('setup');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('setup');
    } finally {
      setPlanLoading(false);
    }
  };

  /* ─── Generate Members Area ────────────────────────────────────────── */

  const handleGenerate = useCallback(async () => {
    if (generating) return;
    const enabledPages = pages.filter(p => p.enabled !== false);
    if (enabledPages.length === 0) {
      setSnack({ open: true, msg: 'Select at least one page', severity: 'error' });
      return;
    }

    setGenerating(true);
    setPhase('generating');
    setFiles([]);
    setPlan([]);
    setSummary('');
    setTokensUsed(null);
    setActiveFileTab(0);

    try {
      const res = await fetch(`${API.programmerAgent}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          targetType: 'members-area',
          appId: selectedAppId || undefined,
          orchestratorModel: orchestratorModel || undefined,
          subAgentModel: subAgentModel || undefined,
          pages: enabledPages,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPlan(data.plan || []);
        setFiles(data.files || []);
        setSummary(data.summary || '');
        setTokensUsed(data.tokensUsed || null);
        setSearchResults(data.searchResults || []);
        setPhase('results');
        setSnack({ open: true, msg: `Generated ${data.files?.length || 0} files — ${(data.tokensUsed?.total || 0).toLocaleString()} tokens`, severity: 'success' });
        loadStats();
      } else {
        setSnack({ open: true, msg: data.error || 'Generation failed', severity: 'error' });
        setPhase('pages');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('pages');
    } finally {
      setGenerating(false);
    }
  }, [prompt, selectedAppId, orchestratorModel, subAgentModel, pages, generating]);

  /* ─── Refine ───────────────────────────────────────────────────────── */

  const handleRefine = async () => {
    if (!refineInstruction.trim() || refining) return;
    setRefining(true);
    try {
      const res = await fetch(`${API.programmerAgent}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: refineInstruction.trim(),
          files,
          fileIndex: activeFileTab,
          model: orchestratorModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.file) {
        const updated = [...files];
        updated[activeFileTab] = data.file;
        setFiles(updated);
        setRefineHistory(prev => [...prev, { instruction: refineInstruction.trim(), fileIndex: activeFileTab, timestamp: new Date().toISOString() }]);
        setSnack({ open: true, msg: 'File refined successfully', severity: 'success' });
        setRefineDialog(false);
        setRefineInstruction('');
      } else {
        setSnack({ open: true, msg: data.error || 'Refine failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setRefining(false);
    }
  };

  /* ─── Chat Panel: Design & Backend (same as Pages tab) ──────────── */

  const handleChatSend = async (directMessage?: string) => {
    const msgText = directMessage || chatInput;
    if (!msgText.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: msgText };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      if (chatMode === 'design') {
        // Design mode: refine the active file via the refine endpoint
        const res = await fetch(`${API.programmerAgent}/refine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction: msgText.trim(),
            files,
            fileIndex: activeFileTab,
            model: orchestratorModel || undefined,
          }),
        });
        const data = await res.json();
        if (data.success && data.file) {
          const updated = [...files];
          updated[activeFileTab] = data.file;
          setFiles(updated);
          setRefineHistory(prev => [...prev, { instruction: msgText.trim(), fileIndex: activeFileTab, timestamp: new Date().toISOString() }]);
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `\u2705 Updated ${files[activeFileTab]?.path.split('/').pop()}. The preview has been refreshed with your changes.`,
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `\u26a0\ufe0f ${data.error || 'Could not apply the change. Try rephrasing your request.'}`,
          }]);
        }
      } else if (chatMode === 'backend') {
        // Backend mode: analyze or implement backend tasks
        if (!backendTasks.length || msgText.toLowerCase().includes('analyze') || msgText.toLowerCase().includes('scan') || msgText.toLowerCase().includes('what')) {
          // Run finalize to get backend tasks
          const res = await fetch(`${API.programmerAgent}/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files,
              appId: selectedAppId || undefined,
              model: orchestratorModel || undefined,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setBackendTasks(data.tasks || []);
            const taskList = (data.tasks || []).map((t: any) => `${t.status === 'done' ? '\u2705' : '\u23f3'} ${t.title} (${t.category} / ${t.priority})`).join('\n');
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `Found ${data.tasks?.length || 0} backend tasks:\n\n${taskList}\n\nI can auto-implement tasks marked \u26a1. Say "implement all" or click individual tasks.`,
            }]);
          } else {
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `\u26a0\ufe0f ${data.error || 'Could not analyze backend tasks.'}`,
            }]);
          }
        } else if (msgText.toLowerCase().includes('implement all') || msgText.toLowerCase().includes('implement everything')) {
          // Implement all auto tasks
          const res = await fetch(`${API.programmerAgent}/implement-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: backendTasks, appId: selectedAppId || undefined }),
          });
          const data = await res.json();
          if (data.success) {
            setBackendTasks(data.tasks || backendTasks);
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `\u2705 Implemented ${data.implemented || 0} tasks. ${data.failed || 0} failed. ${data.skipped || 0} skipped (manual).`,
            }]);
          }
        } else {
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Try asking:\n\u2022 "What backend tasks does this need?"\n\u2022 "Implement all auto tasks"\n\u2022 Or click individual tasks in the task list above.',
          }]);
        }
      } else if (chatMode === 'coder') {
        // Coder Agent: autonomous builder with SSE streaming for live progress
        const activeFile = files[activeFileTab] || null;
        const res = await fetch(`${API.programmerAgent}/coder-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msgText.trim(),
            files,
            activeFile: activeFile ? { path: activeFile.path, description: activeFile.description } : undefined,
            conversationHistory: coderHistory,
            appId: selectedAppId || undefined,
            model: orchestratorModel || undefined,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error (${res.status}). Make sure the backend is running.`);
        }

        // Process SSE stream — show live progress as the agent works
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';

        if (!reader) throw new Error('No response stream');

        // Tracking ID for updating the "working" message in-place
        const workingMsgId = `working-${Date.now()}`;
        let workingLines: string[] = [];

        const updateWorkingMessage = (lines: string[]) => {
          workingLines = lines;
          setCoderMessages(prev => {
            const existing = prev.findIndex(m => m.id === workingMsgId);
            const msg = { id: workingMsgId, role: 'assistant' as const, content: lines.join('\n') };
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = msg;
              return updated;
            }
            return [...prev, msg];
          });
        };

        const appendWorkingLine = (line: string) => {
          updateWorkingMessage([...workingLines, line]);
        };

        let finalData: any = null;

        // Read SSE events
        let reading = true;
        while (reading) {
          const { value, done } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const evt of events) {
            if (!evt.trim()) continue;
            const eventMatch = evt.match(/^event:\s*(.+)$/m);
            const dataMatch = evt.match(/^data:\s*(.+)$/m);
            if (!eventMatch || !dataMatch) continue;

            const eventType = eventMatch[1].trim();
            let eventData: any;
            try { eventData = JSON.parse(dataMatch[1]); } catch { continue; }

            switch (eventType) {
              case 'plan': {
                // Show which file(s) the agent is targeting
                const targets = eventData.targetFiles?.length > 0
                  ? eventData.targetFiles.map((f: string) => f.split('/').pop()).join(', ')
                  : eventData.activeFile?.split('/').pop() || null;
                const targetLine = targets ? `\n📄 **Working on:** ${targets}` : '';
                const planLines = (eventData.steps || []).map((s: any) => `  ${s.id}. ${s.title}`);
                appendWorkingLine(`🛠️ **Plan:** ${eventData.summary}${targetLine}\n${planLines.join('\n')}`);
                break;
              }
              case 'step_start': {
                appendWorkingLine(`\n⏳ ${eventData.title}...`);
                break;
              }
              case 'step_complete': {
                // Replace the last "⏳ title..." line with the completed version
                const icon = eventData.status === 'done' ? '✅' : '❌';
                let lastPendingIdx = -1;
                for (let i = workingLines.length - 1; i >= 0; i--) {
                  if (workingLines[i].includes(`⏳ ${eventData.title}`)) { lastPendingIdx = i; break; }
                }
                if (lastPendingIdx >= 0) {
                  workingLines[lastPendingIdx] = `${icon} ${eventData.title} — ${eventData.detail || ''}`;
                  updateWorkingMessage([...workingLines]);
                } else {
                  appendWorkingLine(`${icon} ${eventData.title} — ${eventData.detail || ''}`);
                }
                break;
              }
              case 'progress': {
                appendWorkingLine(eventData.message);
                break;
              }
              case 'result': {
                finalData = eventData;
                break;
              }
              case 'error': {
                appendWorkingLine(`\n❌ ${eventData.message}`);
                break;
              }
              case 'done': {
                reading = false;
                break;
              }
            }
          }
        }

        // Process the final result data
        if (finalData) {
          // Update conversation history
          setCoderHistory(prev => [
            ...prev,
            { role: 'user' as const, content: msgText.trim() },
            { role: 'assistant' as const, content: finalData.response || 'No response' },
          ]);

          // Auto-apply files so the preview updates immediately
          if (finalData.generatedFiles?.length > 0 || finalData.modifiedFiles?.length > 0) {
            const genFiles = finalData.generatedFiles || [];
            const modFiles = finalData.modifiedFiles || [];

            // Merge into files state (same logic as "Apply All" button)
            setFiles(prev => {
              const updated = [...prev];
              for (const gf of genFiles) {
                const idx = updated.findIndex(f => f.path === gf.path);
                if (idx >= 0) updated[idx] = gf;
                else updated.push(gf);
              }
              for (const mf of modFiles) {
                const idx = updated.findIndex(f => f.path === mf.path);
                if (idx >= 0) updated[idx] = mf;
                else updated.push(mf);
              }

              // Auto-switch to the first changed file tab so user sees it
              const firstChanged = modFiles[0] || genFiles[0];
              if (firstChanged) {
                const changedIdx = updated.findIndex(f => f.path === firstChanged.path);
                if (changedIdx >= 0) {
                  setTimeout(() => {
                    setActiveFileTab(changedIdx);
                    setShowPreview(false); // Switch to code view so changes are visible
                  }, 100);
                }
              }

              return updated;
            });

            // Also store as pending so the banner shows what was applied
            setCoderPendingFiles({
              generated: genFiles,
              modified: modFiles,
            });
          }

          // Add final summary as a separate message
          if (finalData.response) {
            setCoderMessages(prev => [...prev, {
              id: `summary-${Date.now()}`,
              role: 'assistant',
              content: finalData.success ? finalData.response : `⚠️ ${finalData.response}`,
            }]);
          }
        }
      }
    } catch (err) {
      setCoderMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${err instanceof Error ? err.message : 'Network error'}`,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleImplementSingleTask = async (task: BackendTask) => {
    setChatLoading(true);
    try {
      const res = await fetch(`${API.programmerAgent}/implement-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, appId: selectedAppId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' as const } : t));
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `\u2705 ${task.title} — implemented successfully.`,
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `\u26a0\ufe0f ${task.title} — ${data.error || 'implementation failed'}.`,
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `\u274c ${task.title} — ${err instanceof Error ? err.message : 'network error'}.`,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ─── Retry Failed ─────────────────────────────────────────────────── */

  const handleRetryFailed = async () => {
    if (failedSteps.length === 0) return;
    setRetryingSteps(failedSteps.map(s => s.title));
    setPhase('generating');
    try {
      const enabledPages = pages.filter(p => p.enabled !== false);
      const res = await fetch(`${API.programmerAgent}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          targetType: 'members-area',
          appId: selectedAppId || undefined,
          orchestratorModel: orchestratorModel || undefined,
          subAgentModel: subAgentModel || undefined,
          pages: enabledPages,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.plan) setPlan(data.plan);
        if (data.files) setFiles(data.files);
        if (data.summary) setSummary(data.summary);
        if (data.tokensUsed) setTokensUsed(data.tokensUsed);
        setPhase('results');
        setSnack({ open: true, msg: 'Retry completed successfully', severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Retry failed', severity: 'error' });
        setPhase('results');
      }
    } catch (e: any) {
      setSnack({ open: true, msg: e.message || 'Network error', severity: 'error' });
      setPhase('results');
    } finally {
      setRetryingSteps([]);
    }
  };

  /* ─── Save ─────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    if (files.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API.programmerAgent}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      const data = await res.json();
      if (data.success) {
        setSnack({ open: true, msg: `Saved ${data.saved?.length || 0} file(s) to project`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: `Some files failed: ${data.errors?.join(', ')}`, severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnack({ open: true, msg: 'Copied to clipboard', severity: 'info' });
  };

  /* ─── Finalize: analyze backend needs ──────────────────────────────── */

  const handleFinalize = async () => {
    if (files.length === 0) return;
    setFinalizeLoading(true);
    setPhase('finalizing');
    setBackendTasks([]);
    setFinalizeSummary('');

    try {
      const res = await fetch(`${API.programmerAgent}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          appId: selectedAppId || undefined,
          model: subAgentModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(data.tasks || []);
        setFinalizeSummary(data.summary || '');
        setPhase('finalized');
        const autoCount = (data.tasks || []).filter((t: BackendTask) => t.status === 'pending' && t.implementation).length;
        setSnack({ open: true, msg: `Found ${data.tasks?.length || 0} backend tasks — ${autoCount} can be auto-implemented`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Analysis failed', severity: 'error' });
        setPhase('results');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('results');
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handleImplementTask = async (task: BackendTask) => {
    setImplementingTask(task.id);
    try {
      const res = await fetch(`${API.programmerAgent}/implement-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, appId: selectedAppId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' as const } : t));
        setSnack({ open: true, msg: data.message, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.message || 'Implementation failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setImplementingTask(null);
    }
  };

  const handleImplementAll = async () => {
    const pendingAuto = backendTasks.filter(t => t.status === 'pending' && t.implementation);
    if (pendingAuto.length === 0) return;
    setImplementingAll(true);

    try {
      const res = await fetch(`${API.programmerAgent}/implement-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: backendTasks, appId: selectedAppId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBackendTasks(data.tasks || backendTasks);
        const successCount = (data.results || []).filter((r: any) => r.success).length;
        setSnack({ open: true, msg: `Implemented ${successCount} task(s) successfully`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: 'Some tasks failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setImplementingAll(false);
    }
  };

  /* ─── QA Agent handlers ────────────────────────────────────────────── */

  const handleQaReview = async () => {
    if (files.length === 0) return;
    setQaLoading(true);
    setPhase('qa-running');
    setQaIssues([]);
    setQaSummary('');

    try {
      const res = await fetch(`${API.programmerAgent}/qa-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          appId: selectedAppId || undefined,
          model: subAgentModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQaIssues(data.issues || []);
        setQaSummary(data.summary || '');
        setPhase('qa-results');
        const errCount = (data.issues || []).filter((i: QaIssue) => i.severity === 'error').length;
        setSnack({
          open: true,
          msg: errCount > 0
            ? `QA found ${errCount} error(s) — review and fix below`
            : data.issues?.length > 0
              ? 'QA passed with minor suggestions'
              : 'All files passed QA!',
          severity: errCount > 0 ? 'error' : 'success',
        });
      } else {
        setSnack({ open: true, msg: data.error || 'QA review failed', severity: 'error' });
        setPhase('finalized');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('finalized');
    } finally {
      setQaLoading(false);
    }
  };

  const handleQaFix = async (issue: QaIssue) => {
    setFixingIssue(issue.id);
    try {
      const res = await fetch(`${API.programmerAgent}/qa-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          issue,
          model: orchestratorModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.file) {
        setFiles(prev => prev.map(f => f.path === issue.file ? data.file : f));
        setQaIssues(prev => prev.filter(i => i.id !== issue.id));
        setSnack({ open: true, msg: `Fixed: ${issue.title}`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Fix failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setFixingIssue(null);
    }
  };

  const handleQaFixAll = async () => {
    const fixable = qaIssues.filter(i => i.autoFix && i.severity !== 'info');
    if (fixable.length === 0) return;
    setFixingAll(true);

    try {
      const res = await fetch(`${API.programmerAgent}/qa-fix-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          issues: fixable,
          model: orchestratorModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || files);
        setQaIssues(prev => prev.filter(i => !data.fixed?.includes(i.id)));
        setSnack({ open: true, msg: `Fixed ${data.fixed?.length || 0} issue(s)`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: 'Some fixes failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setFixingAll(false);
    }
  };

  const handleGenerateDocs = async () => {
    if (files.length === 0) return;
    setDocsLoading(true);
    setPhase('documenting');
    setDocsFiles([]);

    try {
      const res = await fetch(`${API.programmerAgent}/generate-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          appId: selectedAppId || undefined,
          backendTasks: backendTasks.length > 0 ? backendTasks : undefined,
          model: subAgentModel || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocsFiles(data.docs || []);
        setPhase('documented');
        setSnack({ open: true, msg: `Generated ${data.docs?.length || 0} documentation file(s)`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Docs generation failed', severity: 'error' });
        setPhase('qa-results');
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
      setPhase('qa-results');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleSaveDocs = async () => {
    if (docsFiles.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API.programmerAgent}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: docsFiles }),
      });
      const data = await res.json();
      if (data.success) {
        setSnack({ open: true, msg: `Saved ${docsFiles.length} doc file(s)`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Save failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Add custom page ──────────────────────────────────────────────── */

  const handleAddPage = () => {
    if (!newPageName.trim()) return;
    const id = newPageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setPages(prev => [...prev, {
      id,
      name: newPageName.trim(),
      description: newPageDesc.trim() || `${newPageName.trim()} page`,
      type: 'custom',
      required: false,
      enabled: true,
    }]);
    setNewPageName('');
    setNewPageDesc('');
    setAddPageDialog(false);
  };

  /* ─── Preview (same approach as Pages tab — inline RenderPage) ──── */

  const canPreview = !!(files[activeFileTab]?.path?.match(/\.(tsx|jsx)$/));

  const previewData = useMemo(() => {
    if (!files.length || !files[activeFileTab]) return null;
    const file = files[activeFileTab];
    const ctx: PreviewContext = {
      appName: selectedApp?.name || 'My App',
      appDescription: selectedApp?.description || '',
      prompt,
      pages: pages.map(p => ({ name: p.name, description: p.description, type: p.type })),
      allFiles: files,
    };
    return generatePreviewData(file, selectedApp?.name, ctx);
  }, [files, activeFileTab, selectedApp, prompt, pages]);

  /* ─── Render ───────────────────────────────────────────────────────── */

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AgentIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>Members Area Builder</Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered multi-page members area generation. Describe your app and let the agent build complete, styled HTML pages with login flows, dashboards, and content sections — ready to deploy.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {phase === 'results' && (
            <Button variant="outlined" size="small" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); }}>
              New Build
            </Button>
          )}
          <Button variant="outlined" size="small" startIcon={<TokenIcon />} onClick={() => setShowStats(!showStats)}>
            Usage Stats
          </Button>
        </Box>
      </Box>

      {/* Phase Stepper */}
      {phase !== 'setup' && (
        <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ mb: 3 }}>
          {PHASE_STEPS.map((s) => (
            <Step key={s.key}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem', fontWeight: 600 } }}>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* API key warning */}
      {noKeysConfigured && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          No AI API keys configured. Go to <strong>Settings → API Keys</strong> and add Anthropic or OpenAI.
        </Alert>
      )}

      {/* Stats panel */}
      <Collapse in={showStats}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '1rem' }}>Usage Statistics</Typography>
          {stats ? (
            <Grid container spacing={3}>
              {[
                { label: 'Sessions', value: stats.sessions, color: primaryColor },
                { label: 'Total Tokens', value: stats.totalTokens.toLocaleString(), color: primaryColor },
                { label: 'Orchestrator', value: stats.orchestratorTokens.toLocaleString(), color: '#764ba2' },
                { label: 'Sub-Agent', value: stats.subAgentTokens.toLocaleString(), color: '#4caf50' },
              ].map(s => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">No usage data yet.</Typography>
          )}
        </Paper>
      </Collapse>

      {/* ─── PHASE: SETUP ─────────────────────────────────────────────── */}
      {(phase === 'setup' || phase === 'planning') && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3 }}>
          {/* Left: prompt + project */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                Describe the members area you want to build
              </Typography>
              <TextField
                inputRef={promptRef}
                multiline
                minRows={5}
                maxRows={14}
                fullWidth
                placeholder={"Describe what the members area should include:\n\ne.g. A fishing community members area with a dashboard showing catch stats, a lessons library with video tutorials, a community forum feed, and a tackle shop with product listings"}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.9rem' } }}
              />

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Project *</InputLabel>
                  <Select
                    value={selectedAppId}
                    label="Select Project *"
                    onChange={(e) => setSelectedAppId(e.target.value as number | '')}
                    renderValue={(val) => {
                      const app = apps.find(a => a.id === val);
                      if (!app) return 'Select a project';
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: app.primary_color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <span>{app.name}</span>
                        </Box>
                      );
                    }}
                  >
                    {apps.map(app => (
                      <MenuItem key={app.id} value={app.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: app.primary_color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <span>{app.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={handlePlan}
                  disabled={!prompt.trim() || !selectedAppId || planLoading || noKeysConfigured}
                  startIcon={planLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  sx={{
                    ml: 'auto',
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                    fontWeight: 700, px: 3, borderRadius: 2, textTransform: 'none',
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  {planLoading ? 'Planning…' : 'Plan Members Area'}
                </Button>
              </Box>

              {selectedApp && (
                <Box sx={{
                  mt: 2, p: 1.5, borderRadius: 2,
                  bgcolor: `${primaryColor}08`, border: `1px solid ${primaryColor}25`,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 2, bgcolor: primaryColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                    {selectedApp.name.charAt(0).toUpperCase()}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Building for: {selectedApp.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All pages will match this app's colour scheme ({primaryColor})
                    </Typography>
                  </Box>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: primaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                </Box>
              )}
            </Paper>

            {/* Model configuration */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Model Configuration</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <OrchestratorIcon sx={{ fontSize: 16, color: '#764ba2' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Orchestrator (complex pages)</Typography>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <Select value={orchestratorModel} onChange={(e) => setOrchestratorModel(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                      {orchestratorModels.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{m.name}</span>
                            <Chip label={`$${m.costPer1kTokens}/1k`} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <SpeedIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Sub-Agent (types, styles, simple pages)</Typography>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <Select value={subAgentModel} onChange={(e) => setSubAgentModel(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                      {subAgentModels.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{m.name}</span>
                            <Chip label={`$${m.costPer1kTokens}/1k`} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Right: API keys status */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <KeyIcon sx={{ fontSize: 18, color: primaryColor }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>API Keys Status</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {apiKeys.map(k => (
                  <Box key={k.key} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                    bgcolor: k.configured ? 'rgba(76,175,80,0.04)' : 'rgba(255,152,0,0.04)',
                    border: `1px solid ${k.configured ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)'}`,
                  }}>
                    {k.configured
                      ? <ConfiguredIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                      : <MissingIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                    }
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize' }}>
                        {k.key}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{k.reason}</Typography>
                    </Box>
                    <Chip
                      label={k.configured ? 'Ready' : 'Missing'}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 600,
                        bgcolor: k.configured ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
                        color: k.configured ? '#4caf50' : '#ff9800',
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Configure keys in <strong>Settings → Integration Keys</strong>
              </Typography>
            </Paper>

            {/* Tools panel */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Agent Tools</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <BraveIcon sx={{ fontSize: 18, color: configured.brave ? '#4caf50' : '#999' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Brave Search</Typography>
                    <Typography variant="caption" color="text.secondary">Searches docs & best practices</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <ApifyIcon sx={{ fontSize: 18, color: configured.apify ? '#4caf50' : '#999' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Apify Scraper</Typography>
                    <Typography variant="caption" color="text.secondary">Web scraping & data collection</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1 }}>
                  <OrchestratorIcon sx={{ fontSize: 18, color: primaryColor }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Multi-Agent System</Typography>
                    <Typography variant="caption" color="text.secondary">Orchestrator + sub-agents for cost efficiency</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* What gets built */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Minimum Pages</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {[
                  { icon: <DashboardIcon sx={{ fontSize: 16 }} />, label: 'Dashboard', desc: 'Stats & overview' },
                  { icon: <ProfileIcon sx={{ fontSize: 16 }} />, label: 'Profile', desc: 'User management' },
                  { icon: <SupportIcon sx={{ fontSize: 16 }} />, label: 'Support', desc: 'Help & tickets' },
                  { icon: <SettingsIcon sx={{ fontSize: 16 }} />, label: 'Settings', desc: 'Preferences' },
                ].map(p => (
                  <Box key={p.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.8 }}>
                    <Box sx={{ color: primaryColor }}>{p.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', flex: 1 }}>{p.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.desc}</Typography>
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  + AI suggests additional pages based on your description
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: PAGES (review & edit AI-suggested pages) ──────────── */}
      {phase === 'pages' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${primaryColor}20` }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Members Area Pages ({pages.filter(p => p.enabled !== false).length} selected)
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAddPageDialog(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Add Page
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pages.map((page, idx) => (
                  <Box key={page.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2,
                    bgcolor: page.enabled !== false ? `${primaryColor}04` : '#fafafa',
                    border: `1px solid ${page.enabled !== false ? `${primaryColor}15` : 'rgba(0,0,0,0.06)'}`,
                    opacity: page.enabled !== false ? 1 : 0.5,
                    transition: 'all 0.15s',
                  }}>
                    <Checkbox
                      checked={page.enabled !== false}
                      disabled={page.required}
                      onChange={(e) => {
                        const updated = [...pages];
                        updated[idx] = { ...page, enabled: e.target.checked };
                        setPages(updated);
                      }}
                      sx={{ p: 0.5, color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                      size="small"
                    />
                    <Box sx={{ color: primaryColor, display: 'flex' }}>
                      <PageTypeIcon type={page.type} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{page.name}</Typography>
                        {page.required && (
                          <Chip label="Required" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: `${primaryColor}10`, color: primaryColor }} />
                        )}
                        {!page.required && (
                          <Chip label="AI Suggested" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(156,39,176,0.08)', color: '#9c27b0' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{page.description}</Typography>
                    </Box>
                    {!page.required && (
                      <IconButton size="small" onClick={() => setPages(pages.filter((_, i) => i !== idx))}
                        sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Cost Estimation */}
              {costEstimate && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#f0f7ff', border: '1px solid #bbdefb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CostIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.85rem' }}>
                      Est. Cost: ${costEstimate.estimatedCost}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (~{costEstimate.estimatedTokens?.toLocaleString()} tokens)
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {costEstimate.breakdown?.map((b: any) => `${b.page}: ~${b.tokens} tok`).join(' · ')}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setPhase('setup')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={generating || pages.filter(p => p.enabled !== false).length === 0}
                  startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  sx={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                    fontWeight: 700, px: 4, borderRadius: 2, textTransform: 'none',
                    '&:hover': { opacity: 0.9 },
                  }}
                >
                  Generate {pages.filter(p => p.enabled !== false).length} Pages
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Right: search results if available */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {searchResults.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SearchIcon sx={{ fontSize: 18, color: primaryColor }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Web Research</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {searchResults.flatMap(s => s.results).slice(0, 5).map((r, i) => (
                    <Box key={i} sx={{ p: 1, borderRadius: 1, border: '1px solid rgba(0,0,0,0.04)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: primaryColor }}>
                        <a href={r.url} target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>{r.title}</a>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                  Powered by Brave Search — used as context for AI generation
                </Typography>
              </Paper>
            )}

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>Generation Plan</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                The agent will:<br />
                1. Generate shared types & sidebar layout<br />
                2. Build each page (complex → orchestrator, simple → sub-agent)<br />
                3. Create a router to connect all pages<br />
                4. Match {selectedApp?.name}'s colour scheme
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: GENERATING ─────────────────────────────────────────── */}
      {phase === 'generating' && (
        <Paper sx={{ p: 4, borderRadius: 3, border: `1px solid ${primaryColor}25` }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={24} sx={{ color: primaryColor }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, fontSize: '1.1rem' }}>
              Generating Members Area…
            </Typography>
          </Box>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, mb: 3,
            bgcolor: `${primaryColor}15`,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` },
          }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Building {pages.filter(p => p.enabled !== false).length} pages for {selectedApp?.name}…
            This may take 1-3 minutes depending on the number of pages.
          </Typography>

          {plan.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {plan.map(step => (
                <Box key={step.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  bgcolor: step.status === 'complete' ? 'rgba(76,175,80,0.04)' :
                           step.status === 'running' ? `${primaryColor}04` : 'transparent',
                }}>
                  {step.status === 'complete' ? <DoneIcon sx={{ fontSize: 18, color: '#4caf50' }} /> :
                   step.status === 'failed' ? <ErrorIcon sx={{ fontSize: 18, color: '#f44336' }} /> :
                   step.status === 'running' ? <RunningIcon sx={{ fontSize: 18, color: primaryColor }} /> :
                   <PendingIcon sx={{ fontSize: 18, color: '#999' }} />}
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{step.title}</Typography>
                  <Chip
                    label={step.agent === 'orchestrator' ? 'Orchestrator' : 'Sub-Agent'}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.65rem', fontWeight: 600,
                      bgcolor: step.agent === 'orchestrator' ? 'rgba(118,75,162,0.1)' : 'rgba(76,175,80,0.1)',
                      color: step.agent === 'orchestrator' ? '#764ba2' : '#4caf50',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* ─── PHASE: RESULTS ────────────────────────────────────────────── */}
      {phase === 'results' && files.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: chatPanelOpen ? '280px 1fr 380px' : '280px 1fr', gap: 2, transition: 'grid-template-columns 0.3s' }}>
          {/* Left: file list + plan */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Summary */}
            {summary && (
              <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${primaryColor}15`, bgcolor: `${primaryColor}02` }} elevation={0}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: primaryColor, fontSize: '0.85rem' }}>{summary}</Typography>
              </Paper>
            )}

            {/* Generated files list */}
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Generated Files ({files.length})
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {files.map((f, i) => (
                  <Box
                    key={i}
                    onClick={() => { setActiveFileTab(i); }}
                    sx={{
                      px: 2, py: 1.5, cursor: 'pointer',
                      bgcolor: i === activeFileTab ? `${primaryColor}08` : 'transparent',
                      borderLeft: i === activeFileTab ? `3px solid ${primaryColor}` : '3px solid transparent',
                      borderBottom: '1px solid rgba(0,0,0,0.03)',
                      '&:hover': { bgcolor: `${primaryColor}05` },
                      transition: 'all 0.1s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon sx={{ fontSize: 14, color: i === activeFileTab ? primaryColor : '#999' }} />
                      <Typography variant="body2" sx={{
                        fontWeight: i === activeFileTab ? 700 : 500,
                        fontSize: '0.78rem',
                        color: i === activeFileTab ? primaryColor : 'text.primary',
                      }}>
                        {f.path.split('/').pop()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 3, fontSize: '0.68rem' }}>
                      {f.path}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Plan */}
            {plan.length > 0 && (
              <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, cursor: 'pointer' }}
                  onClick={() => setShowPlan(!showPlan)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Execution Plan</Typography>
                  {showPlan ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                </Box>
                <Collapse in={showPlan}>
                  <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {plan.map(step => (
                      <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        {step.status === 'complete' ? <DoneIcon sx={{ fontSize: 14, color: '#4caf50' }} /> :
                         step.status === 'failed' ? <ErrorIcon sx={{ fontSize: 14, color: '#f44336' }} /> :
                         <PendingIcon sx={{ fontSize: 14, color: '#999' }} />}
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{step.title}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            )}

            {/* Token usage */}
            {tokensUsed && (
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Token Usage</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<OrchestratorIcon />} label={tokensUsed.orchestrator.toLocaleString()} size="small"
                    sx={{ bgcolor: 'rgba(118,75,162,0.1)', color: '#764ba2', fontWeight: 600, fontSize: '0.7rem' }} />
                  <Chip icon={<SpeedIcon />} label={tokensUsed.subAgent.toLocaleString()} size="small"
                    sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', fontWeight: 600, fontSize: '0.7rem' }} />
                  <Chip label={`Total: ${tokensUsed.total.toLocaleString()}`} size="small"
                    sx={{ bgcolor: `${primaryColor}15`, color: primaryColor, fontWeight: 600, fontSize: '0.7rem' }} />
                </Box>
              </Paper>
            )}

            {/* Save All button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {saving ? 'Saving…' : `Save All ${files.length} Files`}
              </Button>
              {failedSteps.length > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  color="warning"
                  startIcon={retryingSteps.length > 0 ? <CircularProgress size={16} color="inherit" /> : <RetryIcon />}
                  onClick={handleRetryFailed}
                  disabled={retryingSteps.length > 0}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2 }}
                >
                  {retryingSteps.length > 0 ? 'Retrying…' : `Retry ${failedSteps.length} Failed`}
                </Button>
              )}
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FinalizeIcon />}
                onClick={handleFinalize}
                sx={{
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  borderColor: primaryColor, color: primaryColor,
                  '&:hover': { borderColor: primaryColor, bgcolor: `${primaryColor}08` },
                }}
              >
                Finalize &amp; Wire Up Backend
              </Button>
            </Box>
          </Box>

          {/* Right: code/preview viewer with browser chrome (same pattern as Pages tab) */}
          <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f7' }} elevation={0}>

            {/* ─── Browser Chrome (same as Pages tab) ─── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#e8e8ec', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              {/* Traffic lights */}
              <Box sx={{ display: 'flex', gap: 0.6, mr: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57', border: '1px solid #e0443e' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffbd2e', border: '1px solid #dea123' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840', border: '1px solid #1aab29' }} />
              </Box>

              {/* Address bar */}
              <Box sx={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2,
                px: 1.5, py: 0.5, mx: 1,
              }}>
                <SecurityIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#555', fontSize: '0.72rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  https://{selectedApp?.slug || 'app'}.example.com/{files[activeFileTab]?.path.split('/').pop()?.replace(/\.(tsx|jsx)$/, '').toLowerCase().replace(/page$/, '') || ''}
                </Typography>
              </Box>

              {/* View mode toggles: Preview / Code / Split */}
              <Box sx={{ display: 'flex', gap: 0.3, bgcolor: '#d8d8dc', borderRadius: 1.5, p: 0.3 }}>
                <Tooltip title="Preview">
                  <IconButton size="small" onClick={() => { setShowPreview(true); setSplitView(false); }}
                    sx={{ bgcolor: showPreview && !splitView ? '#fff' : 'transparent', borderRadius: 1, width: 28, height: 28, boxShadow: showPreview && !splitView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <PreviewIcon sx={{ fontSize: 15, color: showPreview && !splitView ? primaryColor : '#888' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Code">
                  <IconButton size="small" onClick={() => { setShowPreview(false); setSplitView(false); }}
                    sx={{ bgcolor: !showPreview && !splitView ? '#fff' : 'transparent', borderRadius: 1, width: 28, height: 28, boxShadow: !showPreview && !splitView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    <CodeIcon sx={{ fontSize: 15, color: !showPreview && !splitView ? primaryColor : '#888' }} />
                  </IconButton>
                </Tooltip>
                {canPreview && (
                  <Tooltip title="Split View">
                    <IconButton size="small" onClick={() => { setSplitView(!splitView); setShowPreview(true); }}
                      sx={{ bgcolor: splitView ? '#fff' : 'transparent', borderRadius: 1, width: 28, height: 28, boxShadow: splitView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                      <SplitIcon sx={{ fontSize: 15, color: splitView ? primaryColor : '#888' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* ─── Toolbar ─── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.8, bgcolor: '#f0f0f3', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon sx={{ fontSize: 14, color: primaryColor }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#444' }}>
                  {files[activeFileTab]?.path.split('/').pop()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.68rem' }}>
                  {files[activeFileTab]?.path}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Refine this file">
                  <IconButton size="small" onClick={() => setRefineDialog(true)} sx={{ color: '#888' }}>
                    <RefineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy code">
                  <IconButton size="small" onClick={() => copyToClipboard(files[activeFileTab]?.content || '')} sx={{ color: '#888' }}>
                    <CopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* ─── Content: Preview / Code / Split (uses RenderPage like Pages tab) ─── */}
            {splitView && canPreview ? (
              /* Split view: preview left, code right */
              <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 580 }}>
                <Box sx={{ bgcolor: '#e8eaed', display: 'flex', justifyContent: 'center', overflow: 'auto', p: 2, borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                  <Box sx={{
                    width: '100%', maxWidth: 900, bgcolor: '#fff', borderRadius: '10px', overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
                    height: 'fit-content', minHeight: 500,
                  }}>
                    <Box sx={{ p: 3, overflow: 'auto', bgcolor: '#fff', flexGrow: 1 }}>
                      <PreviewErrorBoundary>
                        {previewData && <RenderPage data={previewData.data} primaryColor={primaryColor} appId={selectedApp?.id} />}
                      </PreviewErrorBoundary>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ overflow: 'auto', bgcolor: '#1e1e2e', p: 2, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#444', borderRadius: 3 } }}>
                  <SyntaxHighlight code={files[activeFileTab]?.content || ''} language="tsx" />
                </Box>
              </Box>
            ) : showPreview && canPreview && previewData ? (
              /* Full preview (same layout as Pages tab) */
              <Box sx={{ flex: 1, bgcolor: '#e8eaed', display: 'flex', justifyContent: 'center', overflow: 'auto', p: 2, minHeight: 580 }}>
                <Box sx={{
                  width: '100%', maxWidth: 900, bgcolor: '#fff', borderRadius: '10px', overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
                  height: 'fit-content', minHeight: 500,
                }}>
                  <Box sx={{ p: 3, overflow: 'auto', bgcolor: '#fff', flexGrow: 1 }}>
                    <PreviewErrorBoundary>
                      <RenderPage data={previewData.data} primaryColor={primaryColor} appId={selectedApp?.id} />
                    </PreviewErrorBoundary>
                  </Box>
                </Box>
              </Box>
            ) : (
              /* Code view */
              <Box sx={{
                flex: 1, p: 2, minHeight: 580, overflow: 'auto', bgcolor: '#1e1e2e',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#444', borderRadius: 3 },
              }}>
                <SyntaxHighlight code={files[activeFileTab]?.content || ''} language="tsx" />
              </Box>
            )}
          </Paper>

          {/* ─── Chat Panel (Design + Backend) ─── */}
          {chatPanelOpen && (
            <Paper sx={{
              borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', bgcolor: '#fafbfc', minHeight: 580,
            }} elevation={0}>
              {/* Tab header */}
              <Box sx={{ px: 1, py: 0.75, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{
                  display: 'flex', gap: 0.3, bgcolor: '#f0f0f2', borderRadius: 1.5, p: 0.3,
                }}>
                  <Button size="small" onClick={() => setChatMode('design')} sx={{
                    fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.4,
                    borderRadius: 1, minWidth: 0,
                    bgcolor: chatMode === 'design' ? '#fff' : 'transparent',
                    boxShadow: chatMode === 'design' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: chatMode === 'design' ? primaryColor : '#888',
                  }}>
                    <AgentIcon sx={{ fontSize: 14, mr: 0.5 }} /> Design
                  </Button>
                  <Button size="small" onClick={() => setChatMode('backend')} sx={{
                    fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.4,
                    borderRadius: 1, minWidth: 0,
                    bgcolor: chatMode === 'backend' ? '#fff' : 'transparent',
                    boxShadow: chatMode === 'backend' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: chatMode === 'backend' ? '#e67e22' : '#888',
                  }}>
                    <BuildIcon sx={{ fontSize: 14, mr: 0.5 }} /> Backend
                  </Button>
                  <Button size="small" onClick={() => setChatMode('coder')} sx={{
                    fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.4,
                    borderRadius: 1, minWidth: 0,
                    bgcolor: chatMode === 'coder' ? '#fff' : 'transparent',
                    boxShadow: chatMode === 'coder' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: chatMode === 'coder' ? '#00897b' : '#888',
                  }}>
                    <CodeIcon sx={{ fontSize: 14, mr: 0.5 }} /> Coder
                  </Button>
                </Box>
                <IconButton size="small" onClick={() => setChatPanelOpen(false)} sx={{ color: '#bbb' }}>
                  <CollapseIcon sx={{ fontSize: 18, transform: 'rotate(-90deg)' }} />
                </IconButton>
              </Box>

              {/* ═══ DESIGN CHAT ═══ */}
              {chatMode === 'design' && (
                <>
                  <Box sx={{
                    flex: 1, overflow: 'auto', px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5,
                    '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                  }}>
                    {chatMessages.length === 0 ? (
                      <Box sx={{ m: 'auto', textAlign: 'center', py: 4 }}>
                        <AgentIcon sx={{ fontSize: 40, color: '#ddd', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>Design Chat</Typography>
                        <Typography variant="caption" sx={{ color: '#bbb', lineHeight: 1.5, display: 'block' }}>
                          Ask the AI to change the design, add sections, update content, or modify styling of the active file.
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {['Add a sidebar navigation', 'Make the stats cards more colourful', 'Add a notifications section', 'Change the layout to a 2-column grid'].map(s => (
                            <Button key={s} size="small" variant="outlined" onClick={() => handleChatSend(s)}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', borderColor: '#e0e0e0', color: '#888', justifyContent: 'flex-start', '&:hover': { borderColor: primaryColor, color: primaryColor } }}>
                              {s}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      chatMessages.map((msg) => (
                        <Box key={msg.id} sx={{
                          p: 1.5, borderRadius: 2,
                          bgcolor: msg.role === 'user' ? '#e8f0fe' : '#f0faf0',
                          border: msg.role === 'user' ? '1px solid #d0ddf7' : '1px solid #c8e6c9',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {msg.role === 'assistant' && <RefineIcon sx={{ fontSize: 14, color: '#4caf50' }} />}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role === 'user' ? '#5a7bbf' : '#4caf50' }}>
                              {msg.role === 'user' ? 'You' : 'AI'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', lineHeight: 1.6, color: '#333' }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      ))
                    )}
                    {chatLoading && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: '#f5f0ff', borderRadius: 2, border: '1px solid #e8dff5' }}>
                        <CircularProgress size={16} sx={{ color: primaryColor }} />
                        <Typography variant="caption" sx={{ color: '#764ba2', fontWeight: 600 }}>Refining design...</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#bbb', fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                      Editing: {files[activeFileTab]?.path?.split('/').pop() || 'file'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField fullWidth size="small" placeholder='e.g. "Add a progress bar to each course"'
                        value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
                        onKeyPress={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                        disabled={chatLoading} multiline maxRows={3}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
                      />
                      <IconButton onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                        sx={{
                          background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                          color: '#fff', borderRadius: 2, width: 40, height: 40,
                          '&:hover': { opacity: 0.9 }, '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
                        }}>
                        <SendIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}

              {/* ═══ BACKEND AGENT ═══ */}
              {chatMode === 'backend' && (
                <>
                  {backendTasks.length > 0 && (
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.75rem' }}>Backend Readiness</Typography>
                        <Chip label={`${backendTasks.filter((t: any) => t.status === 'done').length}/${backendTasks.length}`} size="small"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700,
                            bgcolor: backendTasks.every((t: any) => t.status === 'done') ? '#e8f5e9' : '#fff3e0',
                            color: backendTasks.every((t: any) => t.status === 'done') ? '#2e7d32' : '#e65100',
                          }} />
                      </Box>
                      <LinearProgress variant="determinate"
                        value={backendTasks.length > 0 ? (backendTasks.filter((t: any) => t.status === 'done').length / backendTasks.length) * 100 : 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': { background: 'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)', borderRadius: 3 },
                        }} />
                    </Box>
                  )}
                  {backendTasks.length > 0 && (
                    <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f0f0f0', maxHeight: 200, overflow: 'auto',
                      '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: 3 },
                    }}>
                      {backendTasks.map((task: any) => (
                        <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid #f8f8f8', '&:last-child': { borderBottom: 'none' } }}>
                          {task.status === 'done' ? <DoneIcon sx={{ fontSize: 16, color: '#4caf50' }} /> : <PendingIcon sx={{ fontSize: 16, color: '#e0e0e0' }} />}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: task.status === 'done' ? '#999' : '#1a1a2e', fontSize: '0.72rem', display: 'block', lineHeight: 1.3, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                              {task.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#bbb', fontSize: '0.65rem' }}>{task.category} · {task.priority}</Typography>
                              {task.status !== 'done' && (
                                <Typography variant="caption" sx={{
                                  fontSize: '0.6rem', fontWeight: 700, px: 0.6, py: 0.1, borderRadius: '4px',
                                  ...(task.implementation ? { color: '#e67e22', bgcolor: '#fff3e0' } : { color: '#78909c', bgcolor: '#eceff1' }),
                                }}>
                                  {task.implementation ? '⚡ Auto' : '🔧 Manual'}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {task.status !== 'done' && task.implementation && (
                            <Tooltip title="Auto-implement this task">
                              <IconButton size="small" onClick={() => handleImplementSingleTask(task)} disabled={chatLoading}
                                sx={{ color: '#e67e22', '&:hover': { bgcolor: '#fff3e0' } }}>
                                <RunningIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                  <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', gap: 0.75, justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Button size="small" variant="outlined" onClick={() => handleChatSend('What backend tasks does this need?')}
                      disabled={chatLoading}
                      sx={{ fontSize: '0.7rem', textTransform: 'none', borderColor: '#e67e22', color: '#e67e22', '&:hover': { bgcolor: '#fff8f0', borderColor: '#d35400' } }}>
                      🔍 {backendTasks.length > 0 ? 'Re-scan' : 'Analyze'}
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleChatSend('Implement all auto tasks')}
                      disabled={chatLoading || backendTasks.filter((t: any) => t.status === 'pending' && t.implementation).length === 0}
                      sx={{ fontSize: '0.7rem', textTransform: 'none', borderColor: '#e67e22', color: '#e67e22', '&:hover': { bgcolor: '#fff8f0', borderColor: '#d35400' } }}>
                      ⚡ Implement all
                    </Button>
                  </Box>
                  <Box sx={{
                    flex: 1, overflow: 'auto', px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5,
                    '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                  }}>
                    {chatMessages.length === 0 ? (
                      <Box sx={{ m: 'auto', textAlign: 'center', py: 3 }}>
                        <BuildIcon sx={{ fontSize: 36, color: '#e0e0e0', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#999', mb: 0.5, fontSize: '0.85rem' }}>Backend Agent</Typography>
                        <Typography variant="caption" sx={{ color: '#bbb', lineHeight: 1.5, display: 'block' }}>
                          Analyze what backend work your membership pages need — database seeding, API routes, integrations, and security.
                        </Typography>
                      </Box>
                    ) : (
                      chatMessages.map((msg: any) => (
                        <Box key={msg.id} sx={{
                          p: 1.5, borderRadius: 2,
                          bgcolor: msg.role === 'user' ? '#fef3e8' : '#fff',
                          border: msg.role === 'user' ? '1px solid #f5d5b0' : '1px solid #e8e8e8',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {msg.role === 'assistant' && <BuildIcon sx={{ fontSize: 14, color: '#e67e22' }} />}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role === 'user' ? '#bf6c1a' : '#e67e22' }}>
                              {msg.role === 'user' ? 'You' : 'Backend Agent'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', lineHeight: 1.6, color: '#333' }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      ))
                    )}
                    {chatLoading && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: '#fff8f0', borderRadius: 2, border: '1px solid #f5d5b0' }}>
                        <CircularProgress size={16} sx={{ color: '#e67e22' }} />
                        <Typography variant="caption" sx={{ color: '#d35400', fontWeight: 600 }}>Working...</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField fullWidth size="small" placeholder='e.g. "What needs done?" or "Implement all"'
                        value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
                        onKeyPress={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                        disabled={chatLoading} multiline maxRows={3}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
                      />
                      <IconButton onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                        sx={{
                          background: 'linear-gradient(135deg, #e67e22 0%, #e74c3c 100%)',
                          color: '#fff', borderRadius: 2, width: 40, height: 40,
                          '&:hover': { background: 'linear-gradient(135deg, #d35400 0%, #c0392b 100%)' },
                          '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
                        }}>
                        <SendIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}

              {/* ═══ CODER AGENT (Autonomous Builder) ═══ */}
              {chatMode === 'coder' && (
                <>
                  {/* Pending files banner */}
                  {(coderPendingFiles.generated.length > 0 || coderPendingFiles.modified.length > 0) && (
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #b2dfdb', bgcolor: '#e0f2f1' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#00695c', fontSize: '0.75rem' }}>
                          {coderPendingFiles.generated.length + coderPendingFiles.modified.length} file(s) ready to apply
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" variant="contained" onClick={() => {
                            // Apply generated files — add to project
                            const newFiles = [...files];
                            for (const gf of coderPendingFiles.generated) {
                              const existing = newFiles.findIndex(f => f.path === gf.path);
                              if (existing >= 0) newFiles[existing] = gf;
                              else newFiles.push(gf);
                            }
                            // Apply modified files — update in place
                            for (const mf of coderPendingFiles.modified) {
                              const existing = newFiles.findIndex(f => f.path === mf.path);
                              if (existing >= 0) newFiles[existing] = mf;
                              else newFiles.push(mf);
                            }
                            setFiles(newFiles);
                            setCoderPendingFiles({ generated: [], modified: [] });
                            setChatMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              role: 'assistant',
                              content: `\u2705 Applied ${coderPendingFiles.generated.length + coderPendingFiles.modified.length} file(s) to your project. Check the preview!`,
                            }]);
                          }}
                            sx={{ fontSize: '0.68rem', textTransform: 'none', bgcolor: '#00897b', fontWeight: 700, py: 0.3, px: 1.5,
                              '&:hover': { bgcolor: '#00695c' } }}>
                            \u2705 Apply All
                          </Button>
                          <Button size="small" onClick={() => setCoderPendingFiles({ generated: [], modified: [] })}
                            sx={{ fontSize: '0.65rem', textTransform: 'none', color: '#999', minWidth: 0 }}>
                            Dismiss
                          </Button>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        {[...coderPendingFiles.generated.map((f: any) => ({ ...f, _type: 'new' })), ...coderPendingFiles.modified.map((f: any) => ({ ...f, _type: 'mod' }))].map((f: any, i: number) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip label={f._type === 'new' ? 'NEW' : 'MOD'} size="small"
                              sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, minWidth: 32,
                                bgcolor: f._type === 'new' ? '#c8e6c9' : '#fff3e0',
                                color: f._type === 'new' ? '#2e7d32' : '#e65100' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace' }}>
                              {f.path}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  <Box sx={{
                    flex: 1, overflow: 'auto', px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5,
                    '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                  }}>
                    {chatMessages.length === 0 ? (
                      <Box sx={{ m: 'auto', textAlign: 'center', py: 4 }}>
                        <CodeIcon sx={{ fontSize: 36, color: '#b2dfdb', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#888', fontSize: '0.82rem' }}>
                          Ask me anything — build features, debug code, create pages, set up databases.
                        </Typography>
                      </Box>
                    ) : (
                      chatMessages.map((msg) => (
                        <Box key={msg.id} sx={{
                          p: 1.5, borderRadius: 2,
                          bgcolor: msg.role === 'user' ? '#e0f2f1' : '#fafafa',
                          border: msg.role === 'user' ? '1px solid #b2dfdb' : '1px solid #e8e8e8',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {msg.role === 'assistant' && <CodeIcon sx={{ fontSize: 14, color: '#00897b' }} />}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: msg.role === 'user' ? '#00695c' : '#00897b' }}>
                              {msg.role === 'user' ? 'You' : 'Builder Agent'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8rem', lineHeight: 1.6, color: '#333' }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      ))
                    )}
                    {chatLoading && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, bgcolor: '#e0f2f1', borderRadius: 2, border: '1px solid #b2dfdb' }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <CircularProgress size={16} sx={{ color: '#00897b' }} />
                          <Typography variant="caption" sx={{ color: '#00695c', fontWeight: 600 }}>Working...</Typography>
                        </Box>
                        <LinearProgress sx={{ height: 3, borderRadius: 2, bgcolor: '#b2dfdb',
                          '& .MuiLinearProgress-bar': { bgcolor: '#00897b' } }} />
                      </Box>
                    )}
                    <div ref={coderChatEndRef} />
                  </Box>
                  <Box sx={{ px: 2, pt: 0.5, pb: 0.5, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => { setCoderMessages([]); setCoderHistory([]); setCoderPendingFiles({ generated: [], modified: [] }); setChatInput(''); }}
                      sx={{ fontSize: '0.65rem', textTransform: 'none', color: '#999', '&:hover': { color: '#00897b' } }}>
                      Clear chat
                    </Button>
                  </Box>
                  <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField fullWidth size="small" placeholder="Ask me anything..."
                        value={chatInput} onChange={(e: any) => setChatInput(e.target.value)}
                        onKeyPress={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                        disabled={chatLoading} multiline maxRows={3}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
                      />
                      <IconButton onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                        sx={{
                          background: 'linear-gradient(135deg, #00897b 0%, #004d40 100%)',
                          color: '#fff', borderRadius: 2, width: 40, height: 40,
                          '&:hover': { background: 'linear-gradient(135deg, #00695c 0%, #003d33 100%)' },
                          '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
                        }}>
                        <SendIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          )}

          {/* Open chat FAB (when closed) */}
          {!chatPanelOpen && (
            <Box sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 10 }}>
              <Tooltip title="Open AI Chat">
                <IconButton onClick={() => setChatPanelOpen(true)}
                  sx={{
                    width: 56, height: 56, borderRadius: 3,
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                    color: '#fff', boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    '&:hover': { opacity: 0.9, transform: 'scale(1.05)' },
                    transition: 'all 0.2s',
                  }}>
                  <AgentIcon sx={{ fontSize: 28 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}

      {/* ─── PHASE: FINALIZING ─────────────────────────────────────────── */}
      {phase === 'finalizing' && (
        <Paper sx={{ p: 4, borderRadius: 3, border: `1px solid ${primaryColor}25` }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={24} sx={{ color: primaryColor }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: primaryColor, fontSize: '1.1rem' }}>
              Analyzing Backend Requirements…
            </Typography>
          </Box>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, mb: 3,
            bgcolor: `${primaryColor}15`,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` },
          }} />
          <Typography variant="body2" color="text.secondary">
            The AI agent is examining each generated page to identify database seeding, API routes, integrations, and security work needed…
          </Typography>
        </Paper>
      )}

      {/* ─── PHASE: FINALIZED (backend tasks view) ─────────────────────── */}
      {phase === 'finalized' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3 }}>
          {/* Left: task list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Summary */}
            <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${primaryColor}15`, bgcolor: `${primaryColor}02` }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: 2.5,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BuildIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    Backend Infrastructure Tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {finalizeSummary}
                  </Typography>
                </Box>
              </Box>

              {/* Progress bar */}
              {backendTasks.length > 0 && (() => {
                const done = backendTasks.filter(t => t.status === 'done').length;
                const pct = Math.round((done / backendTasks.length) * 100);
                return (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{done}/{backendTasks.length} tasks complete</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: primaryColor }}>{pct}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{
                      borderRadius: 4, height: 8,
                      bgcolor: `${primaryColor}15`,
                      '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, #4caf50, #66bb6a)`, borderRadius: 4 },
                    }} />
                  </Box>
                );
              })()}
            </Paper>

            {/* Implement All button */}
            {backendTasks.filter(t => t.status === 'pending' && t.implementation).length > 0 && (
              <Button
                variant="contained"
                startIcon={implementingAll ? <CircularProgress size={18} color="inherit" /> : <AutoIcon />}
                onClick={handleImplementAll}
                disabled={implementingAll}
                sx={{
                  background: `linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)`,
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {implementingAll ? 'Implementing…' : `Auto-Implement ${backendTasks.filter(t => t.status === 'pending' && t.implementation).length} Tasks`}
              </Button>
            )}

            {/* Task cards grouped by category */}
            {(['database', 'api', 'integration', 'security', 'data'] as const).map(cat => {
              const catTasks = backendTasks.filter(t => t.category === cat);
              if (catTasks.length === 0) return null;

              const catLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
                database: { label: 'Database', icon: <DbIcon sx={{ fontSize: 18 }} />, color: '#2196f3' },
                api: { label: 'API Routes', icon: <ApiIcon sx={{ fontSize: 18 }} />, color: '#ff9800' },
                integration: { label: 'Integrations', icon: <IntegrationIcon sx={{ fontSize: 18 }} />, color: '#9c27b0' },
                security: { label: 'Security', icon: <SecurityIcon sx={{ fontSize: 18 }} />, color: '#f44336' },
                data: { label: 'Data', icon: <DataIcon sx={{ fontSize: 18 }} />, color: '#4caf50' },
              };

              const info = catLabels[cat];

              return (
                <Paper key={cat} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: `${info.color}08`, borderBottom: `1px solid ${info.color}15`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: info.color }}>{info.icon}</Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>{info.label}</Typography>
                    <Chip
                      label={`${catTasks.filter(t => t.status === 'done').length}/${catTasks.length}`}
                      size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${info.color}12`, color: info.color }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {catTasks.map(task => (
                      <Box key={task.id} sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2.5, py: 2,
                        borderBottom: '1px solid rgba(0,0,0,0.03)',
                        bgcolor: task.status === 'done' ? 'rgba(76,175,80,0.03)' : 'transparent',
                        opacity: task.status === 'done' ? 0.7 : 1,
                        transition: 'all 0.15s',
                      }}>
                        {task.status === 'done'
                          ? <DoneIcon sx={{ fontSize: 20, color: '#4caf50', mt: 0.3 }} />
                          : <PendingIcon sx={{ fontSize: 20, color: '#bbb', mt: 0.3 }} />
                        }
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Typography variant="body2" sx={{
                              fontWeight: 600, fontSize: '0.85rem',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            }}>
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.priority}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: task.priority === 'high' ? 'rgba(244,67,54,0.08)' : task.priority === 'medium' ? 'rgba(255,152,0,0.08)' : 'rgba(0,0,0,0.04)',
                                color: task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? '#ff9800' : '#999',
                              }}
                            />
                            {task.implementation && task.status !== 'done' && (
                              <Chip icon={<AutoIcon sx={{ fontSize: '12px !important' }} />} label="Auto" size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(76,175,80,0.08)', color: '#4caf50' }} />
                            )}
                            {!task.implementation && task.status !== 'done' && (
                              <Chip icon={<ManualIcon sx={{ fontSize: '12px !important' }} />} label="Manual" size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#999' }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                            {task.description}
                          </Typography>
                        </Box>
                        {task.implementation && task.status !== 'done' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleImplementTask(task)}
                            disabled={implementingTask === task.id || implementingAll}
                            startIcon={implementingTask === task.id ? <CircularProgress size={12} /> : <AutoIcon />}
                            sx={{
                              textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                              borderColor: '#4caf50', color: '#4caf50', flexShrink: 0,
                              borderRadius: 1.5, px: 1.5, minWidth: 0,
                              '&:hover': { borderColor: '#4caf50', bgcolor: 'rgba(76,175,80,0.04)' },
                            }}
                          >
                            {implementingTask === task.id ? '…' : 'Run'}
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Paper>
              );
            })}

            {/* Navigation */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setPhase('results')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Back to Code
              </Button>
              <Button
                variant="contained"
                startIcon={<BugIcon />}
                onClick={handleQaReview}
                sx={{
                  background: `linear-gradient(135deg, #ff9800 0%, #f57c00 100%)`,
                  fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                QA &amp; Docs Agent
              </Button>
              <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                New Build
              </Button>
            </Box>
          </Box>

          {/* Right: overview + tips */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Generated pages reference */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.88rem' }}>Generated Pages</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {files.filter(f => f.path.match(/\.(tsx|jsx)$/)).map((f, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <FileIcon sx={{ fontSize: 14, color: primaryColor }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{f.path.split('/').pop()}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Category legend */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.88rem' }}>Task Categories</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { icon: <DbIcon sx={{ fontSize: 16 }} />, label: 'Database', desc: 'Tables, records, seeds', color: '#2196f3' },
                  { icon: <ApiIcon sx={{ fontSize: 16 }} />, label: 'API Routes', desc: 'Endpoints the pages call', color: '#ff9800' },
                  { icon: <IntegrationIcon sx={{ fontSize: 16 }} />, label: 'Integrations', desc: 'Stripe, email, webhooks', color: '#9c27b0' },
                  { icon: <SecurityIcon sx={{ fontSize: 16 }} />, label: 'Security', desc: 'Auth, JWT, validation', color: '#f44336' },
                  { icon: <DataIcon sx={{ fontSize: 16 }} />, label: 'Data', desc: 'Sample/mock data', color: '#4caf50' },
                ].map(c => (
                  <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: c.color }}>{c.icon}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{c.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{c.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Badge legend */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.88rem' }}>Badges</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip icon={<AutoIcon sx={{ fontSize: '12px !important' }} />} label="Auto" size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(76,175,80,0.08)', color: '#4caf50' }} />
                  <Typography variant="caption" color="text.secondary">Can be auto-implemented (DB seed)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip icon={<ManualIcon sx={{ fontSize: '12px !important' }} />} label="Manual" size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#999' }} />
                  <Typography variant="caption" color="text.secondary">Requires manual coding / setup</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: QA-RUNNING (loading) ───────────────────────────────── */}
      {phase === 'qa-running' && (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <BugIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>QA Agent Reviewing Code…</Typography>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, maxWidth: 400, mx: 'auto', mb: 2,
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #ff9800, #f57c00)' },
          }} />
          <Typography variant="body2" color="text.secondary">
            Checking imports, types, logic, API calls, and cross-file references…
          </Typography>
        </Paper>
      )}

      {/* ─── PHASE: QA-RESULTS ─────────────────────────────────────────── */}
      {phase === 'qa-results' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary header */}
          <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${qaIssues.some(i => i.severity === 'error') ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)'}`, bgcolor: qaIssues.some(i => i.severity === 'error') ? 'rgba(244,67,54,0.02)' : 'rgba(76,175,80,0.02)' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 3,
                background: qaIssues.some(i => i.severity === 'error')
                  ? 'linear-gradient(135deg, #f44336, #e53935)'
                  : qaIssues.length > 0
                    ? 'linear-gradient(135deg, #ff9800, #f57c00)'
                    : 'linear-gradient(135deg, #4caf50, #66bb6a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {qaIssues.some(i => i.severity === 'error')
                  ? <ErrorIcon sx={{ color: '#fff', fontSize: 24 }} />
                  : qaIssues.length > 0
                    ? <WarningIcon sx={{ color: '#fff', fontSize: 24 }} />
                    : <QaPassIcon sx={{ color: '#fff', fontSize: 24 }} />
                }
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {qaIssues.length === 0 ? 'All Clear!' : `Found ${qaIssues.length} Issue${qaIssues.length !== 1 ? 's' : ''}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">{qaSummary}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['error', 'warning', 'info'] as const).map(sev => {
                  const count = qaIssues.filter(i => i.severity === sev).length;
                  if (count === 0) return null;
                  const colors = { error: '#f44336', warning: '#ff9800', info: '#2196f3' };
                  return (
                    <Chip key={sev} label={`${count} ${sev}`} size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: `${colors[sev]}12`, color: colors[sev] }} />
                  );
                })}
              </Box>
            </Box>
          </Paper>

          {/* Fix All button */}
          {qaIssues.filter(i => i.autoFix && i.severity !== 'info').length > 0 && (
            <Button
              variant="contained"
              startIcon={fixingAll ? <CircularProgress size={18} color="inherit" /> : <RefineIcon />}
              onClick={handleQaFixAll}
              disabled={fixingAll}
              sx={{
                background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                '&:hover': { opacity: 0.9 },
              }}
            >
              {fixingAll ? 'Fixing…' : `Auto-Fix ${qaIssues.filter(i => i.autoFix && i.severity !== 'info').length} Issue(s)`}
            </Button>
          )}

          {/* Issues list */}
          {qaIssues.length > 0 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              {qaIssues.map((issue, idx) => {
                const sevColors = { error: '#f44336', warning: '#ff9800', info: '#2196f3' };
                const sevIcons = {
                  error: <ErrorIcon sx={{ fontSize: 18, color: sevColors.error }} />,
                  warning: <WarningIcon sx={{ fontSize: 18, color: sevColors.warning }} />,
                  info: <InfoIcon sx={{ fontSize: 18, color: sevColors.info }} />,
                };
                return (
                  <Box key={issue.id} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2.5, py: 2,
                    borderBottom: idx < qaIssues.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}>
                    {sevIcons[issue.severity]}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {issue.title}
                        </Typography>
                        <Chip label={issue.category} size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#666' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {issue.file}{issue.line ? `:${issue.line}` : ''}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {issue.description}
                      </Typography>
                    </Box>
                    {issue.autoFix && (
                      <Button
                        size="small" variant="outlined"
                        onClick={() => handleQaFix(issue)}
                        disabled={fixingIssue === issue.id || fixingAll}
                        startIcon={fixingIssue === issue.id ? <CircularProgress size={12} /> : <RefineIcon />}
                        sx={{
                          textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                          borderColor: sevColors[issue.severity], color: sevColors[issue.severity],
                          borderRadius: 1.5, px: 1.5, minWidth: 0, flexShrink: 0,
                          '&:hover': { borderColor: sevColors[issue.severity], bgcolor: `${sevColors[issue.severity]}08` },
                        }}
                      >
                        {fixingIssue === issue.id ? '…' : 'Fix'}
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Paper>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setPhase('finalized')} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Back to Tasks
            </Button>
            <Button
              variant="contained"
              startIcon={<DocsIcon />}
              onClick={handleGenerateDocs}
              sx={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                '&:hover': { opacity: 0.9 },
              }}
            >
              Generate Documentation
            </Button>
            <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              New Build
            </Button>
          </Box>
        </Box>
      )}

      {/* ─── PHASE: DOCUMENTING (loading) ──────────────────────────────── */}
      {phase === 'documenting' && (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
          <DocsIcon sx={{ fontSize: 48, color: primaryColor, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Generating Documentation…</Typography>
          <LinearProgress sx={{
            borderRadius: 4, height: 6, maxWidth: 400, mx: 'auto', mb: 2,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${primaryColor}, #764ba2)` },
          }} />
          <Typography variant="body2" color="text.secondary">
            Writing README, component docs, and API reference…
          </Typography>
        </Paper>
      )}

      {/* ─── PHASE: DOCUMENTED (show docs) ─────────────────────────────── */}
      {phase === 'documented' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header */}
          <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${primaryColor}15`, bgcolor: `${primaryColor}02` }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 3,
                background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DocsIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  Documentation Generated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {docsFiles.length} documentation file{docsFiles.length !== 1 ? 's' : ''} ready
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Doc tabs */}
          {docsFiles.length > 0 && (
            <Paper sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }} elevation={0}>
              {/* Tab headers */}
              <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                {docsFiles.map((doc, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setActiveDocTab(idx)}
                    sx={{
                      px: 2.5, py: 1.5, cursor: 'pointer',
                      fontWeight: activeDocTab === idx ? 700 : 500,
                      fontSize: '0.8rem',
                      borderBottom: activeDocTab === idx ? `2px solid ${primaryColor}` : '2px solid transparent',
                      color: activeDocTab === idx ? primaryColor : 'text.secondary',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                    }}
                  >
                    <FileIcon sx={{ fontSize: 14 }} />
                    {doc.path.split('/').pop()}
                  </Box>
                ))}
              </Box>

              {/* Doc content */}
              <Box sx={{ p: 3, maxHeight: '60vh', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Tooltip title="Copy">
                    <IconButton size="small" onClick={() => {
                      navigator.clipboard.writeText(docsFiles[activeDocTab]?.content || '');
                      setSnack({ open: true, msg: 'Copied to clipboard', severity: 'success' });
                    }}>
                      <CopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                    color: '#333',
                  }}
                >
                  {docsFiles[activeDocTab]?.content || ''}
                </Box>
              </Box>
            </Paper>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setPhase('qa-results')} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Back to QA
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveDocs}
              disabled={saving || docsFiles.length === 0}
              sx={{
                background: `linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)`,
                fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2,
                '&:hover': { opacity: 0.9 },
              }}
            >
              {saving ? 'Saving…' : 'Save Documentation'}
            </Button>
            <Button variant="outlined" onClick={() => { setPhase('setup'); setFiles([]); setPlan([]); setSummary(''); setPages([]); setBackendTasks([]); setQaIssues([]); setDocsFiles([]); }}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              New Build
            </Button>
          </Box>
        </Box>
      )}

      {/* ─── Add Page Dialog ───────────────────────────────────────────── */}
      <Dialog open={addPageDialog} onClose={() => setAddPageDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Page</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth autoFocus label="Page Name" placeholder="e.g. Courses, Downloads, Community"
            value={newPageName} onChange={(e) => setNewPageName(e.target.value)}
            sx={{ mt: 1, mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            fullWidth multiline minRows={2} label="Description" placeholder="What should this page contain?"
            value={newPageDesc} onChange={(e) => setNewPageDesc(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddPageDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPage} disabled={!newPageName.trim()}
            sx={{ textTransform: 'none', fontWeight: 600, background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)` }}>
            Add Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Refine Dialog ─────────────────────────────────────────────── */}
      <Dialog open={refineDialog} onClose={() => setRefineDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Refine: {files[activeFileTab]?.path.split('/').pop()}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe the changes you want for this file.
          </Typography>
          {refineHistory.filter(h => h.fileIndex === activeFileTab).length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#f5f5f5', maxHeight: 120, overflow: 'auto' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Previous refinements:</Typography>
              {refineHistory.filter(h => h.fileIndex === activeFileTab).map((h, i) => (
                <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  • {h.instruction}
                </Typography>
              ))}
            </Box>
          )}
          <TextField
            multiline minRows={3} maxRows={8} fullWidth autoFocus
            placeholder="e.g., Add pagination to the table, change the layout to 3 columns, add a search bar..."
            value={refineInstruction} onChange={(e) => setRefineInstruction(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRefineDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleRefine}
            disabled={!refineInstruction.trim() || refining}
            startIcon={refining ? <CircularProgress size={16} color="inherit" /> : <RefineIcon />}
            sx={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
              textTransform: 'none', fontWeight: 600,
            }}
          >
            {refining ? 'Refining…' : 'Refine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
