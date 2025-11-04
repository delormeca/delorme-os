import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  Folder,
  CalendarToday,
  Edit,
  Delete,
  Language,
  Description,
  PlayArrow,
  Stop,
  Add,
  Refresh,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CloudDownload,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectDetail, useDeleteProject } from '@/hooks/api/useProjects';
import {
  useStartCrawl,
  useCrawlJobStatus,
  useProjectPages,
  useProjectCrawlJobs,
  useAddManualPage,
  useCancelCrawl,
  type PageDetail,
} from '@/hooks/api/useCrawling';
import {
  DashboardLayout,
  ModernCard,
  StandardIconButton,
  LoadingState,
  StandardButton,
  EmptyState,
} from '@/components/ui';
import { useConfirm } from 'material-ui-confirm';
import { useQueryClient } from '@tanstack/react-query';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // State
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  // Hooks
  const { data: project, isLoading: isLoadingProject, error } = useProjectDetail(projectId || '');
  const { data: pages, refetch: refetchPages } = useProjectPages(projectId);
  const { data: crawlJobs } = useProjectCrawlJobs(projectId);
  const { mutateAsync: deleteProject } = useDeleteProject();
  const startCrawl = useStartCrawl();
  const addManualPage = useAddManualPage();
  const cancelCrawl = useCancelCrawl();

  // Poll crawl status when job is running
  const { data: crawlStatus } = useCrawlJobStatus(
    currentJobId,
    !!currentJobId
  );

  // Update currentJobId when crawl starts
  useEffect(() => {
    if (startCrawl.data?.crawl_job_id) {
      setCurrentJobId(startCrawl.data.crawl_job_id);
    }
  }, [startCrawl.data]);

  // Set current job from latest crawl job
  useEffect(() => {
    if (crawlJobs && crawlJobs.length > 0 && !currentJobId) {
      const latestJob = crawlJobs[0];
      if (latestJob.status === 'running') {
        setCurrentJobId(latestJob.id);
      }
    }
  }, [crawlJobs, currentJobId]);

  // Refresh pages when crawl completes
  useEffect(() => {
    if (crawlStatus?.status === 'completed') {
      refetchPages();
      // Clear job after 5 seconds
      setTimeout(() => setCurrentJobId(null), 5000);
    }
  }, [crawlStatus?.status, refetchPages]);

  const handleDelete = async () => {
    if (!project) return;

    const result = await confirm({
      description: `Are you sure you want to delete "${project.name}"? This will also delete all associated pages and data.`,
      title: 'Delete Project',
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
    });

    if (result.confirmed) {
      await deleteProject(project.id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/clients/${project.client_id}`);
    }
  };

  const handleStartCrawl = () => {
    if (projectId) {
      startCrawl.mutate(projectId);
    }
  };

  const handleCancelCrawl = () => {
    if (currentJobId) {
      cancelCrawl.mutate(currentJobId);
      setCurrentJobId(null);
    }
  };

  const handleAddManualPage = () => {
    if (projectId && manualUrl) {
      addManualPage.mutate(
        { projectId, url: manualUrl },
        {
          onSuccess: () => {
            setShowManualAdd(false);
            setManualUrl('');
            refetchPages();
          }
        }
      );
    }
  };

  const isRunning = crawlStatus?.status === 'running';

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'crawled':
        return 'success';
      case 'crawling':
      case 'testing':
        return 'primary';
      case 'discovered':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoadingProject) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading project..." />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Project not found
          </Typography>
          <StandardButton
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/clients')}
          >
            Back to Clients
          </StandardButton>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate(`/clients/${project.client_id}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project Details
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <StandardButton
              variant="contained"
              startIcon={<CloudDownload />}
              onClick={() => navigate(`/projects/${project.id}/crawling`)}
              size="small"
            >
              Pages & Content
            </StandardButton>
            <StandardButton
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/projects/${project.id}/edit`)}
              size="small"
            >
              Edit
            </StandardButton>
            <StandardButton
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
              size="small"
            >
              Delete
            </StandardButton>
          </Stack>
        </Box>

        {/* Project Information Card */}
        <ModernCard variant="glass" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'start', gap: 3 }}>
            <Folder
              sx={{
                fontSize: 64,
                color: theme.palette.primary.main,
                opacity: 0.8,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {project.name}
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Website URL
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Language sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      component="a"
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {project.url}
                    </Typography>
                  </Box>
                </Box>

                {project.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {project.description}
                    </Typography>
                  </Box>
                )}

                {project.sitemap_url && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Sitemap URL
                    </Typography>
                    <Typography
                      variant="body2"
                      component="a"
                      href={project.sitemap_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        display: 'block',
                        mt: 0.5,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {project.sitemap_url}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Created
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarToday sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formatDateShort(project.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </ModernCard>

        {/* Crawl Controls */}
        <Box sx={{ display: 'flex', gap: 2, my: 3 }}>
          <StandardButton
            variant="contained"
            startIcon={isRunning ? <Stop /> : <PlayArrow />}
            onClick={isRunning ? handleCancelCrawl : handleStartCrawl}
            disabled={startCrawl.isPending}
            color={isRunning ? 'error' : 'primary'}
          >
            {isRunning ? 'Stop Crawl' : 'Start Smart Crawl'}
          </StandardButton>

          <StandardButton
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setShowManualAdd(true)}
          >
            Add Page Manually
          </StandardButton>

          <StandardButton
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetchPages()}
          >
            Refresh Pages
          </StandardButton>
        </Box>

        {/* Crawl Status Card */}
        {crawlStatus && (
          <ModernCard variant="glass" sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Crawl Status
              </Typography>
              <Chip
                label={crawlStatus.status.toUpperCase()}
                color={
                  crawlStatus.status === 'completed' ? 'success' :
                  crawlStatus.status === 'failed' ? 'error' :
                  crawlStatus.status === 'running' ? 'primary' : 'default'
                }
              />
            </Box>

            {isRunning && (
              <>
                <Typography variant="body2" gutterBottom>
                  Phase: {crawlStatus.phase}
                </Typography>

                {crawlStatus.phase === 'discovering' && (
                  <Typography variant="body2">
                    Discovering page URLs from {crawlStatus.discovery_method || 'sitemap'}...
                  </Typography>
                )}

                {crawlStatus.phase === 'testing' && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Testing extraction methods on sample pages...
                    </Typography>
                    {crawlStatus.test_results && (
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(crawlStatus.test_results).map(([method, result]: [string, any]) => (
                          <Chip
                            key={method}
                            label={`${method}: ${result.total_score?.toFixed(1) || 0}`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}

                {crawlStatus.phase === 'extracting' && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Extracting content with: {crawlStatus.winning_method}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={crawlStatus.progress_percentage}
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="body2">
                        {Math.round(crawlStatus.progress_percentage)}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {crawlStatus.pages_crawled} / {crawlStatus.pages_total} pages
                      {crawlStatus.pages_failed > 0 && ` (${crawlStatus.pages_failed} failed)`}
                    </Typography>
                  </>
                )}
              </>
            )}

            {crawlStatus.status === 'completed' && (
              <Alert severity="success">
                Crawl completed! {crawlStatus.pages_crawled} pages extracted successfully.
                {crawlStatus.pages_failed > 0 && ` (${crawlStatus.pages_failed} failed)`}
              </Alert>
            )}

            {crawlStatus.status === 'failed' && (
              <Alert severity="error">
                Crawl failed: {crawlStatus.error_message}
              </Alert>
            )}
          </ModernCard>
        )}

        {/* Pages Section */}
        <Box>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Pages {pages && `(${pages.length})`}
            </Typography>
          </Box>

          {!pages || pages.length === 0 ? (
            <Paper sx={{ p: 6 }}>
              <EmptyState
                title="No pages yet"
                description="Click 'Start Smart Crawl' to discover and extract pages from the website"
              />
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50} />
                    <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                      Method
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                      Last Crawled
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page) => (
                    <PageRow key={page.id} page={page} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Manual Add Dialog */}
        <Dialog open={showManualAdd} onClose={() => setShowManualAdd(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Page Manually</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Page URL"
              type="url"
              fullWidth
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://example.com/page"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <StandardButton onClick={() => setShowManualAdd(false)}>
              Cancel
            </StandardButton>
            <StandardButton
              onClick={handleAddManualPage}
              variant="contained"
              disabled={!manualUrl}
            >
              Add Page
            </StandardButton>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

// Expandable Page Row Component
interface PageRowProps {
  page: PageDetail;
}

const PageRow: React.FC<PageRowProps> = ({ page }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'crawled':
        return 'success';
      case 'crawling':
      case 'testing':
        return 'primary';
      case 'discovered':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            disabled={!page.page_data || page.page_data.length === 0}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
            <Typography
              variant="body2"
              sx={{
                maxWidth: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {page.url}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {page.slug}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={page.status}
            color={getStatusColor(page.status)}
            size="small"
          />
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
          <Typography variant="body2" color="text.secondary">
            {page.extraction_method || '-'}
          </Typography>
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(page.last_crawled_at)}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 2, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
              <Typography variant="subtitle2" gutterBottom>
                Extracted Data
              </Typography>
              {page.page_data && page.page_data.length > 0 ? (
                <Stack spacing={2}>
                  {page.page_data.map((data) => (
                    <Paper key={data.id} sx={{ p: 2 }} variant="outlined">
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                        {data.data_type.toUpperCase()}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          backgroundColor: 'background.paper',
                          borderRadius: 1,
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                          }}
                        >
                          {JSON.stringify(data.content, null, 2)}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No extracted data available yet. Data will appear here after the page is crawled.
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ProjectDetail;
