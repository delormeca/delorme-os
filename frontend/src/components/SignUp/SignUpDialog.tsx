import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { 
  Box, 
  Grid, 
  Typography, 
  Divider, 
  IconButton, 
  styled, 
  alpha, 
  useTheme,
  Stack,
  Avatar,
} from "@mui/material";
import { Google, Close, Rocket, PersonAdd, Email, Lock, Person } from "@mui/icons-material";
import { useMutation } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthService, SignupForm } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useSignUpDialogContext } from "@/context/SignUpDialogContext";
import { useSignUpForm } from "@/hooks";
import { InputText } from "@/components/ui";
import { Controller } from "react-hook-form";

const ModernDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    overflow: 'auto',
    borderRadius: `${theme.shape.borderRadius * 1.5}px`,
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.background.paper, 0.98)} 0%, 
      ${alpha(theme.palette.background.default, 0.95)} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.15)}`,
    position: 'relative',
    maxWidth: 480,
    width: '100%',
    margin: theme.spacing(2),
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: `linear-gradient(90deg, 
        ${theme.palette.primary.main}, 
        ${theme.palette.secondary.main})`,
    },
    
    ...theme.applyStyles("dark", {
      background: `linear-gradient(135deg, 
        ${alpha(theme.palette.background.paper, 0.95)} 0%, 
        ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.4)}`,
    }),
  },
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 4, 2),
  textAlign: 'center',
  position: 'relative',
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  background: alpha(theme.palette.background.paper, 0.8),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    background: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    transform: 'scale(1.05)',
  },
}));

const LogoAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  margin: '0 auto 16px',
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
  },
}));

const FormContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 4, 4),
}));

const GoogleButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontWeight: 600,
  height: 48,
  background: alpha(theme.palette.background.paper, 0.8),
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.05),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
  },
  
  '& .MuiSvgIcon-root': {
    color: '#4285f4',
  },
}));

const SignUpButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontWeight: 700,
  height: 48,
  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
  
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
  },
}));

const DividerSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(3, 0),
  gap: theme.spacing(2),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  flex: 1,
  '&::before, &::after': {
    borderColor: alpha(theme.palette.divider, 0.3),
  },
}));

export default function SignUpDialog() {
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
        content: "Welcome! Sign up successful 🎉",
        autoHide: true,
        severity: "success",
      });
      handleClose();
      navigate("/login");
    },
    onError: () => {
      createSnackBar({
        content: "Failed to create account. Please try again.",
        autoHide: true,
        severity: "error",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    signUpMutation.mutateAsync({
      email: data.email,
      full_name: data.full_name,
      password: data.password,
    });
  };
  
  const { open, handleClose } = useSignUpDialogContext();

  return (
    <ModernDialog 
      open={open} 
      onClose={handleClose}
      aria-labelledby="signup-dialog-title"
      aria-describedby="signup-dialog-description"
    >
      <HeaderSection>
        <CloseButton onClick={handleClose} size="small">
          <Close fontSize="small" />
        </CloseButton>
        
        <LogoAvatar>
          <Rocket />
        </LogoAvatar>
        
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 800, 
            mb: 1,
            background: `linear-gradient(135deg, 
              ${theme.palette.text.primary} 0%, 
              ${theme.palette.primary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Join CraftYourStartup
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: '1.1rem', lineHeight: 1.5 }}
        >
          Start building your dream startup today with our powerful tools and resources
        </Typography>
      </HeaderSection>

      <FormContainer>
        {/* Google Sign Up Button */}
        <GoogleButton
          href="/api/auth/google/authorize"
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<Google />}
        >
          Continue with Google
        </GoogleButton>

        <DividerSection>
          <StyledDivider />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            or sign up with email
          </Typography>
          <StyledDivider />
        </DividerSection>

        <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
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
                />
              )}
            />
            
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
                />
              )}
            />
            
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
                />
              )}
            />
            
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
                />
              )}
            />
          </Stack>

          <SignUpButton
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting || signUpMutation.isPending}
            startIcon={isSubmitting || signUpMutation.isPending ? null : <PersonAdd />}
            sx={{ mt: 4, mb: 3 }}
          >
            {isSubmitting || signUpMutation.isPending
              ? "Creating your account..."
              : "Create Account"}
          </SignUpButton>

          {signUpMutation.isError && (
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 1.5, 
                background: alpha(theme.palette.error.main, 0.05),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                mb: 2,
              }}
            >
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ fontWeight: 500, textAlign: 'center' }}
              >
                Failed to create account. Please check your information and try again.
              </Typography>
            </Box>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Typography 
                component={NavLink} 
                to="/login" 
                onClick={handleClose}
                sx={{ 
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in here
              </Typography>
            </Typography>
          </Box>
        </Box>
      </FormContainer>
    </ModernDialog>
  );
}
