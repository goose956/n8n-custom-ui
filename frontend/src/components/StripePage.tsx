import { useState, useEffect } from 'react';
import { API } from '../config/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface App {
  id: number;
  name: string;
  slug: string;
  primary_color?: string;
}

interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  interval?: string;
  label: string;
  stripe_price_id?: string;
}

interface StripeProduct {
  id: string;
  app_id: number;
  name: string;
  description: string;
  stripe_product_id?: string;
  prices: StripePrice[];
  created_at: string;
  updated_at: string;
}

interface StripePayment {
  id: string;
  app_id: number;
  product_id: string;
  price_id: string;
  customer_email: string;
  stripe_session_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  created_at: string;
}

const CURRENCIES = [
  { value: 'gbp', label: '£ GBP' },
  { value: 'usd', label: '$ USD' },
  { value: 'eur', label: '€ EUR' },
];

const INTERVALS = [
  { value: '', label: 'One-time' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'week', label: 'Weekly' },
];

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'gbp' ? '£' : currency === 'eur' ? '€' : '$';
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StripePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'products' | 'payments'>('products');

  // Product dialog
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StripeProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    prices: [{ id: '', amount: '', currency: 'gbp', interval: '', label: 'Monthly' }] as Array<{
      id: string;
      amount: string;
      currency: string;
      interval: string;
      label: string;
    }>,
  });

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadProducts();
      loadPayments();
    }
  }, [selectedAppId]);

  const loadApps = async () => {
    try {
      const res = await axios.get(API.apps);
      const list = res.data?.data || res.data || [];
      setApps(list);
      if (list.length > 0 && !selectedAppId) {
        setSelectedAppId(String(list[0].id));
      }
    } catch {
      setError('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API.stripe}/products?app_id=${selectedAppId}`);
      setProducts(res.data?.data || []);
    } catch {
      console.error('Failed to load products');
    }
  };

  const loadPayments = async () => {
    try {
      const res = await axios.get(`${API.stripe}/payments?app_id=${selectedAppId}`);
      setPayments(res.data?.data || []);
    } catch {
      console.error('Failed to load payments');
    }
  };

  const handleOpenProductDialog = (product?: StripeProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        prices: product.prices.map((p) => ({
          id: p.id,
          amount: String(p.amount),
          currency: p.currency,
          interval: p.interval || '',
          label: p.label,
        })),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        prices: [{ id: '', amount: '', currency: 'gbp', interval: '', label: 'One-time' }],
      });
    }
    setProductDialog(true);
  };

  const handleAddPrice = () => {
    setProductForm((prev) => ({
      ...prev,
      prices: [
        ...prev.prices,
        { id: '', amount: '', currency: 'gbp', interval: 'month', label: 'Monthly' },
      ],
    }));
  };

  const handleRemovePrice = (idx: number) => {
    setProductForm((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== idx),
    }));
  };

  const handlePriceChange = (idx: number, field: string, value: string) => {
    setProductForm((prev) => {
      const prices = [...prev.prices];
      (prices[idx] as any)[field] = value;
      // Auto-set label based on interval
      if (field === 'interval') {
        const match = INTERVALS.find((i) => i.value === value);
        if (match) prices[idx].label = match.label;
      }
      return { ...prev, prices };
    });
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) return;

    const validPrices = productForm.prices.filter((p) => p.amount);
    if (validPrices.length === 0) {
      setError('Add at least one price');
      return;
    }

    try {
      const pricesPayload = validPrices.map((p) => ({
        id: p.id || `price_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        amount: Math.round(parseFloat(p.amount) * 100), // Convert pounds/dollars to pence/cents
        currency: p.currency,
        interval: p.interval || undefined,
        label: p.label,
      }));

      if (editingProduct) {
        await axios.put(`${API.stripe}/products/${editingProduct.id}`, {
          name: productForm.name,
          description: productForm.description,
          prices: pricesPayload,
        });
        setSuccess('Product updated');
      } else {
        await axios.post(`${API.stripe}/products`, {
          app_id: parseInt(selectedAppId),
          name: productForm.name,
          description: productForm.description,
          prices: pricesPayload,
        });
        setSuccess('Product created');
      }

      setProductDialog(false);
      loadProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API.stripe}/products/${productId}`);
      setSuccess('Product deleted');
      loadProducts();
    } catch {
      setError('Failed to delete product');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await axios.post(`${API.stripe}/sync/${selectedAppId}`);
      if (res.data.success) {
        setSuccess(res.data.message);
        loadProducts();
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestCheckout = async (priceId: string) => {
    try {
      setError(null);
      const res = await axios.post(`${API.stripe}/checkout`, {
        app_id: parseInt(selectedAppId),
        price_id: priceId,
        success_url: window.location.origin + '/stripe?success=true',
        cancel_url: window.location.origin + '/stripe?cancelled=true',
      });
      if (res.data.success && res.data.url) {
        window.open(res.data.url, '_blank');
      } else {
        setError(res.data.message || 'Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Checkout failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bgcolor: '#e8f5e9', color: '#27ae60' };
      case 'pending':
        return { bgcolor: '#fff3e0', color: '#f57c00' };
      case 'failed':
        return { bgcolor: '#ffebee', color: '#e53935' };
      case 'refunded':
        return { bgcolor: '#e3f2fd', color: '#1565c0' };
      default:
        return { bgcolor: '#f5f5f5', color: '#999' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ fontSize: 14 }} />;
      case 'pending':
        return <ScheduleIcon sx={{ fontSize: 14 }} />;
      case 'failed':
        return <ErrorIcon sx={{ fontSize: 14 }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.5 }}>
            Stripe Payments
          </Typography>
          <Typography sx={{ color: '#888', fontSize: '0.95rem' }}>
            Manage products, prices & payments for your apps
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Select App</InputLabel>
          <Select
            value={selectedAppId}
            label="Select App"
            onChange={(e) => setSelectedAppId(e.target.value)}
          >
            {apps.map((app) => (
              <MenuItem key={app.id} value={String(app.id)}>
                {app.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* Tab buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button
          variant={tab === 'products' ? 'contained' : 'outlined'}
          startIcon={<CreditCardIcon />}
          onClick={() => setTab('products')}
          sx={{
            ...(tab === 'products'
              ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
              : { borderColor: '#e0e0e0', color: '#666' }),
          }}
        >
          Products & Prices
        </Button>
        <Button
          variant={tab === 'payments' ? 'contained' : 'outlined'}
          startIcon={<PaymentIcon />}
          onClick={() => setTab('payments')}
          sx={{
            ...(tab === 'payments'
              ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
              : { borderColor: '#e0e0e0', color: '#666' }),
          }}
        >
          Payments ({payments.length})
        </Button>
      </Box>

      {/* ─── Products Tab ─────────────────────────────────────────────── */}
      {tab === 'products' && (
        <Stack spacing={2.5}>
          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProductDialog()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
              }}
            >
              Add Product
            </Button>
            <Tooltip title="Sync all products & prices to your Stripe account">
              <Button
                variant="outlined"
                startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                onClick={handleSync}
                disabled={syncing || products.length === 0}
                sx={{ borderColor: '#e0e0e0', color: '#666', '&:hover': { borderColor: '#667eea', color: '#667eea' } }}
              >
                {syncing ? 'Syncing...' : 'Sync to Stripe'}
              </Button>
            </Tooltip>
          </Box>

          {/* Product cards */}
          {products.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed #e0e0e0', bgcolor: 'transparent', boxShadow: 'none' }}>
              <MoneyIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
              <Typography sx={{ color: '#888', fontWeight: 600, mb: 1 }}>No products yet</Typography>
              <Typography variant="body2" sx={{ color: '#bbb', mb: 2 }}>
                Create a product with prices so your app's checkout page can accept payments.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenProductDialog()}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Create First Product
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} md={6} key={product.id}>
                  <Paper sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.06)', position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.05rem' }}>
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="body2" sx={{ color: '#888', mt: 0.25 }}>
                            {product.description}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenProductDialog(product)}>
                          <EditIcon sx={{ fontSize: 16, color: '#888' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteProduct(product.id)}>
                          <DeleteIcon sx={{ fontSize: 16, color: '#e74c3c' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Stripe sync status */}
                    {product.stripe_product_id ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                        label="Synced to Stripe"
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#e8f5e9', color: '#27ae60', mb: 1.5, '& .MuiChip-icon': { color: '#27ae60' } }}
                      />
                    ) : (
                      <Chip
                        label="Local only — sync to Stripe"
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#fff3e0', color: '#f57c00', mb: 1.5 }}
                      />
                    )}

                    {/* Prices */}
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack spacing={1}>
                      {product.prices.map((price) => (
                        <Box
                          key={price.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1.25,
                            bgcolor: '#f8f9ff',
                            borderRadius: 1.5,
                            border: '1px solid #eee',
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.1rem' }}>
                              {formatAmount(price.amount, price.currency)}
                              {price.interval && (
                                <Typography component="span" sx={{ fontWeight: 400, color: '#888', fontSize: '0.85rem' }}>
                                  /{price.interval}
                                </Typography>
                              )}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                              {price.label}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {price.stripe_price_id && (
                              <>
                                <Chip label="Live" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#e8f5e9', color: '#27ae60' }} />
                                <Tooltip title="Open a test Stripe Checkout for this price">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleTestCheckout(price.id)}
                                    sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.7rem', borderColor: '#ddd', color: '#667eea', '&:hover': { borderColor: '#667eea' } }}
                                  >
                                    Test
                                  </Button>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* ─── Payments Tab ─────────────────────────────────────────────── */}
      {tab === 'payments' && (
        <Paper sx={{ overflow: 'hidden' }}>
          {payments.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
              <Typography sx={{ color: '#888', fontWeight: 600, mb: 1 }}>No payments yet</Typography>
              <Typography variant="body2" sx={{ color: '#bbb' }}>
                Payments will appear here once customers start purchasing through your checkout pages.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Session ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => {
                    const statusStyle = getStatusColor(payment.status);
                    return (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {formatDate(payment.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {payment.customer_email || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>
                            {formatAmount(payment.amount, payment.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(payment.status) || undefined}
                            label={payment.status}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              ...statusStyle,
                              '& .MuiChip-icon': { color: statusStyle.color },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#999', fontFamily: 'monospace' }}>
                            {payment.stripe_session_id.slice(0, 20)}...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ─── Product Dialog ───────────────────────────────────────────── */}
      <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          {editingProduct ? 'Edit Product' : 'New Product'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Product Name"
              placeholder="e.g. Pro Membership, Course Access"
              value={productForm.name}
              onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Description"
              placeholder="What the customer gets"
              value={productForm.description}
              onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
            />

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: '#1a1a2e' }}>Prices</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddPrice}>
                Add Price
              </Button>
            </Box>

            {productForm.prices.map((price, idx) => (
              <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: '#f8f9ff', border: '1px solid #eee', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      placeholder="9.99"
                      value={price.amount}
                      onChange={(e) => handlePriceChange(idx, 'amount', e.target.value)}
                      size="small"
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={price.currency}
                        label="Currency"
                        onChange={(e) => handlePriceChange(idx, 'currency', e.target.value)}
                      >
                        {CURRENCIES.map((c) => (
                          <MenuItem key={c.value} value={c.value}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Billing</InputLabel>
                      <Select
                        value={price.interval}
                        label="Billing"
                        onChange={(e) => handlePriceChange(idx, 'interval', e.target.value)}
                      >
                        {INTERVALS.map((i) => (
                          <MenuItem key={i.value} value={i.value}>
                            {i.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={1}>
                    {productForm.prices.length > 1 && (
                      <IconButton size="small" onClick={() => handleRemovePrice(idx)}>
                        <DeleteIcon sx={{ fontSize: 16, color: '#e74c3c' }} />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProductDialog(false)} sx={{ color: '#888' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
            disabled={!productForm.name.trim() || productForm.prices.every((p) => !p.amount)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f96 100%)' },
            }}
          >
            {editingProduct ? 'Save Changes' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
