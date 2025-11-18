/**
 * Sitemap Tracker Runs Page
 *
 * Displays all sitemap tracker runs for a client with detailed change history
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TablePagination,
  Card,
  CardContent,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
  HourglassEmpty,
  Cancel,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail } from '@/hooks/api/useClients';
import { useTrackerRuns } from '@/hooks/api/useSitemapTracker';
import { DashboardLayout, StandardIconButton, LoadingState } from '@/components/ui';
import { SitemapChangesTable } from '@/components/SitemapTracker/SitemapChangesTable';

const SitemapTrackerRunsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const { data: client, isLoading: clientLoading, error: clientError } = useClientDetail(clientId || '');
  const { data: runsData, isLoading: runsLoading, error: runsError } = useTrackerRuns(
    clientId || '',
    page + 1, // API uses 1-based pagination
    pageSize
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    setExpandedRunId(null); // Collapse expanded run when changing pages
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
    setExpandedRunId(null);
  };

  const handleToggleExpand = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'in_progress':
        return <HourglassEmpty color="warning" />;
      case 'pending':
        return <HourglassEmpty color="disabled" />;
      default:
        return <Cancel color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'pending':
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (clientLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading client..." />
      </DashboardLayout>
    );
  }

  if (clientError || !client) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Client not found
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Sitemap Tracker History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client.name} - All tracker runs
            </Typography>
          </Box>
        </Box>

        {/* Error State */}
        {runsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load tracker runs: {(runsError as any).message || 'Unknown error'}
          </Alert>
        )}

        {/* Loading State */}
        {runsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Runs Table */}
        {!runsLoading && runsData && (
          <>
            {runsData.items.length === 0 ? (
              <Card>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No tracker runs found
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}></TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell align="center">Total URLs</TableCell>
                        <TableCell align="center">New</TableCell>
                        <TableCell align="center">Removed</TableCell>
                        <TableCell align="center">Changed</TableCell>
                        <TableCell align="center">Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {runsData.items.map((run) => (
                        <React.Fragment key={run.id}>
                          {/* Main Row */}
                          <TableRow
                            hover
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: expandedRunId === run.id
                                ? theme.palette.action.selected
                                : 'inherit',
                            }}
                            onClick={() => handleToggleExpand(run.id)}
                          >
                            {/* Expand/Collapse Icon */}
                            <TableCell>
                              <IconButton size="small">
                                {expandedRunId === run.id ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title={run.status.replace('_', ' ').toUpperCase()}>
                                  {getStatusIcon(run.status)}
                                </Tooltip>
                                <Chip
                                  label={run.status.replace('_', ' ').toUpperCase()}
                                  size="small"
                                  color={getStatusColor(run.status) as any}
                                />
                              </Box>
                            </TableCell>

                            {/* Started */}
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(run.started_at || run.created_at)}
                              </Typography>
                            </TableCell>

                            {/* Completed */}
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(run.completed_at)}
                              </Typography>
                            </TableCell>

                            {/* Total URLs */}
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {run.total_urls_in_sitemap || 0}
                              </Typography>
                            </TableCell>

                            {/* New URLs */}
                            <TableCell align="center">
                              <Chip
                                label={run.new_urls_count || 0}
                                size="small"
                                color={run.new_urls_count > 0 ? 'success' : 'default'}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>

                            {/* Removed URLs */}
                            <TableCell align="center">
                              <Chip
                                label={run.removed_urls_count || 0}
                                size="small"
                                color={run.removed_urls_count > 0 ? 'error' : 'default'}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>

                            {/* Status Changes */}
                            <TableCell align="center">
                              <Chip
                                label={run.status_code_changes_count || 0}
                                size="small"
                                color={run.status_code_changes_count > 0 ? 'warning' : 'default'}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>

                            {/* Duration */}
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary">
                                {formatDuration(run.execution_time_seconds)}
                              </Typography>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row - Changes Table */}
                          <TableRow>
                            <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                              <Collapse in={expandedRunId === run.id} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
                                  {/* Run Details */}
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                      Run Details
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          Sitemap URL
                                        </Typography>
                                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                          {run.sitemap_url}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          Frequency
                                        </Typography>
                                        <Typography variant="body2">
                                          {run.schedule_frequency.replace('_', ' ').toUpperCase()}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          Avg Response Time
                                        </Typography>
                                        <Typography variant="body2">
                                          {run.average_response_time_ms
                                            ? `${run.average_response_time_ms.toFixed(0)} ms`
                                            : 'N/A'}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    {/* Error Message */}
                                    {run.status === 'failed' && run.error_message && (
                                      <Alert severity="error" sx={{ mt: 2 }}>
                                        {run.error_message}
                                      </Alert>
                                    )}
                                  </Box>

                                  {/* Changes Table */}
                                  {run.status === 'completed' && (
                                    <>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                        Detected Changes
                                      </Typography>
                                      <SitemapChangesTable runId={run.id} compact={false} />
                                    </>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                  component="div"
                  count={runsData.total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={pageSize}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 20, 50]}
                />
              </Card>
            )}
          </>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default SitemapTrackerRunsPage;
