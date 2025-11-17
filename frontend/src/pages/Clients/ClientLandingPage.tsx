/**
 * Client Landing Page
 *
 * Transition page showing navigation cards for client tools and workflows
 */
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  useTheme,
  alpha,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  CalendarToday,
  SitemapOutlined,
  TravelExplore,
  AutoAwesome,
  TrendingUp,
  Link as LinkIcon,
  Assessment,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  ModernCard,
  StandardIconButton,
  LoadingState,
} from '@/components/ui';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  onClick: () => void;
  variant?: 'default' | 'large';
}

const NavigationCard: React.FC<NavigationCardProps> = ({
  title,
  description,
  icon,
  onClick,
  variant = 'default',
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Stack spacing={2} alignItems="flex-start">
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: variant === 'large' ? 48 : 40 } })}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant={variant === 'large' ? 'h4' : 'h5'}
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Open
              </Typography>
              <ArrowForward sx={{ fontSize: 16 }} />
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const ClientLandingPage: React.FC = () => {
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
              Select a tool or workflow to get started
            </Typography>
          </Box>
        </Box>

        {/* Client Information Card */}
        <ModernCard variant="glass" sx={{ mb: 4, p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Business
              sx={{
                fontSize: 56,
                color: theme.palette.primary.main,
                opacity: 0.8,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Client Information
              </Typography>
              <Stack direction="row" spacing={3}>
                {client.industry && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Industry
                    </Typography>
                    <Typography variant="body2">{client.industry}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2">{formatDate(client.created_at)}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </ModernCard>

        {/* Main Navigation Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Sitemap Tracker */}
          <Grid item xs={12} md={6}>
            <NavigationCard
              title="Sitemap Tracker"
              description="Monitor and track sitemap changes, page additions, and removals"
              icon={<SitemapOutlined />}
              onClick={() => navigate(`/clients/${client.id}/sitemap`)}
            />
          </Grid>

          {/* Crawler */}
          <Grid item xs={12} md={6}>
            <NavigationCard
              title="Crawler"
              description="Start and manage web crawls to discover and index pages"
              icon={<TravelExplore />}
              onClick={() => navigate(`/clients/${client.id}/crawler`)}
            />
          </Grid>
        </Grid>

        {/* SEO Workflows Section */}
        <ModernCard variant="glass" sx={{ mb: 4, p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <AutoAwesome sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              SEO Workflows
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Automated SEO analysis and optimization workflows powered by AI
          </Typography>

          <Grid container spacing={2}>
            {/* Optimization Plan */}
            <Grid item xs={12} md={6}>
              <NavigationCard
                title="Optimization Plan"
                description="Generate comprehensive SEO optimization strategies"
                icon={<TrendingUp />}
                onClick={() => navigate(`/clients/${client.id}/workflows/optimization-plan`)}
              />
            </Grid>

            {/* SERP Analyzer */}
            <Grid item xs={12} md={6}>
              <NavigationCard
                title="SERP Analyzer"
                description="Analyze search engine results pages and competitor rankings"
                icon={<Assessment />}
                onClick={() => navigate(`/clients/${client.id}/workflows/serp-analyzer`)}
              />
            </Grid>

            {/* Internal Linking Audit */}
            <Grid item xs={12} md={6}>
              <NavigationCard
                title="Internal Linking Audit"
                description="Audit internal link structure and identify opportunities"
                icon={<LinkIcon />}
                onClick={() => navigate(`/clients/${client.id}/workflows/internal-linking-audit`)}
              />
            </Grid>

            {/* Internal Linking Report */}
            <Grid item xs={12} md={6}>
              <NavigationCard
                title="Internal Linking Report"
                description="Generate detailed reports on internal linking performance"
                icon={<Assessment />}
                onClick={() => navigate(`/clients/${client.id}/workflows/internal-linking-report`)}
              />
            </Grid>
          </Grid>
        </ModernCard>
      </Box>
    </DashboardLayout>
  );
};

export default ClientLandingPage;
