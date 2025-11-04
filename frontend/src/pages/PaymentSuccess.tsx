import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import {
  CheckCircle,
  Download,
  Dashboard as DashboardIcon,
  Receipt,
  Home,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { ModernCard, CTAButton, StandardButton } from "@/components/ui";
import {
  useHandleCheckoutSuccess,
  type PaymentResponse,
  type SubscriptionResponse,
} from "@/hooks/api/usePayments";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";


interface PaymentSuccessData {
  type: "payment" | "subscription";
  data: PaymentResponse | SubscriptionResponse;
}

const PaymentSuccess: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");
  const handleSuccess = useHandleCheckoutSuccess();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sessionId) {
      handleSuccess.mutate(sessionId, {
        onSuccess: (data) => {
          // Determine if it's a payment or subscription based on the response structure
          if ("download_url" in data || "stripe_payment_intent_id" in data) {
            setPaymentData({ type: "payment", data: data as PaymentResponse });
          } else {
            setPaymentData({
              type: "subscription",
              data: data as SubscriptionResponse,
            });
          }
          
          // Invalidate plan-related queries to refresh dashboard data
          queryClient.invalidateQueries({ queryKey: ['userPlan'] });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          queryClient.invalidateQueries({ queryKey: ['featureAccess'] });
          queryClient.invalidateQueries({ queryKey: ['availableUpgrades'] });
        },
        onError: (error) => {
          setError(error.message);
        },
      });
    } else {
      setError("No session ID provided");
    }
  }, [sessionId]);

  const formatCurrency = (amountCents: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownload = (downloadUrl: string) => {
    window.open(downloadUrl, "_blank");
  };

  const handleGoToDashboard = () => {
    // Force refresh plan data before navigating
    queryClient.invalidateQueries({ queryKey: ['userPlan'] });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    navigate("/dashboard?refreshPlan=true");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (handleSuccess.isPending) {
    return (
      <DashboardLayout>
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <ModernCard variant="glass">
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress size={60} color="primary" />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
                  Processing your payment...
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Please wait while we confirm your transaction
                </Typography>
              </Box>
            </ModernCard>
        </Container>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <ModernCard variant="glass">
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                    color: "error.main",
                  }}
                >
                  Payment Processing Error
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  There was an issue processing your payment
                </Typography>
              </Box>

              <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
                {error}
              </Alert>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, textAlign: "center" }}
              >
                Please contact support if you believe this is an error.
              </Typography>

              <Stack spacing={2}>
                <StandardButton
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate("/pricing")}
                >
                  Back to Pricing
                </StandardButton>
                <CTAButton
                  fullWidth
                  size="large"
                  onClick={() => navigate("/contact")}
                >
                  Contact Support
                </CTAButton>
              </Stack>
            </ModernCard>
        </Container>
      </DashboardLayout>
    );
  }

  if (!paymentData) {
    return (
      <DashboardLayout>
        <Box />
      </DashboardLayout>
    );
  }

  const isPayment = paymentData.type === "payment";
  const data = paymentData.data;

  return (
    <DashboardLayout>
      <Container maxWidth="sm" sx={{ py: 4 }}>
          <ModernCard variant="glass">
            {/* Success Header */}
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <CheckCircle sx={{ 
                fontSize: "4rem", 
                color: theme.palette.success.main, 
                mb: 2 
              }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                  background: `linear-gradient(135deg, 
                  ${theme.palette.text.primary} 0%, 
                  ${theme.palette.success.main} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {isPayment ? "Payment Successful!" : "Subscription Activated!"}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {isPayment
                  ? "Your purchase has been completed successfully"
                  : "Welcome to your new subscription plan"}
              </Typography>
            </Box>

            {/* Feature Badges */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              sx={{ mb: 3 }}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip 
                icon={<CheckCircle />} 
                label="Confirmed" 
                color="success"
                variant="outlined"
              />
              <Chip 
                icon={<Receipt />} 
                label="Receipt Sent" 
                color="primary"
                variant="outlined"
              />
              {isPayment && (
                <Chip 
                  icon={<Download />} 
                  label="Ready to Download" 
                  color="info"
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Payment/Subscription Details */}
            <Box
              sx={{
                background: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                borderRadius: 1.5,
                p: 3,
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Transaction Details
              </Typography>

              {isPayment ? (
                <Stack spacing={1}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Product:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {(data as PaymentResponse).product_id}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Amount:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(
                        (data as PaymentResponse).amount,
                        (data as PaymentResponse).currency
                      )}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Date:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate((data as PaymentResponse).created_at)}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Plan:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {(data as SubscriptionResponse).plan_id}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {(data as SubscriptionResponse).status}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Next Billing:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(
                        (data as SubscriptionResponse).current_period_end
                      )}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>

            {/* Download Section for One-time Payments */}
            {isPayment && (data as PaymentResponse).download_url && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Download Your Purchase
                </Typography>
                <CTAButton
                  fullWidth
                  size="large"
                  startIcon={<Download />}
                  onClick={() =>
                    handleDownload((data as PaymentResponse).download_url!)
                  }
                >
                  Download Files
                </CTAButton>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack spacing={2}>
              <CTAButton
                fullWidth
                size="large"
                startIcon={<DashboardIcon />}
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </CTAButton>

              <StandardButton
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<Home />}
                onClick={handleGoHome}
              >
                Return to Home
              </StandardButton>
            </Stack>

            {/* Additional Information */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                borderRadius: 1.5,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                📧 <strong>Receipt sent to your email</strong> • 🔒 Secure
                transaction • 💬 Need help? Contact support
              </Typography>
            </Box>
          </ModernCard>
      </Container>
    </DashboardLayout>
  );
};

export default PaymentSuccess;
