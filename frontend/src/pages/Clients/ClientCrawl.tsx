import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Alert,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Settings,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  StandardIconButton,
  LoadingState,
  StandardButton,
  ModernCard,
} from '@/components/ui';
import { EnhancedClientPagesList } from '@/components/Clients/EnhancedClientPagesList';
import { StartCrawlDialog, CrawlProgressTracker } from '@/components/PageCrawl';
import { EngineSetupModal } from '@/components/Clients/EngineSetupModal';
import { EngineSetupProgressDialog } from '@/components/Clients/EngineSetupProgressDialog';
import { useClientPageCount } from '@/hooks/api/useClientPages';
import { usePageCrawlRuns } from '@/hooks/api/usePageCrawl';
import { useQueryClient } from '@tanstack/react-query';

const ClientCrawl: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: client, isLoading, error } = useClientDetail(clientId || '');
  const { data: pageCount } = useClientPageCount(clientId || '');

  // Engine setup state
  const [showEngineSetup, setShowEngineSetup] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Page crawl state
  const [showCrawlDialog, setShowCrawlDialog] = useState(false);
  const [activeCrawlRunId, setActiveCrawlRunId] = useState<string | null>(null);
  const { data: crawlRuns } = usePageCrawlRuns(clientId || '', 1);

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
        <LoadingState message="Loading crawl data..." />
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

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate(`/clients/${client.slug}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {client.name} - Website Crawl
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and monitor website crawling
            </Typography>
          </Box>
        </Box>

        {/* Crawl Management Section */}
        <Box sx={{ mb: 4 }}>
          <ModernCard variant="glass">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                  {crawlRuns && crawlRuns.length > 0 ? 'Crawl Again' : 'Start Crawl'}
                </StandardButton>
                <StandardButton
                  variant="outlined"
                  size="small"
                  startIcon={<Settings />}
                  onClick={() => setShowEngineSetup(true)}
                >
                  Reconfigure Crawl
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

            {pageCount && pageCount.total_pages > 0 && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Successfully crawled {pageCount.total_pages} pages from {client.name}.
              </Alert>
            )}

            <EnhancedClientPagesList clientId={client.id} />
          </ModernCard>
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

export default ClientCrawl;
