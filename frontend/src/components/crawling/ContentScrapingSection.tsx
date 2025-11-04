import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CloudDownload } from '@mui/icons-material';
import { StandardButton } from '@/components/ui';
import { useScrapeSelectedPages } from '@/hooks/api/useCrawling';
import { format } from 'date-fns';

interface ContentScrapingSectionProps {
  projectId: string;
  selectedPages: string[];
  unscrapedCount: number;
  lastCrawlDate: string | null;
  onScrapeComplete: (result: any) => void;
}

const ContentScrapingSection: React.FC<ContentScrapingSectionProps> = ({
  projectId,
  selectedPages,
  unscrapedCount,
  lastCrawlDate,
  onScrapeComplete,
}) => {
  const theme = useTheme();
  const [extractionMethod, setExtractionMethod] = useState('crawl4ai');
  const scrapePages = useScrapeSelectedPages();

  const handleScrape = async () => {
    console.log('🔵 handleScrape called');
    console.log('🔵 selectedPages:', selectedPages);
    console.log('🔵 selectedPages.length:', selectedPages.length);

    if (selectedPages.length === 0) {
      console.log('🔴 No pages selected, returning early');
      return;
    }

    console.log('🟢 Starting scrape with:', { pageIds: selectedPages, extractionMethod });

    try {
      const result = await scrapePages.mutateAsync({
        pageIds: selectedPages,
        extractionMethod,
      });
      console.log('✅ Scrape successful:', result);
      onScrapeComplete(result);
    } catch (error) {
      console.error('❌ Failed to scrape pages:', error);
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

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Content Scraping
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select pages from the table below and choose an extraction method to scrape their content.
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="extraction-method-label">Extraction Method</InputLabel>
          <Select
            labelId="extraction-method-label"
            value={extractionMethod}
            label="Extraction Method"
            onChange={(e) => setExtractionMethod(e.target.value)}
          >
            <MenuItem value="crawl4ai">
              <Box>
                <Typography variant="body2">Crawl4AI</Typography>
                <Typography variant="caption" color="text.secondary">
                  Default - Fast and reliable
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="jina">
              <Box>
                <Typography variant="body2">Jina AI</Typography>
                <Typography variant="caption" color="text.secondary">
                  AI-powered extraction
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="firecrawl">
              <Box>
                <Typography variant="body2">Firecrawl</Typography>
                <Typography variant="caption" color="text.secondary">
                  Advanced web scraping
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="playwright">
              <Box>
                <Typography variant="body2">Playwright</Typography>
                <Typography variant="caption" color="text.secondary">
                  Browser automation
                </Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <StandardButton
            variant="contained"
            startIcon={scrapePages.isPending ? <CircularProgress size={16} /> : <CloudDownload />}
            onClick={handleScrape}
            disabled={selectedPages.length === 0 || scrapePages.isPending}
            fullWidth
          >
            {scrapePages.isPending
              ? 'Scraping...'
              : `Scrape ${selectedPages.length} Page${selectedPages.length !== 1 ? 's' : ''}`}
          </StandardButton>
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Unscraped pages:
            </Typography>
            <Chip
              label={unscrapedCount}
              size="small"
              color={unscrapedCount > 0 ? 'warning' : 'success'}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Last crawl date:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDate(lastCrawlDate)}
            </Typography>
          </Box>

          {selectedPages.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Selected pages:
              </Typography>
              <Chip
                label={selectedPages.length}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default ContentScrapingSection;
