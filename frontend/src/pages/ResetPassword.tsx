import {
  Box,
  Link,
  Stack,
  Typography,
  alpha,
  useTheme,
  Container,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Lock, Visibility, VisibilityOff, Security, CheckCircle } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useResetPassword } from "@/hooks/api/useResetPassword";
import { InputText, AuthCard, AuthPageLogo, CTAButton, AuthFeatureChip } from "@/components/ui";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords don't match")
    .required("Please confirm your password"),
});

type ResetPasswordForm = yup.InferType<typeof resetPasswordSchema>;

const PasswordRequirement: React.FC<{ met: boolean; children: React.ReactNode }> = ({ met, children }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      fontSize: "0.8rem",
      color: met ? theme.palette.success.main : theme.palette.text.secondary,
    }}>
      {children}
    </Box>
  );
};

export default function ResetPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { createSnackBar } = useSnackBarContext();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token");

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
  } = useForm<ResetPasswordForm>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  if (!token) {
    createSnackBar({
      content: "Invalid or missing reset token. Please request a new password reset.",
      autoHide: true,
      severity: "error",
    });
    navigate("/forgot-password");
    return null;
  }

  const resetPasswordMutation = useResetPassword();

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await resetPasswordMutation.mutateAsync({
        token: token!,
        password: data.password,
      });
      createSnackBar({
        content: "Password reset successfully! You can now sign in with your new password.",
        autoHide: true,
        severity: "success",
      });
      navigate("/login");
    } catch (error) {
      createSnackBar({
        content: "Error resetting password. The link may have expired. Please try again.",
        autoHide: true,
        severity: "error",
      });
    }
  };

  // Password strength checks
  const hasMinLength = password?.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password || "");
  const hasLowerCase = /[a-z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");

  if (!token) {
    return null;
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 2,
      pt: 12,
      pb: 6,
    }}>
      <Container maxWidth="sm">
          <AuthCard>
            {/* Logo Section */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <AuthPageLogo />
            </Box>

            {/* Header */}
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
                Reset Your Password
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: "0.95rem", md: "1rem" },
                  lineHeight: 1.6,
                }}
              >
                Please enter your new password below. Make sure it's strong and secure.
              </Typography>
            </Box>

            {/* Feature Badge */}
            <Stack 
              direction="row" 
              spacing={1.5} 
              justifyContent="center" 
              sx={{ mb: 2.5 }}
              flexWrap="wrap"
              useFlexGap
            >
              <AuthFeatureChip icon={<Security />} label="Secure Reset" color="success" />
            </Stack>

            {/* Form */}
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 2,
                maxWidth: "400px",
                mx: "auto",
                width: "100%"
              }}
            >
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        {...field}
                        label="New Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        required
                        errors={errors}
                        variant="outlined"
                        placeholder="Enter your new password"
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              size="small"
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.background.default, 0.3),
                            "&:hover": {
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        {...field}
                        label="Confirm New Password"
                        type={showConfirmPassword ? "text" : "password"}
                        fullWidth
                        required
                        errors={errors}
                        variant="outlined"
                        placeholder="Confirm your new password"
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              size="small"
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.background.default, 0.3),
                            "&:hover": {
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Password Requirements */}
              {password && (
                <Box 
                  sx={{ 
                    p: 2,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Password Requirements:
                  </Typography>
                  <Stack spacing={0.5}>
                    <PasswordRequirement met={hasMinLength}>
                      <CheckCircle />
                      At least 8 characters
                    </PasswordRequirement>
                    <PasswordRequirement met={hasUpperCase}>
                      <CheckCircle />
                      One uppercase letter
                    </PasswordRequirement>
                    <PasswordRequirement met={hasLowerCase}>
                      <CheckCircle />
                      One lowercase letter
                    </PasswordRequirement>
                    <PasswordRequirement met={hasNumber}>
                      <CheckCircle />
                      One number
                    </PasswordRequirement>
                  </Stack>
                </Box>
              )}

              <CTAButton
                type="submit"
                fullWidth
                size="large"
                startIcon={<Lock />}
                disabled={isSubmitting || resetPasswordMutation.isPending}
              >
                {isSubmitting || resetPasswordMutation.isPending
                  ? "Resetting password..."
                  : "Reset Password"}
              </CTAButton>



              {/* Additional Help */}
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{" "}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => navigate("/login")}
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
                </Typography>
              </Box>
            </Box>
          </AuthCard>
      </Container>
    </Box>
  );
} 