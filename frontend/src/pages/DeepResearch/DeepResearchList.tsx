import React from 'react';
import {
  Box,
  Typography,
  Grid2 as Grid,
  Chip,
  IconButton,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add,
  Delete,
  Visibility,
  Cancel,
  Search,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  DashboardLayout,
  PageHeader,
  LoadingState,
  EmptyState,
  StandardButton,
} from '@/components/ui';
import {
  useResearchList,
  useDeleteResearch,
  useCancelResearch,
  ResearchRequestRead,
} from '@/hooks/api/useDeepResearch';

const DeepResearchList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: research, isLoading } = useResearchList();
  const deleteResearch = useDeleteResearch();
  const cancelResearch = useCancelResearch();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'processing':
        return <HourglassEmpty fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'pending':
        return <HourglassEmpty fontSize="small" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <LoadingState message="Loading research..." />
        </Box>
      </DashboardLayout>
    );
  }

  if (!research || research.length === 0) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <EmptyState
            icon={<Search sx={{ fontSize: 80, color: theme.palette.primary.main }} />}
            title="No research yet"
            description="Start your first deep research query to generate comprehensive AI-powered reports with citations"
            action={{
              label: "Start Research",
              onClick: () => navigate("/dashboard/deep-researcher/new"),
              variant: "contained",
            }}
          />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <PageHeader
          title="Deep Research"
          subtitle="AI-powered research with comprehensive reports and citations"
          action={
            <StandardButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/dashboard/deep-researcher/new")}
            >
              New Research
            </StandardButton>
          }
        />

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {research.map((item: ResearchRequestRead) => (
            <Grid size={{ xs: 12, md: 6 }} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography
                      variant="h6"
                      sx={{
                        flex: 1,
                        mr: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.query}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(item.status)}
                      label={item.status.toUpperCase()}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.report_type.replace('_', ' ')} • {item.tone} tone
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.created_at).toLocaleDateString()} at{' '}
                      {new Date(item.created_at).toLocaleTimeString()}
                    </Typography>
                  </Box>

                  {item.status === 'processing' && (
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          {Math.round(item.progress)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.progress}
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  )}

                  <Box
                    display="flex"
                    gap={2}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Sources
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.total_sources}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Cost
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${item.cost_usd.toFixed(4)}
                      </Typography>
                    </Box>
                    {item.duration_seconds && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Duration
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round(item.duration_seconds)}s
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/dashboard/deep-researcher/${item.id}`)}
                    title="View Details"
                  >
                    <Visibility />
                  </IconButton>

                  {item.status === 'processing' && (
                    <IconButton
                      size="small"
                      onClick={() => cancelResearch.mutate(item.id)}
                      title="Cancel"
                      color="warning"
                    >
                      <Cancel />
                    </IconButton>
                  )}

                  <IconButton
                    size="small"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this research?')) {
                        deleteResearch.mutate(item.id);
                      }
                    }}
                    title="Delete"
                    color="error"
                    sx={{ ml: 'auto' }}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default DeepResearchList;
