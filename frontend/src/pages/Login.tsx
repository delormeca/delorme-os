import {
  Box,
  Divider,
  Link,
  Stack,
  Typography,
  alpha,
  useTheme,
  Container,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  Google,
  Login as LoginIcon,
  Visibility,
  Security,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AuthService, LoginForm } from "@/client";
import { useLoginForm } from "@/hooks";
import { useSnackBarContext } from "@/context/SnackBarContext";
import {
  InputText,
  AuthCard,
  AuthPageLogo,
  CTAButton,
  StandardButton,
  AuthFeatureChip,
} from "@/components/ui";
import { Controller } from "react-hook-form";

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useLoginForm();

  const loginMutation = useMutation({
    mutationFn: AuthService.loginApiAuthLoginPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      createSnackBar({
        content: "Welcome back! Login successful",
        autoHide: true,
        severity: "success",
      });
      navigate("/dashboard");
    },
    onError: () => {
      createSnackBar({
        content: "Invalid credentials. Please try again.",
        autoHide: true,
        severity: "error",
      });
    },
  });

  const onForgotPassword = () => {
    navigate("/forgot-password");
  };

  const onSignUp = () => {
    navigate("/signup");
  };

  const onSubmit = async (data: LoginForm) => {
    await loginMutation.mutateAsync(data);
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

          {/* Welcome Header */}
          <Box sx={{ textAlign: "center", mb: 2.5 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                background: `linear-gradient(135deg, 
                    ${theme.palette.text.primary} 0%, 
                    ${theme.palette.primary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: { xs: "0.95rem", md: "1rem" },
              }}
            >
              Sign in to continue building your startup
            </Typography>
          </Box>

          {/* Feature Badges */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            sx={{ mb: 2.5 }}
            flexWrap="wrap"
            useFlexGap
          >
            <AuthFeatureChip icon={<Security />} label="Secure" color="primary" />
            <AuthFeatureChip icon={<Visibility />} label="Private" color="primary" />
          </Stack>

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: "500px",
              mx: "auto",
              width: "100%",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={12}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      label="Email Address"
                      type="email"
                      fullWidth
                      required
                      errors={errors}
                      variant="outlined"
                      placeholder="your@email.com"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: alpha(
                            theme.palette.background.default,
                            0.3
                          ),
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.background.default,
                              0.5
                            ),
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={12}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      label="Password"
                      type="password"
                      fullWidth
                      required
                      errors={errors}
                      variant="outlined"
                      placeholder="Enter your password"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: alpha(
                            theme.palette.background.default,
                            0.3
                          ),
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.background.default,
                              0.5
                            ),
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Box sx={{ textAlign: "right" }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={onForgotPassword}
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <CTAButton
              type="submit"
              fullWidth
              size="large"
              startIcon={<LoginIcon />}
              disabled={isSubmitting || loginMutation.isPending}
            >
              {isSubmitting || loginMutation.isPending
                ? "Signing you in..."
                : "Sign In"}
            </CTAButton>

            <Divider sx={{ my: 2, fontWeight: 500 }}>or continue with</Divider>

            <StandardButton
              variant="outlined"
              href="/api/auth/google/authorize"
              fullWidth
              size="large"
              startIcon={<Google />}
            >
              Sign in with Google
            </StandardButton>

            {loginMutation.isError && (
              <Typography
                color="error"
                variant="body2"
                sx={{
                  textAlign: "center",
                  fontWeight: 500,
                  mt: 2,
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                }}
              >
                Invalid email or password. Please check your credentials and try
                again.
              </Typography>
            )}

            {/* Sign Up Link */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?
                </Typography>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={onSignUp}
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign up now
                </Link>
              </Stack>
            </Box>
          </Box>
        </AuthCard>
      </Container>
    </Box>
  );
}
