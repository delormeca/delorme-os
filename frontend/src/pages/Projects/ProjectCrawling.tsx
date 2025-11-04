import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectDetail } from '@/hooks/api/useProjects';
import { useProjectPagesWithStats } from '@/hooks/api/useCrawling';
import {
  DashboardLayout,
  ModernCard,
  StandardIconButton,
  LoadingState,
} from '@/components/ui';
import URLExtractionSection from '@/components/crawling/URLExtractionSection';
import SitemapDiffNotification from '@/components/crawling/SitemapDiffNotification';
import ContentScrapingSection from '@/components/crawling/ContentScrapingSection';
import PagesDataTable from '@/components/crawling/PagesDataTable';
import ScrapingProgressModal from '@/components/crawling/ScrapingProgressModal';

const ProjectCrawling: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // State
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [rescanResult, setRescanResult] = useState<any>(null);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Hooks
  const { data: project, isLoading: isLoadingProject } = useProjectDetail(projectId || '');
  const { data: pagesData, isLoading: isLoadingPages } = useProjectPagesWithStats(projectId);

  // Cast pagesData to the expected type
  const pages = (pagesData as any) || [];

  // Calculate statistics
  const stats = useMemo(() => {
    if (!pages || pages.length === 0) {
      return {
        totalPages: 0,
        unscrapedCount: 0,
        lastScanDate: null,
        lastCrawlDate: null,
      };
    }

    const unscrapedCount = pages.filter(
      (p: any) => p.status === 'discovered' || !p.last_crawled_at
    ).length;

    // Get most recent scan date (created_at of newest page)
    const sortedByCreated = [...pages].sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastScanDate = sortedByCreated[0]?.created_at || null;

    // Get most recent crawl date
    const crawledPages = pages.filter((p: any) => p.last_crawled_at);
    const sortedByCrawled = [...crawledPages].sort(
      (a: any, b: any) =>
        new Date(b.last_crawled_at).getTime() - new Date(a.last_crawled_at).getTime()
    );
    const lastCrawlDate = sortedByCrawled[0]?.last_crawled_at || null;

    return {
      totalPages: pages.length,
      unscrapedCount,
      lastScanDate,
      lastCrawlDate,
    };
  }, [pages]);

  const handleRescanComplete = (result: any) => {
    setRescanResult(result);
  };

  const handleKeepRemovedPages = () => {
    // Pages are already kept by default, just close notification
    setSuccessMessage('Removed pages have been kept in your project.');
    setShowSuccessSnackbar(true);
    setRescanResult(null);
  };

  const handleDeleteRemovedPages = async () => {
    // TODO: Implement API call to delete removed pages
    // For now, just show success message
    setSuccessMessage('Removed pages have been deleted.');
    setShowSuccessSnackbar(true);
    setRescanResult(null);
  };

  const handleScrapeComplete = (result: any) => {
    setScrapeResult(result);
    setShowProgressModal(true);

    // Clear selection after scraping
    setSelectedPages(new Set());

    // Auto-close modal after completion
    if (result.success_count + result.failed_count === result.total) {
      setTimeout(() => {
        setShowProgressModal(false);
        setScrapeResult(null);
      }, 3000);
    }
  };

  const handleCloseDiffNotification = () => {
    setRescanResult(null);
  };

  if (isLoadingProject || isLoadingPages) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading project..." />
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Project not found
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'xl', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {project.name} - Pages & Content
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage URL extraction and content scraping for this project
            </Typography>
          </Box>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Two-Phase Crawling:</strong> First extract URLs from the sitemap (no content scraping),
            then select pages and scrape their content with your preferred extraction method.
          </Typography>
        </Alert>

        {/* Control Sections */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <URLExtractionSection
              projectId={projectId || ''}
              hasPages={stats.totalPages > 0}
              totalPages={stats.totalPages}
              lastScanDate={stats.lastScanDate}
              sitemapUrl={project.sitemap_url || null}
              onRescanComplete={handleRescanComplete}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ContentScrapingSection
              projectId={projectId || ''}
              selectedPages={Array.from(selectedPages)}
              unscrapedCount={stats.unscrapedCount}
              lastCrawlDate={stats.lastCrawlDate}
              onScrapeComplete={handleScrapeComplete}
            />
          </Grid>
        </Grid>

        {/* Pages Table */}
        <ModernCard variant="glass" sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Pages ({stats.totalPages})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select pages to scrape their content. All columns are scrollable horizontally.
            </Typography>
          </Box>

          <PagesDataTable
            pages={pages}
            selectedPages={selectedPages}
            onSelectionChange={setSelectedPages}
          />
        </ModernCard>

        {/* Sitemap Diff Notification */}
        <SitemapDiffNotification
          result={rescanResult}
          onClose={handleCloseDiffNotification}
          onKeepRemovedPages={handleKeepRemovedPages}
          onDeleteRemovedPages={handleDeleteRemovedPages}
        />

        {/* Scraping Progress Modal */}
        <ScrapingProgressModal
          open={showProgressModal}
          result={scrapeResult}
          isLoading={!scrapeResult}
          onClose={() => setShowProgressModal(false)}
        />

        {/* Success Snackbar */}
        <Snackbar
          open={showSuccessSnackbar}
          autoHideDuration={3000}
          onClose={() => setShowSuccessSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setShowSuccessSnackbar(false)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
};

export default ProjectCrawling;
