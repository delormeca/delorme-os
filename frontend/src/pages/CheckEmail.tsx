import {
  Box,
  Stack,
  Typography,
  alpha,
  useTheme,
  Container,
} from "@mui/material";
import { Email, ArrowBack, CheckCircle, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  AuthCard,
  AuthPageLogo,
  CTAButton,
  StandardButton,
} from "@/components/ui";

export default function CheckEmail() {
  const theme = useTheme();
  const navigate = useNavigate();

  const onBackToLogin = () => {
    navigate("/login");
  };

  const onResendEmail = () => {
    navigate("/forgot-password");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        pt: 12,
        pb: 6,
      }}
    >
      <Container maxWidth="sm">
        <AuthCard>
          {/* Logo Section */}
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <AuthPageLogo />
          </Box>

          {/* Email Icon with Check */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                borderRadius: "50%",
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.success.main, 0.15)}, 
                  ${alpha(theme.palette.primary.main, 0.15)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                position: "relative",
              }}
            >
              <Email
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                  color: theme.palette.success.main,
                }}
              />
              <CheckCircle
                sx={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  color: theme.palette.common.white,
                  background: theme.palette.success.main,
                  borderRadius: "50%",
                }}
              />
            </Box>
          </Box>

          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                background: `linear-gradient(135deg, 
                    ${theme.palette.text.primary} 0%, 
                    ${theme.palette.success.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Check Your Email
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: { xs: "0.95rem", md: "1rem" },
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              We've sent password reset instructions to your email address.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.85rem", md: "0.9rem" },
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              Please check your inbox and follow the link to reset your
              password.
            </Typography>
          </Box>

          {/* Instructions */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              mb: 4,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.info.main,
                mb: 1.5,
              }}
            >
              What's next?
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                • Check your email inbox (and spam folder)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Click the "Reset Password" button in the email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Create a new, secure password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Sign in with your new password
              </Typography>
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack spacing={2}>
            <CTAButton
              fullWidth
              size="large"
              startIcon={<ArrowBack />}
              onClick={onBackToLogin}
            >
              Back to Login
            </CTAButton>

            <StandardButton
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<Refresh />}
              onClick={onResendEmail}
            >
              Didn't receive the email? Resend
            </StandardButton>
          </Stack>

          {/* Help Text */}
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.85rem" }}
            >
              If you continue to have problems, please contact our support team.
            </Typography>
          </Box>
        </AuthCard>
      </Container>
    </Box>
  );
}
