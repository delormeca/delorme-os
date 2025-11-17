/**
 * Apify Crawl History
 *
 * Displays a list of past crawl runs with their status and results.
 */
import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  Timeline,
  CloudDownload,
  Stop,
} from '@mui/icons-material';
import { ModernCard, LoadingState } from '@/components/ui';
import { useClientCrawls } from '@/hooks/api/useCrawler';
import { formatDistanceToNow } from 'date-fns';

interface ApifyCrawlHistoryProps {
  clientId: string;
  limit?: number;
  onViewCrawl?: (crawlRunId: string) => void;
}

export const ApifyCrawlHistory: React.FC<ApifyCrawlHistoryProps> = ({
  clientId,
  limit = 10,
  onViewCrawl,
}) => {
  const theme = useTheme();
  const { data: crawls, isLoading } = useClientCrawls(clientId, limit);

  // Status color mapping
  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
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
  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'RUNNING':
        return <Timeline fontSize="small" />;
      case 'SUCCEEDED':
        return <CheckCircle fontSize="small" />;
      case 'FAILED':
      case 'ABORTED':
        return <ErrorIcon fontSize="small" />;
      case 'READY':
      case 'starting':
        return <HourglassEmpty fontSize="small" />;
      default:
        return undefined;
    }
  };

  if (isLoading) {
    return (
      <ModernCard variant="glass">
        <LoadingState message="Loading crawl history..." />
      </ModernCard>
    );
  }

  if (!crawls || crawls.length === 0) {
    return (
      <ModernCard variant="glass">
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CloudDownload
            sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary">
            No crawls yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start your first Apify crawl to see it here
          </Typography>
        </Box>
      </ModernCard>
    );
  }

  return (
    <ModernCard variant="glass">
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Crawl History
      </Typography>

      <Stack spacing={2}>
        {crawls.map((crawl) => (
          <Box
            key={crawl.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
              }}
            >
              {/* Left: Status and Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    icon={getStatusIcon(crawl.status)}
                    label={crawl.status}
                    color={getStatusColor(crawl.status)}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {crawl.started_at
                      ? formatDistanceToNow(new Date(crawl.started_at), {
                          addSuffix: true,
                        })
                      : 'Not started'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pages Crawled
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {crawl.pages_crawled} / {crawl.total_pages}
                    </Typography>
                  </Box>

                  {crawl.pages_failed > 0 && (
                    <Box>
                      <Typography variant="caption" color="error">
                        Failed
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                        color="error"
                      >
                        {crawl.pages_failed}
                      </Typography>
                    </Box>
                  )}

                  {crawl.completed_at && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="body2">
                        {formatDistanceToNow(new Date(crawl.completed_at), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Right: Actions */}
              <Box>
                {onViewCrawl && (
                  <Tooltip title="View details">
                    <IconButton
                      onClick={() => onViewCrawl(crawl.id)}
                      size="small"
                      sx={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Run ID */}
            {crawl.apify_run_id && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1, fontFamily: 'monospace' }}
              >
                Run ID: {crawl.apify_run_id}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </ModernCard>
  );
};
