import {
  Box,
  Link,
  Stack,
  Typography,
  alpha,
  useTheme,
  Container,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Email, ArrowBack, Security } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useForgotPassword } from "@/hooks/api/useForgotPassword";
import { InputText, AuthCard, AuthPageLogo, CTAButton, StandardButton, AuthFeatureChip } from "@/components/ui";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const forgotPasswordSchema = yup.object({
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
});

type ForgotPasswordForm = yup.InferType<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { createSnackBar } = useSnackBarContext();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useForgotPassword();

  const onBack = () => {
    navigate("/login");
  };

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      createSnackBar({
        content: "Password reset instructions sent to your email",
        autoHide: true,
        severity: "success",
      });
      navigate("/check-email");
    } catch (error) {
      createSnackBar({
        content: "Error sending reset email. Please try again.",
        autoHide: true,
        severity: "error",
      });
    }
  };

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

            {/* Back Button */}
            <Box sx={{ mb: 2 }}>
              <StandardButton
                variant="text"
                startIcon={<ArrowBack />}
                onClick={onBack}
              >
                Back to Login
              </StandardButton>
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
                Forgot Password?
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
                Don't worry, it happens to the best of us. Enter your email and we'll send you reset instructions.
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
              <AuthFeatureChip icon={<Security />} label="Secure Reset" color="info" />
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

              <CTAButton
                type="submit"
                fullWidth
                size="large"
                startIcon={<Email />}
                disabled={isSubmitting || forgotPasswordMutation.isPending}
              >
                {isSubmitting || forgotPasswordMutation.isPending
                  ? "Sending reset email..."
                  : "Send Reset Instructions"}
              </CTAButton>



              {/* Additional Help */}
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{" "}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={onBack}
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