import {
  Box,
  Stack,
  Typography,
  alpha,
  useTheme,
  Container,
} from "@mui/material";
import { Lock, CheckCircle, Login } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  AuthCard,
  AuthPageLogo,
  CTAButton,
  StandardButton,
} from "@/components/ui";

export default function PasswordResetSuccess() {
  const theme = useTheme();
  const navigate = useNavigate();

  const onSignIn = () => {
    navigate("/login");
  };

  const onGoHome = () => {
    navigate("/");
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

          {/* Success Icon */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                borderRadius: "50%",
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.success.main, 0.15)}, 
                  ${alpha(theme.palette.primary.main, 0.15)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: `3px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: { xs: "2.5rem", sm: "3rem" },
                  color: theme.palette.success.main,
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
              Password Reset Successful!
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
              Your password has been successfully updated. You can now sign in
              with your new password.
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
              Please keep your new password secure and don't share it with
              anyone.
            </Typography>
          </Box>

          {/* Security Tips */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                textAlign: "center",
              }}
            >
              Security Tips
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: `${theme.shape.borderRadius * 1.5}px`,
                background: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              }}
            >
              <Lock
                sx={{ color: theme.palette.success.main, fontSize: "1.5rem" }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Strong Password Created
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your new password meets all security requirements
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: `${theme.shape.borderRadius * 1.5}px`,
                background: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              }}
            >
              <CheckCircle
                sx={{ color: theme.palette.success.main, fontSize: "1.5rem" }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Account Secured
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your account is now protected with the new password
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack spacing={2}>
            <CTAButton
              fullWidth
              size="large"
              startIcon={<Login />}
              onClick={onSignIn}
            >
              Sign In Now
            </CTAButton>

            <StandardButton
              variant="text"
              fullWidth
              size="large"
              onClick={onGoHome}
            >
              Back to Home
            </StandardButton>
          </Stack>

          {/* Additional Security Note */}
          <Box
            sx={{
              textAlign: "center",
              mt: 3,
              p: 2,
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}
            >
              For your security, this password reset link has been deactivated.
              If you need to reset your password again, please request a new
              reset link.
            </Typography>
          </Box>
        </AuthCard>
      </Container>
    </Box>
  );
}
