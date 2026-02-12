import { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
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
  Menu,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as ProcessingIcon,
  Description as DraftIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Label as TagIcon,
} from '@mui/icons-material';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AppPlan {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'processing' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  order: number;
  progress: number;
  notes: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  draft: number;
  processing: number;
  completed: number;
  avgProgress: number;
  overdue: number;
}

const API_BASE = API.appPlanner;

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#95a5a6', bgColor: 'rgba(149,165,166,0.1)', icon: <DraftIcon sx={{ fontSize: 16 }} /> },
  processing: { label: 'Processing', color: '#f39c12', bgColor: 'rgba(243,156,18,0.1)', icon: <ProcessingIcon sx={{ fontSize: 16 }} /> },
  completed: { label: 'Completed', color: '#27ae60', bgColor: 'rgba(39,174,96,0.1)', icon: <CompletedIcon sx={{ fontSize: 16 }} /> },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#95a5a6', dot: '#bdc3c7' },
  medium: { label: 'Medium', color: '#3498db', dot: '#3498db' },
  high: { label: 'High', color: '#e67e22', dot: '#e67e22' },
  urgent: { label: 'Urgent', color: '#e74c3c', dot: '#e74c3c' },
};

const CATEGORIES = ['General', 'SaaS', 'Mobile', 'Web App', 'API', 'Plugin', 'Automation', 'Internal Tool', 'E-Commerce', 'AI/ML'];

// ─── Component ─────────────────────────────────────────────────────────────────

export function AppsPage() {
  const [plans, setPlans] = useState<AppPlan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AppPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as AppPlan['status'],
    priority: 'medium' as AppPlan['priority'],
    category: 'General',
    tags: '',
    notes: '',
    dueDate: '',
    progress: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ anchorEl: HTMLElement; plan: AppPlan } | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<AppPlan | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load apps', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, [fetchPlans, fetchStats]);

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      dueDate: formData.dueDate || null,
    };

    try {
      const url = editingPlan ? `${API_BASE}/${editingPlan.id}` : API_BASE;
      const method = editingPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setEditingPlan(null);
        fetchPlans();
        fetchStats();
        setSnackbar({ open: true, message: editingPlan ? 'App updated' : 'App created', severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
    }
  }, [formData, editingPlan, fetchPlans, fetchStats]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchPlans();
      fetchStats();
      setSnackbar({ open: true, message: 'App deleted', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  }, [fetchPlans, fetchStats]);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/${id}/duplicate`, { method: 'POST' });
      fetchPlans();
      fetchStats();
      setSnackbar({ open: true, message: 'App duplicated', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to duplicate', severity: 'error' });
    }
  }, [fetchPlans, fetchStats]);

  const handleStatusChange = useCallback(async (plan: AppPlan, newStatus: AppPlan['status']) => {
    try {
      await fetch(`${API_BASE}/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPlans();
      fetchStats();
    } catch { /* ignore */ }
  }, [fetchPlans, fetchStats]);

  const handleProgressChange = useCallback(async (plan: AppPlan, progress: number) => {
    try {
      const status = progress >= 100 ? 'completed' : progress > 0 ? 'processing' : 'draft';
      await fetch(`${API_BASE}/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress, status }),
      });
      fetchPlans();
      fetchStats();
    } catch { /* ignore */ }
  }, [fetchPlans, fetchStats]);

  // ─── Reorder ────────────────────────────────────────────────────────────────

  const movePlan = useCallback(async (planId: string, direction: 'up' | 'down') => {
    const sorted = [...plans].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === planId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];

    const orderedIds = sorted.map((p) => p.id);

    try {
      await fetch(`${API_BASE}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      fetchPlans();
    } catch { /* ignore */ }
  }, [plans, fetchPlans]);

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  const openCreateDialog = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      status: 'draft',
      priority: 'medium',
      category: 'General',
      tags: '',
      notes: '',
      dueDate: '',
      progress: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (plan: AppPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      status: plan.status,
      priority: plan.priority,
      category: plan.category,
      tags: plan.tags.join(', '),
      notes: plan.notes,
      dueDate: plan.dueDate ? plan.dueDate.split('T')[0] : '',
      progress: plan.progress,
    });
    setDialogOpen(true);
  };

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filteredPlans = plans
    .filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some((t) => t.toLowerCase().includes(q))) {
          return false;
        }
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const isOverdue = (plan: AppPlan) => plan.dueDate && new Date(plan.dueDate) < new Date() && plan.status !== 'completed';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
            App Planner
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#888' }}>
            Plan, organize, and track your app projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 700,
            fontSize: '0.88rem',
            boxShadow: '0 4px 14px rgba(102,126,234,0.35)',
            '&:hover': { boxShadow: '0 6px 20px rgba(102,126,234,0.45)' },
          }}
        >
          New App
        </Button>
      </Box>

      {/* ─── Stats Bar ──────────────────────────────────────────────────────── */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
          {[
            { label: 'Total Apps', value: stats.total, color: '#667eea', bg: 'rgba(102,126,234,0.08)' },
            { label: 'Draft', value: stats.draft, color: '#95a5a6', bg: 'rgba(149,165,166,0.08)' },
            { label: 'Processing', value: stats.processing, color: '#f39c12', bg: 'rgba(243,156,18,0.08)' },
            { label: 'Completed', value: stats.completed, color: '#27ae60', bg: 'rgba(39,174,96,0.08)' },
            { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: '#764ba2', bg: 'rgba(118,75,162,0.08)' },
          ].map((stat) => (
            <Paper
              key={stat.label}
              sx={{
                p: 2,
                textAlign: 'center',
                boxShadow: 'none',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 3,
                bgcolor: stat.bg,
              }}
            >
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>
                {stat.value}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* ─── Toolbar ────────────────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: 1.5,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          boxShadow: 'none',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 3,
        }}
      >
        <TextField
          size="small"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#bbb' }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem', height: 38 } }}
        />

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel sx={{ fontSize: '0.78rem' }}>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ fontSize: '0.82rem', borderRadius: 2, height: 38 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel sx={{ fontSize: '0.78rem' }}>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ fontSize: '0.82rem', borderRadius: 2, height: 38 }}
          >
            <MenuItem value="all">All Priority</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Tooltip title="Grid View">
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                bgcolor: viewMode === 'grid' ? 'rgba(102,126,234,0.12)' : 'transparent',
                color: viewMode === 'grid' ? '#667eea' : '#bbb',
              }}
            >
              <GridViewIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="List View">
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                bgcolor: viewMode === 'list' ? 'rgba(102,126,234,0.12)' : 'transparent',
                color: viewMode === 'list' ? '#667eea' : '#bbb',
              }}
            >
              <ListViewIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* ─── Grid View ──────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))', gap: 2 }}>
          {filteredPlans.map((plan, idx) => (
            <Paper
              key={plan.id}
              sx={{
                p: 0,
                boxShadow: 'none',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#667eea',
                  boxShadow: '0 4px 16px rgba(102,126,234,0.1)',
                  transform: 'translateY(-2px)',
                },
                ...(isOverdue(plan) && {
                  borderColor: 'rgba(231,76,60,0.3)',
                  borderLeft: '3px solid #e74c3c',
                }),
              }}
            >
              {/* Card header with status band */}
              <Box
                sx={{
                  height: 4,
                  background: STATUS_CONFIG[plan.status].color,
                }}
              />

              <Box sx={{ p: 2 }}>
                {/* Top row: priority dot + category + actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_CONFIG[plan.priority].dot }} />
                    <Chip
                      label={plan.category}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: '#888' }}
                    />
                    {isOverdue(plan) && (
                      <Chip
                        label="Overdue"
                        size="small"
                        sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0 }}>
                    <Tooltip title="Move Up">
                      <span>
                        <IconButton size="small" onClick={() => movePlan(plan.id, 'up')} disabled={idx === 0} sx={{ p: 0.3 }}>
                          <UpIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move Down">
                      <span>
                        <IconButton size="small" onClick={() => movePlan(plan.id, 'down')} disabled={idx === filteredPlans.length - 1} sx={{ p: 0.3 }}>
                          <DownIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton size="small" onClick={(e) => setContextMenu({ anchorEl: e.currentTarget, plan })} sx={{ p: 0.3 }}>
                      <MoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Title + order badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(102,126,234,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#667eea' }}>
                      {plan.order + 1}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>
                    {plan.name}
                  </Typography>
                </Box>

                {/* Description */}
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: '#888',
                    mb: 1.5,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 38,
                  }}
                >
                  {plan.description || 'No description'}
                </Typography>

                {/* Progress bar */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#888' }}>Progress</Typography>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: STATUS_CONFIG[plan.status].color }}>
                      {plan.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={plan.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(0,0,0,0.04)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: plan.progress >= 100
                          ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                          : plan.progress > 50
                          ? 'linear-gradient(90deg, #667eea, #764ba2)'
                          : 'linear-gradient(90deg, #f39c12, #e67e22)',
                      },
                    }}
                  />
                </Box>

                {/* Tags */}
                {plan.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                    {plan.tags.slice(0, 4).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        icon={<TagIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{
                          height: 22,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(102,126,234,0.06)',
                          color: '#667eea',
                          '& .MuiChip-icon': { color: '#667eea' },
                        }}
                      />
                    ))}
                    {plan.tags.length > 4 && (
                      <Chip label={`+${plan.tags.length - 4}`} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)' }} />
                    )}
                  </Box>
                )}

                {/* Bottom row: status chip + date + priority */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    icon={STATUS_CONFIG[plan.status].icon}
                    label={STATUS_CONFIG[plan.status].label}
                    size="small"
                    onClick={() => {
                      const next = plan.status === 'draft' ? 'processing' : plan.status === 'processing' ? 'completed' : 'draft';
                      handleStatusChange(plan, next);
                    }}
                    sx={{
                      height: 26,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: STATUS_CONFIG[plan.status].bgColor,
                      color: STATUS_CONFIG[plan.status].color,
                      cursor: 'pointer',
                      '& .MuiChip-icon': { color: STATUS_CONFIG[plan.status].color },
                      '&:hover': { filter: 'brightness(0.95)' },
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {plan.dueDate && (
                      <Tooltip title={`Due: ${new Date(plan.dueDate).toLocaleDateString()}`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <CalendarIcon sx={{ fontSize: 13, color: isOverdue(plan) ? '#e74c3c' : '#bbb' }} />
                          <Typography sx={{ fontSize: '0.68rem', color: isOverdue(plan) ? '#e74c3c' : '#bbb', fontWeight: 600 }}>
                            {new Date(plan.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </Typography>
                        </Box>
                      </Tooltip>
                    )}
                    <Chip
                      label={PRIORITY_CONFIG[plan.priority].label}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: `${PRIORITY_CONFIG[plan.priority].color}15`,
                        color: PRIORITY_CONFIG[plan.priority].color,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}

          {/* Empty state / Create card */}
          {filteredPlans.length === 0 && !loading && (
            <Paper
              onClick={openCreateDialog}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed rgba(102,126,234,0.2)',
                boxShadow: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                gridColumn: '1 / -1',
                '&:hover': { borderColor: '#667eea', bgcolor: 'rgba(102,126,234,0.02)' },
              }}
            >
              <AddIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#999' }}>
                {plans.length === 0 ? 'Create your first app' : 'No apps match your filters'}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#bbb', mt: 0.5 }}>
                Click to add a new app project
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ─── List View ──────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <Paper sx={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          {/* Header row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 24px 1fr 100px 100px 90px 80px 100px 60px',
              gap: 1,
              px: 2,
              py: 1,
              bgcolor: '#fafbfc',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              alignItems: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>#</Typography>
            <Box />
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Name</Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Category</Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Status</Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Priority</Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Progress</Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>Due</Typography>
            <Box />
          </Box>

          {filteredPlans.map((plan, idx) => (
            <Box
              key={plan.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '40px 24px 1fr 100px 100px 90px 80px 100px 60px',
                gap: 1,
                px: 2,
                py: 1.2,
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: 'rgba(102,126,234,0.03)' },
                ...(isOverdue(plan) && { bgcolor: 'rgba(231,76,60,0.03)' }),
              }}
            >
              {/* Reorder arrows */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <IconButton size="small" onClick={() => movePlan(plan.id, 'up')} disabled={idx === 0} sx={{ p: 0, '& svg': { fontSize: 16 } }}>
                  <UpIcon />
                </IconButton>
                <IconButton size="small" onClick={() => movePlan(plan.id, 'down')} disabled={idx === filteredPlans.length - 1} sx={{ p: 0, '& svg': { fontSize: 16 } }}>
                  <DownIcon />
                </IconButton>
              </Box>

              {/* Order badge */}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 1,
                  bgcolor: 'rgba(102,126,234,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#667eea' }}>
                  {plan.order + 1}
                </Typography>
              </Box>

              {/* Name + description */}
              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>
                  {plan.name}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {plan.description || 'No description'}
                </Typography>
              </Box>

              {/* Category */}
              <Chip label={plan.category} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)' }} />

              {/* Status */}
              <Chip
                icon={STATUS_CONFIG[plan.status].icon}
                label={STATUS_CONFIG[plan.status].label}
                size="small"
                onClick={() => {
                  const next = plan.status === 'draft' ? 'processing' : plan.status === 'processing' ? 'completed' : 'draft';
                  handleStatusChange(plan, next);
                }}
                sx={{
                  height: 24,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: STATUS_CONFIG[plan.status].bgColor,
                  color: STATUS_CONFIG[plan.status].color,
                  cursor: 'pointer',
                  '& .MuiChip-icon': { color: STATUS_CONFIG[plan.status].color },
                }}
              />

              {/* Priority */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_CONFIG[plan.priority].dot }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: PRIORITY_CONFIG[plan.priority].color }}>
                  {PRIORITY_CONFIG[plan.priority].label}
                </Typography>
              </Box>

              {/* Progress */}
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={plan.progress}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.04)',
                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: STATUS_CONFIG[plan.status].color },
                  }}
                />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#bbb', mt: 0.2 }}>
                  {plan.progress}%
                </Typography>
              </Box>

              {/* Due date */}
              <Typography sx={{ fontSize: '0.72rem', color: isOverdue(plan) ? '#e74c3c' : '#999', fontWeight: isOverdue(plan) ? 700 : 400 }}>
                {plan.dueDate ? new Date(plan.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
              </Typography>

              {/* Actions */}
              <IconButton size="small" onClick={(e) => setContextMenu({ anchorEl: e.currentTarget, plan })}>
                <MoreIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}

          {filteredPlans.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.88rem', color: '#999' }}>
                {plans.length === 0 ? 'No apps yet — click "New App" to get started' : 'No apps match filters'}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* ─── Context Menu ───────────────────────────────────────────────────── */}
      <Menu
        anchorEl={contextMenu?.anchorEl}
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } } }}
      >
        <MenuItem
          onClick={() => { if (contextMenu) openEditDialog(contextMenu.plan); setContextMenu(null); }}
          sx={{ fontSize: '0.82rem', gap: 1 }}
        >
          <EditIcon sx={{ fontSize: 16 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => { if (contextMenu) handleDuplicate(contextMenu.plan.id); setContextMenu(null); }}
          sx={{ fontSize: '0.82rem', gap: 1 }}
        >
          <DuplicateIcon sx={{ fontSize: 16 }} /> Duplicate
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              const next = contextMenu.plan.status === 'draft' ? 'processing' : contextMenu.plan.status === 'processing' ? 'completed' : 'draft';
              handleStatusChange(contextMenu.plan, next);
            }
            setContextMenu(null);
          }}
          sx={{ fontSize: '0.82rem', gap: 1 }}
        >
          {contextMenu && STATUS_CONFIG[contextMenu.plan.status === 'draft' ? 'processing' : contextMenu.plan.status === 'processing' ? 'completed' : 'draft'].icon}
          Move to {contextMenu && STATUS_CONFIG[contextMenu.plan.status === 'draft' ? 'processing' : contextMenu.plan.status === 'processing' ? 'completed' : 'draft'].label}
        </MenuItem>
        {contextMenu && contextMenu.plan.progress < 100 && (
          <MenuItem
            onClick={() => { handleProgressChange(contextMenu.plan, Math.min(100, contextMenu.plan.progress + 25)); setContextMenu(null); }}
            sx={{ fontSize: '0.82rem', gap: 1 }}
          >
            <FlagIcon sx={{ fontSize: 16 }} /> +25% Progress
          </MenuItem>
        )}
        <MenuItem
          onClick={() => { if (contextMenu) setDeleteConfirm(contextMenu.plan); setContextMenu(null); }}
          sx={{ fontSize: '0.82rem', gap: 1, color: '#e74c3c' }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} /> Delete
        </MenuItem>
      </Menu>

      {/* ─── Create/Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingPlan(null); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
          {editingPlan ? 'Edit App' : 'Create New App'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="App Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as AppPlan['status'] }))}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData((f) => ({ ...f, priority: e.target.value as AppPlan['priority'] }))}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <TextField
              label="Tags (comma-separated)"
              fullWidth
              placeholder="e.g. react, mobile, saas"
              value={formData.tags}
              onChange={(e) => setFormData((f) => ({ ...f, tags: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {editingPlan && (
              <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#555', mb: 0.5 }}>
                  Progress: {formData.progress}%
                </Typography>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formData.progress}
                  onChange={(e) => setFormData((f) => ({ ...f, progress: parseInt(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </Box>
            )}
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              placeholder="Additional notes, ideas, links..."
              value={formData.notes}
              onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setDialogOpen(false); setEditingPlan(null); }} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name.trim()}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 3,
            }}
          >
            {editingPlan ? 'Save Changes' : 'Create App'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete App?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.88rem' }}>
            Are you sure you want to delete <strong>"{deleteConfirm?.name}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
