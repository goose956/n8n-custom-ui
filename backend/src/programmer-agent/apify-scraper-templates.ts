/**
 * Apify Scraper Integration Templates
 * 
 * Auto-generated as part of every new members area.
 * Produces a complete backend (NestJS controller + service + module) and
 * a polished frontend results page — zero AI tokens required.
 * 
 * The agent only needs to later customize:
 *  - The Apify actor ID (default: 'clockworks/tiktok-scraper')
 *  - Input fields / URL validation pattern
 *  - Results table columns
 */

export interface ScraperTemplateParams {
  /** kebab-case slug, e.g. 'my-app' */
  slug: string;
  /** Display name, e.g. 'My App' */
  appName: string;
  /** Hex color, e.g. '#667eea' */
  primaryColor: string;
  /** Apify actor ID — can be customized later */
  actorId?: string;
  /** db.json collection name */
  dbCollection?: string;
  /** App ID number */
  appId?: number;
}

function toPascalCase(str: string): string {
  return str.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ============================================================================
// BACKEND: Controller
// ============================================================================

export function scraperControllerTemplate(p: ScraperTemplateParams): string {
  const pascal = toPascalCase(p.slug);
  const serviceName = `${pascal}ScraperService`;
  const controllerName = `${pascal}ScraperController`;
  
  return `import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ${serviceName} } from './${p.slug}-scraper.service';

interface ScrapeRequest {
  urls: string[];
  options?: {
    maxItems?: number;
    [key: string]: any;
  };
}

@Controller('api/${p.slug}-scraper')
export class ${controllerName} {
  constructor(private readonly scraperService: ${serviceName}) {}

  @Post('/run')
  async runScraper(@Body() body: ScrapeRequest) {
    try {
      const result = await this.scraperService.runScraper(body);
      return {
        success: result.success,
        runId: result.runId,
        message: result.success ? 'Scraper started successfully' : (result.error || 'Failed to start scraper'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('/status')
  async getStatus(@Query('runId') runId: string) {
    try {
      if (!runId) {
        return { success: false, message: 'Run ID is required', timestamp: new Date().toISOString() };
      }
      const result = await this.scraperService.getStatus(runId);
      return {
        success: result.success,
        status: result.status,
        data: result.data,
        message: result.success ? 'Status retrieved' : (result.error || 'Failed to get status'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('/results')
  async getResults(@Query('runId') runId: string) {
    try {
      const result = await this.scraperService.getResults(runId);
      return {
        success: result.success,
        data: result.data,
        total: result.data?.length || 0,
        message: result.success ? 'Results retrieved' : (result.error || 'Failed to get results'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
`;
}

// ============================================================================
// BACKEND: Service
// ============================================================================

export function scraperServiceTemplate(p: ScraperTemplateParams): string {
  const pascal = toPascalCase(p.slug);
  const serviceName = `${pascal}ScraperService`;
  const actorId = p.actorId || 'clockworks/tiktok-scraper';
  const collection = p.dbCollection || `${toCamelCase(p.slug)}ScraperRuns`;
  
  return `import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CryptoService } from '../shared/crypto.service';
import { DatabaseService } from '../shared/database.service';

interface ScrapeRequest {
  urls: string[];
  options?: {
    maxItems?: number;
    [key: string]: any;
  };
}

interface ScrapeResponse {
  success: boolean;
  runId?: string;
  error?: string;
}

interface StatusResponse {
  success: boolean;
  status?: string;
  data?: any;
  error?: string;
}

interface ResultsResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

@Injectable()
export class ${serviceName} {
  private readonly logger = new Logger(${serviceName}.name);

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly db: DatabaseService,
  ) {}

  private getApiKey(provider: string): string | null {
    try {
      const data = this.db.readSync();
      const apiKeys = data.apiKeys || [];
      const keyEntry = apiKeys.find((k: any) => k.name.toLowerCase() === provider.toLowerCase());
      if (!keyEntry) return null;
      return this.cryptoService.decrypt(keyEntry.value);
    } catch (error) {
      this.logger.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  private async runApifyActor(actorId: string, input: Record<string, any>): Promise<any> {
    const token = this.getApiKey('apify');
    if (!token) throw new Error('Apify API key not configured. Add it in Settings > API Keys.');

    const runResponse = await axios.post(
      \`https://api.apify.com/v2/acts/\${actorId}/runs\`,
      input,
      {
        headers: { Authorization: \`Bearer \${token}\` },
        params: { waitForFinish: 120 },
        timeout: 130_000,
      },
    );
    return runResponse.data?.data;
  }

  private async getApifyResults(datasetId: string): Promise<any[]> {
    const token = this.getApiKey('apify');
    if (!token) throw new Error('Apify API key not configured');

    const results = await axios.get(\`https://api.apify.com/v2/datasets/\${datasetId}/items\`, {
      headers: { Authorization: \`Bearer \${token}\` },
      params: { format: 'json' },
      timeout: 15_000,
    });
    return results.data || [];
  }

  async runScraper(request: ScrapeRequest): Promise<ScrapeResponse> {
    try {
      if (!request.urls || request.urls.length === 0) {
        return { success: false, error: 'At least one URL is required' };
      }

      const input: Record<string, any> = {
        startUrls: request.urls.map(url => ({ url })),
        resultsLimit: request.options?.maxItems || 100,
      };

      const runData = await this.runApifyActor('${actorId}', input);

      if (!runData?.id) {
        return { success: false, error: 'Failed to start scraper run' };
      }

      // Store run info in db.json
      const data = this.db.readSync();
      if (!data.${collection}) data.${collection} = {};

      data.${collection}[runData.id] = {
        id: runData.id,
        status: runData.status,
        startedAt: new Date().toISOString(),
        urls: request.urls,
        options: request.options || {},
        defaultDatasetId: runData.defaultDatasetId,
      };
      this.db.writeSync(data);

      return { success: true, runId: runData.id };
    } catch (error) {
      this.logger.error('Scraper run error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getStatus(runId: string): Promise<StatusResponse> {
    try {
      const token = this.getApiKey('apify');
      if (!token) return { success: false, error: 'Apify API key not configured' };

      const response = await axios.get(\`https://api.apify.com/v2/actor-runs/\${runId}\`, {
        headers: { Authorization: \`Bearer \${token}\` },
        timeout: 15_000,
      });

      const runData = response.data?.data;
      if (!runData) return { success: false, error: 'Run not found' };

      // Update local DB
      const data = this.db.readSync();
      if (data.${collection}?.[runId]) {
        data.${collection}[runId].status = runData.status;
        data.${collection}[runId].updatedAt = new Date().toISOString();
        if (runData.finishedAt) data.${collection}[runId].finishedAt = runData.finishedAt;
        this.db.writeSync(data);
      }

      return {
        success: true,
        status: runData.status,
        data: {
          id: runData.id,
          status: runData.status,
          startedAt: runData.startedAt,
          finishedAt: runData.finishedAt,
          stats: runData.stats,
        },
      };
    } catch (error) {
      this.logger.error('Status check error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getResults(runId: string): Promise<ResultsResponse> {
    try {
      const data = this.db.readSync();
      const runInfo = data.${collection}?.[runId];
      if (!runInfo) return { success: false, error: 'Run not found in database' };

      let datasetId = runInfo.defaultDatasetId;
      if (!datasetId) {
        const token = this.getApiKey('apify');
        if (!token) return { success: false, error: 'Apify API key not configured' };

        const response = await axios.get(\`https://api.apify.com/v2/actor-runs/\${runId}\`, {
          headers: { Authorization: \`Bearer \${token}\` },
          timeout: 15_000,
        });
        datasetId = response.data?.data?.defaultDatasetId;
        if (!datasetId) return { success: false, error: 'No dataset available for this run' };

        data.${collection}[runId].defaultDatasetId = datasetId;
        this.db.writeSync(data);
      }

      const results = await this.getApifyResults(datasetId);
      return { success: true, data: results };
    } catch (error) {
      this.logger.error('Results retrieval error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
`;
}

// ============================================================================
// BACKEND: Module
// ============================================================================

export function scraperModuleTemplate(p: ScraperTemplateParams): string {
  const pascal = toPascalCase(p.slug);
  return `import { Module } from '@nestjs/common';
import { ${pascal}ScraperController } from './${p.slug}-scraper.controller';
import { ${pascal}ScraperService } from './${p.slug}-scraper.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [${pascal}ScraperController],
  providers: [${pascal}ScraperService],
  exports: [${pascal}ScraperService],
})
export class ${pascal}ScraperModule {}
`;
}

// ============================================================================
// FRONTEND: Scraper Results Page (for members area)
// ============================================================================

export function scraperResultsPageTemplate(p: ScraperTemplateParams): string {
  const pascal = toPascalCase(p.slug);
  const sec = darkenHex(p.primaryColor, 0.15);
  
  return `import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, IconButton, Tooltip, LinearProgress, InputAdornment,
  Alert, Snackbar, Grid, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/GetApp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DataIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkIcon from '@mui/icons-material/Link';

const COLORS = {
  primary: '${p.primaryColor}',
  secondary: '${sec}',
  tint: '${p.primaryColor}15',
  bg: '#fafbfc',
  border: 'rgba(0,0,0,0.06)',
  shadow: '0 2px 12px rgba(0,0,0,0.04)',
  shadowHover: '0 8px 25px rgba(0,0,0,0.08)',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#e74c3c',
};

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
const API_URL = \`\${API_BASE}/api/${p.slug}-scraper\`;

interface ScraperResult {
  [key: string]: any;
}

export function Members${pascal}ScraperPage() {
  const [results, setResults] = useState<ScraperResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ScraperResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [maxItems, setMaxItems] = useState(100);
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'info' });

  // Poll status when a run is active
  useEffect(() => {
    if (!runId || runStatus === 'SUCCEEDED' || runStatus === 'FAILED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(\`\${API_URL}/status?runId=\${runId}\`);
        const data = await res.json();
        if (data.success) {
          setRunStatus(data.status);
          if (data.status === 'SUCCEEDED') {
            setSnack({ open: true, msg: 'Scrape completed! Loading results...', severity: 'success' });
            loadResults(runId);
          } else if (data.status === 'FAILED') {
            setSnack({ open: true, msg: 'Scrape failed. Please try again.', severity: 'error' });
          }
        }
      } catch (err) { /* keep polling */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [runId, runStatus]);

  // Filter results when search changes
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredResults(results); return; }
    const q = searchQuery.toLowerCase();
    setFilteredResults(results.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    ));
  }, [searchQuery, results]);

  const loadResults = useCallback(async (rid: string) => {
    setLoading(true);
    try {
      const res = await fetch(\`\${API_URL}/results?runId=\${rid}\`);
      const data = await res.json();
      if (data.success && data.data) {
        setResults(data.data);
        setFilteredResults(data.data);
      }
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to load results', severity: 'error' });
    }
    setLoading(false);
  }, []);

  const startScrape = async () => {
    const urls = urlInput.split('\\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      setSnack({ open: true, msg: 'Enter at least one URL', severity: 'error' });
      return;
    }
    setRunDialogOpen(false);
    setLoading(true);
    setRunStatus('STARTING');
    try {
      const res = await fetch(\`\${API_URL}/run\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, options: { maxItems } }),
      });
      const data = await res.json();
      if (data.success && data.runId) {
        setRunId(data.runId);
        setRunStatus('RUNNING');
        setSnack({ open: true, msg: 'Scraper started! Results will appear when complete.', severity: 'success' });
      } else {
        setRunStatus(null);
        setSnack({ open: true, msg: data.message || 'Failed to start', severity: 'error' });
      }
    } catch (err) {
      setRunStatus(null);
      setSnack({ open: true, msg: 'Network error starting scraper', severity: 'error' });
    }
    setLoading(false);
  };

  const exportCsv = () => {
    if (filteredResults.length === 0) return;
    const keys = Object.keys(filteredResults[0]).filter(k => typeof filteredResults[0][k] !== 'object');
    const header = keys.join(',');
    const rows = filteredResults.map(r => keys.map(k => {
      const v = String(r[k] ?? '').replace(/"/g, '""');
      return v.includes(',') || v.includes('"') || v.includes('\\n') ? \`"\${v}"\` : v;
    }).join(','));
    const csv = [header, ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`${p.slug}-scraper-results.csv\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derive columns from first result
  const columns = results.length > 0
    ? Object.keys(results[0]).filter(k => typeof results[0][k] !== 'object').slice(0, 8)
    : [];

  const isRunning = runStatus === 'RUNNING' || runStatus === 'STARTING';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Hero header */}
      <Paper sx={{
        p: { xs: 3, md: 4 }, mb: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
        background: \`linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)\`, color: '#fff',
      }} elevation={0}>
        <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -40 }} />
        <Box sx={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -30, left: '30%' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <DataIcon sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              ${p.appName} Scraper
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 600 }}>
            Run Apify scrapers, view results, and export data. Connect any Apify actor to power your ${p.appName} integrations.
          </Typography>
        </Box>
      </Paper>

      {/* Status bar */}
      {isRunning && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid ' + COLORS.border, display: 'flex', alignItems: 'center', gap: 2 }} elevation={0}>
          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>Scraper running...</Typography>
            <LinearProgress sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: COLORS.tint, '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary } }} />
          </Box>
          <Chip icon={<TimerIcon />} label={runStatus} size="small" sx={{ fontWeight: 600 }} />
        </Paper>
      )}

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Results', value: results.length, icon: <DataIcon />, color: COLORS.primary },
          { label: 'Filtered', value: filteredResults.length, icon: <SearchIcon />, color: '#2196f3' },
          { label: 'Status', value: runStatus || 'Ready', icon: runStatus === 'SUCCEEDED' ? <CheckCircleIcon /> : <TimerIcon />, color: runStatus === 'SUCCEEDED' ? COLORS.success : COLORS.warning },
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid ' + COLORS.border, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.25s', '&:hover': { transform: 'translateY(-2px)', boxShadow: COLORS.shadowHover } }} elevation={0}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', fontSize: '0.7rem' }}>{stat.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{stat.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid ' + COLORS.border, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }} elevation={0}>
        <TextField
          size="small" placeholder="Search results..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#999' }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
        />
        <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setRunDialogOpen(true)}
          disabled={isRunning}
          sx={{
            background: \`linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)\`,
            color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: 2, px: 3,
            boxShadow: '0 4px 15px ${p.primaryColor}40',
            '&:hover': { boxShadow: '0 6px 20px ${p.primaryColor}60' },
          }}>
          {isRunning ? 'Running...' : 'New Scrape'}
        </Button>
        <Tooltip title="Refresh results">
          <IconButton onClick={() => runId && loadResults(runId)} disabled={!runId || loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export CSV">
          <IconButton onClick={exportCsv} disabled={filteredResults.length === 0}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Results table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid ' + COLORS.border, overflow: 'hidden' }} elevation={0}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}
          </Box>
        ) : filteredResults.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <DataIcon sx={{ fontSize: 56, color: '#ddd', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#999', mb: 1 }}>No results yet</Typography>
            <Typography variant="body2" sx={{ color: '#bbb', mb: 3 }}>
              Click "New Scrape" to run your first scrape and see results here.
            </Typography>
            <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setRunDialogOpen(true)}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary, textTransform: 'none', fontWeight: 600 }}>
              Run First Scrape
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8f9fa' }}>#</TableCell>
                  {columns.map(col => (
                    <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', bgcolor: '#f8f9fa' }}>
                      {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.slice(0, 200).map((row, idx) => (
                  <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fafbfc' } }}>
                    <TableCell sx={{ color: '#999', fontSize: '0.78rem' }}>{idx + 1}</TableCell>
                    {columns.map(col => (
                      <TableCell key={col} sx={{ fontSize: '0.8rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {String(row[col] ?? '—').startsWith('http') ? (
                          <Tooltip title={String(row[col])}>
                            <IconButton size="small" onClick={() => window.open(String(row[col]), '_blank')} sx={{ color: COLORS.primary }}>
                              <OpenInNewIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          String(row[col] ?? '—').slice(0, 100)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {filteredResults.length > 200 && (
          <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa', borderTop: '1px solid ' + COLORS.border }}>
            <Typography variant="caption" sx={{ color: '#999' }}>Showing 200 of {filteredResults.length} results. Export CSV for full data.</Typography>
          </Box>
        )}
      </Paper>

      {/* Run Scraper Dialog */}
      <Dialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayArrowIcon sx={{ color: COLORS.primary }} />
            New Scrape
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
            Enter URLs to scrape (one per line). The scraper will extract data from each URL.
          </Typography>
          <TextField
            fullWidth multiline rows={4} placeholder={"Enter URLs here (one per line)\\nhttps://example.com/page1\\nhttps://example.com/page2"}
            value={urlInput} onChange={e => setUrlInput(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ color: '#999' }} /></InputAdornment> }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            fullWidth type="number" label="Max results per URL" value={maxItems}
            onChange={e => setMaxItems(parseInt(e.target.value) || 100)}
            size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRunDialogOpen(false)} sx={{ textTransform: 'none', color: '#999' }}>Cancel</Button>
          <Button variant="contained" onClick={startScrape} startIcon={<PlayArrowIcon />}
            disabled={!urlInput.trim()}
            sx={{
              background: \`linear-gradient(135deg, ${p.primaryColor} 0%, ${sec} 100%)\`,
              color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: 2,
            }}>
            Start Scrape
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
`;
}

// ============================================================================
// Helper
// ============================================================================

function darkenHex(hex: string, pct: number): string {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * pct));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ============================================================================
// ALL-IN-ONE: Generate all scraper files for a members area
// ============================================================================

export interface ScraperFileSet {
  backendFiles: { path: string; content: string; language: string; description: string }[];
  frontendPage: { path: string; content: string; language: string; description: string };
  moduleName: string;
  modulePath: string;
  apiConfigKey: string;
  apiConfigValue: string;
  routeId: string;
  routeName: string;
}

export function generateScraperFiles(p: ScraperTemplateParams, membersDir: string): ScraperFileSet {
  const pascal = toPascalCase(p.slug);
  const backendDir = `backend/src/${p.slug}-scraper`;

  return {
    backendFiles: [
      {
        path: `${backendDir}/${p.slug}-scraper.controller.ts`,
        content: scraperControllerTemplate(p),
        language: 'typescript',
        description: `${p.appName} scraper controller`,
      },
      {
        path: `${backendDir}/${p.slug}-scraper.service.ts`,
        content: scraperServiceTemplate(p),
        language: 'typescript',
        description: `${p.appName} scraper service`,
      },
      {
        path: `${backendDir}/${p.slug}-scraper.module.ts`,
        content: scraperModuleTemplate(p),
        language: 'typescript',
        description: `${p.appName} scraper module`,
      },
    ],
    frontendPage: {
      path: `${membersDir}/scraper.tsx`,
      content: scraperResultsPageTemplate(p),
      language: 'typescript',
      description: `${p.appName} scraper results page`,
    },
    moduleName: `${pascal}ScraperModule`,
    modulePath: `./${p.slug}-scraper/${p.slug}-scraper.module`,
    apiConfigKey: `${toCamelCase(p.slug)}Scraper`,
    apiConfigValue: `\${API_BASE_URL}/api/${p.slug}-scraper`,
    routeId: 'scraper',
    routeName: 'Data Scraper',
  };
}
