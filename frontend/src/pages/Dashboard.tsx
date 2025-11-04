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
  Article,
  Add,
  Analytics,
  Speed,
  PeopleAlt,
  ArrowForward,
  Edit,
  Visibility,
  Business,
  Folder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  DashboardLayout,
  ModernCard,
  StandardButton,
  StatusBadge,
  LoadingState,
} from '@/components/ui';
import { useArticles } from '@/hooks/api/useArticles';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { ArticleRead, ClientRead, ProjectRead } from '@/client';
import PlanStatus from '@/components/PlanStatus';
import { useUserPlan } from '@/hooks/api/usePlans';
import { useClients } from '@/hooks/api/useClients';
import { useProjects } from '@/hooks/api/useProjects';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: userPlan } = useUserPlan();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getArticleStats = () => {
    if (!articles) return { total: 0, published: 0, drafts: 0 };
    
    const published = articles.filter(article => article.is_published).length;
    const drafts = articles.filter(article => !article.is_published).length;
    
    return {
      total: articles.length,
      published,
      drafts,
    };
  };

  const getRecentArticles = (): ArticleRead[] => {
    if (!articles) return [];
    return articles
      .sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  };

  const getRecentProjects = (): ProjectRead[] => {
    if (!projects) return [];
    return projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const stats = getArticleStats();
  const recentArticles = getRecentArticles();
  const recentProjects = getRecentProjects();

  if (articlesLoading) {
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
              Here's your content overview
            </Typography>
          </Box>
          
          <StandardButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/dashboard/my-articles/new')}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '140px' }
            }}
          >
            Create Article
          </StandardButton>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ModernCard
            title="Published Articles"
            icon={<Visibility />}
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
            onClick={() => navigate('/dashboard/my-articles')}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                color: 'warning.main',
                lineHeight: 1,
              }}
            >
              {stats.published}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Published content
            </Typography>
          </ModernCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ModernCard
            title="Total Articles"
            icon={<Article />}
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
            onClick={() => navigate('/dashboard/my-articles')}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                color: 'info.main',
                lineHeight: 1,
              }}
            >
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              All articles
            </Typography>
          </ModernCard>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Projects */}
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
            title="Recent Articles"
            subtitle={stats.total > 0 ? `${recentArticles.length} of ${stats.total} articles` : undefined}
            icon={<Article />}
            action={
              stats.total > 0 && (
                <StandardButton
                  variant="text"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/dashboard/my-articles')}
                  size="small"
                >
                  View All
                </StandardButton>
              )
            }
            variant="glass"
            sx={{ height: 'fit-content' }}
          >
            {recentArticles.length === 0 ? (
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
                  <Article sx={{ fontSize: '2rem', color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No articles yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first article to get started
                </Typography>
                <StandardButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/dashboard/my-articles/new')}
                >
                  Create Article
                </StandardButton>
              </Box>
            ) : (
              <Stack spacing={1}>
                {recentArticles.slice(0, 3).map((article) => (
                  <Box
                    key={article.id}
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
                    onClick={() => navigate(`/dashboard/my-articles/${article.id}/view`)}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' } }} 
                        >
                          {article.title}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {new Date(article.published_at || new Date()).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <StatusBadge
                        status={article.is_published ? 'success' : 'warning'}
                        label={article.is_published ? 'Published' : 'Draft'}
                        size="small"
                      />
                    </Stack>
                  </Box>
                ))}
                
                {recentArticles.length > 3 && (
                  <Box sx={{ textAlign: 'center', pt: 1 }}>
                    <StandardButton
                      variant="text"
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/dashboard/my-articles')}
                    >
                      View {recentArticles.length - 3} more
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
            {/* Stats Overview */}
            <Grid container spacing={2}>
              {stats.total > 0 && (
                <Grid size={12}>
                  <ModernCard
                    title="Publish Rate"
                    icon={<TrendingUp />}
                    variant="gradient"
                  >
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 800,
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                        color: 'info.main',
                        lineHeight: 1,
                      }}
                    >
                      {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.total > 0 ? (stats.published / stats.total) * 100 : 0}
                      sx={{
                        mt: 2,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.divider, 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, 
                            ${theme.palette.primary.main}, 
                            ${theme.palette.secondary.main})`,
                        },
                      }}
                    />
                  </ModernCard>
                </Grid>
              )}
            </Grid>

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
                  onClick={() => navigate('/dashboard/my-articles/new')}
                >
                  New Article
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