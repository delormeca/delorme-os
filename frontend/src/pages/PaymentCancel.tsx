import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Fade,
} from '@mui/material';
import {
  Cancel,
  ArrowBack,
  Home,
  Refresh,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout, ModernCard, StandardButton, FeatureChip } from '@/components/ui';

const PaymentCancel: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGoBack = () => {
    navigate('/dashboard/billing');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleTryAgain = () => {
    navigate('/pricing');
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'sm', mx: 'auto', py: 8 }}>
        <Fade in={isVisible} timeout={800}>
          <ModernCard variant="glass" withGradientBorder>
            {/* Error Header */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: '4rem', 
                  mb: 2,
                  [theme.breakpoints.down('sm')]: {
                    fontSize: '3rem',
                  },
                }}
              >
                ❌
              </Typography>
              
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: 'error.main' }}>
                Payment Cancelled
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                Your payment was cancelled. No charges were made to your account.
              </Typography>
            </Box>

            {/* Feature Chips */}
            <Stack 
              direction="row" 
              spacing={1.5} 
              justifyContent="center" 
              sx={{ mb: 3 }}
              flexWrap="wrap"
              useFlexGap
            >
              <FeatureChip
                icon={<Refresh />}
                label="Try Again"
                variant="outlined"
              />
              <FeatureChip
                icon={<Home />}
                label="Dashboard"
                variant="outlined"
              />
              <FeatureChip
                icon={<ArrowBack />}
                label="Go Back"
                variant="outlined"
              />
            </Stack>

            {/* Information Section */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: theme.palette.info.main + '10',
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.info.main}30`,
              mb: 3,
              textAlign: "center"
            }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                What happened?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You cancelled the payment process. Your subscription remains unchanged,
                and no payment was processed.
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Stack spacing={2}>
              <StandardButton
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Refresh />}
                onClick={handleTryAgain}
              >
                Try Again
              </StandardButton>

              <StandardButton
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
              >
                Back to Billing
              </StandardButton>

              <StandardButton
                variant="text"
                fullWidth
                startIcon={<Home />}
                onClick={handleGoHome}
                sx={{ color: 'text.secondary' }}
              >
                Go to Dashboard
              </StandardButton>
            </Stack>

            {/* Help Section */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: theme.palette.warning.main + '10',
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.warning.main}30`,
              textAlign: "center"
            }}>
              <Typography variant="body2" color="text.secondary">
                💡 <strong>Need help?</strong> Contact our support team if you're experiencing issues with payment processing.
              </Typography>
            </Box>
          </ModernCard>
        </Fade>
      </Box>
    </DashboardLayout>
  );
};

export default PaymentCancel;