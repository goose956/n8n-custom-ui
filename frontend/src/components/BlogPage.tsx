import { useState, useEffect, useCallback } from'react';
import { API as API_ENDPOINTS, API_BASE_URL } from'../config/api';
import DOMPurify from'dompurify';
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
 InputAdornment,
 Checkbox,
 Divider,
 CircularProgress,
 Collapse,
} from'@mui/material';
import {
 Add as AddIcon,
 Edit as EditIcon,
 Delete as DeleteIcon,
 Publish as PublishIcon,
 Drafts as DraftIcon,
 Search as SearchIcon,
 AutoAwesome as GenerateIcon,
 PlayArrow as PlayIcon,
 Refresh as RetryIcon,
 Settings as SettingsIcon,
 Map as SitemapIcon,
 Schedule as ScheduleIcon,
 CheckCircle as PublishedIcon,
 HourglassEmpty as QueuedIcon,
 ErrorOutline as FailedIcon,
 ContentCopy as CopyIcon,
 DeleteSweep as BulkDeleteIcon,
 ExpandMore as ExpandIcon,
 ExpandLess as CollapseIcon,
 Visibility as PreviewIcon,
 Code as CodeIcon,
 Article as ArticleIcon,
 Folder as FolderIcon,
 FolderOpen as FolderOpenIcon,
 TipsAndUpdates as TipsIcon,
 AutoFixHigh as OptimizeIcon,
 CheckCircleOutline as CheckIcon,
 Info as InfoIcon,
} from'@mui/icons-material';

// "€"€"€ Types "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

interface BlogPost {
 id: string;
 projectId: number | null;
 keyword: string;
 title: string;
 slug: string;
 content: string;
 excerpt: string;
 status:'queued' |'generating' |'draft' |'scheduled' |'published' |'failed';
 length:'short' |'medium' |'long';
 wordCount: number;
 scheduledAt: string | null;
 publishedAt: string | null;
 createdAt: string;
 updatedAt: string;
 tags: string[];
 metaDescription: string;
 error?: string;
 featuredImage?: string;
 views?: number;
}

interface BlogSettings {
 frequency:'manual' |'daily' |'weekly' |'biweekly' |'monthly';
 defaultLength:'short' |'medium' |'long';
 defaultStatus:'draft' |'published';
 projectId: number | null;
 autoGenerateTitle: boolean;
}

interface Stats {
 total: number;
 queued: number;
 generating: number;
 draft: number;
 scheduled: number;
 published: number;
 failed: number;
 totalWords: number;
 totalViews: number;
}

const BLOG_API = API_ENDPOINTS.blog;
const APPS_API = API_ENDPOINTS.apps;

interface Project {
 id: number;
 name: string;
 slug: string;
 primary_color?: string;
}

interface ProjectIndex {
 projectId: number | null;
 projectName: string;
 projectSlug: string;
 projectColor: string;
 total: number;
 queued: number;
 draft: number;
 published: number;
 failed: number;
 totalWords: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
 queued: { label:'Queued', color:'#3498db', bg:'rgba(52,152,219,0.08)', icon: <QueuedIcon sx={{ fontSize: 16 }} /> },
 generating: { label:'Generating', color:'#f39c12', bg:'rgba(243,156,18,0.08)', icon: <GenerateIcon sx={{ fontSize: 16 }} /> },
 draft: { label:'Draft', color:'#95a5a6', bg:'rgba(149,165,166,0.08)', icon: <DraftIcon sx={{ fontSize: 16 }} /> },
 scheduled: { label:'Scheduled', color:'#9b59b6', bg:'rgba(155,89,182,0.08)', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> },
 published: { label:'Published', color:'#27ae60', bg:'rgba(39,174,96,0.08)', icon: <PublishedIcon sx={{ fontSize: 16 }} /> },
 failed: { label:'Failed', color:'#e74c3c', bg:'rgba(231,76,60,0.08)', icon: <FailedIcon sx={{ fontSize: 16 }} /> },
};

const LENGTH_OPTIONS = [
 { value:'short', label:'Short', desc:'400-600 words' },
 { value:'medium', label:'Medium', desc:'800-1200 words' },
 { value:'long', label:'Long', desc:'1500-2500 words' },
];

// "€"€"€ Component "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

export function BlogPage() {
 const [posts, setPosts] = useState<BlogPost[]>([]);
 const [stats, setStats] = useState<Stats | null>(null);
 const [, setSettings] = useState<BlogSettings | null>(null);
 const [loading, setLoading] = useState(true);
 const [generating, setGenerating] = useState<Set<string>>(new Set());

 // Projects
 const [projects, setProjects] = useState<Project[]>([]);
 const [selectedProject, setSelectedProject] = useState<number | null>(null);
 const [projectIndex, setProjectIndex] = useState<ProjectIndex[]>([]);

 // Tab
 const [activeTab, setActiveTab] = useState(0);

 // Keyword input
 const [keywordInput, setKeywordInput] = useState('');
 const [keywordLength, setKeywordLength] = useState<'short' |'medium' |'long'>('medium');

 // Keyword suggestions
 const [suggestions, setSuggestions] = useState<{ keyword: string; type: string; score: number; reason: string }[]>([]);
 const [suggestingKeywords, setSuggestingKeywords] = useState(false);
 const [showTips, setShowTips] = useState(false);

 // Search / filter
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter] = useState<string>('all');

 // Selection
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

 // Edit dialog
 const [editDialog, setEditDialog] = useState<{ open: boolean; post: BlogPost | null }>({ open: false, post: null });
 const [editContent, setEditContent] = useState('');
 const [editTitle, setEditTitle] = useState('');
 const [editExcerpt, setEditExcerpt] = useState('');
 const [editTags, setEditTags] = useState('');
 const [editMeta, setEditMeta] = useState('');
 const [editMode, setEditMode] = useState<'visual' |'html'>('visual');

 // Preview
 const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

 // Settings dialog
 const [settingsOpen, setSettingsOpen] = useState(false);
 const [settingsForm, setSettingsForm] = useState<BlogSettings>({
 frequency:'manual',
 defaultLength:'medium',
 defaultStatus:'draft',
 projectId: null,
 autoGenerateTitle: true,
 });

 // Sitemap dialog
 const [sitemapDialog, setSitemapDialog] = useState<{ open: boolean; content: string; postCount: number }>({
 open: false,
 content:'',
 postCount: 0,
 });

 // Delete confirm
 const [deleteConfirm, setDeleteConfirm] = useState<BlogPost | null>(null);

 // Snackbar
 const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity:'success' |'error' |'info' |'warning' }>({
 open: false,
 message:'',
 severity:'info',
 });

 // "€"€"€ Data fetching "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const fetchProjects = useCallback(async () => {
 try {
 const res = await fetch(APPS_API);
 const data = await res.json();
 if (data.success) setProjects(data.data || []);
 } catch { /* silent */ }
 }, []);

 const fetchProjectIndex = useCallback(async () => {
 try {
 const res = await fetch(`${BLOG_API}/project-index`);
 const data = await res.json();
 if (data.success) setProjectIndex(data.data || []);
 } catch { /* silent */ }
 }, []);

 const fetchPosts = useCallback(async () => {
 try {
 const url = selectedProject != null ?`${BLOG_API}/posts?projectId=${selectedProject}` :`${BLOG_API}/posts`;
 const res = await fetch(url);
 const data = await res.json();
 if (data.success) setPosts(data.data);
 } catch {
 setSnackbar({ open: true, message:'Failed to load posts', severity:'error' });
 } finally {
 setLoading(false);
 }
 }, [selectedProject]);

 const fetchStats = useCallback(async () => {
 try {
 const url = selectedProject != null ?`${BLOG_API}/stats?projectId=${selectedProject}` :`${BLOG_API}/stats`;
 const res = await fetch(url);
 const data = await res.json();
 if (data.success) setStats(data.data);
 } catch { /* silent */ }
 }, [selectedProject]);

 const fetchSettings = useCallback(async () => {
 try {
 const res = await fetch(`${BLOG_API}/settings`);
 const data = await res.json();
 if (data.success) {
 setSettings(data.data);
 setSettingsForm(data.data);
 }
 } catch { /* silent */ }
 }, []);

 useEffect(() => {
 fetchProjects();
 }, [fetchProjects]);

 useEffect(() => {
 fetchPosts();
 fetchStats();
 fetchSettings();
 fetchProjectIndex();
 }, [fetchPosts, fetchStats, fetchSettings, fetchProjectIndex]);

 // "€"€"€ Add keywords "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const handleAddKeywords = useCallback(async () => {
 const keywords = keywordInput
 .split(/[,\n]+/)
 .map((k) => k.trim())
 .filter(Boolean);

 if (keywords.length === 0) return;

 try {
 const res = await fetch(`${BLOG_API}/keywords`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ keywords, length: keywordLength, projectId: selectedProject }),
 });
 const data = await res.json();
 if (data.success) {
 setKeywordInput('');
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 setSnackbar({ open: true, message:`${keywords.length} keyword(s) added to queue`, severity:'success' });
 }
 } catch {
 setSnackbar({ open: true, message:'Failed to add keywords', severity:'error' });
 }
 }, [keywordInput, keywordLength, selectedProject, fetchPosts, fetchStats, fetchProjectIndex]);

 // --- Suggest optimized keywords ---

 const handleSuggestKeywords = useCallback(async () => {
 const seed = keywordInput.trim();
 if (!seed) return;
 setSuggestingKeywords(true);
 setSuggestions([]);
 try {
 const res = await fetch(`${BLOG_API}/suggest-keywords`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ seed }),
 });
 const data = await res.json();
 if (data.success && data.data?.suggestions) {
 setSuggestions(data.data.suggestions);
 } else {
 setSnackbar({ open: true, message: data.message ||'Failed to suggest keywords', severity:'error' });
 }
 } catch {
 setSnackbar({ open: true, message:'Failed to suggest keywords', severity:'error' });
 } finally {
 setSuggestingKeywords(false);
 }
 }, [keywordInput]);

 const handleAddSuggestion = useCallback((keyword: string) => {
 setKeywordInput((prev) => {
 const existing = prev.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean);
 if (existing.includes(keyword)) return prev;
 return prev ?`${prev}, ${keyword}` : keyword;
 });
 }, []);

 const handleAddAllSuggestions = useCallback(() => {
 const existing = keywordInput.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean);
 const newKeywords = suggestions.map((s) => s.keyword).filter((k) => !existing.includes(k));
 setKeywordInput(() => {
 const all = [...existing, ...newKeywords];
 return all.join(',');
 });
 }, [keywordInput, suggestions]);

 // "€"€"€ Generate "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const handleGenerate = useCallback(async (id: string) => {
 setGenerating((prev) => new Set(prev).add(id));
 try {
 const res = await fetch(`${BLOG_API}/generate/${id}`, { method:'POST' });
 const data = await res.json();
 if (data.success) {
 setSnackbar({ open: true, message:`"${data.data.title}" generated`, severity:'success' });
 } else {
 setSnackbar({ open: true, message: data.message, severity:'error' });
 }
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 } catch {
 setSnackbar({ open: true, message:'Generation failed', severity:'error' });
 } finally {
 setGenerating((prev) => {
 const next = new Set(prev);
 next.delete(id);
 return next;
 });
 }
 }, [fetchPosts, fetchStats, fetchProjectIndex]);

 const handleGenerateAll = useCallback(async () => {
 // If items are selected, only generate those; otherwise generate all queued
 const hasSelection = selectedIds.size > 0;
 const toGenerate = hasSelection
 ? posts.filter((p) => selectedIds.has(p.id) && (p.status ==='queued' || p.status ==='failed'))
 : posts.filter((p) => p.status ==='queued' || p.status ==='failed');

 if (toGenerate.length === 0) {
 setSnackbar({ open: true, message: hasSelection ?'No queued/failed posts in selection' :'No queued posts to generate', severity:'info' });
 return;
 }

 setSnackbar({ open: true, message:`Generating ${toGenerate.length} post${toGenerate.length > 1 ?'s' :''}... This may take a while`, severity:'info' });
 setGenerating(new Set(toGenerate.map((p) => p.id)));

 try {
 const fetchOpts: RequestInit = {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(hasSelection ? { ids: Array.from(selectedIds) } : {}),
 };
 const res = await fetch(`${BLOG_API}/generate-all`, fetchOpts);
 const data = await res.json();
 const succeeded = data.results?.filter((r: any) => r.success).length || 0;
 const failed = data.results?.filter((r: any) => !r.success).length || 0;
 setSnackbar({
 open: true,
 message:`Generated: ${succeeded} succeeded, ${failed} failed`,
 severity: failed > 0 ?'warning' :'success',
 });
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 if (hasSelection) setSelectedIds(new Set());
 } catch {
 setSnackbar({ open: true, message:'Bulk generation failed', severity:'error' });
 } finally {
 setGenerating(new Set());
 }
 }, [posts, selectedIds, fetchPosts, fetchStats, fetchProjectIndex]);

 // "€"€"€ Publish / Unpublish "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const handlePublish = useCallback(async (id: string) => {
 try {
 await fetch(`${BLOG_API}/publish/${id}`, { method:'POST' });
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 setSnackbar({ open: true, message:'Post published', severity:'success' });
 } catch {
 setSnackbar({ open: true, message:'Failed to publish', severity:'error' });
 }
 }, [fetchPosts, fetchStats, fetchProjectIndex]);

 const handleUnpublish = useCallback(async (id: string) => {
 try {
 await fetch(`${BLOG_API}/unpublish/${id}`, { method:'POST' });
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 setSnackbar({ open: true, message:'Post moved to draft', severity:'success' });
 } catch {
 setSnackbar({ open: true, message:'Failed to unpublish', severity:'error' });
 }
 }, [fetchPosts, fetchStats, fetchProjectIndex]);

 // "€"€"€ Delete "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const handleDelete = useCallback(async (id: string) => {
 try {
 await fetch(`${BLOG_API}/posts/${id}`, { method:'DELETE' });
 setDeleteConfirm(null);
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 setSnackbar({ open: true, message:'Post deleted', severity:'success' });
 } catch {
 setSnackbar({ open: true, message:'Failed to delete', severity:'error' });
 }
 }, [fetchPosts, fetchStats, fetchProjectIndex]);

 const handleBulkDelete = useCallback(async () => {
 if (selectedIds.size === 0) return;
 try {
 await fetch(`${BLOG_API}/posts/bulk-delete`, {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ ids: Array.from(selectedIds) }),
 });
 setSelectedIds(new Set());
 fetchPosts();
 fetchStats();
 fetchProjectIndex();
 setSnackbar({ open: true, message:`${selectedIds.size} posts deleted`, severity:'success' });
 } catch {
 setSnackbar({ open: true, message:'Failed to delete posts', severity:'error' });
 }
 }, [selectedIds, fetchPosts, fetchStats, fetchProjectIndex]);

 // "€"€"€ Edit "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const openEditor = (post: BlogPost) => {
 setEditDialog({ open: true, post });
 setEditTitle(post.title);
 setEditContent(post.content);
 setEditExcerpt(post.excerpt);
 setEditTags(post.tags.join(','));
 setEditMeta(post.metaDescription);
 setEditMode('visual');
 };

 const handleSaveEdit = useCallback(async () => {
 if (!editDialog.post) return;
 try {
 const res = await fetch(`${BLOG_API}/posts/${editDialog.post.id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 title: editTitle,
 content: editContent,
 excerpt: editExcerpt,
 tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
 metaDescription: editMeta,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setEditDialog({ open: false, post: null });
 fetchPosts();
 setSnackbar({ open: true, message:'Post updated', severity:'success' });
 }
 } catch {
 setSnackbar({ open: true, message:'Failed to save', severity:'error' });
 }
 }, [editDialog, editTitle, editContent, editExcerpt, editTags, editMeta, fetchPosts]);

 // "€"€"€ Settings "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const handleSaveSettings = useCallback(async () => {
 try {
 await fetch(`${BLOG_API}/settings`, {
 method:'PUT',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(settingsForm),
 });
 setSettings(settingsForm);
 setSettingsOpen(false);
 setSnackbar({ open: true, message:'Settings saved', severity:'success' });
 } catch {
 setSnackbar({ open: true, message:'Failed to save settings', severity:'error' });
 }
 }, [settingsForm]);

 // "€"€"€ Sitemap "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const handleViewSitemap = useCallback(async () => {
 try {
 const res = await fetch(`${BLOG_API}/sitemap`);
 const data = await res.json();
 setSitemapDialog({ open: true, content: data.content ||'', postCount: data.postCount || 0 });
 } catch {
 setSnackbar({ open: true, message:'Failed to load sitemap', severity:'error' });
 }
 }, []);

 const handleRegenerateSitemap = useCallback(async () => {
 try {
 await fetch(`${BLOG_API}/sitemap/regenerate`, { method:'POST' });
 setSnackbar({ open: true, message:'Sitemap regenerated', severity:'success' });
 // Refresh it
 const res = await fetch(`${BLOG_API}/sitemap`);
 const data = await res.json();
 setSitemapDialog((s) => ({ ...s, content: data.content ||'', postCount: data.postCount || 0 }));
 } catch {
 setSnackbar({ open: true, message:'Failed to regenerate sitemap', severity:'error' });
 }
 }, []);

 // "€"€"€ Filtering "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 const filteredPosts = posts.filter((p) => {
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 if (!p.keyword.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q) && !p.tags.some((t) => t.toLowerCase().includes(q))) {
 return false;
 }
 }
 if (statusFilter !=='all' && p.status !== statusFilter) return false;

 // Tab filtering
 if (activeTab === 1) return p.status ==='queued' || p.status ==='generating' || p.status ==='failed';
 if (activeTab === 2) return p.status ==='draft' || p.status ==='scheduled';
 if (activeTab === 3) return p.status ==='published';
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
 if (selectedIds.size === filteredPosts.length) {
 setSelectedIds(new Set());
 } else {
 setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
 }
 };

 // "€"€"€ Render "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

 return (
 <Box sx={{ p: 3, maxWidth: 1400, mx:'auto' }}>
 {/* "€"€"€ Header "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb: 3 }}>
 <Box>
 <Typography variant="h4" sx={{ fontSize:'1.8rem', fontWeight: 800, color:'#1a1a2e', mb: 0.5 }}>
 Blog Manager
 </Typography>
 <Typography sx={{ fontSize:'0.9rem', color:'#888' }}>
 Generate, edit, and publish SEO-optimised blog posts using AI. Create content from topics or keywords, manage drafts, and build a content library for each of your projects.
 </Typography>
 </Box>
 <Box sx={{ display:'flex', gap: 1, alignItems:'center' }}>
 {/* Project Picker */}
 <FormControl size="small" sx={{ minWidth: 200 }}>
 <InputLabel sx={{ fontSize:'0.82rem' }}>
 <FolderIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign:'text-bottom' }} />
 Project
 </InputLabel>
 <Select
 value={selectedProject ??''}
 label="Project"
 onChange={(e) => {
 const val = e.target.value;
 setSelectedProject(val ==='' ? null : Number(val));
 }}
 sx={{ borderRadius: 2.5, fontSize:'0.85rem', height: 42, bgcolor:'#fff' }}
 >
 <MenuItem value="">
 <em>All Projects</em>
 </MenuItem>
 {projects.map((p) => (
 <MenuItem key={p.id} value={p.id}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ width: 10, height: 10, borderRadius:'50%', bgcolor: p.primary_color ||'#667eea' }} />
 {p.name}
 </Box>
 </MenuItem>
 ))}
 </Select>
 </FormControl>
 <Tooltip title="Sitemap">
 <Button
 variant="outlined"
 startIcon={<SitemapIcon />}
 onClick={handleViewSitemap}
 sx={{ borderRadius: 2.5, borderColor:'rgba(0,0,0,0.1)', color:'#666', height: 42 }}
 >
 Sitemap
 </Button>
 </Tooltip>
 <Tooltip title="Settings">
 <Button
 variant="outlined"
 startIcon={<SettingsIcon />}
 onClick={() => setSettingsOpen(true)}
 sx={{ borderRadius: 2.5, borderColor:'rgba(0,0,0,0.1)', color:'#666', height: 42 }}
 >
 Settings
 </Button>
 </Tooltip>
 </Box>
 </Box>

 {/* "€"€"€ Project Index "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {selectedProject === null && projectIndex.length > 0 && (
 <Paper
 sx={{
 p: 2,
 mb: 3,
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 borderRadius: 3,
 }}
 >
 <Typography sx={{ fontSize:'0.82rem', fontWeight: 800, color:'#1a1a2e', mb: 1.5, display:'flex', alignItems:'center', gap: 1 }}>
 <FolderOpenIcon sx={{ fontSize: 18, color:'#667eea' }} />
 Posts by Project
 </Typography>
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap: 1.5 }}>
 {projectIndex.map((pi) => (
 <Paper
 key={pi.projectId ??'unassigned'}
 onClick={() => pi.projectId != null && setSelectedProject(pi.projectId)}
 sx={{
 p: 1.5,
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 borderRadius: 2.5,
 cursor: pi.projectId != null ?'pointer' :'default',
 transition:'all 0.15s',
'&:hover': pi.projectId != null ? {
 borderColor: pi.projectColor ||'#667eea',
 bgcolor:`${pi.projectColor ||'#667eea'}08`,
 transform:'translateY(-1px)',
 } : {},
 }}
 >
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 1 }}>
 <Box sx={{ width: 10, height: 10, borderRadius:'50%', bgcolor: pi.projectColor ||'#999' }} />
 <Typography sx={{ fontSize:'0.82rem', fontWeight: 700, color:'#1a1a2e' }}>{pi.projectName}</Typography>
 <Chip label={pi.total} size="small" sx={{ ml:'auto', height: 20, fontSize:'0.68rem', fontWeight: 700 }} />
 </Box>
 <Box sx={{ display:'flex', gap: 1.5 }}>
 <Typography sx={{ fontSize:'0.68rem', color:'#27ae60' }}>
 <strong>{pi.published}</strong> published
 </Typography>
 <Typography sx={{ fontSize:'0.68rem', color:'#95a5a6' }}>
 <strong>{pi.draft}</strong> drafts
 </Typography>
 <Typography sx={{ fontSize:'0.68rem', color:'#3498db' }}>
 <strong>{pi.queued}</strong> queued
 </Typography>
 {pi.failed > 0 && (
 <Typography sx={{ fontSize:'0.68rem', color:'#e74c3c' }}>
 <strong>{pi.failed}</strong> failed
 </Typography>
 )}
 </Box>
 </Paper>
 ))}
 </Box>
 </Paper>
 )}

 {/* "€"€"€ Stats "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {stats && (
 <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 1.5, mb: 3 }}>
 {[
 { label:'Total', value: stats.total, color:'#667eea' },
 { label:'Queued', value: stats.queued, color:'#3498db' },
 { label:'Drafts', value: stats.draft, color:'#95a5a6' },
 { label:'Published', value: stats.published, color:'#27ae60' },
 { label:'Failed', value: stats.failed, color:'#e74c3c' },
 { label:'Total Words', value: stats.totalWords.toLocaleString(), color:'#764ba2' },
 { label:'Total Views', value: (stats.totalViews || 0).toLocaleString(), color:'#e67e22' },
 ].map((s) => (
 <Paper
 key={s.label}
 sx={{
 p: 1.5,
 textAlign:'center',
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 borderRadius: 2.5,
 bgcolor:`${s.color}08`,
 }}
 >
 <Typography sx={{ fontSize:'1.3rem', fontWeight: 800, color: s.color }}>{s.value}</Typography>
 <Typography sx={{ fontSize:'0.65rem', fontWeight: 700, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.04em' }}>
 {s.label}
 </Typography>
 </Paper>
 ))}
 </Box>
 )}

 {/* "€"€"€ Keyword Input "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Paper
 sx={{
 p: 2.5,
 mb: 3,
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 borderRadius: 3,
 background:'linear-gradient(135deg, rgba(102,126,234,0.03) 0%, rgba(118,75,162,0.03) 100%)',
 }}
 >
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1.5 }}>
 <Typography sx={{ fontSize:'0.88rem', fontWeight: 800, color:'#1a1a2e', display:'flex', alignItems:'center', gap: 1 }}>
 <AddIcon sx={{ fontSize: 18, color:'#667eea' }} />
 Add Keywords
 </Typography>
 <Button
 size="small"
 startIcon={<TipsIcon sx={{ fontSize: 16 }} />}
 onClick={() => setShowTips(!showTips)}
 sx={{ fontSize:'0.75rem', color:'#667eea', textTransform:'none' }}
 >
 {showTips ?'Hide Tips' :'LLM Keyword Tips'}
 </Button>
 </Box>

 {/* Keyword Tips Panel */}
 <Collapse in={showTips}>
 <Paper
 elevation={0}
 sx={{
 p: 2, mb: 2, borderRadius: 2,
 background:'linear-gradient(135deg, rgba(102,126,234,0.06) 0%, rgba(118,75,162,0.06) 100%)',
 border:'1px solid rgba(102,126,234,0.15)',
 }}
 >
 <Typography sx={{ fontSize:'0.82rem', fontWeight: 700, color:'#1a1a2e', mb: 1, display:'flex', alignItems:'center', gap: 0.5 }}>
 <InfoIcon sx={{ fontSize: 16, color:'#667eea' }} /> Keywords that LLMs love to cite:
 </Typography>
 <Box sx={{ display:'flex', flexWrap:'wrap', gap: 0.8 }}>
 {[
 { label:'"What is X?"', type:'Question', color:'#667eea' },
 { label:'"How to X step by step"', type:'How-to', color:'#27ae60' },
 { label:'"X vs Y comparison"', type:'Comparison', color:'#e67e22' },
 { label:'"Best X for Y in 2026"', type:'List/Ranking', color:'#9b59b6' },
 { label:'"X explained simply"', type:'Definition', color:'#3498db' },
 { label:'"How to fix X"', type:'Problem/Solution', color:'#e74c3c' },
 ].map((tip) => (
 <Chip
 key={tip.label}
 label={<><strong>{tip.type}:</strong> {tip.label}</>}
 size="small"
 sx={{
 fontSize:'0.72rem', bgcolor:`${tip.color}12`, color: tip.color,
 border:`1px solid ${tip.color}30`, cursor:'default',
 }}
 />
 ))}
 </Box>
 <Typography sx={{ fontSize:'0.73rem', color:'#888', mt: 1, fontStyle:'italic' }}>
 Tip: Type a broad topic below and click "Optimize" to auto-generate LLM-optimized keyword variations.
 </Typography>
 </Paper>
 </Collapse>

 <Box sx={{ display:'flex', gap: 1.5, alignItems:'flex-start' }}>
 <Box sx={{ flex: 1 }}>
 <TextField
 multiline
 minRows={2}
 maxRows={4}
 placeholder={'Enter keywords separated by commas or new lines...\ne.g. best fishing spots 2026, how to tie fishing knots, top 10 fishing reels\n\nTip: Type a broad topic like "fishing reels" and click Optimize for AI suggestions'}
 value={keywordInput}
 onChange={(e) => setKeywordInput(e.target.value)}
 fullWidth
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2, fontSize:'0.85rem' } }}
 />
 {/* Keyword Suggestions */}
 {(suggestingKeywords || suggestions.length > 0) && (
 <Paper
 elevation={0}
 sx={{
 mt: 1.5, p: 2, borderRadius: 2,
 border:'1px solid rgba(102,126,234,0.2)',
 background:'linear-gradient(135deg, rgba(102,126,234,0.04) 0%, rgba(39,174,96,0.04) 100%)',
 }}
 >
 {suggestingKeywords ? (
 <Box sx={{ display:'flex', alignItems:'center', gap: 1, py: 1 }}>
 <CircularProgress size={18} sx={{ color:'#667eea' }} />
 <Typography sx={{ fontSize:'0.82rem', color:'#667eea', fontWeight: 600 }}>
 AI is generating optimized keyword variations...
 </Typography>
 </Box>
 ) : (
 <>
 <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
 <Typography sx={{ fontSize:'0.82rem', fontWeight: 700, color:'#1a1a2e', display:'flex', alignItems:'center', gap: 0.5 }}>
 <OptimizeIcon sx={{ fontSize: 16, color:'#667eea' }} />
 Optimized Suggestions ({suggestions.length})
 </Typography>
 <Box sx={{ display:'flex', gap: 1 }}>
 <Button
 size="small"
 onClick={handleAddAllSuggestions}
 sx={{ fontSize:'0.72rem', color:'#27ae60', textTransform:'none' }}
 >
 Add All
 </Button>
 <Button
 size="small"
 onClick={() => setSuggestions([])}
 sx={{ fontSize:'0.72rem', color:'#999', textTransform:'none' }}
 >
 Dismiss
 </Button>
 </Box>
 </Box>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 0.8 }}>
 {suggestions.map((s, i) => {
 const typeColors: Record<string, string> = {
 question:'#667eea', comparison:'#e67e22', definition:'#3498db',
 list:'#9b59b6', howto:'#27ae60', problem:'#e74c3c', specific:'#f39c12',
 };
 const color = typeColors[s.type] ||'#667eea';
 const isAdded = keywordInput.split(/[,\n]+/).map(k => k.trim()).includes(s.keyword);
 return (
 <Box
 key={i}
 sx={{
 display:'flex', alignItems:'center', gap: 1, py: 0.5, px: 1,
 borderRadius: 1.5, cursor: isAdded ?'default' :'pointer',
 bgcolor: isAdded ?'rgba(39,174,96,0.06)' :'transparent',
'&:hover': { bgcolor: isAdded ?'rgba(39,174,96,0.06)' :'rgba(102,126,234,0.06)' },
 transition:'all 0.15s',
 }}
 onClick={() => !isAdded && handleAddSuggestion(s.keyword)}
 >
 {isAdded ? (
 <CheckIcon sx={{ fontSize: 16, color:'#27ae60' }} />
 ) : (
 <AddIcon sx={{ fontSize: 16, color:'#667eea' }} />
 )}
 <Typography sx={{ fontSize:'0.82rem', fontWeight: 600, color:'#1a1a2e', flex: 1 }}>
 {s.keyword}
 </Typography>
 <Chip
 label={s.type}
 size="small"
 sx={{ fontSize:'0.65rem', height: 20, bgcolor:`${color}15`, color, border:`1px solid ${color}30` }}
 />
 <Chip
 label={`${s.score}/100`}
 size="small"
 sx={{
 fontSize:'0.65rem', height: 20, fontWeight: 700,
 bgcolor: s.score >= 80 ?'rgba(39,174,96,0.1)' : s.score >= 60 ?'rgba(243,156,18,0.1)' :'rgba(231,76,60,0.1)',
 color: s.score >= 80 ?'#27ae60' : s.score >= 60 ?'#f39c12' :'#e74c3c',
 }}
 />
 <Tooltip title={s.reason} arrow>
 <InfoIcon sx={{ fontSize: 14, color:'#bbb', cursor:'help' }} />
 </Tooltip>
 </Box>
 );
 })}
 </Box>
 </>
 )}
 </Paper>
 )}
 </Box>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1, minWidth: 170 }}>
 <FormControl size="small" fullWidth>
 <InputLabel sx={{ fontSize:'0.78rem' }}>Length</InputLabel>
 <Select
 value={keywordLength}
 label="Length"
 onChange={(e) => setKeywordLength(e.target.value as any)}
 sx={{ fontSize:'0.82rem', borderRadius: 2 }}
 >
 {LENGTH_OPTIONS.map((opt) => (
 <MenuItem key={opt.value} value={opt.value}>
 {opt.label} ({opt.desc})
 </MenuItem>
 ))}
 </Select>
 </FormControl>
 <Button
 variant="contained"
 fullWidth
 onClick={handleSuggestKeywords}
 disabled={!keywordInput.trim() || suggestingKeywords}
 startIcon={suggestingKeywords ? <CircularProgress size={14} sx={{ color:'#fff' }} /> : <OptimizeIcon />}
 sx={{
 borderRadius: 2,
 background:'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
 fontWeight: 700,
 fontSize:'0.82rem',
 py: 1,
'&:hover': { background:'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
 }}
 >
 {suggestingKeywords ?'Optimizing...' :'Optimize'}
 </Button>
 <Button
 variant="contained"
 fullWidth
 onClick={handleAddKeywords}
 disabled={!keywordInput.trim()}
 startIcon={<AddIcon />}
 sx={{
 borderRadius: 2,
 background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 fontWeight: 700,
 fontSize:'0.82rem',
 py: 1,
 }}
 >
 Add to Queue
 </Button>
 <Button
 variant="outlined"
 fullWidth
 onClick={handleGenerateAll}
 disabled={generating.size > 0}
 startIcon={generating.size > 0 ? <CircularProgress size={14} /> : <GenerateIcon />}
 sx={{
 borderRadius: 2,
 borderColor:'#667eea',
 color:'#667eea',
 fontWeight: 700,
 fontSize:'0.82rem',
 py: 1,
 }}
 >
 {generating.size > 0 ?'Generating...' : selectedIds.size > 0 ?`Generate Selected (${selectedIds.size})` :'Generate All'}
 </Button>
 </Box>
 </Box>
 </Paper>

 {/* "€"€"€ Tabs "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Box sx={{ mb: 2 }}>
 <Tabs
 value={activeTab}
 onChange={(_, v) => { setActiveTab(v); setSelectedIds(new Set()); }}
 sx={{
 minHeight: 40,
'& .MuiTab-root': { minHeight: 40, fontSize:'0.82rem', fontWeight: 700, textTransform:'none' },
'& .MuiTabs-indicator': { background:'linear-gradient(90deg, #667eea, #764ba2)', height: 3, borderRadius: 2 },
 }}
 >
 <Tab label={`All (${posts.length})`} />
 <Tab label={`Queue (${posts.filter((p) => ['queued','generating','failed'].includes(p.status)).length})`} />
 <Tab label={`Drafts (${posts.filter((p) => ['draft','scheduled'].includes(p.status)).length})`} />
 <Tab label={`Published (${posts.filter((p) => p.status ==='published').length})`} />
 </Tabs>
 </Box>

 {/* "€"€"€ Toolbar "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Paper
 sx={{
 p: 1,
 mb: 2,
 display:'flex',
 alignItems:'center',
 gap: 1,
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 borderRadius: 2.5,
 }}
 >
 <Tooltip title="Select All">
 <Checkbox
 size="small"
 checked={filteredPosts.length > 0 && selectedIds.size === filteredPosts.length}
 indeterminate={selectedIds.size > 0 && selectedIds.size < filteredPosts.length}
 onChange={toggleSelectAll}
 />
 </Tooltip>
 <TextField
 size="small"
 placeholder="Search posts..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 InputProps={{
 startAdornment: (
 <InputAdornment position="start">
 <SearchIcon sx={{ fontSize: 18, color:'#bbb' }} />
 </InputAdornment>
 ),
 }}
 sx={{ flex: 1,'& .MuiOutlinedInput-root': { borderRadius: 2, fontSize:'0.82rem', height: 36 } }}
 />

 {selectedIds.size > 0 && (
 <>
 <Chip label={`${selectedIds.size} selected`} size="small" sx={{ fontWeight: 700 }} />
 <Button
 size="small"
 color="error"
 startIcon={<BulkDeleteIcon sx={{ fontSize: 16 }} />}
 onClick={handleBulkDelete}
 sx={{ borderRadius: 2, fontSize:'0.78rem', fontWeight: 700 }}
 >
 Delete Selected
 </Button>
 </>
 )}
 </Paper>

 {/* "€"€"€ Post List "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 {loading ? (
 <Box sx={{ textAlign:'center', py: 6 }}>
 <CircularProgress />
 </Box>
 ) : filteredPosts.length === 0 ? (
 <Paper
 sx={{
 p: 4,
 textAlign:'center',
 boxShadow:'none',
 border:'2px dashed rgba(102,126,234,0.15)',
 borderRadius: 3,
 }}
 >
 <ArticleIcon sx={{ fontSize: 48, color:'#ddd', mb: 1 }} />
 <Typography sx={{ fontSize:'0.95rem', fontWeight: 700, color:'#999' }}>
 {posts.length === 0 ?'No blog posts yet' :'No posts match your search'}
 </Typography>
 <Typography sx={{ fontSize:'0.8rem', color:'#bbb', mt: 0.5 }}>
 Add keywords above to start generating blog content
 </Typography>
 </Paper>
 ) : (
 <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
 {filteredPosts.map((post) => {
 const proj = projects.find((p) => p.id === post.projectId);
 return (
 <PostRow
 key={post.id}
 post={post}
 selected={selectedIds.has(post.id)}
 isGenerating={generating.has(post.id)}
 projectName={selectedProject === null && proj ? proj.name : undefined}
 projectColor={selectedProject === null && proj ? proj.primary_color : undefined}
 onToggleSelect={() => toggleSelect(post.id)}
 onGenerate={() => handleGenerate(post.id)}
 onEdit={() => openEditor(post)}
 onPublish={() => handlePublish(post.id)}
 onUnpublish={() => handleUnpublish(post.id)}
 onDelete={() => setDeleteConfirm(post)}
 onPreview={() => setPreviewPost(post)}
 onRetry={() => handleGenerate(post.id)}
 />
 );
 })}
 </Box>
 )}

 {/* "€"€"€ Edit Dialog "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, post: null })} maxWidth="lg" fullWidth>
 <DialogTitle sx={{ fontWeight: 800, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <EditIcon sx={{ color:'#667eea' }} />
 Edit Post
 </Box>
 <Box sx={{ display:'flex', gap: 0.5 }}>
 <Chip
 label="Visual"
 size="small"
 onClick={() => setEditMode('visual')}
 sx={{
 fontWeight: 700,
 bgcolor: editMode ==='visual' ?'rgba(102,126,234,0.12)' :'transparent',
 color: editMode ==='visual' ?'#667eea' :'#999',
 cursor:'pointer',
 }}
 />
 <Chip
 label="HTML"
 size="small"
 icon={<CodeIcon sx={{ fontSize:'14px !important' }} />}
 onClick={() => setEditMode('html')}
 sx={{
 fontWeight: 700,
 bgcolor: editMode ==='html' ?'rgba(102,126,234,0.12)' :'transparent',
 color: editMode ==='html' ?'#667eea' :'#999',
 cursor:'pointer',
'& .MuiChip-icon': { color: editMode ==='html' ?'#667eea' :'#999' },
 }}
 />
 </Box>
 </DialogTitle>
 <DialogContent>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 2, mt: 1 }}>
 <TextField
 label="Title"
 fullWidth
 value={editTitle}
 onChange={(e) => setEditTitle(e.target.value)}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 <TextField
 label="Excerpt"
 fullWidth
 multiline
 rows={2}
 value={editExcerpt}
 onChange={(e) => setEditExcerpt(e.target.value)}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 {editMode ==='html' ? (
 <TextField
 label="Content (HTML)"
 fullWidth
 multiline
 rows={16}
 value={editContent}
 onChange={(e) => setEditContent(e.target.value)}
 sx={{
'& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily:'monospace', fontSize:'0.82rem' },
 }}
 />
 ) : (
 <Box>
 <Typography sx={{ fontSize:'0.78rem', fontWeight: 700, color:'#888', mb: 0.5 }}>Content</Typography>
 <Paper
 sx={{
 p: 2,
 minHeight: 350,
 maxHeight: 500,
 overflow:'auto',
 border:'1px solid rgba(0,0,0,0.12)',
 borderRadius: 2,
 boxShadow:'none',
'& h2': { fontSize:'1.3rem', fontWeight: 700, color:'#1a1a2e', mb: 1, mt: 2 },
'& h3': { fontSize:'1.1rem', fontWeight: 700, color:'#333', mb: 0.5, mt: 1.5 },
'& p': { fontSize:'0.9rem', lineHeight: 1.75, color:'#444', mb: 1.5 },
'& ul, & ol': { pl: 3, mb: 1.5 },
'& li': { fontSize:'0.88rem', lineHeight: 1.6, color:'#444', mb: 0.5 },
'& strong': { fontWeight: 700 },
 }}
 contentEditable
 suppressContentEditableWarning
 onBlur={(e: React.FocusEvent<HTMLDivElement>) => setEditContent(e.currentTarget.innerHTML)}
 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editContent) }}
 />
 </Box>
 )}
 <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 2 }}>
 <TextField
 label="Tags (comma-separated)"
 fullWidth
 value={editTags}
 onChange={(e) => setEditTags(e.target.value)}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 <TextField
 label="Meta Description"
 fullWidth
 value={editMeta}
 onChange={(e) => setEditMeta(e.target.value)}
 inputProps={{ maxLength: 160 }}
 helperText={`${editMeta.length}/160`}
 sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 } }}
 />
 </Box>
 </Box>
 </DialogContent>
 <DialogActions sx={{ p: 2, gap: 1 }}>
 {editDialog.post && editDialog.post.status ==='draft' && (
 <Button
 onClick={() => {
 handleSaveEdit().then(() => {
 if (editDialog.post) handlePublish(editDialog.post.id);
 });
 }}
 startIcon={<PublishIcon />}
 sx={{ borderRadius: 2, fontWeight: 700, color:'#27ae60', mr:'auto' }}
 >
 Save & Publish
 </Button>
 )}
 <Button onClick={() => setEditDialog({ open: false, post: null })} sx={{ borderRadius: 2 }}>
 Cancel
 </Button>
 <Button
 variant="contained"
 onClick={handleSaveEdit}
 sx={{ borderRadius: 2, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 3 }}
 >
 Save Changes
 </Button>
 </DialogActions>
 </Dialog>

 {/* "€"€"€ Preview Dialog "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={Boolean(previewPost)} onClose={() => setPreviewPost(null)} maxWidth="md" fullWidth>
 <DialogTitle sx={{ fontWeight: 800 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <PreviewIcon sx={{ color:'#667eea' }} />
 Preview
 </Box>
 </DialogTitle>
 <DialogContent>
 {previewPost && (
 <Box>
 <Typography variant="h4" sx={{ fontWeight: 800, color:'#1a1a2e', mb: 1 }}>
 {previewPost.title}
 </Typography>
 <Box sx={{ display:'flex', gap: 1, mb: 2, flexWrap:'wrap' }}>
 {previewPost.tags.map((tag) => (
 <Chip key={tag} label={tag} size="small" sx={{ fontSize:'0.72rem', fontWeight: 600 }} />
 ))}
 <Typography sx={{ fontSize:'0.78rem', color:'#999', ml: 1 }}>
 {previewPost.wordCount} words &bull; {new Date(previewPost.createdAt).toLocaleDateString()}
 </Typography>
 </Box>
 {previewPost.featuredImage && (
 <Box
 component="img"
 src={previewPost.featuredImage.startsWith('http') ? previewPost.featuredImage : `${API_BASE_URL}${previewPost.featuredImage}`}
 alt={previewPost.title}
 sx={{
 width:'100%',
 maxHeight: 400,
 objectFit:'cover',
 borderRadius: 2,
 mb: 2,
 }}
 />
 )}
 {previewPost.excerpt && (
 <Typography
 sx={{
 fontSize:'1rem',
 color:'#555',
 fontStyle:'italic',
 mb: 3,
 p: 2,
 borderLeft:'3px solid #667eea',
 bgcolor:'rgba(102,126,234,0.04)',
 borderRadius:'0 8px 8px 0',
 }}
 >
 {previewPost.excerpt}
 </Typography>
 )}
 <Divider sx={{ mb: 2 }} />
 <Box
 sx={{
'& h2': { fontSize:'1.4rem', fontWeight: 700, color:'#1a1a2e', mb: 1, mt: 3 },
'& h3': { fontSize:'1.15rem', fontWeight: 700, color:'#333', mb: 0.5, mt: 2 },
'& p': { fontSize:'0.95rem', lineHeight: 1.8, color:'#444', mb: 1.5 },
'& ul, & ol': { pl: 3, mb: 1.5 },
'& li': { fontSize:'0.92rem', lineHeight: 1.7, color:'#444', mb: 0.5 },
'& strong': { fontWeight: 700 },
'& em': { fontStyle:'italic' },
 }}
 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewPost.content) }}
 />
 </Box>
 )}
 </DialogContent>
 <DialogActions sx={{ p: 2 }}>
 {previewPost && (
 <Button onClick={() => { setPreviewPost(null); openEditor(previewPost); }} startIcon={<EditIcon />} sx={{ borderRadius: 2, mr:'auto' }}>
 Edit
 </Button>
 )}
 <Button onClick={() => setPreviewPost(null)} sx={{ borderRadius: 2 }}>Close</Button>
 </DialogActions>
 </Dialog>

 {/* "€"€"€ Settings Dialog "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
 <DialogTitle sx={{ fontWeight: 800 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <SettingsIcon sx={{ color:'#667eea' }} />
 Blog Settings
 </Box>
 </DialogTitle>
 <DialogContent>
 <Box sx={{ display:'flex', flexDirection:'column', gap: 2.5, mt: 1 }}>
 <FormControl fullWidth>
 <InputLabel>Default Project</InputLabel>
 <Select
 value={settingsForm.projectId ??''}
 label="Default Project"
 onChange={(e) => {
 const val = e.target.value;
 setSettingsForm((f) => ({ ...f, projectId: val ==='' ? null : Number(val) }));
 }}
 sx={{ borderRadius: 2 }}
 >
 <MenuItem value="">
 <em>None</em>
 </MenuItem>
 {projects.map((p) => (
 <MenuItem key={p.id} value={p.id}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Box sx={{ width: 10, height: 10, borderRadius:'50%', bgcolor: p.primary_color ||'#667eea' }} />
 {p.name}
 </Box>
 </MenuItem>
 ))}
 </Select>
 </FormControl>
 <FormControl fullWidth>
 <InputLabel>Default Article Length</InputLabel>
 <Select
 value={settingsForm.defaultLength}
 label="Default Article Length"
 onChange={(e) => setSettingsForm((f) => ({ ...f, defaultLength: e.target.value as any }))}
 sx={{ borderRadius: 2 }}
 >
 {LENGTH_OPTIONS.map((opt) => (
 <MenuItem key={opt.value} value={opt.value}>{opt.label} - {opt.desc}</MenuItem>
 ))}
 </Select>
 </FormControl>
 <FormControl fullWidth>
 <InputLabel>Post Frequency</InputLabel>
 <Select
 value={settingsForm.frequency}
 label="Post Frequency"
 onChange={(e) => setSettingsForm((f) => ({ ...f, frequency: e.target.value as any }))}
 sx={{ borderRadius: 2 }}
 >
 <MenuItem value="manual">Manual</MenuItem>
 <MenuItem value="daily">Daily</MenuItem>
 <MenuItem value="weekly">Weekly</MenuItem>
 <MenuItem value="biweekly">Bi-Weekly</MenuItem>
 <MenuItem value="monthly">Monthly</MenuItem>
 </Select>
 </FormControl>
 <FormControl fullWidth>
 <InputLabel>After Generation</InputLabel>
 <Select
 value={settingsForm.defaultStatus}
 label="After Generation"
 onChange={(e) => setSettingsForm((f) => ({ ...f, defaultStatus: e.target.value as any }))}
 sx={{ borderRadius: 2 }}
 >
 <MenuItem value="draft">Save as Draft (review first)</MenuItem>
 <MenuItem value="published">Publish Directly</MenuItem>
 </Select>
 </FormControl>
 </Box>
 </DialogContent>
 <DialogActions sx={{ p: 2 }}>
 <Button onClick={() => setSettingsOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
 <Button
 variant="contained"
 onClick={handleSaveSettings}
 sx={{ borderRadius: 2, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 3 }}
 >
 Save Settings
 </Button>
 </DialogActions>
 </Dialog>

 {/* "€"€"€ Sitemap Dialog "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={sitemapDialog.open} onClose={() => setSitemapDialog({ open: false, content:'', postCount: 0 })} maxWidth="md" fullWidth>
 <DialogTitle sx={{ fontWeight: 800, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <SitemapIcon sx={{ color:'#667eea' }} />
 Sitemap
 <Chip label={`${sitemapDialog.postCount} published`} size="small" sx={{ fontWeight: 700, bgcolor:'rgba(39,174,96,0.1)', color:'#27ae60' }} />
 </Box>
 <Button
 size="small"
 onClick={handleRegenerateSitemap}
 startIcon={<RetryIcon sx={{ fontSize: 16 }} />}
 sx={{ borderRadius: 2, fontSize:'0.78rem', fontWeight: 700 }}
 >
 Regenerate
 </Button>
 </DialogTitle>
 <DialogContent>
 <TextField
 fullWidth
 multiline
 rows={18}
 value={sitemapDialog.content}
 InputProps={{ readOnly: true }}
 sx={{
'& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily:'monospace', fontSize:'0.78rem', bgcolor:'#fafbfc' },
 }}
 />
 <Box sx={{ mt: 1.5, display:'flex', gap: 1 }}>
 <Button
 size="small"
 onClick={() => {
 navigator.clipboard.writeText(sitemapDialog.content);
 setSnackbar({ open: true, message:'Sitemap XML copied to clipboard', severity:'success' });
 }}
 startIcon={<CopyIcon sx={{ fontSize: 16 }} />}
 sx={{ borderRadius: 2, fontSize:'0.78rem', fontWeight: 700 }}
 >
 Copy XML
 </Button>
 <Typography sx={{ fontSize:'0.75rem', color:'#999', display:'flex', alignItems:'center' }}>
 Submit this sitemap to Google Search Console for indexing
 </Typography>
 </Box>
 </DialogContent>
 <DialogActions sx={{ p: 2 }}>
 <Button onClick={() => setSitemapDialog({ open: false, content:'', postCount: 0 })} sx={{ borderRadius: 2 }}>
 Close
 </Button>
 </DialogActions>
 </Dialog>

 {/* "€"€"€ Delete Confirm "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
 <DialogTitle sx={{ fontWeight: 700 }}>Delete Post?</DialogTitle>
 <DialogContent>
 <Typography sx={{ fontSize:'0.88rem' }}>
 Are you sure you want to delete <strong>"{deleteConfirm?.title || deleteConfirm?.keyword}"</strong>?
 </Typography>
 </DialogContent>
 <DialogActions sx={{ p: 2 }}>
 <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
 <Button variant="contained" color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)} sx={{ borderRadius: 2 }}>
 Delete
 </Button>
 </DialogActions>
 </Dialog>

 {/* "€"€"€ Snackbar "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€ */}
 <Snackbar
 open={snackbar.open}
 autoHideDuration={4000}
 onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
 anchorOrigin={{ vertical:'bottom', horizontal:'center' }}
 >
 <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
 {snackbar.message}
 </Alert>
 </Snackbar>
 </Box>
 );
}

// "€"€"€ Post Row Component "€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€"€

interface PostRowProps {
 post: BlogPost;
 selected: boolean;
 isGenerating: boolean;
 projectName?: string;
 projectColor?: string;
 onToggleSelect: () => void;
 onGenerate: () => void;
 onEdit: () => void;
 onPublish: () => void;
 onUnpublish: () => void;
 onDelete: () => void;
 onPreview: () => void;
 onRetry: () => void;
}

function PostRow({ post, selected, isGenerating, projectName, projectColor, onToggleSelect, onGenerate, onEdit, onPublish, onUnpublish, onDelete, onPreview, onRetry }: PostRowProps) {
 const [expanded, setExpanded] = useState(false);
 const statusConf = STATUS_CONFIG[post.status];

 return (
 <Paper
 sx={{
 boxShadow:'none',
 border:'1px solid rgba(0,0,0,0.06)',
 borderRadius: 2.5,
 overflow:'hidden',
 transition:'all 0.15s ease',
 ...(selected && { borderColor:'#667eea', bgcolor:'rgba(102,126,234,0.02)' }),
'&:hover': { borderColor:'rgba(0,0,0,0.12)' },
 }}
 >
 {/* Main row */}
 <Box
 sx={{
 display:'flex',
 alignItems:'center',
 gap: 1.5,
 px: 2,
 py: 1.2,
 }}
 >
 <Checkbox size="small" checked={selected} onChange={onToggleSelect} />

 {/* Status chip */}
 <Chip
 icon={statusConf.icon}
 label={statusConf.label}
 size="small"
 sx={{
 minWidth: 100,
 fontSize:'0.72rem',
 fontWeight: 700,
 bgcolor: statusConf.bg,
 color: statusConf.color,
'& .MuiChip-icon': { color: statusConf.color },
 }}
 />

 {/* Title / keyword */}
 <Box sx={{ flex: 1, minWidth: 0 }}>
 <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
 <Typography sx={{ fontSize:'0.88rem', fontWeight: 700, color:'#1a1a2e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
 {post.title || post.keyword}
 </Typography>
 {projectName && (
 <Chip
 label={projectName}
 size="small"
 sx={{
 height: 18,
 fontSize:'0.6rem',
 fontWeight: 700,
 bgcolor:`${projectColor ||'#667eea'}15`,
 color: projectColor ||'#667eea',
 flexShrink: 0,
 }}
 />
 )}
 </Box>
 {post.title && post.keyword !== post.title && (
 <Typography sx={{ fontSize:'0.72rem', color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
 Keyword: {post.keyword}
 </Typography>
 )}
 </Box>

 {/* Length badge */}
 <Chip
 label={post.length}
 size="small"
 sx={{ height: 20, fontSize:'0.62rem', fontWeight: 700, bgcolor:'rgba(0,0,0,0.04)', color:'#999', textTransform:'capitalize' }}
 />

 {/* Word count */}
 {post.wordCount > 0 && (
 <Typography sx={{ fontSize:'0.72rem', color:'#bbb', fontWeight: 600, minWidth: 60, textAlign:'right' }}>
 {post.wordCount.toLocaleString()} words
 </Typography>
 )}

 {/* Views */}
 {(post.views || 0) > 0 && (
 <Tooltip title="Page views">
 <Typography sx={{ fontSize:'0.72rem', color:'#e67e22', fontWeight: 700, minWidth: 50, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap: 0.3 }}>
 {(post.views || 0).toLocaleString()} views
 </Typography>
 </Tooltip>
 )}

 {/* Date */}
 <Typography sx={{ fontSize:'0.72rem', color:'#bbb', minWidth: 70, textAlign:'right' }}>
 {new Date(post.updatedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
 </Typography>

 {/* Actions */}
 <Box sx={{ display:'flex', gap: 0.3, ml: 1 }}>
 {/* Generate button for queued/failed */}
 {(post.status ==='queued' || post.status ==='failed') && (
 <Tooltip title={post.status ==='failed' ?'Retry' :'Generate'}>
 <IconButton
 size="small"
 onClick={post.status ==='failed' ? onRetry : onGenerate}
 disabled={isGenerating}
 sx={{ color:'#667eea' }}
 >
 {isGenerating ? <CircularProgress size={16} /> : post.status ==='failed' ? <RetryIcon sx={{ fontSize: 18 }} /> : <PlayIcon sx={{ fontSize: 18 }} />}
 </IconButton>
 </Tooltip>
 )}

 {/* Preview for posts with content */}
 {post.content && (
 <Tooltip title="Preview">
 <IconButton size="small" onClick={onPreview} sx={{ color:'#764ba2' }}>
 <PreviewIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 )}

 {/* Edit for drafts/published */}
 {(post.status ==='draft' || post.status ==='published' || post.status ==='scheduled') && (
 <Tooltip title="Edit">
 <IconButton size="small" onClick={onEdit} sx={{ color:'#667eea' }}>
 <EditIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 )}

 {/* Publish/Unpublish */}
 {post.status ==='draft' && (
 <Tooltip title="Publish">
 <IconButton size="small" onClick={onPublish} sx={{ color:'#27ae60' }}>
 <PublishIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 )}
 {post.status ==='published' && (
 <Tooltip title="Unpublish">
 <IconButton size="small" onClick={onUnpublish} sx={{ color:'#f39c12' }}>
 <DraftIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>
 )}

 {/* Delete */}
 <Tooltip title="Delete">
 <IconButton size="small" onClick={onDelete} sx={{ color:'#ccc','&:hover': { color:'#e74c3c' } }}>
 <DeleteIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Tooltip>

 {/* Expand */}
 {(post.content || post.error) && (
 <IconButton size="small" onClick={() => setExpanded(!expanded)}>
 {expanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
 </IconButton>
 )}
 </Box>
 </Box>

 {/* Generating progress */}
 {isGenerating && <LinearProgress sx={{ height: 2,'& .MuiLinearProgress-bar': { background:'linear-gradient(90deg, #667eea, #764ba2)' } }} />}

 {/* Error row */}
 {post.error && !expanded && (
 <Box sx={{ px: 2, pb: 1 }}>
 <Typography sx={{ fontSize:'0.72rem', color:'#e74c3c' }}>
 Error: {post.error}
 </Typography>
 </Box>
 )}

 {/* Expanded content */}
 <Collapse in={expanded}>
 <Box sx={{ px: 2, pb: 2, borderTop:'1px solid rgba(0,0,0,0.04)' }}>
 {post.error && (
 <Alert severity="error" sx={{ mt: 1, borderRadius: 2, fontSize:'0.78rem' }}>
 {post.error}
 </Alert>
 )}
 {post.excerpt && (
 <Box sx={{ mt: 1.5 }}>
 <Typography sx={{ fontSize:'0.72rem', fontWeight: 700, color:'#aaa', textTransform:'uppercase', mb: 0.3 }}>Excerpt</Typography>
 <Typography sx={{ fontSize:'0.82rem', color:'#666', fontStyle:'italic' }}>{post.excerpt}</Typography>
 </Box>
 )}
 {post.featuredImage && (
 <Box sx={{ mt: 1.5 }}>
 <Typography sx={{ fontSize:'0.72rem', fontWeight: 700, color:'#aaa', textTransform:'uppercase', mb: 0.3 }}>Featured Image</Typography>
 <Box
 component="img"
 src={post.featuredImage.startsWith('http') ? post.featuredImage : `${API_BASE_URL}${post.featuredImage}`}
 alt={post.title || post.keyword}
 sx={{
 width:'100%',
 maxHeight: 180,
 objectFit:'cover',
 borderRadius: 2,
 border:'1px solid rgba(0,0,0,0.06)',
 }}
 />
 </Box>
 )}
 {post.content && (
 <Box sx={{ mt: 1.5 }}>
 <Typography sx={{ fontSize:'0.72rem', fontWeight: 700, color:'#aaa', textTransform:'uppercase', mb: 0.3 }}>Content Preview</Typography>
 <Paper
 sx={{
 p: 2,
 maxHeight: 200,
 overflow:'auto',
 boxShadow:'none',
 bgcolor:'#fafbfc',
 border:'1px solid rgba(0,0,0,0.04)',
 borderRadius: 2,
'& h2': { fontSize:'1rem', fontWeight: 700, mb: 0.5 },
'& h3': { fontSize:'0.9rem', fontWeight: 700, mb: 0.3 },
'& p': { fontSize:'0.82rem', lineHeight: 1.7, mb: 1 },
'& ul, & ol': { pl: 2.5 },
'& li': { fontSize:'0.82rem', lineHeight: 1.6 },
 }}
 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
 />
 </Box>
 )}
 {post.tags.length > 0 && (
 <Box sx={{ display:'flex', gap: 0.5, mt: 1.5, flexWrap:'wrap' }}>
 {post.tags.map((tag) => (
 <Chip key={tag} label={tag} size="small" sx={{ fontSize:'0.68rem', fontWeight: 600, bgcolor:'rgba(102,126,234,0.06)', color:'#667eea' }} />
 ))}
 </Box>
 )}
 {post.metaDescription && (
 <Box sx={{ mt: 1.5 }}>
 <Typography sx={{ fontSize:'0.72rem', fontWeight: 700, color:'#aaa', textTransform:'uppercase', mb: 0.3 }}>Meta Description</Typography>
 <Typography sx={{ fontSize:'0.78rem', color:'#888' }}>{post.metaDescription}</Typography>
 </Box>
 )}
 <Box sx={{ display:'flex', gap: 2, mt: 1.5 }}>
 <Typography sx={{ fontSize:'0.7rem', color:'#bbb' }}>Slug: /{post.slug}</Typography>
 {post.publishedAt && (
 <Typography sx={{ fontSize:'0.7rem', color:'#bbb' }}>Published: {new Date(post.publishedAt).toLocaleString()}</Typography>
 )}
 <Typography sx={{ fontSize:'0.7rem', color:'#bbb' }}>Created: {new Date(post.createdAt).toLocaleString()}</Typography>
 </Box>
 </Box>
 </Collapse>
 </Paper>
 );
}
