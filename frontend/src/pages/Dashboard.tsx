import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Grid2 as Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Add,
  Analytics,
  Speed,
  PeopleAlt,
  ArrowForward,
  Business,
  Folder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  DashboardLayout,
  ModernCard,
  StandardButton,
  LoadingState,
} from '@/components/ui';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { ClientRead, ProjectRead } from '@/client';
import PlanStatus from '@/components/PlanStatus';
import { useUserPlan } from '@/hooks/api/usePlans';
import { useClients } from '@/hooks/api/useClients';
import { useProjects } from '@/hooks/api/useProjects';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: userPlan } = useUserPlan();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRecentProjects = (): ProjectRead[] => {
    if (!projects) return [];
    return projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const getRecentClients = (): ClientRead[] => {
    if (!clients) return [];
    return clients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const recentProjects = getRecentProjects();
  const recentClients = getRecentClients();

  if (clientsLoading || projectsLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your dashboard..." fullHeight />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                lineHeight: 1.2,
              }}
            >
              {getGreeting()}, {currentUser?.full_name?.split(' ')[0] || 'there'}! 👋
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.4,
              }}
            >
              Here's your business overview
            </Typography>
          </Box>

          <StandardButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/clients/new')}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '140px' }
            }}
          >
            Create Client
          </StandardButton>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ModernCard
            title="Total Clients"
            icon={<Business />}
            variant="gradient"
            sx={{
              height: '100%',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.1)}`,
              },
            }}
            onClick={() => navigate('/clients')}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                background: `linear-gradient(135deg,
                  ${theme.palette.primary.main},
                  ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}
            >
              {clients?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Active clients
            </Typography>
          </ModernCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <ModernCard
            title="Total Projects"
            icon={<Folder />}
            variant="gradient"
            sx={{
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.1)}`,
              },
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                color: 'success.main',
                lineHeight: 1,
              }}
            >
              {projects?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Active projects
            </Typography>
          </ModernCard>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Projects and Clients */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <ModernCard
            title="Recent Projects"
            subtitle={projects && projects.length > 0 ? `${recentProjects.length} of ${projects.length} projects` : undefined}
            icon={<Folder />}
            action={
              projects && projects.length > 0 && (
                <StandardButton
                  variant="text"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/clients')}
                  size="small"
                >
                  View All
                </StandardButton>
              )
            }
            variant="glass"
            sx={{ height: 'fit-content', mb: 3 }}
          >
            {!projects || recentProjects.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}>
                  <Folder sx={{ fontSize: '2rem', color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first client and project to get started
                </Typography>
                <StandardButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/clients/new')}
                >
                  Create Client
                </StandardButton>
              </Box>
            ) : (
              <Stack spacing={1}>
                {recentProjects.map((project) => (
                  <Box
                    key={project.id}
                    sx={{
                      p: 1.5,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Folder sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }}
                        >
                          {project.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {project.url}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}

                {projects && projects.length > 5 && (
                  <Box sx={{ textAlign: 'center', pt: 1 }}>
                    <StandardButton
                      variant="text"
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/clients')}
                    >
                      View {projects.length - 5} more
                    </StandardButton>
                  </Box>
                )}
              </Stack>
            )}
          </ModernCard>

          <ModernCard
            title="Recent Clients"
            subtitle={clients && clients.length > 0 ? `${recentClients.length} of ${clients.length} clients` : undefined}
            icon={<Business />}
            action={
              clients && clients.length > 0 && (
                <StandardButton
                  variant="text"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/clients')}
                  size="small"
                >
                  View All
                </StandardButton>
              )
            }
            variant="glass"
            sx={{ height: 'fit-content' }}
          >
            {!clients || recentClients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}>
                  <Business sx={{ fontSize: '2rem', color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No clients yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first client to get started
                </Typography>
                <StandardButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/clients/new')}
                >
                  Create Client
                </StandardButton>
              </Box>
            ) : (
              <Stack spacing={1}>
                {recentClients.map((client) => (
                  <Box
                    key={client.id}
                    sx={{
                      p: 1.5,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Business sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }}
                        >
                          {client.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {new Date(client.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}

                {clients && clients.length > 5 && (
                  <Box sx={{ textAlign: 'center', pt: 1 }}>
                    <StandardButton
                      variant="text"
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/clients')}
                    >
                      View {clients.length - 5} more
                    </StandardButton>
                  </Box>
                )}
              </Stack>
            )}
          </ModernCard>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Quick Actions */}
            <ModernCard
              title="Quick Actions"
              icon={<Speed />}
              variant="glass"
            >
              <Stack spacing={2}>
                <StandardButton
                  variant="contained"
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => navigate('/clients/new')}
                >
                  New Client
                </StandardButton>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <StandardButton
                    variant="outlined"
                    fullWidth
                    startIcon={<Analytics />}
                    onClick={() => navigate('/dashboard/analytics')}
                    size="small"
                  >
                    Analytics
                  </StandardButton>
                  <StandardButton
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleAlt />}
                    onClick={() => navigate('/dashboard/profile')}
                    size="small"
                  >
                    Profile
                  </StandardButton>
                </Box>
              </Stack>
            </ModernCard>

            {/* Plan Status */}
            <Box>
              <PlanStatus />
            </Box>
          </Stack>
        </Grid>
      </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;