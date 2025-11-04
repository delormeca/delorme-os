/**
 * Upgrade Dialog Component
 * 
 * Shows upgrade options with proration details and billing explanations.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Close,
  Upgrade,
  CheckCircle,
  Info,
  Star,
} from '@mui/icons-material';
import { StandardButton } from '@/components/ui';
import { useProrationPreview, useCreateUpgradeCheckout } from '@/hooks/api/useUpgrades';
import { useUserPlan } from '@/hooks/api/usePlans';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  targetPlan: string;
  planName: string;
  planPrice: string;
  planFeatures: string[];
  billingType: 'one_time' | 'subscription';
}

const UpgradeDialog: React.FC<UpgradeDialogProps> = ({
  open,
  onClose,
  targetPlan,
  planName,
  planPrice,
  planFeatures,
  billingType,
}) => {
  const { data: userPlan } = useUserPlan();
  const { data: prorationData, isLoading: prorationLoading } = useProrationPreview(
    open ? targetPlan : ''
  );
  const createUpgradeCheckout = useCreateUpgradeCheckout();

  const currentPlan = userPlan?.current_plan || 'free';
  const isSubscriptionUpgrade = billingType === 'subscription';
  const hasActiveSubscription = prorationData?.has_subscription;

  const handleUpgrade = async () => {
    try {
      await createUpgradeCheckout.mutateAsync({ targetPlan });
    } catch (error) {
      // Error handling is done by the hook
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Upgrade color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Upgrade to {planName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Left Column - Plan Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              {/* Current vs Target Plan */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Current
                    </Typography>
                    <Chip 
                      label={currentPlan.toUpperCase()} 
                      color="default" 
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" color="text.secondary">→</Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Upgrading To
                    </Typography>
                    <Chip 
                      label={planName} 
                      color="primary" 
                      icon={<Star />}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Stack>
                
                <Typography variant="h6" color="primary.main" fontWeight={600}>
                  {planPrice}
                  {billingType === 'subscription' && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  )}
                </Typography>
              </Box>

              {/* Key Features (compact) */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Key Features:
                </Typography>
                <Stack spacing={0.5}>
                  {planFeatures.slice(0, 3).map((feature, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1}>
                      <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                      <Typography variant="body2">
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                  {planFeatures.length > 3 && (
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2.5 }}>
                      +{planFeatures.length - 3} more features
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* Right Column - Billing Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              {/* Billing Details */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Billing Details
                </Typography>

                {prorationLoading ? (
                  <Box display="flex" alignItems="center" gap={1} py={1}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Calculating...
                    </Typography>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      bgcolor: 'background.default',
                      borderRadius: 2, 
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {isSubscriptionUpgrade && hasActiveSubscription ? 'Today:' : 'Total:'}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {isSubscriptionUpgrade && hasActiveSubscription && prorationData?.proration ? 
                            prorationData.proration.amount_formatted :
                            planPrice
                          }
                        </Typography>
                      </Box>
                      
                      {isSubscriptionUpgrade && (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Then:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {planPrice}/month
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Billing Type Info */}
                {isSubscriptionUpgrade && hasActiveSubscription && prorationData?.proration ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Proration:</strong> {prorationData.proration.explanation}
                    </Typography>
                  </Alert>
                ) : isSubscriptionUpgrade && !hasActiveSubscription ? (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Free Trial:</strong> {targetPlan === 'premium' ? '14' : '30'} days free
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>One-time:</strong> Lifetime access, no recurring charges
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Note */}
        <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> {isSubscriptionUpgrade ? 
              'Changes take effect immediately. Manage your subscription anytime from your dashboard.' :
              'One-time purchases provide lifetime access to all plan features.'
            }
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <StandardButton onClick={onClose} variant="outlined">
          Cancel
        </StandardButton>
        <StandardButton 
          onClick={handleUpgrade}
          variant="contained"
          startIcon={<Upgrade />}
          isLoading={createUpgradeCheckout.isPending}
          loadingText="Processing..."
          color="primary"
        >
          {isSubscriptionUpgrade && hasActiveSubscription ? 'Upgrade Now' : 
           isSubscriptionUpgrade ? 'Start Free Trial' : 
           'Purchase Now'}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog;
