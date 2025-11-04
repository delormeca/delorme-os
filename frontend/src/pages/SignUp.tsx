import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
  PersonAdd,
  Shield,
  Speed,
  CheckCircle,
} from "@mui/icons-material";
import { AuthService, SignupForm } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import {
  InputText,
  AuthCard,
  AuthPageLogo,
  CTAButton,
  StandardButton,
  AuthFeatureChip,
} from "@/components/ui";
import { useSignUpForm } from "@/hooks";
import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";

export default function SignUp() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { createSnackBar } = useSnackBarContext();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useSignUpForm();

  const signUpMutation = useMutation({
    mutationFn: AuthService.signupApiAuthSignupPost,
    onSuccess: () => {
      createSnackBar({
        content: "Account created successfully! Please sign in.",
        autoHide: true,
        severity: "success",
      });
      navigate("/login");
    },
    onError: () => {
      createSnackBar({
        content: "Error creating account. Please try again.",
        autoHide: true,
        severity: "error",
      });
    },
  });

  const onLogin = () => {
    navigate("/login");
  };

  const onSubmit = (data: SignupForm) => {
    signUpMutation.mutateAsync({
      email: data.email,
      full_name: data.full_name,
      password: data.password,
    });
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
              Start Your Journey
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: { xs: "0.95rem", md: "1rem" },
              }}
            >
              Create your account and launch your startup in minutes
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
            <AuthFeatureChip icon={<Speed />} label="Quick Setup" color="success" />
            <AuthFeatureChip icon={<Shield />} label="Secure" color="success" />
            <AuthFeatureChip icon={<CheckCircle />} label="Free Start" color="success" />
          </Stack>

          {/* Sign Up Form */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: "600px",
              mx: "auto",
              width: "100%",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="full_name"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      label="Full Name"
                      fullWidth
                      required
                      errors={errors}
                      variant="outlined"
                      placeholder="John Doe"
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

              <Grid size={{ xs: 12, md: 6 }}>
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
                      placeholder="your@email.com"
                      variant="outlined"
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

              <Grid size={{ xs: 12, md: 6 }}>
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
                      placeholder="Create a strong password"
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

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="verify_password"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      label="Confirm Password"
                      type="password"
                      fullWidth
                      required
                      errors={errors}
                      variant="outlined"
                      placeholder="Confirm your password"
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

            <CTAButton
              type="submit"
              fullWidth
              size="large"
              startIcon={<PersonAdd />}
              disabled={isSubmitting || signUpMutation.isPending}
            >
              {isSubmitting || signUpMutation.isPending
                ? "Creating your account..."
                : "Create Account"}
            </CTAButton>

            <Divider sx={{ my: 2, fontWeight: 500 }}>or continue with</Divider>

            <StandardButton
              variant="outlined"
              href="/api/auth/google/authorize"
              fullWidth
              size="large"
              startIcon={<Google />}
            >
              Sign up with Google
            </StandardButton>

            {signUpMutation.isError && (
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
                Error creating account. Please check your information and try
                again.
              </Typography>
            )}

            {/* Terms Notice */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: "center",
                mt: 1,
                fontSize: { xs: "0.8rem", md: "0.875rem" },
              }}
            >
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                sx={{ color: "primary.main", fontWeight: 500 }}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                sx={{ color: "primary.main", fontWeight: 500 }}
              >
                Privacy Policy
              </Link>
            </Typography>

            {/* Login Link */}
            <Box sx={{ textAlign: "center", mt: 1.5 }}>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Typography variant="body2" color="text.secondary">
                  Already have an account?
                </Typography>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={onLogin}
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign in here
                </Link>
              </Stack>
            </Box>
          </Box>
        </AuthCard>
      </Container>
    </Box>
  );
}
