/**
 * Analytics Page
 *
 * Displays analytics data with plan-based access control.
 * Shows different levels of analytics based on user's plan.
 */

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid2,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  Analytics as AnalyticsIcon,
  Assessment,
  Group,
  Article,
  Visibility,
  Schedule,
  Speed,
} from "@mui/icons-material";
import { PermissionGuard, usePermission } from "@/components/PermissionGuard";
import {
  useBasicAnalytics,
  useAdvancedAnalytics,
  usePremiumReporting,
  useTeamAnalytics,
} from "@/hooks/api/useAnalytics";
import { useUserPlan } from "@/hooks/api/usePlans";
import {
  DashboardLayout,
  PageHeader,
  ModernCard,
  LoadingState,
  FeatureChip,
  StatusBadge,
} from "@/components/ui";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}> = ({ title, value, icon, subtitle, color = "primary" }) => (
  <ModernCard
    title={title}
    icon={icon}
    variant="gradient"
    sx={{
      height: "100%",
      textAlign: "center",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.1)`,
      },
    }}
  >
    <Typography
      variant="h2"
      sx={{
        fontWeight: 800,
        fontSize: "2.5rem",
        color: `${color}.main`,
        lineHeight: 1,
      }}
    >
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {subtitle}
      </Typography>
    )}
  </ModernCard>
);

const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data: userPlan } = useUserPlan();

  // Permission checks
  const basicPermission = usePermission("basic_analytics");
  const advancedPermission = usePermission("advanced_analytics");
  const reportingPermission = usePermission("advanced_reporting");
  const teamPermission = usePermission("team_management");

  // Data hooks - only fetch data if user has permission
  const { data: basicData, isLoading: basicLoading } = useBasicAnalytics(
    basicPermission.hasAccess
  );
  const { data: advancedData, isLoading: advancedLoading } =
    useAdvancedAnalytics(advancedPermission.hasAccess);
  const { data: reportingData, isLoading: reportingLoading } =
    usePremiumReporting(reportingPermission.hasAccess);
  const { data: teamData, isLoading: teamLoading } = useTeamAnalytics(
    teamPermission.hasAccess
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const availableTabs = [
    { label: "Overview", permission: true, icon: <AnalyticsIcon /> },
    {
      label: "Basic Analytics",
      permission: basicPermission.hasAccess,
      icon: <TrendingUp />,
    },
    {
      label: "Advanced Analytics",
      permission: advancedPermission.hasAccess,
      icon: <Assessment />,
    },
    {
      label: "Premium Reports",
      permission: reportingPermission.hasAccess,
      icon: <Speed />,
    },
    {
      label: "Team Analytics",
      permission: teamPermission.hasAccess,
      icon: <Group />,
    },
  ].filter((tab) => tab.permission);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: "lg", mx: "auto" }}>
        <PageHeader
          title="Analytics Dashboard"
          subtitle="Track your content performance and engagement"
        />

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analytics tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: { xs: 0, sm: 1 },
              },
              '& .MuiTab-root': {
                minWidth: { xs: 'auto', sm: 140 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                padding: { xs: '12px 8px', sm: '12px 16px' },
                '& .MuiSvgIcon-root': {
                  display: { xs: 'none', sm: 'block' },
                },
              },
            }}
          >
            {availableTabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Welcome to your analytics dashboard! Upgrade your plan to unlock
                more detailed insights.
              </Alert>
            </Grid2>

            {/* Basic metrics available to all users */}
            <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
              <MetricCard
                title="Plan Features"
                value={userPlan?.permissions?.length || 0}
                icon={<Article />}
                subtitle="Available features"
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
              <MetricCard
                title="Analytics Level"
                value={userPlan?.current_plan || "Free"}
                icon={<TrendingUp />}
                subtitle="Current access level"
                color="secondary"
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
              <MetricCard
                title="Available Reports"
                value={availableTabs.length - 1}
                icon={<Assessment />}
                subtitle="Accessible analytics"
                color="success"
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
              <MetricCard
                title="Upgrade Status"
                value={basicPermission.upgradeNeeded ? "Available" : "Current"}
                icon={<Visibility />}
                subtitle="Plan status"
                color={basicPermission.upgradeNeeded ? "warning" : "success"}
              />
            </Grid2>
          </Grid2>
        </TabPanel>

        {/* Basic Analytics Tab */}
        {basicPermission.hasAccess && (
          <TabPanel value={tabValue} index={1}>
            <PermissionGuard feature="basic_analytics">
              {basicLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Total Articles"
                      value={basicData?.metrics?.total_articles || 0}
                      icon={<Article />}
                      subtitle="All articles created"
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Published"
                      value={basicData?.metrics?.published_articles || 0}
                      icon={<Visibility />}
                      subtitle="Live articles"
                      color="success"
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Drafts"
                      value={basicData?.metrics?.draft_articles || 0}
                      icon={<Schedule />}
                      subtitle="Work in progress"
                      color="warning"
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Recent Activity"
                      value={basicData?.metrics?.recent_published || 0}
                      icon={<TrendingUp />}
                      subtitle="Last 30 days"
                      color="secondary"
                    />
                  </Grid2>

                  {/* Recent Activity */}
                  <Grid2 size={{ xs: 12 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recent Articles
                        </Typography>
                        {basicData?.recent_activity?.length > 0 ? (
                          <Stack spacing={2}>
                            {basicData?.recent_activity?.map(
                              (article: any, index: number) => (
                                <Box
                                  key={index}
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Typography variant="body1">
                                    {article.title}
                                  </Typography>
                                  <Chip
                                    label={
                                      article.is_published
                                        ? "Published"
                                        : "Draft"
                                    }
                                    color={
                                      article.is_published
                                        ? "success"
                                        : "warning"
                                    }
                                    size="small"
                                  />
                                </Box>
                              )
                            )}
                          </Stack>
                        ) : (
                          <Typography color="text.secondary">
                            No recent articles found.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid2>
                </Grid2>
              )}
            </PermissionGuard>
          </TabPanel>
        )}

        {/* Advanced Analytics Tab */}
        {advancedPermission.hasAccess && (
          <TabPanel value={tabValue} index={2}>
            <PermissionGuard feature="advanced_analytics">
              {advancedLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid2 container spacing={3}>
                  {/* Advanced metrics */}
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Content Analysis
                        </Typography>
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            Average Content Length:{" "}
                            {advancedData?.advanced_metrics
                              ?.avg_content_length || 0}{" "}
                            characters
                          </Typography>
                        </Box>
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            Publishing Frequency:{" "}
                            {advancedData?.advanced_metrics
                              ?.publishing_frequency || "N/A"}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid2>

                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Growth Trends
                        </Typography>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mr={2}
                          >
                            Trend:
                          </Typography>
                          <Chip
                            label={advancedData?.growth_trends?.trend || "N/A"}
                            color={
                              advancedData?.growth_trends?.trend ===
                              "increasing"
                                ? "success"
                                : advancedData?.growth_trends?.trend ===
                                  "decreasing"
                                ? "error"
                                : "default"
                            }
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Growth Rate:{" "}
                          {advancedData?.growth_trends?.growth_rate || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>

                  {/* Content Categories */}
                  <Grid2 size={{ xs: 12 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Content Categories
                        </Typography>
                        <Grid2 container spacing={2}>
                          {Object.entries(
                            advancedData?.advanced_metrics
                              ?.content_categories || {}
                          ).map(([category, count]) => (
                            <Grid2
                              size={{ xs: 6, md: 4, lg: 2 }}
                              key={category}
                            >
                              <Box textAlign="center">
                                <Typography variant="h5" color="primary.main">
                                  {count as number}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ textTransform: "capitalize" }}
                                >
                                  {category}
                                </Typography>
                              </Box>
                            </Grid2>
                          ))}
                        </Grid2>
                      </CardContent>
                    </Card>
                  </Grid2>
                </Grid2>
              )}
            </PermissionGuard>
          </TabPanel>
        )}

        {/* Premium Reports Tab */}
        {reportingPermission.hasAccess && (
          <TabPanel value={tabValue} index={3}>
            <PermissionGuard feature="advanced_reporting">
              {reportingLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12 }}>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Premium reporting features are now available! Export your
                      data and generate custom reports.
                    </Alert>
                  </Grid2>

                  {/* Export Options */}
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Export Options
                        </Typography>
                        <Stack spacing={2}>
                          {reportingData?.premium_features?.export_options?.map(
                            (option: any, index: number) => (
                              <Box
                                key={index}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography variant="body1">
                                  {option.format.toUpperCase()}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {option.description}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid2>

                  {/* Benchmarking */}
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Benchmarking
                        </Typography>
                        {reportingData?.premium_features?.benchmarking && (
                          <Stack spacing={2}>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Your Articles:{" "}
                                {
                                  reportingData.premium_features.benchmarking
                                    .user_articles
                                }
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Platform Average:{" "}
                                {
                                  reportingData.premium_features.benchmarking
                                    .platform_average
                                }
                              </Typography>
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                Performance Percentile
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={
                                  reportingData.premium_features.benchmarking
                                    .percentile
                                }
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                mt={1}
                              >
                                {
                                  reportingData.premium_features.benchmarking
                                    .percentile
                                }
                                th percentile
                              </Typography>
                            </Box>
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Grid2>
                </Grid2>
              )}
            </PermissionGuard>
          </TabPanel>
        )}

        {/* Team Analytics Tab */}
        {teamPermission.hasAccess && (
          <TabPanel value={tabValue} index={4}>
            <PermissionGuard feature="team_management">
              {teamLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Team analytics help you understand collaboration patterns
                      and team productivity.
                    </Alert>
                  </Grid2>

                  {/* Team Metrics */}
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Team Size"
                      value={teamData?.team_metrics?.team_size || 0}
                      icon={<Group />}
                      subtitle="Active members"
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Team Articles"
                      value={teamData?.team_metrics?.total_team_articles || 0}
                      icon={<Article />}
                      subtitle="Total team output"
                      color="success"
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Productivity Score"
                      value={teamData?.team_metrics?.collaboration_score || 0}
                      icon={<TrendingUp />}
                      subtitle="Team collaboration"
                      color="secondary"
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <MetricCard
                      title="Weekly Output"
                      value={
                        teamData?.team_productivity?.articles_per_week || 0
                      }
                      icon={<Speed />}
                      subtitle="Articles per week"
                      color="warning"
                    />
                  </Grid2>
                </Grid2>
              )}
            </PermissionGuard>
          </TabPanel>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default Analytics;
