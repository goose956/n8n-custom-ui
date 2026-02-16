import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Box, Typography, Paper, Button, IconButton, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  CircularProgress, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
  ShoppingCart as CheckoutIcon,
  CardGiftcard as UpsellIcon,
  PersonAdd as RegisterIcon,
  ThumbUp as ThanksIcon,
  Article as PageIcon,
  ArrowForward as ArrowIcon,
  ContentCopy as DuplicateIcon,
  AccountTree as FunnelIcon,
  AutoFixHigh as AIEditIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Close as CloseIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';

// ——— Types ————————————————————————————————————————————————

interface FunnelStep {
  id: string;
  pageType: string;
  label: string;
  pageId?: number;
  config?: Record<string, any>;
}

interface FunnelTier {
  id: string;
  name: string;
  color: string;
  steps: FunnelStep[];
}

interface Funnel {
  id: number;
  app_id: number;
  name: string;
  description?: string;
  tiers: FunnelTier[];
  created_at: string;
  updated_at: string;
}

interface AppInfo {
  id: number;
  name: string;
  slug: string;
  primary_color: string;
}

// ——— Step type config ——————————————————————————————————————

const STEP_TYPES = [
  { type: 'checkout', label: 'Checkout', icon: <CheckoutIcon />, color: '#667eea', description: 'Payment / pricing page' },
  { type: 'upsell', label: 'Upsell', icon: <UpsellIcon />, color: '#e67e22', description: 'One-time offer after purchase' },
  { type: 'register', label: 'Register', icon: <RegisterIcon />, color: '#27ae60', description: 'Account creation page' },
  { type: 'thankyou', label: 'Thank You', icon: <ThanksIcon />, color: '#3498db', description: 'Confirmation / welcome page' },
  { type: 'custom', label: 'Custom Page', icon: <PageIcon />, color: '#9b59b6', description: 'Any custom page' },
];

const TIER_COLORS = ['#27ae60', '#667eea', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4'];

function getStepIcon(pageType: string) {
  const st = STEP_TYPES.find(s => s.type === pageType);
  return st?.icon || <PageIcon />;
}

function getStepColor(pageType: string) {
  const st = STEP_TYPES.find(s => s.type === pageType);
  return st?.color || '#999';
}

function generateId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ——— Main component ———————————————————————————————————————

export function FunnelBuilderPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [activeFunnel, setActiveFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });

  // Dialogs
  const [newFunnelDialog, setNewFunnelDialog] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [addTierDialog, setAddTierDialog] = useState(false);
  const [newTierName, setNewTierName] = useState('');

  // Page picker dialog
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [pagePickerStep, setPagePickerStep] = useState<{ tierId: string; stepId: string } | null>(null);
  const [savedPages, setSavedPages] = useState<any[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagePreviewOpen, setPagePreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Drag state
  const [dragState, setDragState] = useState<{ tierId: string; stepIdx: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ tierId: string; position: number } | null>(null);

  const FUNNELS_API = `${API_BASE_URL}/api/funnels`;

  // ——— Load apps ——————————————————————————————————————————

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/apps`);
        const data = await res.json();
        setApps(data.data || data || []);
        if (data.data?.length > 0 || data?.length > 0) {
          const list = data.data || data;
          setSelectedAppId(list[0].id);
        }
      } catch {
        setSnack({ open: true, msg: 'Failed to load projects', severity: 'error' });
      }
    })();
  }, []);

  // ——— Data fetching ———————————————————————————————————————

  const fetchFunnels = useCallback(async () => {
    if (!selectedAppId) return;
    setLoading(true);
    try {
      const res = await fetch(`${FUNNELS_API}?appId=${selectedAppId}`);
      const data = await res.json();
      setFunnels(data.data || []);
      if (data.data?.length > 0 && !activeFunnel) {
        setActiveFunnel(data.data[0]);
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to load funnels', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedAppId, FUNNELS_API]);

  useEffect(() => {
    if (selectedAppId) {
      fetchFunnels();
    } else {
      setFunnels([]);
      setActiveFunnel(null);
    }
  }, [selectedAppId, fetchFunnels]);

  // ——— CRUD ————————————————————————————————————————————————

  const handleCreateFunnel = async () => {
    if (!selectedAppId || !newFunnelName.trim()) return;
    try {
      const res = await fetch(FUNNELS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedAppId, name: newFunnelName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFunnels(prev => [...prev, data.data]);
        setActiveFunnel(data.data);
        setNewFunnelDialog(false);
        setNewFunnelName('');
        setDirty(false);
        setSnack({ open: true, msg: 'Funnel created', severity: 'success' });
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to create funnel', severity: 'error' });
    }
  };

  const handleSave = async () => {
    if (!activeFunnel) return;
    setSaving(true);
    try {
      const res = await fetch(`${FUNNELS_API}/${activeFunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeFunnel.name, description: activeFunnel.description, tiers: activeFunnel.tiers }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveFunnel(data.data);
        setFunnels(prev => prev.map(f => f.id === data.data.id ? data.data : f));
        setDirty(false);
        setSnack({ open: true, msg: 'Funnel saved', severity: 'success' });
      }
    } catch {
      setSnack({ open: true, msg: 'Failed to save', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFunnel = async () => {
    if (!activeFunnel) return;
    try {
      await fetch(`${FUNNELS_API}/${activeFunnel.id}`, { method: 'DELETE' });
      setFunnels(prev => prev.filter(f => f.id !== activeFunnel.id));
      setActiveFunnel(null);
      setDirty(false);
      setSnack({ open: true, msg: 'Funnel deleted', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Failed to delete', severity: 'error' });
    }
  };

  // ——— Tier management —————————————————————————————————————

  const addTier = () => {
    if (!activeFunnel || !newTierName.trim()) return;
    const usedColors = new Set(activeFunnel.tiers.map(t => t.color));
    const nextColor = TIER_COLORS.find(c => !usedColors.has(c)) || TIER_COLORS[0];
    const tierId = newTierName.trim().toLowerCase().replace(/\s+/g, '-');
    const newTier: FunnelTier = {
      id: tierId,
      name: newTierName.trim(),
      color: nextColor,
      steps: [{ id: generateId(), pageType: 'register', label: 'Register' }],
    };
    setActiveFunnel({ ...activeFunnel, tiers: [...activeFunnel.tiers, newTier] });
    setDirty(true);
    setAddTierDialog(false);
    setNewTierName('');
  };

  const removeTier = (tierId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({ ...activeFunnel, tiers: activeFunnel.tiers.filter(t => t.id !== tierId) });
    setDirty(true);
  };

  const renameTier = (tierId: string, name: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t => t.id === tierId ? { ...t, name } : t),
    });
    setDirty(true);
  };

  // ——— Step management —————————————————————————————————————

  const addStep = (tierId: string, pageType: string) => {
    if (!activeFunnel) return;
    const st = STEP_TYPES.find(s => s.type === pageType);
    const newStep: FunnelStep = {
      id: generateId(),
      pageType,
      label: st?.label || 'Page',
    };
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId ? { ...t, steps: [...t.steps, newStep] } : t
      ),
    });
    setDirty(true);
  };

  const removeStep = (tierId: string, stepId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId ? { ...t, steps: t.steps.filter(s => s.id !== stepId) } : t
      ),
    });
    setDirty(true);
  };

  const updateStepLabel = (tierId: string, stepId: string, label: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId
          ? { ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, label } : s) }
          : t
      ),
    });
    setDirty(true);
  };

  const duplicateStep = (tierId: string, stepId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t => {
        if (t.id !== tierId) return t;
        const idx = t.steps.findIndex(s => s.id === stepId);
        if (idx === -1) return t;
        const clone = { ...t.steps[idx], id: generateId(), label: `${t.steps[idx].label} (copy)` };
        const newSteps = [...t.steps];
        newSteps.splice(idx + 1, 0, clone);
        return { ...t, steps: newSteps };
      }),
    });
    setDirty(true);
  };

  // ——— Drag and drop ———————————————————————————————————————

  const handleDragStart = (tierId: string, stepIdx: number) => {
    setDragState({ tierId, stepIdx });
  };

  const handleDragOver = (e: React.DragEvent, tierId: string, position: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ tierId, position });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetTierId: string, targetPosition: number) => {
    e.preventDefault();
    if (!dragState || !activeFunnel) {
      setDragState(null);
      setDropTarget(null);
      return;
    }

    const { tierId: srcTierId, stepIdx: srcIdx } = dragState;

    setActiveFunnel(prev => {
      if (!prev) return prev;
      const tiers = prev.tiers.map(t => ({ ...t, steps: [...t.steps] }));

      const srcTier = tiers.find(t => t.id === srcTierId);
      const dstTier = tiers.find(t => t.id === targetTierId);
      if (!srcTier || !dstTier) return prev;

      const [movedStep] = srcTier.steps.splice(srcIdx, 1);

      // Adjust target position if same tier and source was before target
      let insertAt = targetPosition;
      if (srcTierId === targetTierId && srcIdx < targetPosition) {
        insertAt = Math.max(0, targetPosition - 1);
      }

      dstTier.steps.splice(insertAt, 0, movedStep);

      return { ...prev, tiers };
    });

    setDirty(true);
    setDragState(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  // Palette drag (new step from palette)
  const handlePaletteDragStart = (e: React.DragEvent, pageType: string) => {
    e.dataTransfer.setData('application/funnel-step-type', pageType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePaletteDrop = (e: React.DragEvent, tierId: string, position: number) => {
    const pageType = e.dataTransfer.getData('application/funnel-step-type');
    if (pageType) {
      e.preventDefault();
      if (!activeFunnel) return;
      const st = STEP_TYPES.find(s => s.type === pageType);
      const newStep: FunnelStep = { id: generateId(), pageType, label: st?.label || 'Page' };
      setActiveFunnel({
        ...activeFunnel,
        tiers: activeFunnel.tiers.map(t => {
          if (t.id !== tierId) return t;
          const steps = [...t.steps];
          steps.splice(position, 0, newStep);
          return { ...t, steps };
        }),
      });
      setDirty(true);
      setDropTarget(null);
      return;
    }

    // Otherwise it's a move within tiers
    handleDrop(e, tierId, position);
  };

  // ——— Page picker ————————————————————————————————————————

  const openPagePicker = async (tierId: string, stepId: string) => {
    setPagePickerStep({ tierId, stepId });
    setPagePickerOpen(true);
    setLoadingPages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pages?app_id=${selectedAppId}`);
      const data = await res.json();
      setSavedPages(data.data || []);
    } catch {
      setSnack({ open: true, msg: 'Failed to load pages', severity: 'error' });
    } finally {
      setLoadingPages(false);
    }
  };

  const assignPageToStep = (pageId: number, pageTitle: string) => {
    if (!activeFunnel || !pagePickerStep) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === pagePickerStep.tierId
          ? {
              ...t,
              steps: t.steps.map(s =>
                s.id === pagePickerStep.stepId
                  ? { ...s, pageId, config: { ...s.config, pageTitle } }
                  : s
              ),
            }
          : t
      ),
    });
    setDirty(true);
    setPagePickerOpen(false);
    setPagePickerStep(null);
    setSnack({ open: true, msg: `Linked "${pageTitle}" to step`, severity: 'success' });
  };

  const unlinkPage = (tierId: string, stepId: string) => {
    if (!activeFunnel) return;
    setActiveFunnel({
      ...activeFunnel,
      tiers: activeFunnel.tiers.map(t =>
        t.id === tierId
          ? {
              ...t,
              steps: t.steps.map(s =>
                s.id === stepId
                  ? { ...s, pageId: undefined, config: { ...s.config, pageTitle: undefined } }
                  : s
              ),
            }
          : t
      ),
    });
    setDirty(true);
    setSnack({ open: true, msg: 'Page unlinked from step', severity: 'info' });
  };

  // ——— Render ——————————————————————————————————————————————

  if (!selectedAppId) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <FunnelIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#999' }}>Select a project first</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#bbb', mt: 0.5 }}>Choose a project to build membership funnels for</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress size={32} />
        <Typography sx={{ mt: 1, color: '#999' }}>Loading funnels...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ——— Header ——————————————————————————————— */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FunnelIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Funnel Builder</Typography>
          </Box>

          {/* Project selector */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedAppId}
              label="Project"
              onChange={(e) => { setSelectedAppId(Number(e.target.value)); setActiveFunnel(null); setDirty(false); }}
              sx={{ borderRadius: 2 }}
            >
              {apps.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Funnel selector */}
          {funnels.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Funnel</InputLabel>
              <Select
                value={activeFunnel?.id || ''}
                label="Funnel"
                onChange={(e) => {
                  const f = funnels.find(f => f.id === Number(e.target.value));
                  if (f) { setActiveFunnel(f); setDirty(false); }
                }}
                sx={{ borderRadius: 2 }}
              >
                {funnels.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {dirty && activeFunnel && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {saving ? 'Saving...' : 'Save Funnel'}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setNewFunnelDialog(true)}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}
          >
            New Funnel
          </Button>
          {activeFunnel && (
            <Tooltip title="Delete funnel">
              <IconButton size="small" onClick={handleDeleteFunnel} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ——— No funnels state ———————————————————— */}
      {funnels.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', boxShadow: 'none', border: '2px dashed rgba(102,126,234,0.2)', borderRadius: 3 }}>
          <FunnelIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#999', mb: 1 }}>No funnels yet</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#bbb', mb: 3 }}>
            Create a funnel to build visual signup paths for Free, Pro, Gold members and more.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewFunnelDialog(true)}
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Create First Funnel
          </Button>
        </Paper>
      )}

      {/* ——— Funnel canvas ————————————————————————— */}
      {activeFunnel && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Step palette */}
          <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', mb: 1.5, letterSpacing: 0.5 }}>
              Drag steps into lanes below
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {STEP_TYPES.map(st => (
                <Paper
                  key={st.type}
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, st.type)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 2, py: 1, borderRadius: 2,
                    border: `1.5px solid ${st.color}22`,
                    bgcolor: `${st.color}08`,
                    cursor: 'grab',
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: `${st.color}15`, borderColor: `${st.color}40`, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${st.color}20` },
                    '&:active': { cursor: 'grabbing' },
                  }}
                >
                  <Box sx={{ color: st.color, display: 'flex' }}>{st.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{st.label}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>{st.description}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>

          {/* Tier lanes */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pb: 2 }}>
            {activeFunnel.tiers.map(tier => (
              <Paper
                key={tier.id}
                sx={{
                  boxShadow: 'none',
                  border: `1.5px solid ${tier.color}30`,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                {/* Tier header */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 2.5, py: 1.5,
                  bgcolor: `${tier.color}0a`,
                  borderBottom: `1px solid ${tier.color}15`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tier.color }} />
                    <TextField
                      value={tier.name}
                      onChange={(e) => renameTier(tier.id, e.target.value)}
                      variant="standard"
                      InputProps={{ disableUnderline: true, sx: { fontSize: '1rem', fontWeight: 800, color: '#1a1a2e' } }}
                      sx={{ maxWidth: 160 }}
                    />
                    <Chip
                      label={`${tier.steps.length} step${tier.steps.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ fontSize: '0.68rem', fontWeight: 600, bgcolor: `${tier.color}15`, color: tier.color, height: 22 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {/* Quick-add buttons */}
                    {STEP_TYPES.slice(0, 3).map(st => (
                      <Tooltip key={st.type} title={`Add ${st.label}`}>
                        <IconButton size="small" onClick={() => addStep(tier.id, st.type)} sx={{ color: st.color, opacity: 0.6, '&:hover': { opacity: 1 } }}>
                          {st.icon}
                        </IconButton>
                      </Tooltip>
                    ))}
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                    <Tooltip title="Delete tier">
                      <IconButton size="small" onClick={() => removeTier(tier.id)} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Steps lane */}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0, px: 2, py: 2.5,
                    minHeight: 100,
                    overflowX: 'auto',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (tier.steps.length === 0) {
                      setDropTarget({ tierId: tier.id, position: 0 });
                    }
                  }}
                  onDrop={(e) => {
                    if (tier.steps.length === 0) {
                      handlePaletteDrop(e, tier.id, 0);
                    }
                  }}
                >
                  {tier.steps.length === 0 && (
                    <Box sx={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed rgba(0,0,0,0.08)', borderRadius: 2, py: 3,
                      bgcolor: dropTarget?.tierId === tier.id ? 'rgba(102,126,234,0.05)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#bbb' }}>
                        Drag steps here or use the + buttons above
                      </Typography>
                    </Box>
                  )}

                  {tier.steps.map((step, idx) => (
                    <Box key={step.id} sx={{ display: 'flex', alignItems: 'center' }}>
                      {/* Drop zone before step */}
                      <Box
                        onDragOver={(e) => handleDragOver(e, tier.id, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handlePaletteDrop(e, tier.id, idx)}
                        sx={{
                          width: dropTarget?.tierId === tier.id && dropTarget?.position === idx ? 60 : 8,
                          minHeight: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'width 0.2s ease',
                          borderRadius: 1,
                          bgcolor: dropTarget?.tierId === tier.id && dropTarget?.position === idx ? 'rgba(102,126,234,0.1)' : 'transparent',
                          border: dropTarget?.tierId === tier.id && dropTarget?.position === idx ? '2px dashed #667eea' : '2px solid transparent',
                        }}
                      />

                      {/* Step card */}
                      <Paper
                        draggable
                        onDragStart={() => handleDragStart(tier.id, idx)}
                        onDragEnd={handleDragEnd}
                        onDoubleClick={() => openPagePicker(tier.id, step.id)}
                        elevation={0}
                        sx={{
                          position: 'relative',
                          width: 140,
                          p: 1.5,
                          border: `1.5px solid ${step.pageId ? getStepColor(step.pageType) : getStepColor(step.pageType) + '25'}`,
                          borderRadius: 2.5,
                          cursor: 'grab',
                          bgcolor: step.pageId ? `${getStepColor(step.pageType)}06` : '#fff',
                          transition: 'all 0.15s ease',
                          opacity: dragState?.tierId === tier.id && dragState?.stepIdx === idx ? 0.4 : 1,
                          '&:hover': {
                            borderColor: getStepColor(step.pageType),
                            boxShadow: `0 4px 16px ${getStepColor(step.pageType)}20`,
                            transform: 'translateY(-2px)',
                          },
                          '&:hover .step-actions': { opacity: 1 },
                          '&:active': { cursor: 'grabbing' },
                        }}
                      >
                        {/* Drag handle */}
                        <Box sx={{ position: 'absolute', top: 4, left: 4, color: '#ddd', cursor: 'grab' }}>
                          <DragIcon sx={{ fontSize: 14 }} />
                        </Box>

                        {/* Step actions (hidden until hover) */}
                        <Box
                          className="step-actions"
                          sx={{
                            position: 'absolute', top: 2, right: 2,
                            display: 'flex', gap: 0,
                            opacity: 0, transition: 'opacity 0.15s ease',
                          }}
                        >
                          <Tooltip title="Edit in AI Editor">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.location.href = '/upsell-editor'; }} sx={{ p: 0.3 }}>
                              <AIEditIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#667eea' } }} />
                            </IconButton>
                          </Tooltip>
                          {step.pageId ? (
                            <Tooltip title="Unlink page">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); unlinkPage(tier.id, step.id); }} sx={{ p: 0.3 }}>
                                <UnlinkIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#e67e22' } }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Link a saved page">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPagePicker(tier.id, step.id); }} sx={{ p: 0.3 }}>
                                <LinkIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#27ae60' } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Duplicate">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); duplicateStep(tier.id, step.id); }} sx={{ p: 0.3 }}>
                              <DuplicateIcon sx={{ fontSize: 13, color: '#bbb' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeStep(tier.id, step.id); }} sx={{ p: 0.3 }}>
                              <DeleteIcon sx={{ fontSize: 13, color: '#bbb', '&:hover': { color: '#e74c3c' } }} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Icon */}
                        <Box sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 44, height: 44, borderRadius: 2,
                          bgcolor: `${getStepColor(step.pageType)}12`,
                          color: getStepColor(step.pageType),
                          mx: 'auto', mb: 1, mt: 0.5,
                        }}>
                          {getStepIcon(step.pageType)}
                        </Box>

                        {/* Label */}
                        <TextField
                          value={step.label}
                          onChange={(e) => updateStepLabel(tier.id, step.id, e.target.value)}
                          variant="standard"
                          InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '0.78rem', fontWeight: 700, color: '#1a1a2e', textAlign: 'center', '& input': { textAlign: 'center' } },
                          }}
                          sx={{ width: '100%' }}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Type chip + linked page indicator */}
                        {step.pageId ? (
                          <Tooltip title={`Linked: ${step.config?.pageTitle || `Page #${step.pageId}`}`}>
                            <Chip
                              icon={<LinkIcon sx={{ fontSize: '0.6rem !important' }} />}
                              label={step.config?.pageTitle ? (step.config.pageTitle.length > 12 ? step.config.pageTitle.slice(0, 12) + '…' : step.config.pageTitle) : `Page #${step.pageId}`}
                              size="small"
                              sx={{
                                display: 'block', mx: 'auto', mt: 0.5,
                                height: 18, fontSize: '0.58rem', fontWeight: 600,
                                bgcolor: '#27ae6018',
                                color: '#27ae60',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => { e.stopPropagation(); openPagePicker(tier.id, step.id); }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            label={step.pageType}
                            size="small"
                            sx={{
                              display: 'block', mx: 'auto', mt: 0.5,
                              height: 18, fontSize: '0.6rem', fontWeight: 600,
                              bgcolor: `${getStepColor(step.pageType)}12`,
                              color: getStepColor(step.pageType),
                            }}
                          />
                        )}

                        {/* Double-click hint */}
                        {!step.pageId && (
                          <Typography sx={{
                            fontSize: '0.55rem', color: '#ccc', textAlign: 'center', mt: 0.5,
                            opacity: 0, transition: 'opacity 0.15s',
                            '.MuiPaper-root:hover &': { opacity: 1 },
                          }}>
                            Double-click to link page
                          </Typography>
                        )}
                      </Paper>

                      {/* Arrow between steps */}
                      {idx < tier.steps.length - 1 && (
                        <Box
                          onDragOver={(e) => handleDragOver(e, tier.id, idx + 1)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handlePaletteDrop(e, tier.id, idx + 1)}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            px: 0.5,
                            minWidth: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 60 : 32,
                            transition: 'min-width 0.2s ease',
                            minHeight: 80,
                            bgcolor: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 'rgba(102,126,234,0.06)' : 'transparent',
                            borderRadius: 1,
                            border: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? '2px dashed #667eea' : '2px solid transparent',
                          }}
                        >
                          <ArrowIcon sx={{ color: `${tier.color}60`, fontSize: 22 }} />
                        </Box>
                      )}

                      {/* Drop zone after last step */}
                      {idx === tier.steps.length - 1 && (
                        <Box
                          onDragOver={(e) => handleDragOver(e, tier.id, idx + 1)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handlePaletteDrop(e, tier.id, idx + 1)}
                          sx={{
                            width: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 60 : 16,
                            minHeight: 80,
                            ml: 0.5,
                            transition: 'width 0.2s ease',
                            borderRadius: 1,
                            bgcolor: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? 'rgba(102,126,234,0.1)' : 'transparent',
                            border: dropTarget?.tierId === tier.id && dropTarget?.position === idx + 1 ? '2px dashed #667eea' : '2px solid transparent',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}

            {/* Add tier button */}
            <Button
              startIcon={<AddIcon />}
              onClick={() => setAddTierDialog(true)}
              sx={{
                alignSelf: 'flex-start',
                borderRadius: 2,
                textTransform: 'none',
                color: '#999',
                border: '1.5px dashed rgba(0,0,0,0.1)',
                px: 3,
                '&:hover': { borderColor: '#667eea', color: '#667eea', bgcolor: 'rgba(102,126,234,0.04)' },
              }}
            >
              Add Tier
            </Button>
          </Box>
        </Box>
      )}

      {/* ——— Create funnel dialog ———————————————— */}
      <Dialog open={newFunnelDialog} onClose={() => setNewFunnelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Funnel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Funnel Name"
            value={newFunnelName}
            onChange={(e) => setNewFunnelName(e.target.value)}
            placeholder="e.g., Main Signup Funnel"
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFunnel(); }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewFunnelDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFunnel}
            disabled={!newFunnelName.trim()}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ——— Add tier dialog ————————————————————— */}
      <Dialog open={addTierDialog} onClose={() => setAddTierDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Membership Tier</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Tier Name"
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            placeholder="e.g., Premium, Enterprise"
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') addTier(); }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddTierDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={addTier}
            disabled={!newTierName.trim()}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ——— Page picker dialog ————————————————— */}
      <Dialog
        open={pagePickerOpen}
        onClose={() => { setPagePickerOpen(false); setPagePickerStep(null); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon sx={{ color: '#667eea' }} />
            Link a Saved Page
          </Box>
          <IconButton onClick={() => { setPagePickerOpen(false); setPagePickerStep(null); }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingPages ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={28} />
              <Typography sx={{ mt: 1, color: '#999', fontSize: '0.85rem' }}>Loading saved pages...</Typography>
            </Box>
          ) : savedPages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
              <PageIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: '#999', mb: 0.5 }}>No saved pages yet</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#bbb' }}>
                Create pages in the Upsell Editor first, then link them to funnel steps here.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2, p: 2.5 }}>
              {savedPages.map(page => {
                const cj = page.content_json || {};
                const isLinked = pagePickerStep && activeFunnel?.tiers
                  .find(t => t.id === pagePickerStep.tierId)?.steps
                  .find(s => s.id === pagePickerStep.stepId)?.pageId === page.id;

                return (
                  <Paper
                    key={page.id}
                    onClick={() => assignPageToStep(page.id, page.title)}
                    sx={{
                      border: isLinked ? '2px solid #27ae60' : '1.5px solid rgba(0,0,0,0.08)',
                      borderRadius: 2.5, overflow: 'hidden', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#667eea', boxShadow: '0 4px 16px rgba(102,126,234,0.15)', transform: 'translateY(-2px)' },
                    }}
                  >
                    {/* Page preview thumbnail */}
                    <Box sx={{
                      height: 140, bgcolor: '#f8f9fa', overflow: 'hidden', position: 'relative',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {cj.htmlPreview ? (
                        <iframe
                          srcDoc={cj.htmlPreview}
                          title={page.title}
                          sandbox=""
                          style={{
                            width: '400%', height: '400%', border: 'none',
                            transform: 'scale(0.25)', transformOrigin: 'top left',
                            pointerEvents: 'none',
                          }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <PageIcon sx={{ fontSize: 40, color: '#ddd' }} />
                        </Box>
                      )}
                      {/* Preview button overlay */}
                      {cj.htmlPreview && (
                        <Tooltip title="Full preview">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewHtml(cj.htmlPreview);
                              setPagePreviewOpen(true);
                            }}
                            sx={{
                              position: 'absolute', top: 4, right: 4,
                              bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                              '&:hover': { bgcolor: '#fff' },
                            }}
                          >
                            <PreviewIcon sx={{ fontSize: 16, color: '#667eea' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isLinked && (
                        <Chip
                          label="Currently linked"
                          size="small"
                          sx={{
                            position: 'absolute', bottom: 4, left: 4,
                            bgcolor: '#27ae60', color: '#fff', fontSize: '0.65rem', fontWeight: 700, height: 20,
                          }}
                        />
                      )}
                    </Box>

                    {/* Page info */}
                    <Box sx={{ p: 1.5 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', mb: 0.3, lineHeight: 1.3 }} noWrap>
                        {page.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={page.page_type || cj.pageType || 'page'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#f0f0f0', color: '#999' }}
                        />
                        {cj.productName && (
                          <Typography sx={{ fontSize: '0.65rem', color: '#bbb' }} noWrap>
                            {cj.productName}
                          </Typography>
                        )}
                      </Box>
                      {cj.price && (
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#27ae60', mt: 0.3 }}>
                          {cj.price}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ——— Full page preview dialog ———————————— */}
      <Dialog
        open={pagePreviewOpen}
        onClose={() => setPagePreviewOpen(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#fafbfc' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography sx={{ fontWeight: 700 }}>Page Preview</Typography>
          <IconButton onClick={() => setPagePreviewOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <iframe
            srcDoc={previewHtml}
            title="Page Preview"
            sandbox="allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </Box>
      </Dialog>

      {/* ——— Snackbar ————————————————————————————— */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
