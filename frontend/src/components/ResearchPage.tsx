import { useState, useEffect, useCallback } from 'react';
import { API as API_ENDPOINTS } from '../config/api';
import DOMPurify from 'dompurify';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Checkbox,
  Collapse,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Refresh as RetryIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as PreviewIcon,
  DeleteSweep as BulkDeleteIcon,
  PlayArrow as RunIcon,
  CheckCircle as CompleteIcon,
  ErrorOutline as FailedIcon,
  HourglassEmpty as IdleIcon,
  AutoAwesome as AnalyzingIcon,
  TravelExplore as SearchingIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  OpenInNew as ExternalIcon,
  ContentCopy as CopyIcon,
  Lightbulb as FindingIcon,
  Link as SourceIcon,
  PictureAsPdf as PdfIcon,
  SmartToy as ModelIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface Source {
  title: string;
  url: string;
  relevance: string;
}

interface ResearchProject {
  id: string;
  projectId: number | null;
  name: string;
  query: string;
  status: 'idle' | 'searching' | 'analyzing' | 'complete' | 'failed';
  searchResults: SearchResult[];
  analysis: string;
  summary: string;
  keyFindings: string[];
  sources: Source[];
  createdAt: string;
  updatedAt: string;
  error?: string;
}

interface ResearchSettings {
  defaultProjectId: number | null;
  searchCount: number;
  analysisDepth: 'brief' | 'standard' | 'deep';
  claudeModel: string;
}

interface Stats {
  total: number;
  complete: number;
  inProgress: number;
  failed: number;
  totalSources: number;
}

interface Project {
  id: number;
  name: string;
  slug: string;
  primary_color?: string;
}

interface ProjectIndex {
  projectId: number | null;
  projectName: string;
  projectColor: string;
  total: number;
  complete: number;
  inProgress: number;
  failed: number;
}

const RESEARCH_API = API_ENDPOINTS.research;
const APPS_API = API_ENDPOINTS.apps;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
  idle: { label: 'Ready', color: '#95a5a6', bg: 'rgba(149,165,166,0.08)', icon: <IdleIcon sx={{ fontSize: 16 }} /> },
  searching: { label: 'Searching', color: '#3498db', bg: 'rgba(52,152,219,0.08)', icon: <SearchingIcon sx={{ fontSize: 16 }} /> },
  analyzing: { label: 'Analyzing', color: '#f39c12', bg: 'rgba(243,156,18,0.08)', icon: <AnalyzingIcon sx={{ fontSize: 16 }} /> },
  complete: { label: 'Complete', color: '#27ae60', bg: 'rgba(39,174,96,0.08)', icon: <CompleteIcon sx={{ fontSize: 16 }} /> },
  failed: { label: 'Failed', color: '#e74c3c', bg: 'rgba(231,76,60,0.08)', icon: <FailedIcon sx={{ fontSize: 16 }} /> },
};

const DEPTH_OPTIONS = [
  { value: 'brief', label: 'Brief', desc: 'Quick 2-3 paragraph summary' },
  { value: 'standard', label: 'Standard', desc: 'Thorough analysis with key findings' },
  { value: 'deep', label: 'Deep', desc: 'Comprehensive in-depth report' },
];

const MODEL_OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4', desc: 'OpenAI — most capable', provider: 'openai' },
  { value: 'gpt-4o', label: 'GPT-4o', desc: 'OpenAI — fast & capable', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'OpenAI — fastest, low cost', provider: 'openai' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', desc: 'Best balance of speed & quality', provider: 'claude' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', desc: 'Previous gen, reliable', provider: 'claude' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', desc: 'Fastest, lower cost', provider: 'claude' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', desc: 'Most capable, slower', provider: 'claude' },
];

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ResearchPage() {
  const [researches, setResearches] = useState<ResearchProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<Set<string>>(new Set());

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectIndex, setProjectIndex] = useState<ProjectIndex[]>([]);

  // Tab
  const [activeTab, setActiveTab] = useState(0);

  // New research input
  const [queryInput, setQueryInput] = useState('');
  const [researchName, setResearchName] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail view
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; research: ResearchProject | null }>({ open: false, research: null });

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<ResearchSettings>({
    defaultProjectId: null,
    searchCount: 10,
    analysisDepth: 'standard',
    claudeModel: 'gpt-4o',
  });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<ResearchProject | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // â”€â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(APPS_API);
      const data = await res.json();
      if (data.success) setProjects(data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchProjectIndex = useCallback(async () => {
    try {
      const res = await fetch(`${RESEARCH_API}/project-index`);
      const data = await res.json();
      if (data.success) setProjectIndex(data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchResearches = useCallback(async () => {
    try {
      const url = selectedProject != null ? `${RESEARCH_API}/projects?projectId=${selectedProject}` : `${RESEARCH_API}/projects`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setResearches(data.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load research', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  const fetchStats = useCallback(async () => {
    try {
      const url = selectedProject != null ? `${RESEARCH_API}/stats?projectId=${selectedProject}` : `${RESEARCH_API}/stats`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silent */ }
  }, [selectedProject]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${RESEARCH_API}/settings`);
      const data = await res.json();
      if (data.success) setSettingsForm(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchResearches();
    fetchStats();
    fetchSettings();
    fetchProjectIndex();
  }, [fetchResearches, fetchStats, fetchSettings, fetchProjectIndex]);

  // â”€â”€â”€ Create Research â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleCreate = useCallback(async () => {
    if (!queryInput.trim()) return;
    try {
      const res = await fetch(`${RESEARCH_API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryInput, name: researchName || undefined, projectId: selectedProject }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryInput('');
        setResearchName('');
        fetchResearches();
        fetchStats();
        fetchProjectIndex();
        setSnackbar({ open: true, message: 'Research created', severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to create research', severity: 'error' });
    }
  }, [queryInput, researchName, selectedProject, fetchResearches, fetchStats, fetchProjectIndex]);

  // â”€â”€â”€ Run Research â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleRun = useCallback(async (id: string, model?: string) => {
    setRunning((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`${RESEARCH_API}/run/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || selectedModel }),
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'Research complete!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.message, severity: 'error' });
      }
      fetchResearches();
      fetchStats();
      fetchProjectIndex();
    } catch {
      setSnackbar({ open: true, message: 'Research failed', severity: 'error' });
    } finally {
      setRunning((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [fetchResearches, fetchStats, fetchProjectIndex, selectedModel]);

  // â”€â”€â”€ Create + Run â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleCreateAndRun = useCallback(async () => {
    if (!queryInput.trim()) return;
    try {
      const res = await fetch(`${RESEARCH_API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryInput, name: researchName || undefined, projectId: selectedProject }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryInput('');
        setResearchName('');
        fetchResearches();
        fetchStats();
        fetchProjectIndex();
        // Auto-run
        handleRun(data.data.id, selectedModel);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to create research', severity: 'error' });
    }
  }, [queryInput, researchName, selectedProject, fetchResearches, fetchStats, fetchProjectIndex, handleRun, selectedModel]);

  // â”€â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${RESEARCH_API}/projects/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchResearches();
      fetchStats();
      fetchProjectIndex();
      setSnackbar({ open: true, message: 'Research deleted', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  }, [fetchResearches, fetchStats, fetchProjectIndex]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch(`${RESEARCH_API}/projects/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      setSelectedIds(new Set());
      fetchResearches();
      fetchStats();
      fetchProjectIndex();
      setSnackbar({ open: true, message: `${selectedIds.size} research(es) deleted`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  }, [selectedIds, fetchResearches, fetchStats, fetchProjectIndex]);

  // â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSaveSettings = useCallback(async () => {
    try {
      await fetch(`${RESEARCH_API}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      setSettingsOpen(false);
      setSnackbar({ open: true, message: 'Settings saved', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    }
  }, [settingsForm]);

  // â”€â”€â”€ PDF Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const generatePdf = useCallback((research: ResearchProject) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, style: string, color: [number, number, number] = [26, 26, 46]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.45;
      }
    };

    const addSpacing = (s: number) => { y += s; };
    const addLine = () => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;
    };

    // Title
    addText(research.name, 20, 'bold', [102, 126, 234]);
    addSpacing(3);

    // Date
    addText(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 9, 'normal', [150, 150, 150]);
    addSpacing(2);

    // Query
    addLine();
    addText('RESEARCH QUERY', 9, 'bold', [150, 150, 150]);
    addSpacing(1);
    addText(research.query, 11, 'normal');
    addSpacing(5);

    // Summary
    if (research.summary) {
      addLine();
      addText('SUMMARY', 9, 'bold', [39, 174, 96]);
      addSpacing(1);
      addText(research.summary, 11, 'normal');
      addSpacing(5);
    }

    // Key Findings
    if (research.keyFindings?.length) {
      addLine();
      addText('KEY FINDINGS', 9, 'bold', [243, 156, 18]);
      addSpacing(2);
      research.keyFindings.forEach((finding, i) => {
        addText(`${i + 1}. ${finding}`, 10, 'normal');
        addSpacing(1.5);
      });
      addSpacing(3);
    }

    // Analysis (strip HTML tags for PDF)
    if (research.analysis) {
      addLine();
      addText('FULL ANALYSIS', 9, 'bold', [102, 126, 234]);
      addSpacing(2);
      const plainText = research.analysis
        .replace(/<h[1-6][^>]*>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<li[^>]*>/gi, 'â€¢ ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      addText(plainText, 10, 'normal');
      addSpacing(5);
    }

    // Sources
    if (research.sources?.length) {
      addLine();
      addText('SOURCES', 9, 'bold', [118, 75, 162]);
      addSpacing(2);
      research.sources.forEach((source, i) => {
        addText(`${i + 1}. ${source.title}`, 10, 'bold');
        addText(`   ${source.url}`, 9, 'normal', [100, 100, 200]);
        addText(`   ${source.relevance}`, 9, 'italic', [130, 130, 130]);
        addSpacing(2);
      });
    }

    const safeName = research.name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    doc.save(`research_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    setSnackbar({ open: true, message: 'PDF saved!', severity: 'success' });
  }, []);

  // â”€â”€â”€ Filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filteredResearches = researches.filter((r) => {
    if (activeTab === 1) return r.status === 'idle' || r.status === 'searching' || r.status === 'analyzing';
    if (activeTab === 2) return r.status === 'complete';
    if (activeTab === 3) return r.status === 'failed';
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResearches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResearches.map((r) => r.id)));
    }
  };

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
            Research
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#888' }}>
            Search the web using Brave Search and analyse results with Claude AI. Research competitors, validate ideas, and gather market insights — all saved to your projects for future reference.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontSize: '0.82rem' }}>
              <FolderIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              Project
            </InputLabel>
            <Select
              value={selectedProject ?? ''}
              label="ðŸ“ Project"
              onChange={(e) => {
                const val = e.target.value;
                setSelectedProject(val === '' ? null : Number(val));
              }}
              sx={{ borderRadius: 2.5, fontSize: '0.85rem', height: 42, bgcolor: '#fff' }}
            >
              <MenuItem value="">
                <em>All Projects</em>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.primary_color || '#667eea' }} />
                    {p.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Settings">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
              sx={{ borderRadius: 2.5, borderColor: 'rgba(0,0,0,0.1)', color: '#666', height: 42 }}
            >
              Settings
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* â”€â”€â”€ Project Index â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedProject === null && projectIndex.length > 0 && (
        <Paper
          sx={{ p: 2, mb: 3, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}
        >
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a1a2e', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOpenIcon sx={{ fontSize: 18, color: '#667eea' }} />
            Research by Project
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
            {projectIndex.map((pi) => (
              <Paper
                key={pi.projectId ?? 'unassigned'}
                onClick={() => pi.projectId != null && setSelectedProject(pi.projectId)}
                sx={{
                  p: 1.5, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5,
                  cursor: pi.projectId != null ? 'pointer' : 'default', transition: 'all 0.15s',
                  '&:hover': pi.projectId != null ? { borderColor: pi.projectColor || '#667eea', bgcolor: `${pi.projectColor || '#667eea'}08`, transform: 'translateY(-1px)' } : {},
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: pi.projectColor || '#999' }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e' }}>{pi.projectName}</Typography>
                  <Chip label={pi.total} size="small" sx={{ ml: 'auto', height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#27ae60' }}><strong>{pi.complete}</strong> complete</Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#3498db' }}><strong>{pi.inProgress}</strong> running</Typography>
                  {pi.failed > 0 && <Typography sx={{ fontSize: '0.68rem', color: '#e74c3c' }}><strong>{pi.failed}</strong> failed</Typography>}
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Total', value: stats.total, color: '#667eea' },
            { label: 'Complete', value: stats.complete, color: '#27ae60' },
            { label: 'In Progress', value: stats.inProgress, color: '#3498db' },
            { label: 'Sources Found', value: stats.totalSources, color: '#764ba2' },
          ].map((s) => (
            <Paper
              key={s.label}
              sx={{ p: 1.5, textAlign: 'center', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5, bgcolor: `${s.color}08` }}
            >
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* â”€â”€â”€ New Research Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Paper
        sx={{
          p: 2.5, mb: 3, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(102,126,234,0.03) 0%, rgba(118,75,162,0.03) 100%)',
        }}
      >
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a1a2e', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon sx={{ fontSize: 18, color: '#667eea' }} />
          New Research
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              placeholder="What do you want to research? e.g. best practices for SaaS pricing models"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateAndRun();
                }
              }}
            />
            <TextField
              placeholder="Optional: Research name"
              value={researchName}
              onChange={(e) => setResearchName(e.target.value)}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: '0.82rem' }}>
                <ModelIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} /> Model
              </InputLabel>
              <Select
                value={selectedModel}
                label="ðŸ¤– Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                sx={{ borderRadius: 2, fontSize: '0.82rem' }}
              >
                {MODEL_OPTIONS.map((m, i) => [
                  // Add divider between OpenAI and Claude groups
                  i > 0 && MODEL_OPTIONS[i - 1].provider !== m.provider ? <Divider key={`div-${i}`} sx={{ my: 0.5 }} /> : null,
                  <MenuItem key={m.value} value={m.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{m.label}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#999' }}>{m.desc}</Typography>
                    </Box>
                  </MenuItem>,
                ])}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCreateAndRun}
              disabled={!queryInput.trim() || running.size > 0}
              startIcon={running.size > 0 ? <CircularProgress size={14} /> : <SearchIcon />}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 700, fontSize: '0.82rem', py: 1.3,
              }}
            >
              Research Now
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCreate}
              disabled={!queryInput.trim()}
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2, borderColor: '#667eea', color: '#667eea', fontWeight: 700, fontSize: '0.78rem' }}
            >
              Save for Later
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* â”€â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none' },
            '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #667eea, #764ba2)', height: 2.5, borderRadius: 2 },
          }}
        >
          <Tab label={`All (${researches.length})`} />
          <Tab label={`Pending (${researches.filter((r) => r.status === 'idle' || r.status === 'searching' || r.status === 'analyzing').length})`} />
          <Tab label={`Complete (${researches.filter((r) => r.status === 'complete').length})`} />
          <Tab label={`Failed (${researches.filter((r) => r.status === 'failed').length})`} />
        </Tabs>
        {selectedIds.size > 0 && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${selectedIds.size} selected`} size="small" sx={{ fontWeight: 700 }} />
            <Tooltip title="Delete selected">
              <IconButton size="small" onClick={handleBulkDelete} sx={{ color: '#e74c3c' }}>
                <BulkDeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* â”€â”€â”€ Select All â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {filteredResearches.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Checkbox size="small" checked={selectedIds.size === filteredResearches.length && filteredResearches.length > 0} indeterminate={selectedIds.size > 0 && selectedIds.size < filteredResearches.length} onChange={toggleSelectAll} />
          <Typography sx={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 600 }}>Select All</Typography>
        </Box>
      )}

      {/* â”€â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : filteredResearches.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 6, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3 }}>
          <SearchIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
          <Typography sx={{ fontSize: '0.9rem', color: '#aaa', fontWeight: 600 }}>No research yet</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#ccc' }}>Enter a query above to start researching</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredResearches.map((research) => {
            const proj = projects.find((p) => p.id === research.projectId);
            return (
              <ResearchRow
                key={research.id}
                research={research}
                selected={selectedIds.has(research.id)}
                isRunning={running.has(research.id)}
                projectName={selectedProject === null && proj ? proj.name : undefined}
                projectColor={selectedProject === null && proj ? proj.primary_color : undefined}
                onToggleSelect={() => toggleSelect(research.id)}
                onRun={() => handleRun(research.id)}
                onDelete={() => setDeleteConfirm(research)}
                onView={() => setDetailDialog({ open: true, research })}
                onDownloadPdf={() => generatePdf(research)}
              />
            );
          })}
        </Box>
      )}

      {/* â”€â”€â”€ Detail Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, research: null })} maxWidth="lg" fullWidth>
        {detailDialog.research && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon sx={{ color: '#667eea' }} />
                {detailDialog.research.name}
              </Box>
              <Chip
                icon={STATUS_CONFIG[detailDialog.research.status]?.icon}
                label={STATUS_CONFIG[detailDialog.research.status]?.label}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: STATUS_CONFIG[detailDialog.research.status]?.bg,
                  color: STATUS_CONFIG[detailDialog.research.status]?.color,
                  '& .MuiChip-icon': { color: STATUS_CONFIG[detailDialog.research.status]?.color },
                }}
              />
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                {/* Query */}
                <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, bgcolor: '#fafbfc' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', mb: 0.5 }}>Query</Typography>
                  <Typography sx={{ fontSize: '0.88rem', color: '#1a1a2e' }}>{detailDialog.research.query}</Typography>
                </Paper>

                {/* Summary */}
                {detailDialog.research.summary && (
                  <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid rgba(39,174,96,0.15)', borderRadius: 2, bgcolor: 'rgba(39,174,96,0.02)' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#27ae60', textTransform: 'uppercase', mb: 0.5 }}>Summary</Typography>
                    <Typography sx={{ fontSize: '0.88rem', color: '#1a1a2e', lineHeight: 1.6 }}>{detailDialog.research.summary}</Typography>
                  </Paper>
                )}

                {/* Key Findings */}
                {detailDialog.research.keyFindings?.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a1a2e', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FindingIcon sx={{ fontSize: 16, color: '#f39c12' }} />
                      Key Findings
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {detailDialog.research.keyFindings.map((finding, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <Chip label={i + 1} size="small" sx={{ height: 20, minWidth: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea' }} />
                          <Typography sx={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.5 }}>{finding}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Analysis */}
                {detailDialog.research.analysis && (
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a1a2e', mb: 1 }}>Full Analysis</Typography>
                    <Paper
                      sx={{ p: 2.5, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, bgcolor: '#fafbfc' }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detailDialog.research.analysis) }}
                    />
                  </Box>
                )}

                {/* Sources */}
                {detailDialog.research.sources?.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a1a2e', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SourceIcon sx={{ fontSize: 16, color: '#764ba2' }} />
                      Sources ({detailDialog.research.sources.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      {detailDialog.research.sources.map((source, i) => (
                        <Paper key={i} sx={{ p: 1.5, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e' }}>{source.title}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>{source.relevance}</Typography>
                          </Box>
                          <Tooltip title="Open in new tab">
                            <IconButton size="small" onClick={() => window.open(source.url, '_blank')} sx={{ color: '#667eea' }}>
                              <ExternalIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Search Results */}
                {detailDialog.research.searchResults?.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a1a2e', mb: 1 }}>
                      Raw Search Results ({detailDialog.research.searchResults.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 300, overflow: 'auto' }}>
                      {detailDialog.research.searchResults.map((sr, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#bbb', fontWeight: 700, minWidth: 16 }}>{i + 1}.</Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              component="a"
                              href={sr.url}
                              target="_blank"
                              rel="noopener"
                              sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#667eea', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, display: 'block' }}
                            >
                              {sr.title}
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#999', mt: 0.3 }}>{sr.description}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Error */}
                {detailDialog.research.error && (
                  <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                    {detailDialog.research.error}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {detailDialog.research.analysis && (
                <Button
                  startIcon={<CopyIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    const text = `# ${detailDialog.research!.name}\n\n## Summary\n${detailDialog.research!.summary}\n\n## Key Findings\n${detailDialog.research!.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n## Sources\n${detailDialog.research!.sources.map((s) => `- [${s.title}](${s.url}) â€” ${s.relevance}`).join('\n')}`;
                    navigator.clipboard.writeText(text);
                    setSnackbar({ open: true, message: 'Copied to clipboard as markdown', severity: 'success' });
                  }}
                  sx={{ borderRadius: 2, fontSize: '0.78rem', fontWeight: 700 }}
                >
                  Copy as Markdown
                </Button>
              )}
              {detailDialog.research.analysis && (
                <Button
                  startIcon={<PdfIcon sx={{ fontSize: 16 }} />}
                  onClick={() => generatePdf(detailDialog.research!)}
                  sx={{ borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, mr: 'auto', color: '#e74c3c' }}
                >
                  Save as PDF
                </Button>
              )}
              {(detailDialog.research.status === 'idle' || detailDialog.research.status === 'failed') && (
                <Button
                  variant="contained"
                  startIcon={running.has(detailDialog.research.id) ? <CircularProgress size={14} /> : <RunIcon />}
                  onClick={() => handleRun(detailDialog.research!.id)}
                  disabled={running.has(detailDialog.research.id)}
                  sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 700 }}
                >
                  {detailDialog.research.status === 'failed' ? 'Retry' : 'Run Research'}
                </Button>
              )}
              <Button onClick={() => setDetailDialog({ open: false, research: null })} sx={{ borderRadius: 2 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* â”€â”€â”€ Settings Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: '#667eea' }} />
            Research Settings
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Default Project</InputLabel>
              <Select
                value={settingsForm.defaultProjectId ?? ''}
                label="Default Project"
                onChange={(e) => {
                  const val = e.target.value;
                  setSettingsForm((f) => ({ ...f, defaultProjectId: val === '' ? null : Number(val) }));
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.primary_color || '#667eea' }} />
                      {p.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Search Results Count"
              type="number"
              fullWidth
              value={settingsForm.searchCount}
              onChange={(e) => setSettingsForm((f) => ({ ...f, searchCount: parseInt(e.target.value) || 10 }))}
              inputProps={{ min: 5, max: 20 }}
              helperText="Number of Brave Search results to analyze (5-20)"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Analysis Depth</InputLabel>
              <Select
                value={settingsForm.analysisDepth}
                label="Analysis Depth"
                onChange={(e) => setSettingsForm((f) => ({ ...f, analysisDepth: e.target.value as any }))}
                sx={{ borderRadius: 2 }}
              >
                {DEPTH_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label} â€” {opt.desc}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Default AI Model</InputLabel>
              <Select
                value={settingsForm.claudeModel}
                label="Default AI Model"
                onChange={(e) => setSettingsForm((f) => ({ ...f, claudeModel: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                {MODEL_OPTIONS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label} â€” {m.desc}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSettingsOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 3 }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* â”€â”€â”€ Delete Confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Research?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.88rem' }}>
            Are you sure you want to delete <strong>"{deleteConfirm?.name}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)} sx={{ borderRadius: 2 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* â”€â”€â”€ Snackbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// â”€â”€â”€ Research Row Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ResearchRowProps {
  research: ResearchProject;
  selected: boolean;
  isRunning: boolean;
  projectName?: string;
  projectColor?: string;
  onToggleSelect: () => void;
  onRun: () => void;
  onDelete: () => void;
  onView: () => void;
  onDownloadPdf: () => void;
}

function ResearchRow({ research, selected, isRunning, projectName, projectColor, onToggleSelect, onRun, onDelete, onView, onDownloadPdf }: ResearchRowProps) {
  const [expanded, setExpanded] = useState(false);
  const statusConf = STATUS_CONFIG[research.status];

  return (
    <Paper
      sx={{
        boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5, overflow: 'hidden', transition: 'all 0.15s ease',
        ...(selected && { borderColor: '#667eea', bgcolor: 'rgba(102,126,234,0.02)' }),
        '&:hover': { borderColor: 'rgba(0,0,0,0.12)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2 }}>
        <Checkbox size="small" checked={selected} onChange={onToggleSelect} />

        <Chip
          icon={statusConf.icon}
          label={statusConf.label}
          size="small"
          sx={{
            minWidth: 100, fontSize: '0.72rem', fontWeight: 700, bgcolor: statusConf.bg, color: statusConf.color,
            '& .MuiChip-icon': { color: statusConf.color },
          }}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {research.name}
            </Typography>
            {projectName && (
              <Chip label={projectName} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${projectColor || '#667eea'}15`, color: projectColor || '#667eea', flexShrink: 0 }} />
            )}
          </Box>
          {research.name !== research.query && (
            <Typography sx={{ fontSize: '0.72rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {research.query}
            </Typography>
          )}
        </Box>

        {research.sources?.length > 0 && (
          <Chip label={`${research.sources.length} sources`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(118,75,162,0.08)', color: '#764ba2' }} />
        )}

        {research.keyFindings?.length > 0 && (
          <Chip label={`${research.keyFindings.length} findings`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(243,156,18,0.08)', color: '#f39c12' }} />
        )}

        <Typography sx={{ fontSize: '0.72rem', color: '#bbb', minWidth: 70, textAlign: 'right' }}>
          {new Date(research.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.3, ml: 1 }}>
          {(research.status === 'idle' || research.status === 'failed') && (
            <Tooltip title={research.status === 'failed' ? 'Retry' : 'Run'}>
              <IconButton size="small" onClick={onRun} disabled={isRunning} sx={{ color: '#667eea' }}>
                {isRunning ? <CircularProgress size={16} /> : research.status === 'failed' ? <RetryIcon sx={{ fontSize: 18 }} /> : <RunIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          )}

          {research.status === 'complete' && (
            <Tooltip title="View Report">
              <IconButton size="small" onClick={onView} sx={{ color: '#764ba2' }}>
                <PreviewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {research.status === 'complete' && (
            <Tooltip title="Save as PDF">
              <IconButton size="small" onClick={onDownloadPdf} sx={{ color: '#e74c3c' }}>
                <PdfIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {(research.summary || research.error) && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          )}
        </Box>
      </Box>

      {isRunning && <LinearProgress sx={{ height: 2, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #667eea, #764ba2)' } }} />}

      {research.error && !expanded && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', color: '#e74c3c' }}>Error: {research.error}</Typography>
        </Box>
      )}

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          {research.error && (
            <Alert severity="error" sx={{ mt: 1, borderRadius: 2, fontSize: '0.78rem' }}>{research.error}</Alert>
          )}
          {research.summary && (
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#27ae60', textTransform: 'uppercase', mb: 0.5 }}>Summary</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.5 }}>{research.summary}</Typography>
            </Box>
          )}
          {research.keyFindings?.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#f39c12', textTransform: 'uppercase', mb: 0.5 }}>Key Findings</Typography>
              {research.keyFindings.map((f, i) => (
                <Typography key={i} sx={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.4, pl: 1, borderLeft: '2px solid rgba(102,126,234,0.2)', mb: 0.5 }}>
                  {f}
                </Typography>
              ))}
            </Box>
          )}
          {research.status === 'complete' && (
            <Button size="small" onClick={onView} startIcon={<PreviewIcon sx={{ fontSize: 14 }} />} sx={{ mt: 1, borderRadius: 2, fontSize: '0.72rem', fontWeight: 700 }}>
              View Full Report
            </Button>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
