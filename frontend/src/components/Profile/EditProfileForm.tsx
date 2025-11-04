import React, { useEffect } from "react";
import {
  Typography,
  Stack,
  Box,
  useTheme,
  Avatar,
  Divider,
  alpha,
} from "@mui/material";
import { useUpdateProfile } from "@/hooks/api/useUpdateProfile";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";
import { ArrowBack, Person, Save } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { 
  DashboardLayout,
  ModernCard,
  StandardButton,
  StandardIconButton,
  FormInput,
  FormSection,
  LoadingState
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";

interface IEditProfileFormInputs {
  full_name: string;
  email: string;
}

export const EditProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const form = useStandardForm<IEditProfileFormInputs>({
    schema: formSchemas.profile,
    onSuccess: async (data) => {
      await updateProfile(data);
    },
    successMessage: "Profile updated successfully!",
    defaultValues: {
      full_name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
      });
    }
  }, [currentUser, form.reset]);

  if (userLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Edit Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your account information
            </Typography>
          </Box>
        </Box>

        {/* User Info Section */}
        <ModernCard
          title="Profile Information"
          icon={<Person />}
          variant="glass"
          sx={{ mb: 3 }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3, 
            p: 3, 
            background: alpha(theme.palette.primary.main, 0.03),
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 3,
          }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80,
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.secondary.main})`,
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {currentUser?.full_name || 'User'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date().getFullYear()}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={form.onSubmit}>
            <FormSection 
              title="Personal Information"
              description="Update your basic profile details"
            >
              <FormInput
                name="full_name"
                control={form.control}
                errors={form.formState.errors}
                label="Full Name"
                placeholder="Enter your full name"
                fullWidth
              />
              
              <FormInput
                name="email"
                control={form.control}
                errors={form.formState.errors}
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                fullWidth
              />
            </FormSection>

            <Divider sx={{ my: 3 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <StandardButton
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </StandardButton>
              <StandardButton
                type="submit"
                variant="contained"
                startIcon={<Save />}
                isLoading={form.isSubmitting}
                loadingText="Saving..."
                sx={{ flex: 1 }}
              >
                Save Changes
              </StandardButton>
            </Stack>
          </form>
        </ModernCard>
      </Box>
    </DashboardLayout>
  );
};