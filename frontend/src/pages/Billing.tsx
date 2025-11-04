import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Grid2 as Grid,
  Divider,
} from '@mui/material';
import {
  CreditCard,
  Settings,
  Upgrade,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { 
  DashboardLayout,
  ModernCard,
  StandardButton,
  PageHeader,
  StatusBadge,
  FeatureChip,
  LoadingState
} from '@/components/ui';
import { useUserPlan } from '@/hooks/api/usePlans';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useCreateCustomerPortal } from '@/hooks/api/usePayments';
import { useSnackBarContext } from '@/context/SnackBarContext';
import PlanStatus from '@/components/PlanStatus';

const Billing: React.FC = () => {
  const { data: currentUser } = useCurrentUser();
  const { data: userPlan, isLoading: planLoading } = useUserPlan();
  const { mutate: openCustomerPortal, isPending: portalLoading } = useCreateCustomerPortal();
  const { createSnackBar } = useSnackBarContext();

  const handleManageBilling = () => {
    openCustomerPortal(undefined, {
      onSuccess: () => {
        createSnackBar({
          content: 'Opening Stripe Customer Portal...',
          severity: 'info',
          autoHide: true,
        });
      },
      onError: (error: any) => {
        const errorMessage = error?.detail?.message || error?.message || 'Failed to open billing portal';
        
        if (errorMessage.includes('No configuration provided')) {
          createSnackBar({
            content: 'Billing portal is not configured yet. Please contact support for assistance.',
            severity: 'warning',
            autoHide: false,
          });
        } else {
          createSnackBar({
            content: 'Failed to open billing portal. Please try again.',
            severity: 'error',
            autoHide: true,
          });
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentPlan = userPlan?.current_plan || 'free';
  const subscription = userPlan?.subscription;

  if (planLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading billing information..." fullHeight />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your subscription and billing details"
      />

      <Stack spacing={4}>
        {/* Current Plan Overview */}
        <ModernCard
          title="Current Plan"
          subtitle="Your subscription details"
          icon={<CreditCard />}
          variant="gradient"
        >
          <PlanStatus compact={false} showUpgradeButton={true} />
        </ModernCard>

        {/* Subscription Details */}
        {subscription ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <ModernCard
                title="Subscription Information"
                icon={<CheckCircle />}
                variant="glass"
              >
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Plan Details
                      </Typography>
                      <Stack spacing={1.5}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Plan</Typography>
                          <StatusBadge 
                            status="info"
                            label={subscription.plan?.toUpperCase() || 'UNKNOWN'}
                            size="small"
                          />
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Status</Typography>
                          <StatusBadge 
                            status={subscription.status === 'ACTIVE' ? 'success' : 'warning'}
                            label={subscription.status || 'UNKNOWN'}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Billing Information
                      </Typography>
                      <Stack spacing={1.5}>
                        {subscription.start_date && (
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Started</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(subscription.start_date)}
                            </Typography>
                          </Box>
                        )}

                        {subscription.end_date && (
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Next Billing</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(subscription.end_date)}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </ModernCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <ModernCard
                title="Manage Subscription"
                icon={<Settings />}
                variant="glass"
              >
                <Stack spacing={2}>
                  <StandardButton
                    variant="contained"
                    startIcon={<CreditCard />}
                    onClick={handleManageBilling}
                    isLoading={portalLoading}
                    loadingText="Opening..."
                    fullWidth
                  >
                    Billing Portal
                  </StandardButton>
                  
                  <StandardButton
                    variant="outlined"
                    startIcon={<Upgrade />}
                    onClick={() => window.location.href = '/pricing'}
                    fullWidth
                  >
                    Change Plan
                  </StandardButton>
                  
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                    Manage payment methods, download invoices, and update billing details
                  </Typography>
                </Stack>
              </ModernCard>
            </Grid>
          </Grid>
        ) : (
          <ModernCard
            title="No Active Subscription"
            subtitle="You're currently on the free plan"
            icon={<Info />}
            variant="glass"
          >
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Upgrade to unlock premium features and get the most out of CraftYourStartup
              </Typography>
              
              <StandardButton
                variant="contained"
                startIcon={<Upgrade />}
                onClick={() => window.location.href = '/pricing'}
                size="large"
              >
                View Plans & Pricing
              </StandardButton>
            </Box>
          </ModernCard>
        )}

        {/* Help Section */}
        <ModernCard
          title="Need Help?"
          subtitle="Billing support and resources"
          icon={<Info />}
          variant="glass"
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Billing Questions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Get help with your subscription
                </Typography>
                <StandardButton
                  variant="outlined"
                  size="small"
                  href="mailto:billing@craftyourstartup.com"
                >
                  Contact Support
                </StandardButton>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Documentation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Learn about billing features
                </Typography>
                <StandardButton
                  variant="outlined"
                  size="small"
                  href="/docs/billing"
                >
                  View Docs
                </StandardButton>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Pricing Plans
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Compare all available plans
                </Typography>
                <StandardButton
                  variant="outlined"
                  size="small"
                  onClick={() => window.location.href = '/pricing'}
                >
                  View Pricing
                </StandardButton>
              </Box>
            </Grid>
          </Grid>
        </ModernCard>
      </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default Billing;