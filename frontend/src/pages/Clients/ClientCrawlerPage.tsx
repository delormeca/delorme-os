/**
 * Client Crawler Page
 *
 * Dedicated page for Apify web crawling with comprehensive data table
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  TravelExplore,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  StandardIconButton,
  LoadingState,
} from '@/components/ui';
import { ApifyCrawlerControlPanel, ApifyCrawlHistory, ApifyCrawlResultsTable, ClientPagesTable } from '@/components/ApifyCrawler';

const ClientCrawlerPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: client, isLoading, error } = useClientDetail(clientId || '');
  const [selectedCrawlRunId, setSelectedCrawlRunId] = useState<string | null>(null);

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
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <TravelExplore
              sx={{
                fontSize: 40,
                color: theme.palette.primary.main,
              }}
            />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Web Crawler
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client.name} - Discover and index website pages
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Apify Crawler Control Panel */}
        <Box sx={{ mb: 4 }}>
          <ApifyCrawlerControlPanel
            clientId={client.id}
            clientName={client.name}
            baseUrl={client.base_url || undefined}
          />
        </Box>

        {/* Available Pages Table - Shows all pages ready for crawling */}
        <Box sx={{ mb: 4 }}>
          <ClientPagesTable clientId={client.id} />
        </Box>

        {/* Crawl History */}
        <Box sx={{ mb: 4 }}>
          <ApifyCrawlHistory
            clientId={client.id}
            limit={10}
            onViewCrawl={(crawlRunId) => setSelectedCrawlRunId(crawlRunId)}
          />
        </Box>

        {/* Crawl Results Table - Big data table with tags and SEO metrics */}
        {selectedCrawlRunId && (
          <Box sx={{ mb: 4 }}>
            <ApifyCrawlResultsTable crawlRunId={selectedCrawlRunId} />
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ClientCrawlerPage;
