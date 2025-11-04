import React from 'react';
import {
  Box,
  Typography,
  Stack,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Refresh, PlayArrow } from '@mui/icons-material';
import { StandardButton } from '@/components/ui';
import { useRescanSitemap } from '@/hooks/api/useCrawling';
import { format } from 'date-fns';

interface URLExtractionSectionProps {
  projectId: string;
  hasPages: boolean;
  totalPages: number;
  lastScanDate: string | null;
  sitemapUrl: string | null;
  onRescanComplete: (result: any) => void;
}

const URLExtractionSection: React.FC<URLExtractionSectionProps> = ({
  projectId,
  hasPages,
  totalPages,
  lastScanDate,
  sitemapUrl,
  onRescanComplete,
}) => {
  const theme = useTheme();
  const rescanSitemap = useRescanSitemap();

  const handleExtractOrRescan = async () => {
    console.log('Extract/Rescan clicked for project:', projectId);
    try {
      const result = await rescanSitemap.mutateAsync(projectId);
      console.log('Rescan result:', result);
      onRescanComplete(result);
    } catch (error) {
      console.error('Failed to rescan sitemap:', error);
      // Show error to user
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to scan sitemap'}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM do yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const hasSitemap = Boolean(sitemapUrl);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            URL Extraction
          </Typography>
          <StandardButton
            variant="contained"
            startIcon={rescanSitemap.isPending ? <CircularProgress size={16} /> : hasPages ? <Refresh /> : <PlayArrow />}
            onClick={handleExtractOrRescan}
            disabled={rescanSitemap.isPending || !hasSitemap}
            title={!hasSitemap ? 'Please configure a sitemap URL in project settings' : ''}
          >
            {rescanSitemap.isPending ? 'Scanning...' : hasPages ? 'Re-scan Sitemap' : 'Extract URLs'}
          </StandardButton>
        </Box>

        {!hasSitemap && (
          <Alert severity="warning">
            <Typography variant="body2">
              No sitemap URL configured. Please edit the project and add a sitemap URL to enable URL extraction.
            </Typography>
          </Alert>
        )}

        {hasPages && (
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Last scan:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate(lastScanDate)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total URLs:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {totalPages}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                Up to date
              </Typography>
            </Box>
          </Stack>
        )}

        {!hasPages && (
          <Typography variant="body2" color="text.secondary">
            Extract URLs from the sitemap to get started. No content will be scraped in this step.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default URLExtractionSection;
