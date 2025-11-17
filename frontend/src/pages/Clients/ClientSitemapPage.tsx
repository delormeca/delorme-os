/**
 * Client Sitemap Page
 *
 * Dedicated page for Sitemap Tracker functionality
 */
import React from 'react';
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  AccountTree,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  StandardIconButton,
  LoadingState,
} from '@/components/ui';
import { SitemapTrackerCard } from '@/components/SitemapTrackerCard';

const ClientSitemapPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: client, isLoading, error } = useClientDetail(clientId || '');

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
            <AccountTree
              sx={{
                fontSize: 40,
                color: theme.palette.primary.main,
              }}
            />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Sitemap Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client.name} - Monitor sitemap changes and page updates
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Sitemap Tracker Card */}
        <SitemapTrackerCard clientId={client.id} client={client} />
      </Box>
    </DashboardLayout>
  );
};

export default ClientSitemapPage;
