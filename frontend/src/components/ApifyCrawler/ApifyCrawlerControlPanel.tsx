/**
 * Apify Crawler Control Panel
 *
 * Provides START/STOP/PAUSE controls for Apify crawls with real-time status monitoring.
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  useTheme,
  Collapse,
  IconButton,
  Tooltip,
  TextField,
  FormControlLabel,
  Switch,
  alpha,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  Refresh,
  ExpandMore,
  ExpandLess,
  CloudDownload,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  Timeline,
} from '@mui/icons-material';
import { ModernCard, StandardButton } from '@/components/ui';
import {
  useStartCrawl,
  useStopCrawl,
  usePauseCrawl,
  useCrawlStatus,
  useProcessCrawl,
} from '@/hooks/api/useCrawler';
import { CrawlStartRequest } from '@/client';

interface ApifyCrawlerControlPanelProps {
  clientId: string;
  clientName: string;
  baseUrl?: string;
}

export const ApifyCrawlerControlPanel: React.FC<ApifyCrawlerControlPanelProps> = ({
  clientId,
  clientName,
  baseUrl,
}) => {
  const theme = useTheme();

  // State
  const [expanded, setExpanded] = useState(false);
  const [activeCrawlRunId, setActiveCrawlRunId] = useState<string | null>(null);
  const [customUrls, setCustomUrls] = useState<string>('');
  const [maxDepth, setMaxDepth] = useState(0);
  const [saveHtml, setSaveHtml] = useState(true);
  const [saveMarkdown, setSaveMarkdown] = useState(true);
  const [saveScreenshots, setSaveScreenshots] = useState(true);

  // API Hooks
  const { mutate: startCrawl, isPending: isStarting } = useStartCrawl();
  const { mutate: stopCrawl, isPending: isStopping } = useStopCrawl();
  const { mutate: pauseCrawl, isPending: isPausing } = usePauseCrawl();
  const { mutate: processCrawl, isPending: isProcessing } = useProcessCrawl();

  // Status monitoring (with automatic polling for active crawls)
  const { data: status, isLoading: isLoadingStatus } = useCrawlStatus(activeCrawlRunId || '', {
    enabled: !!activeCrawlRunId,
  });

  // Determine if crawl is active
  const isActive = status && ['READY', 'RUNNING', 'starting'].includes(status.status);

  // Calculate progress percentage
  const progressPercent = status?.total_pages && status?.total_pages > 0
    ? (status.pages_crawled / status.total_pages) * 100
    : 0;

  // Status color mapping
  const getStatusColor = (statusValue?: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    if (!statusValue) return 'default';
    switch (statusValue) {
      case 'RUNNING':
        return 'primary';
      case 'SUCCEEDED':
        return 'success';
      case 'FAILED':
      case 'ABORTED':
        return 'error';
      case 'READY':
      case 'starting':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Status icon mapping
  const getStatusIcon = (statusValue?: string): React.ReactElement | undefined => {
    if (!statusValue) return undefined;
    switch (statusValue) {
      case 'RUNNING':
        return <Timeline />;
      case 'SUCCEEDED':
        return <CheckCircle />;
      case 'FAILED':
      case 'ABORTED':
        return <ErrorIcon />;
      case 'READY':
      case 'starting':
        return <HourglassEmpty />;
      default:
        return undefined;
    }
  };

  // Handle start crawl
  const handleStartCrawl = () => {
    // Parse custom URLs if provided
    const urls = customUrls.trim()
      ? customUrls.split('\n').map(u => u.trim()).filter(Boolean)
      : baseUrl
      ? [baseUrl]
      : undefined;

    if (!urls || urls.length === 0) {
      alert('Please provide at least one URL to crawl');
      return;
    }

    const crawlData: CrawlStartRequest = {
      client_id: clientId,
      urls,
      max_depth: maxDepth,
      save_html: saveHtml,
      save_markdown: saveMarkdown,
      save_screenshots: saveScreenshots,
    };

    startCrawl(
      { clientId, data: crawlData },
      {
        onSuccess: (response) => {
          setActiveCrawlRunId(response.id);
          setCustomUrls(''); // Clear custom URLs after starting
        },
      }
    );
  };

  // Handle stop crawl
  const handleStopCrawl = () => {
    if (activeCrawlRunId) {
      stopCrawl(activeCrawlRunId, {
        onSuccess: () => {
          setTimeout(() => setActiveCrawlRunId(null), 2000);
        },
      });
    }
  };

  // Handle pause crawl
  const handlePauseCrawl = () => {
    if (activeCrawlRunId) {
      pauseCrawl(activeCrawlRunId, {
        onSuccess: () => {
          setTimeout(() => setActiveCrawlRunId(null), 2000);
        },
      });
    }
  };

  // Handle process results
  const handleProcessResults = () => {
    if (activeCrawlRunId) {
      processCrawl({
        crawlRunId: activeCrawlRunId,
        generateEmbeddings: true,
        calculateSimilarity: true,
      });
    }
  };

  return (
    <ModernCard variant="glass">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Apify Website Crawler
          </Typography>
          {status && (
            <Chip
              icon={getStatusIcon(status.status)}
              label={status.status}
              color={getStatusColor(status.status)}
              size="small"
            />
          )}
        </Box>
        <IconButton onClick={() => setExpanded(!expanded)} size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Status Display */}
      {status && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Pages: {status.pages_crawled} / {status.total_pages}
            </Typography>
            {status.pages_failed > 0 && (
              <Typography variant="body2" color="error">
                Failed: {status.pages_failed}
              </Typography>
            )}
          </Stack>

          {isActive && (
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
          )}
        </Box>
      )}

      {/* Control Buttons */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {!isActive ? (
          <StandardButton
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStartCrawl}
            disabled={isStarting || !baseUrl}
            size="small"
          >
            {isStarting ? 'Starting...' : 'Start Crawl'}
          </StandardButton>
        ) : (
          <>
            <Tooltip title="Stop crawl immediately">
              <StandardButton
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStopCrawl}
                disabled={isStopping}
                size="small"
              >
                {isStopping ? 'Stopping...' : 'Stop'}
              </StandardButton>
            </Tooltip>
            <Tooltip title="Pause crawl gracefully">
              <StandardButton
                variant="outlined"
                startIcon={<Pause />}
                onClick={handlePauseCrawl}
                disabled={isPausing}
                size="small"
              >
                {isPausing ? 'Pausing...' : 'Pause'}
              </StandardButton>
            </Tooltip>
          </>
        )}

        {status?.status === 'SUCCEEDED' && (
          <StandardButton
            variant="contained"
            color="success"
            startIcon={<CloudDownload />}
            onClick={handleProcessResults}
            disabled={isProcessing}
            size="small"
          >
            {isProcessing ? 'Processing...' : 'Process Results'}
          </StandardButton>
        )}

        {activeCrawlRunId && (
          <Tooltip title="Refresh status">
            <IconButton
              onClick={() => {
                // Force refetch by setting to null and back
                const currentId = activeCrawlRunId;
                setActiveCrawlRunId(null);
                setTimeout(() => setActiveCrawlRunId(currentId), 100);
              }}
              size="small"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Advanced Settings (Collapsible) */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Crawl Configuration
          </Typography>

          <Stack spacing={2}>
            {/* Custom URLs */}
            <TextField
              label="Custom URLs (one per line)"
              multiline
              rows={3}
              value={customUrls}
              onChange={(e) => setCustomUrls(e.target.value)}
              placeholder={baseUrl || 'Enter URLs to crawl'}
              helperText="Leave empty to use client's base URL"
              disabled={isActive}
              fullWidth
              size="small"
            />

            {/* Max Depth */}
            <TextField
              label="Max Crawl Depth"
              type="number"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value) || 0)}
              helperText="0 = exact URLs only, 1+ = follow links"
              disabled={isActive}
              fullWidth
              size="small"
            />

            {/* Save Options */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Save Options
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={saveHtml}
                      onChange={(e) => setSaveHtml(e.target.checked)}
                      disabled={isActive}
                      size="small"
                    />
                  }
                  label="HTML"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={saveMarkdown}
                      onChange={(e) => setSaveMarkdown(e.target.checked)}
                      disabled={isActive}
                      size="small"
                    />
                  }
                  label="Markdown"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={saveScreenshots}
                      onChange={(e) => setSaveScreenshots(e.target.checked)}
                      disabled={isActive}
                      size="small"
                    />
                  }
                  label="Screenshots"
                />
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Collapse>

      {/* Help Text */}
      {!status && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Apify Website Crawler</AlertTitle>
          This crawler uses Apify's cloud infrastructure to crawl websites with full control.
          Click "Start Crawl" to begin. You can stop or pause anytime.
        </Alert>
      )}

      {/* Error Display */}
      {status?.status === 'FAILED' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Crawl Failed</AlertTitle>
          The crawl encountered an error. Check the Apify dashboard for details.
        </Alert>
      )}
    </ModernCard>
  );
};
