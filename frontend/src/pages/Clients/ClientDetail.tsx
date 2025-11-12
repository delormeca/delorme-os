import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  useTheme,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  CalendarToday,
  Edit,
  Delete,
  Add,
  Settings,
  Warning,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail, useDeleteClient } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  ModernCard,
  StandardIconButton,
  LoadingState,
  StandardButton,
} from '@/components/ui';
import { ProjectsList } from '@/components/Projects/ProjectsList';
import { EngineSetupModal } from '@/components/Clients/EngineSetupModal';
import { EngineSetupProgressDialog } from '@/components/Clients/EngineSetupProgressDialog';
import { EnhancedClientPagesList } from '@/components/Clients/EnhancedClientPagesList';
import { StartCrawlDialog, CrawlProgressTracker } from '@/components/PageCrawl';
import { useClientPageCount } from '@/hooks/api/useClientPages';
import { usePageCrawlRuns } from '@/hooks/api/usePageCrawl';
import { useConfirm } from 'material-ui-confirm';
import { useQueryClient } from '@tanstack/react-query';

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { data: client, isLoading, error } = useClientDetail(clientId || '');
  const { mutateAsync: deleteClient } = useDeleteClient();
  const { data: pageCount } = useClientPageCount(clientId || '');

  // Debug logging
  React.useEffect(() => {
    if (pageCount) {
      console.log('Page count data:', pageCount);
    }
    if (client) {
      console.log('Client data:', client);
    }
  }, [pageCount, client]);

  // Engine setup state
  const [showEngineSetup, setShowEngineSetup] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Page crawl state
  const [showCrawlDialog, setShowCrawlDialog] = useState(false);
  const [activeCrawlRunId, setActiveCrawlRunId] = useState<string | null>(null);
  const { data: crawlRuns } = usePageCrawlRuns(clientId || '', 1);

  const handleDelete = async () => {
    if (!client) return;

    const result = await confirm({
      description: `Are you sure you want to delete "${client.name}"? This will also delete all associated projects and data.`,
      title: 'Delete Client',
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
    });

    if (result.confirmed) {
      await deleteClient({ clientId: client.id, password: '' });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    }
  };

  const handleSetupStarted = (runId: string) => {
    setCurrentRunId(runId);
    setShowEngineSetup(false);
    setShowProgress(true);
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setCurrentRunId(null);
    // Refresh client data
    queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
  };

  const handleCrawlStarted = (crawlRunId: string) => {
    setActiveCrawlRunId(crawlRunId);
    setShowCrawlDialog(false);
  };

  const handleCrawlComplete = () => {
    setActiveCrawlRunId(null);
    // Refresh pages list
    queryClient.invalidateQueries({ queryKey: ['client-pages', clientId] });
    queryClient.invalidateQueries({ queryKey: ['page-crawl-runs', clientId] });
  };

  // Check if there's an active crawl on mount
  React.useEffect(() => {
    if (crawlRuns && crawlRuns.length > 0) {
      const latestRun = crawlRuns[0];
      if (latestRun.status === 'in_progress' || latestRun.status === 'pending') {
        setActiveCrawlRunId(latestRun.id);
      }
    }
  }, [crawlRuns]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading client..." />
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Client not found
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate('/clients')}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Client Details
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <StandardButton
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/clients/${client.id}/edit`)}
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

        {/* Client Information Card */}
        <ModernCard variant="glass" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'start', gap: 3 }}>
            <Business
              sx={{
                fontSize: 64,
                color: theme.palette.primary.main,
                opacity: 0.8,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {client.name}
              </Typography>

              <Stack spacing={2}>
                {client.industry && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Industry
                    </Typography>
                    <Typography variant="body1">
                      {client.industry}
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
                      {formatDate(client.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </ModernCard>

        {/* Engine Setup Section */}
        <Box sx={{ mb: 4 }}>
          {!client.engine_setup_completed ? (
            <ModernCard sx={{ textAlign: 'center', py: 6 }}>
              <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Website Engine Setup Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure the Website Engine to discover and import pages from this client's website.
              </Typography>
              <StandardButton
                variant="contained"
                startIcon={<Settings />}
                onClick={() => setShowEngineSetup(true)}
              >
                Setup Website Engine
              </StandardButton>
            </ModernCard>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Pages ({pageCount?.total_pages || 0})
                </Typography>
                <Stack direction="row" spacing={1}>
                  <StandardButton
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setShowCrawlDialog(true)}
                    disabled={!!activeCrawlRunId}
                  >
                    Start Data Extraction
                  </StandardButton>
                  <StandardButton
                    variant="outlined"
                    size="small"
                    startIcon={<Settings />}
                    onClick={() => setShowEngineSetup(true)}
                  >
                    Re-run Setup
                  </StandardButton>
                </Stack>
              </Box>

              {/* Active Crawl Progress */}
              {activeCrawlRunId && (
                <CrawlProgressTracker
                  crawlRunId={activeCrawlRunId}
                  onComplete={handleCrawlComplete}
                />
              )}

              <Alert severity="success" sx={{ mb: 2 }}>
                Engine setup completed! {pageCount?.total_pages || 0} pages discovered.
              </Alert>
              <EnhancedClientPagesList clientId={client.id} />
            </Box>
          )}
        </Box>

        {/* Projects Section */}
        <Box>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Projects
            </Typography>
            <StandardButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate(`/clients/${client.id}/projects/new`)}
            >
              Add Project
            </StandardButton>
          </Box>

          <ProjectsList clientId={client.id} showCreateButton={false} />
        </Box>

        {/* Engine Setup Modal */}
        <EngineSetupModal
          open={showEngineSetup}
          onClose={() => setShowEngineSetup(false)}
          clientId={client.id}
          clientName={client.name}
          defaultSitemapUrl={client.sitemap_url || undefined}
          onSetupStarted={handleSetupStarted}
        />

        {/* Engine Setup Progress Dialog */}
        <EngineSetupProgressDialog
          open={showProgress}
          onClose={handleProgressClose}
          runId={currentRunId}
          clientId={client.id}
        />

        {/* Page Crawl Dialog */}
        <StartCrawlDialog
          open={showCrawlDialog}
          onClose={() => setShowCrawlDialog(false)}
          clientId={client.id}
          onCrawlStarted={handleCrawlStarted}
        />
      </Box>
    </DashboardLayout>
  );
};

export default ClientDetail;
