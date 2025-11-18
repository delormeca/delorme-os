import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  Settings,
  PlayArrow,
  History,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useConfigureSitemapTracker,
  useStartTrackerRun,
  useExecuteTrackerRun,
  useTrackerDashboard,
  SitemapTrackerConfigUpdate,
} from '@/hooks/api/useSitemapTracker';
import { ModernCard, StandardButton } from '@/components/ui';
import { useTheme } from '@mui/material';
import { SitemapChangesTable } from '@/components/SitemapTracker/SitemapChangesTable';

interface SitemapTrackerCardProps {
  clientId: string;
  client: any; // Client data with sitemap_url, sitemap_tracking_frequency, sitemap_tracker_enabled, sitemap_tracker_configured
}

export const SitemapTrackerCard: React.FC<SitemapTrackerCardProps> = ({ clientId, client }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // API hooks
  const configureMutation = useConfigureSitemapTracker();
  const startRunMutation = useStartTrackerRun();
  const executeRunMutation = useExecuteTrackerRun();
  const { data: dashboard, isLoading: dashboardLoading } = useTrackerDashboard(clientId);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SitemapTrackerConfigUpdate>({
    sitemap_url: client.sitemap_url || '',
    tracking_frequency: client.sitemap_tracking_frequency || 'weekly',
    enabled: client.sitemap_tracker_enabled ?? true,
  });

  // Handle configuration save
  const handleSave = async () => {
    await configureMutation.mutateAsync({
      clientId,
      config: formData,
    });
    setDialogOpen(false);
  };

  // Handle manual run
  const handleRunNow = async () => {
    // Step 1: Create the tracker run (returns pending run with ID)
    const createdRun = await startRunMutation.mutateAsync({
      clientId,
      data: { run_type: 'manual' },
    });

    // Step 2: Execute the run (actually performs sitemap parsing)
    await executeRunMutation.mutateAsync(createdRun.id);
  };

  // Handle navigation
  const handleViewHistory = () => {
    navigate(`/clients/${clientId}/sitemap-tracker/runs`);
  };

  // Open dialog with current values
  const handleConfigureClick = () => {
    setFormData({
      sitemap_url: client.sitemap_url || '',
      tracking_frequency: client.sitemap_tracking_frequency || 'weekly',
      enabled: client.sitemap_tracker_enabled ?? true,
    });
    setDialogOpen(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'failed':
        return 'error';
      case 'pending':
      default:
        return 'default';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format frequency label
  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'bi-monthly': 'Bi-Monthly',
      'monthly': 'Monthly',
      'manual-only': 'Manual Only',
    };
    return labels[frequency] || frequency;
  };

  const isConfigured = client.sitemap_tracker_configured;
  const latestRun = dashboard?.latest_run;

  return (
    <>
      <ModernCard variant="glass">
        <CardHeader
          title="Sitemap Tracker"
          subheader={
            isConfigured ? (
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={getFrequencyLabel(client.sitemap_tracking_frequency || 'weekly')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={client.sitemap_tracker_enabled ? 'Enabled' : 'Disabled'}
                  size="small"
                  color={client.sitemap_tracker_enabled ? 'success' : 'default'}
                />
              </Box>
            ) : (
              'Configure your sitemap URL to start tracking'
            )
          }
          action={
            <Box sx={{ position: 'relative', zIndex: 1300 }}>
              <StandardButton
                variant="outlined"
                size="small"
                startIcon={<Settings />}
                onClick={handleConfigureClick}
                sx={{ position: 'relative', zIndex: 1300 }}
              >
                Configure
              </StandardButton>
            </Box>
          }
        />

        <CardContent>
          {!isConfigured ? (
            // Configuration Prompt
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Configure Sitemap Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your sitemap URL to start tracking changes automatically
              </Typography>
              <StandardButton
                variant="contained"
                startIcon={<Settings />}
                onClick={handleConfigureClick}
              >
                Configure Now
              </StandardButton>
            </Box>
          ) : (
            // Status Section
            <Stack spacing={2}>
              {/* Current Configuration */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sitemap URL
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', mt: 0.5 }}>
                  {client.sitemap_url || 'Not configured'}
                </Typography>
              </Box>

              {/* Latest Run Summary */}
              {latestRun && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Latest Run
                    </Typography>

                    <Stack spacing={1.5}>
                      {/* Status and Time */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={latestRun.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(latestRun.status)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {latestRun.status === 'completed' && latestRun.completed_at
                            ? formatTimestamp(latestRun.completed_at)
                            : latestRun.status === 'in_progress'
                            ? 'In Progress...'
                            : formatTimestamp(latestRun.created_at)}
                        </Typography>
                      </Box>

                      {/* Progress Bar for In Progress */}
                      {latestRun.status === 'in_progress' && (
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={latestRun.progress_percentage || 0}
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {latestRun.progress_percentage || 0}% Complete
                            {latestRun.current_status_message && ` - ${latestRun.current_status_message}`}
                          </Typography>
                        </Box>
                      )}

                      {/* Statistics */}
                      {latestRun.status === 'completed' && (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 1.5,
                            mt: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Total URLs
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {latestRun.total_urls_in_sitemap || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              New URLs
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {latestRun.new_urls_count || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Removed URLs
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                              {latestRun.removed_urls_count || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Status Changes
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {latestRun.status_code_changes_count || 0}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Error Message */}
                      {latestRun.status === 'failed' && latestRun.error_message && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {latestRun.error_message}
                        </Alert>
                      )}

                      {/* Recent Changes Table */}
                      {latestRun.status === 'completed' && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                              Recent Changes
                            </Typography>
                            <SitemapChangesTable
                              runId={latestRun.id}
                              compact={true}
                              maxRows={10}
                            />
                          </Box>
                        </>
                      )}
                    </Stack>
                  </Box>
                </>
              )}

              {/* No runs yet */}
              {!latestRun && !dashboardLoading && (
                <Alert severity="info">
                  No tracker runs yet. Click "Run Now" to start your first sitemap tracking run.
                </Alert>
              )}

              {/* Loading state */}
              {dashboardLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Stack>
          )}
        </CardContent>

        {isConfigured && (
          <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
            <StandardButton
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              onClick={handleRunNow}
              disabled={
                startRunMutation.isPending ||
                executeRunMutation.isPending ||
                latestRun?.status === 'in_progress' ||
                latestRun?.status === 'pending'
              }
            >
              {startRunMutation.isPending || executeRunMutation.isPending ? 'Starting...' : 'Run Now'}
            </StandardButton>
            <StandardButton
              variant="outlined"
              size="small"
              startIcon={<History />}
              onClick={handleViewHistory}
            >
              View History
            </StandardButton>
          </CardActions>
        )}
      </ModernCard>

      {/* Configuration Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Sitemap Tracker</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Sitemap URL"
              fullWidth
              value={formData.sitemap_url || ''}
              onChange={(e) =>
                setFormData({ ...formData, sitemap_url: e.target.value })
              }
              placeholder="https://example.com/sitemap.xml"
              helperText="Enter the full URL of your sitemap.xml file"
            />

            <FormControl fullWidth>
              <InputLabel id="frequency-label">Tracking Frequency</InputLabel>
              <Select
                labelId="frequency-label"
                label="Tracking Frequency"
                value={formData.tracking_frequency || 'weekly'}
                onChange={(e) =>
                  setFormData({ ...formData, tracking_frequency: e.target.value })
                }
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="bi-monthly">Bi-Monthly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="manual-only">Manual Only</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  color="primary"
                />
              }
              label="Enable Automatic Tracking"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={configureMutation.isPending}>
            Cancel
          </Button>
          <StandardButton
            variant="contained"
            onClick={handleSave}
            disabled={configureMutation.isPending || !formData.sitemap_url}
          >
            {configureMutation.isPending ? 'Saving...' : 'Save'}
          </StandardButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
