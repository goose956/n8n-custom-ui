import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Box, Typography, Paper, Button, IconButton, Chip, TextField,
  Dialog, Tooltip,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  CircularProgress, Grid, Card, CardContent,
  LinearProgress, Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  ShoppingCart as CheckoutIcon,
  CardGiftcard as UpsellIcon,
  Redeem as OrderBumpIcon,
  TrendingDown as DownsellIcon,
  Celebration as ThankYouIcon,
  AutoFixHigh as AIIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  LocalOffer as PriceIcon,
  FormatBold as BoldIcon,
  Palette as PaletteIcon,
  AutoAwesome as SparkleIcon,
  Timer as TimerIcon,
  FormatQuote as QuoteIcon,
  Inventory as ProductIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// ——— Types ————————————————————————————————————————————————

interface AppInfo {
  id: number;
  name: string;
  slug: string;
  primary_color: string;
}

interface StripeProduct {
  id: string;
  app_id: number;
  name: string;
  description: string;
  prices: { id: string; amount: number; currency: string; interval?: string; label: string }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type PageType = 'upsell' | 'checkout' | 'order-bump' | 'downsell' | 'thankyou-upsell';
type StyleType = 'minimal' | 'bold' | 'elegant' | 'aggressive';

// ——— Page type cards ——————————————————————————————————————

const PAGE_TYPES: { type: PageType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { type: 'checkout', label: 'Checkout Page', description: 'Product details, pricing, payment form with trust badges', icon: <CheckoutIcon />, color: '#667eea' },
  { type: 'upsell', label: 'One-Click Upsell', description: 'Post-purchase add-on offer with "Yes, Add This!" CTA', icon: <UpsellIcon />, color: '#f39c12' },
  { type: 'order-bump', label: 'Order Bump', description: 'Checkbox add-on shown inside the checkout form', icon: <OrderBumpIcon />, color: '#27ae60' },
  { type: 'downsell', label: 'Downsell Offer', description: 'Lower-priced alternative when upsell is declined', icon: <DownsellIcon />, color: '#e74c3c' },
  { type: 'thankyou-upsell', label: 'Thank You + Upsell', description: 'Confirmation page with a final special offer', icon: <ThankYouIcon />, color: '#9b59b6' },
];

const STYLES: { type: StyleType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'minimal', label: 'Minimal', description: 'Clean, lots of whitespace', icon: <PaletteIcon /> },
  { type: 'bold', label: 'Bold', description: 'Strong CTA, high contrast', icon: <BoldIcon /> },
  { type: 'elegant', label: 'Elegant', description: 'Premium, refined feel', icon: <SparkleIcon /> },
  { type: 'aggressive', label: 'High-Convert', description: 'Sales page style, urgency', icon: <TimerIcon /> },
];

// ——— Main component ———————————————————————————————————————

export function UpsellEditorPage() {
  // App/project state
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [products, setProducts] = useState<StripeProduct[]>([]);

  // Page config
  const [pageType, setPageType] = useState<PageType>('upsell');
  const [style, setStyle] = useState<StyleType>('bold');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [urgency, setUrgency] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Generated code
  const [generatedCode, setGeneratedCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // AI Chat for editing
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // UI state
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });
  const [step, setStep] = useState<'configure' | 'editor'>('configure');

  const API = `${API_BASE_URL}/api`;

  // ——— Load apps ——————————————————————————————————————————

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/apps`);
        const data = await res.json();
        const list = data.data || data || [];
        setApps(list);
        if (list.length > 0) setSelectedAppId(list[0].id);
      } catch {
        setSnack({ open: true, msg: 'Failed to load projects', severity: 'error' });
      }
    })();
  }, []);

  // ——— Load Stripe products when app changes ————————————————

  useEffect(() => {
    if (!selectedAppId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/stripe/products?app_id=${selectedAppId}`);
        const data = await res.json();
        setProducts(data.data || []);
      } catch {
        setProducts([]);
      }
    })();
  }, [selectedAppId]);

  // ——— Auto-fill from Stripe product ————————————————————————

  useEffect(() => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      setProductName(prod.name);
      setProductDescription(prod.description || '');
      if (prod.prices.length > 0) {
        const p = prod.prices[0];
        const formatted = `${p.currency === 'gbp' ? '£' : p.currency === 'usd' ? '$' : p.currency.toUpperCase() + ' '}${(p.amount / 100).toFixed(2)}`;
        setPrice(formatted);
      }
    }
  }, [selectedProductId, products]);

  // ——— Chat scroll ———————————————————————————————————————

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ——— Generate upsell page ————————————————————————————————

  const handleGenerate = useCallback(async () => {
    if (!selectedAppId || !productName.trim()) {
      setSnack({ open: true, msg: 'Please select a project and enter a product name', severity: 'error' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API}/programmer-agent/generate-upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          pageType,
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          price: price.trim(),
          originalPrice: originalPrice.trim() || undefined,
          features: features.filter(f => f.trim()),
          urgency: urgency.trim() || undefined,
          testimonial: testimonial.trim() || undefined,
          style,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCode(data.code);
        setStep('editor');
        setChatMessages([{
          id: '1',
          role: 'assistant',
          content: `I've generated your ${pageType} page for "${productName}". You can edit it by typing instructions below — for example:\n\n• "Make the headline bigger"\n• "Change the button color to red"\n• "Add a countdown timer"\n• "Add another testimonial"\n• "Make it more urgent"`,
          timestamp: new Date().toISOString(),
        }]);
        setSnack({ open: true, msg: 'Page generated! Use the AI chat to refine it.', severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Generation failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Network error', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  }, [selectedAppId, pageType, productName, productDescription, price, originalPrice, features, urgency, testimonial, style, API]);

  // ——— AI Chat: Refine page —————————————————————————————————

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatLoading || !generatedCode) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`${API}/programmer-agent/refine-upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: generatedCode,
          instruction: userMsg.content,
          appId: selectedAppId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.code) {
        setGeneratedCode(data.code);
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.question || '✅ Done! I\'ve updated the page. Check the preview to see the changes.',
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ ${data.error || data.question || 'Something went wrong. Try rephrasing your request.'}`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Network error: ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, generatedCode, selectedAppId, API]);

  // ——— Copy code —————————————————————————————————————————

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setSnack({ open: true, msg: 'Code copied to clipboard', severity: 'success' });
  };

  // ——— Save to page ———————————————————————————————————————

  const handleSavePage = async () => {
    if (!selectedAppId || !generatedCode) return;
    try {
      const res = await fetch(`${API}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: selectedAppId,
          page_type: pageType === 'order-bump' ? 'checkout' : pageType === 'thankyou-upsell' ? 'thanks' : 'custom',
          title: `${productName} - ${PAGE_TYPES.find(p => p.type === pageType)?.label || 'Upsell'}`,
          content_json: {
            componentCode: generatedCode,
            pageType,
            productName,
            price,
            style,
            generatedAt: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSnack({ open: true, msg: `Page saved! (ID: ${data.data?.id || 'created'})`, severity: 'success' });
      } else {
        setSnack({ open: true, msg: data.error || 'Save failed', severity: 'error' });
      }
    } catch (err) {
      setSnack({ open: true, msg: err instanceof Error ? err.message : 'Save failed', severity: 'error' });
    }
  };

  // ——— Feature list management ———————————————————————————

  const addFeature = () => setFeatures(prev => [...prev, '']);
  const updateFeature = (idx: number, val: string) => setFeatures(prev => prev.map((f, i) => i === idx ? val : f));
  const removeFeature = (idx: number) => setFeatures(prev => prev.filter((_, i) => i !== idx));

  // ——— Quick edit suggestions ————————————————————————————

  const quickEdits = [
    'Make the CTA button bigger and more prominent',
    'Add a countdown timer showing urgency',
    'Add a money-back guarantee badge section',
    'Make it more mobile-friendly',
    'Add animated entrance effects',
    'Change the color scheme to match my brand',
    'Add a comparison table showing what\'s included',
    'Add more social proof / testimonials',
  ];

  // ——— RENDER ——————————————————————————————————————————————

  if (step === 'configure') {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a2e' }}>AI Upsell Page Editor</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedAppId}
              label="Project"
              onChange={(e) => setSelectedAppId(Number(e.target.value))}
              sx={{ borderRadius: 2 }}
            >
              {apps.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {/* Page Type Selection */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckoutIcon sx={{ fontSize: 20, color: '#667eea' }} /> 1. Choose Page Type
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {PAGE_TYPES.map(pt => (
            <Grid item xs={12} sm={6} md={4} key={pt.type}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: pageType === pt.type ? `2px solid ${pt.color}` : '2px solid transparent',
                  boxShadow: pageType === pt.type ? `0 0 0 3px ${pt.color}22` : '0 1px 3px rgba(0,0,0,0.08)',
                  borderRadius: 3,
                  transition: '0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
                }}
                onClick={() => setPageType(pt.type)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ bgcolor: pt.color + '18', color: pt.color, width: 36, height: 36 }}>
                      {pt.icon}
                    </Avatar>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{pt.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>{pt.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Style Selection */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaletteIcon sx={{ fontSize: 20, color: '#667eea' }} /> 2. Choose Style
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {STYLES.map(s => (
            <Chip
              key={s.type}
              icon={<Box sx={{ display: 'flex', alignItems: 'center' }}>{s.icon}</Box>}
              label={`${s.label} — ${s.description}`}
              onClick={() => setStyle(s.type)}
              variant={style === s.type ? 'filled' : 'outlined'}
              sx={{
                py: 2.5, px: 1,
                borderRadius: 2,
                fontWeight: style === s.type ? 700 : 400,
                bgcolor: style === s.type ? '#667eea18' : 'transparent',
                borderColor: style === s.type ? '#667eea' : 'rgba(0,0,0,0.12)',
                color: style === s.type ? '#667eea' : '#666',
              }}
            />
          ))}
        </Box>

        {/* Product Details */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ProductIcon sx={{ fontSize: 20, color: '#667eea' }} /> 3. Product Details
        </Typography>

        {/* Stripe product picker */}
        {products.length > 0 && (
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid rgba(102,126,234,0.15)', bgcolor: '#fafbfe' }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#667eea', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PriceIcon sx={{ fontSize: 16 }} /> Auto-fill from your Stripe products
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {products.map(prod => (
                <Chip
                  key={prod.id}
                  label={`${prod.name}${prod.prices[0] ? ` — ${(prod.prices[0].amount / 100).toFixed(2)}` : ''}`}
                  onClick={() => setSelectedProductId(prod.id)}
                  variant={selectedProductId === prod.id ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: 2,
                    bgcolor: selectedProductId === prod.id ? '#667eea18' : 'transparent',
                    borderColor: selectedProductId === prod.id ? '#667eea' : 'rgba(0,0,0,0.12)',
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Product Name"
              value={productName} onChange={e => setProductName(e.target.value)}
              placeholder="e.g. Premium Templates Pack"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth size="small" label="Offer Price"
              value={price} onChange={e => setPrice(e.target.value)}
              placeholder="£29.99"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth size="small" label="Original Price (optional)"
              value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
              placeholder="£59.99"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth size="small" multiline rows={2} label="Product Description"
              value={productDescription} onChange={e => setProductDescription(e.target.value)}
              placeholder="Describe what the customer gets..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>

        {/* Features */}
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckIcon sx={{ fontSize: 16, color: '#27ae60' }} /> Features / Benefits
        </Typography>
        {features.map((f, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth size="small"
              value={f} onChange={e => updateFeature(idx, e.target.value)}
              placeholder={`Feature ${idx + 1}`}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {features.length > 1 && (
              <IconButton size="small" onClick={() => removeFeature(idx)} sx={{ color: '#ccc', '&:hover': { color: '#e74c3c' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={addFeature} sx={{ mb: 3, textTransform: 'none', color: '#667eea' }}>
          Add Feature
        </Button>

        {/* Optional fields */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Urgency Message (optional)"
              value={urgency} onChange={e => setUrgency(e.target.value)}
              placeholder="Only available for the next 24 hours!"
              InputProps={{ startAdornment: <TimerIcon sx={{ mr: 1, fontSize: 18, color: '#e74c3c' }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Testimonial Quote (optional)"
              value={testimonial} onChange={e => setTestimonial(e.target.value)}
              placeholder='"This changed my business!" — John D.'
              InputProps={{ startAdornment: <QuoteIcon sx={{ mr: 1, fontSize: 18, color: '#f39c12' }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>

        {/* Generate Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={generating ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <AIIcon />}
            onClick={handleGenerate}
            disabled={generating || !productName.trim() || !selectedAppId}
            sx={{
              px: 5, py: 1.5, borderRadius: 3, textTransform: 'none', fontWeight: 700, fontSize: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
              '&:hover': { boxShadow: '0 6px 20px rgba(102,126,234,0.5)' },
            }}
          >
            {generating ? 'Generating Page...' : 'Generate with AI'}
          </Button>
        </Box>
        {generating && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

        {/* Snackbar */}
        <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // ——— EDITOR VIEW (after generation) ——————————————————————

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AIIcon sx={{ color: '#667eea', fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
            {productName} — {PAGE_TYPES.find(p => p.type === pageType)?.label}
          </Typography>
          <Chip
            label={STYLES.find(s => s.type === style)?.label}
            size="small"
            sx={{ bgcolor: '#667eea18', color: '#667eea', fontWeight: 600 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small" variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setStep('configure')}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}
          >
            Back to Config
          </Button>
          <Button
            size="small" variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setShowPreview(true)}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}
          >
            Preview
          </Button>
          <Button
            size="small" variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopy}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}
          >
            Copy Code
          </Button>
          <Button
            size="small" variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePage}
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Save as Page
          </Button>
          <Tooltip title="Regenerate from scratch">
            <IconButton size="small" onClick={handleGenerate} disabled={generating} sx={{ color: '#999' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main layout: Code + Chat */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0, overflow: 'hidden' }}>
        {/* Code panel */}
        <Paper sx={{
          flex: 1, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Box sx={{
            p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)', bgcolor: '#1a1a2e',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#8b95a5', fontFamily: 'monospace' }}>
              UpsellPage.tsx
            </Typography>
            <Chip label={`${generatedCode.split('\n').length} lines`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#8b95a5', fontSize: '0.7rem' }} />
          </Box>
          <Box sx={{
            flex: 1, overflow: 'auto', p: 2, bgcolor: '#0d1117',
            fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
            fontSize: '0.78rem', lineHeight: 1.6, color: '#c9d1d9',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {generatedCode}
          </Box>
        </Paper>

        {/* AI Chat panel */}
        <Paper sx={{
          width: 380, borderRadius: 3, display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(0,0,0,0.06)', flexShrink: 0,
        }}>
          {/* Chat header */}
          <Box sx={{
            p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px 12px 0 0',
          }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AIIcon sx={{ fontSize: 18 }} /> AI Design Chat
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
              Tell me how to change the page
            </Typography>
          </Box>

          {/* Quick edit chips */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)', maxHeight: 90, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {quickEdits.slice(0, 6).map((qe, idx) => (
                <Chip
                  key={idx}
                  label={qe.length > 30 ? qe.slice(0, 30) + '...' : qe}
                  size="small"
                  onClick={() => { setChatInput(qe); }}
                  sx={{
                    fontSize: '0.68rem', borderRadius: 1.5, cursor: 'pointer',
                    bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#667eea18', color: '#667eea' },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Chat messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            {chatMessages.map(msg => (
              <Box key={msg.id} sx={{
                mb: 1.5,
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <Paper sx={{
                  maxWidth: '85%', p: 1.5, borderRadius: 2,
                  bgcolor: msg.role === 'user' ? '#667eea' : '#f5f5f5',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  boxShadow: 'none',
                }}>
                  <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {chatLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <CircularProgress size={16} sx={{ color: '#667eea' }} />
                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>AI is editing the page...</Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* Chat input */}
          <Box sx={{ p: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth size="small"
                placeholder="e.g. Make the headline bigger..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                multiline maxRows={3}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
              />
              <IconButton
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                sx={{
                  bgcolor: '#667eea', color: '#fff', borderRadius: 2,
                  '&:hover': { bgcolor: '#5a6fd6' },
                  '&.Mui-disabled': { bgcolor: '#eee', color: '#ccc' },
                }}
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Full-page Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#fafbfc' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography sx={{ fontWeight: 700 }}>Page Preview — {productName}</Typography>
          <IconButton onClick={() => setShowPreview(false)}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', justifyContent: 'center' }}>
          <Paper sx={{ maxWidth: 800, width: '100%', p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Box sx={{
              fontFamily: '"Fira Code", monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap',
              lineHeight: 1.6, color: '#333', bgcolor: '#f8f9fa', p: 3, borderRadius: 2,
            }}>
              {generatedCode}
            </Box>
          </Paper>
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
