# ============================================================
# End-to-end preview test script
# Tests components exactly like the browser preview does
# ============================================================

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"

function Test-Preview {
    param(
        [string]$Name,
        [string]$ComponentCode,
        [string]$FileName,
        [string]$ComponentName
    )
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "TEST: $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $filePath = "frontend/src/components/members/$FileName"
    
    # 1. Start preview session
    Write-Host "[1] Starting preview session..." -ForegroundColor Yellow
    $body = @{
        files = @(@{
            path = $filePath
            content = $ComponentCode
        })
        entryFile = $filePath
        componentName = $ComponentName
        primaryColor = "#1976d2"
    } | ConvertTo-Json -Depth 5
    
    try {
        $startResp = Invoke-RestMethod -Uri "$baseUrl/api/preview/start" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
        $sessionId = $startResp.sessionId
        $port = $startResp.port
        Write-Host "    Session: $sessionId, Port: $port" -ForegroundColor Green
    } catch {
        Write-Host "    FAIL: Could not start preview: $_" -ForegroundColor Red
        return @{ success = $false; error = "Start failed" }
    }
    
    # 2. Wait for Vite to be ready
    Write-Host "[2] Waiting for Vite server on port $port..." -ForegroundColor Yellow
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
    }
    if (-not $ready) {
        Write-Host "    FAIL: Vite never became ready on port $port" -ForegroundColor Red
        # Stop session
        try { Invoke-RestMethod -Uri "$baseUrl/api/preview/stop" -Method POST -ContentType "application/json" -Body (@{sessionId=$sessionId} | ConvertTo-Json) -TimeoutSec 5 } catch {}
        return @{ success = $false; error = "Vite not ready" }
    }
    Write-Host "    Vite is ready!" -ForegroundColor Green
    
    # 3. Fetch the index.html and check it loaded
    Write-Host "[3] Fetching index.html..." -ForegroundColor Yellow
    try {
        $indexHtml = (Invoke-WebRequest -Uri "http://localhost:$port/" -UseBasicParsing -TimeoutSec 5).Content
        if ($indexHtml -match "root") {
            Write-Host "    index.html OK (has #root div)" -ForegroundColor Green
        } else {
            Write-Host "    WARNING: index.html missing #root" -ForegroundColor Red
        }
    } catch {
        Write-Host "    FAIL: Could not fetch index.html: $_" -ForegroundColor Red
    }
    
    # 4. Fetch the generated main.tsx (transformed by Vite)
    Write-Host "[4] Fetching /src/main.tsx (Vite-transformed)..." -ForegroundColor Yellow
    try {
        $mainTsx = (Invoke-WebRequest -Uri "http://localhost:$port/src/main.tsx" -UseBasicParsing -TimeoutSec 10).Content
        
        # Check for key features
        $checks = @{
            "React import" = $mainTsx -match "react"
            "Component import" = $mainTsx -match "components/"
            "ErrorBoundary" = $mainTsx -match "PreviewErrorBoundary|ErrorBoundary"
            "MemoryRouter" = $mainTsx -match "MemoryRouter"
            "_safeProxy" = $mainTsx -match "_safeProxy"
            "fetch mock" = $mainTsx -match "_realFetch|_mockData"
        }
        foreach ($check in $checks.GetEnumerator()) {
            if ($check.Value) {
                Write-Host "    $($check.Key): OK" -ForegroundColor Green
            } else {
                Write-Host "    $($check.Key): MISSING" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "    FAIL: Could not fetch main.tsx: $_" -ForegroundColor Red
    }
    
    # 5. Fetch the component file itself (Vite-transformed)
    Write-Host "[5] Fetching component /src/components/members/$FileName (Vite-transformed)..." -ForegroundColor Yellow
    try {
        $compContent = (Invoke-WebRequest -Uri "http://localhost:$port/src/components/members/$FileName" -UseBasicParsing -TimeoutSec 10).Content
        
        # Check for Vite transform errors
        if ($compContent -match "Internal server error|Pre-transform error|Failed to resolve import") {
            Write-Host "    FAIL: Vite transform error detected!" -ForegroundColor Red
            # Extract error message
            if ($compContent -match '(?s)(Internal server error.*?)(?:</pre>|$)') {
                $errMsg = $Matches[1].Substring(0, [Math]::Min($Matches[1].Length, 500))
                Write-Host "    Error: $errMsg" -ForegroundColor Red
            }
        } elseif ($compContent -match $ComponentName) {
            Write-Host "    Component '$ComponentName' found in transformed output" -ForegroundColor Green
        } else {
            Write-Host "    WARNING: Component name '$ComponentName' not found in output" -ForegroundColor Yellow
            Write-Host "    First 300 chars: $($compContent.Substring(0, [Math]::Min($compContent.Length, 300)))" -ForegroundColor Gray
        }

        # Check for unresolved imports (Vite would error on these)
        if ($compContent -match "does not provide an export named") {
            Write-Host "    FAIL: Missing export detected in transformed code" -ForegroundColor Red
        }
        
        $contentLen = $compContent.Length
        Write-Host "    Transformed size: $contentLen bytes" -ForegroundColor Green
    } catch {
        $errDetail = $_.Exception.Message
        Write-Host "    FAIL: Could not fetch component: $errDetail" -ForegroundColor Red
        # Try to get the error response body
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errBody = $reader.ReadToEnd()
                $reader.Close()
                if ($errBody.Length -gt 0) {
                    Write-Host "    Error body (first 500): $($errBody.Substring(0, [Math]::Min($errBody.Length, 500)))" -ForegroundColor Red
                }
            } catch {}
        }
    }
    
    # 6. Stop session
    Write-Host "[6] Stopping preview session..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/preview/stop" -Method POST -ContentType "application/json" -Body (@{sessionId=$sessionId} | ConvertTo-Json) -TimeoutSec 5
        Write-Host "    Session stopped" -ForegroundColor Green
    } catch {
        Write-Host "    WARNING: Could not stop session: $_" -ForegroundColor Yellow
    }
    
    Write-Host "TEST COMPLETE: $Name" -ForegroundColor Cyan
    return @{ success = $true; port = $port; sessionId = $sessionId }
}

# ============================================================
# TEST 1: Dashboard page (user's code - as-is)
# ============================================================

$dashboardCode = @'
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, IconButton, Chip, Avatar, Skeleton, LinearProgress, Badge, Paper, Tooltip, Button } from '@mui/material';
import { TrendingUp, TrendingDown, ArrowUpward, ArrowDownward, Refresh, Add, Info, BarChart, Timeline, PieChart, Star, Favorite } from '@mui/icons-material';

interface ScriptStatistics {
    totalScriptsGenerated: number;
    averageEngagementRate: number;
    trendingCategories: string[];
}

interface ScriptSummary {
    scriptId: string;
    title: string;
    generatedAt: Date;
    likes: number;
    views: number;
}

export function MembersDashboardPage() {
    const [statistics, setStatistics] = useState<ScriptStatistics | null>(null);
    const [recentScripts, setRecentScripts] = useState<ScriptSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const statsResponse = await fetch('/api/dashboard/statistics');
                const scriptsResponse = await fetch('/api/dashboard/recent-scripts');
                const statsData = await statsResponse.json();
                const scriptsData = await scriptsResponse.json();
                setStatistics(statsData);
                setRecentScripts(scriptsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ bgcolor: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', p: 4, mb: 3, color: 'white', borderRadius: 3 }}>
                <Typography variant="h4" gutterBottom>
                    <Dashboard style={{ verticalAlign: 'middle' }} /> Tik Tok Script Dashboard
                </Typography>
                <Typography variant="subtitle1">Track your script creation and TikTok video trends.</Typography>
            </Paper>
            <Grid container spacing={3}>
                {loading ? (
                    [0, 1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rectangular" height={120} /></Grid>
                    ))
                ) : (
                    <>
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>Scripts Generated <TrendingUp /></Typography>
                                    <Typography variant="h3" sx={{ color: '#27ae60' }}>{statistics?.totalScriptsGenerated}</Typography>
                                    <ArrowUpward sx={{ color: 'green', mr: 1 }} /> <span>5% increase</span>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>Avg Engagement <BarChart /></Typography>
                                    <Typography variant="h3" sx={{ color: '#e74c3c' }}>{statistics?.averageEngagementRate}%</Typography>
                                    <ArrowDownward sx={{ color: 'red', mr: 1 }} /> <span>3% decrease</span>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={12} md={4}>
                            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>Trending Categories <Star /></Typography>
                                    {statistics?.trendingCategories.map((category) => (
                                        <Chip key={category} label={category} color="primary" sx={{ mr: 1, mb: 1 }} />
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}
            </Grid>
            <Box mt={5}>
                <Typography variant="h6" gutterBottom><Timeline /> Recent Scripts</Typography>
                {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                ) : recentScripts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', p: 3, border: '1px dashed grey', borderRadius: 2 }}>
                        <Typography variant="body1" color="textSecondary">
                            <Info style={{ fontSize: 64 }} />
                            You have not created any tik tok script-related content yet.
                        </Typography>
                        <Button variant="contained" color="primary" sx={{ mt: 2 }}><Add /> Start Creating Script</Button>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {recentScripts.map((script) => (
                            <Grid item xs={12} md={6} key={script.scriptId}>
                                <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 3, '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}>
                                    <CardContent>
                                        <Typography variant="h5" sx={{ mb: 2 }}>{script.title} <Favorite /></Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Generated on: {new Date(script.generatedAt).toDateString()}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><Avatar sx={{ bgcolor: '#1976d2', mr: 1 }}>V</Avatar>Views: {script.views}</Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}><Avatar sx={{ bgcolor: '#e74c3c', mr: 1 }}>L</Avatar>Likes: {script.likes}</Box>
                                    </CardContent>
                                    <CardActions><Tooltip title="Regenerate Script"><IconButton color="primary"><Refresh /></IconButton></Tooltip></CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </Box>
    );
}
'@

Test-Preview -Name "Dashboard (user code - AS-IS)" -ComponentCode $dashboardCode -FileName "dashboard.tsx" -ComponentName "MembersDashboardPage"

Write-Host "`n`n" -ForegroundColor White

# ============================================================
# TEST 2: Profile page (static template)
# ============================================================

$profileCode = @'
import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, Button, TextField, Divider,
  Chip, Snackbar, Alert, Skeleton, IconButton, Tooltip, Card, CardContent,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Edit from '@mui/icons-material/Edit';
import Save from '@mui/icons-material/Save';
import Cancel from '@mui/icons-material/Cancel';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import Badge from '@mui/icons-material/Badge';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CheckCircle from '@mui/icons-material/CheckCircle';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

export function MembersProfilePage() {
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [profile, setProfile] = useState({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+1 555-0123',
    bio: 'Active tik tok script user since 2025.',
    joinDate: '2025-06-15',
    plan: 'Pro',
  });
  const [draft, setDraft] = useState({ ...profile });

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
    setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setEditing(false);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1976d2 0%, #0d5baa 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)' }}>
            {profile.firstName[0]}{profile.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>{profile.firstName} {profile.lastName}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip icon={<CheckCircle />} label={profile.plan + ' Plan'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              <Chip icon={<CalendarToday />} label={'Joined ' + new Date(profile.joinDate).toLocaleDateString()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
            </Box>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {!editing ? (
              <Button variant="contained" startIcon={<Edit />} onClick={() => setEditing(true)} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>Edit Profile</Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ bgcolor: '#4caf50' }}>Save</Button>
                <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge sx={{ color: '#1976d2' }} /> Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="First Name" value={editing ? draft.firstName : profile.firstName} onChange={e => setDraft({ ...draft, firstName: e.target.value })} disabled={!editing} size="small" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name" value={editing ? draft.lastName : profile.lastName} onChange={e => setDraft({ ...draft, lastName: e.target.value })} disabled={!editing} size="small" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={editing ? draft.email : profile.email} onChange={e => setDraft({ ...draft, email: e.target.value })} disabled={!editing} size="small" InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={editing ? draft.phone : profile.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} disabled={!editing} size="small" InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Bio" value={editing ? draft.bio : profile.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} disabled={!editing} multiline rows={3} size="small" /></Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircle sx={{ color: '#1976d2' }} /> Account Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary" variant="body2">Plan</Typography><Chip label={profile.plan} size="small" color="primary" /></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary" variant="body2">Status</Typography><Chip label="Active" size="small" color="success" /></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary" variant="body2">Member Since</Typography><Typography variant="body2" fontWeight={500}>{new Date(profile.joinDate).toLocaleDateString()}</Typography></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}><Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
}
'@

Test-Preview -Name "Profile (static template)" -ComponentCode $profileCode -FileName "profile.tsx" -ComponentName "MembersProfilePage"

Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "ALL TESTS COMPLETE" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
