import React, { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Palette,
  Language,
  Storage,
  Shield,
  Save,
  Groups,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  DashboardLayout,
  PageHeader,
  ModernCard,
  StandardButton,
  FormInput,
  FormSection,
  FormGrid,
  StatusBadge,
  FeatureChip
} from '@/components/ui';
import { useStandardForm, formSchemas } from '@/hooks';
import { useUpdateProfile } from '@/hooks/api/useUpdateProfile';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { ProjectLeadsManager } from '@/components/Settings/ProjectLeadsManager';

interface SettingsFormData {
  full_name: string;
  email: string;
  notifications_enabled: boolean;
  dark_mode: boolean;
  language: string;
}

const Settings: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    darkMode: false,
    compactView: false,
  });

  const profileForm = useStandardForm<SettingsFormData>({
    schema: formSchemas.profile,
    onSuccess: async (data) => {
      await updateProfile(data);
    },
    successMessage: "Profile updated successfully!",
    defaultValues: {
      full_name: currentUser?.full_name || '',
      email: currentUser?.email || '',
      notifications_enabled: preferences.emailNotifications,
      dark_mode: preferences.darkMode,
      language: 'en',
    },
  });

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and security"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
        action={
          <FeatureChip
            icon={<Shield />}
            label="Secure"
            variant="filled"
          />
        }
      />

      <Stack spacing={4}>
        {/* Profile Settings */}
        <ModernCard
          title="Profile Information"
          subtitle="Update your personal details"
          icon={<Person />}
          variant="glass"
        >
          <form onSubmit={profileForm.onSubmit}>
            <FormSection>
              <FormGrid columns={2}>
                <FormInput
                  name="full_name"
                  control={profileForm.control}
                  errors={profileForm.formState.errors}
                  label="Full Name"
                  placeholder="Enter your full name"
                />
                
                <FormInput
                  name="email"
                  control={profileForm.control}
                  errors={profileForm.formState.errors}
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                />
              </FormGrid>

              <Box sx={{ pt: 2 }}>
                <StandardButton
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  isLoading={profileForm.isSubmitting}
                  loadingText="Saving..."
                >
                  Save Changes
                </StandardButton>
              </Box>
            </FormSection>
          </form>
        </ModernCard>

        {/* Project Leads Management */}
        <ModernCard
          title="Project Leads"
          subtitle="Manage project leads and client assignments"
          icon={<Groups />}
          variant="glass"
        >
          <ProjectLeadsManager />
        </ModernCard>

        {/* Notification Preferences */}
        <ModernCard
          title="Notifications"
          subtitle="Control how you receive updates"
          icon={<Notifications />}
          variant="glass"
        >
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={() => handlePreferenceChange('emailNotifications')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Email Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive important updates via email
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Divider />

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.pushNotifications}
                    onChange={() => handlePreferenceChange('pushNotifications')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Push Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get instant notifications in your browser
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Divider />

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.marketingEmails}
                    onChange={() => handlePreferenceChange('marketingEmails')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Marketing Emails
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive product updates and tips
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </ModernCard>

        {/* Appearance Settings */}
        <ModernCard
          title="Appearance"
          subtitle="Customize your interface"
          icon={<Palette />}
          variant="glass"
        >
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.darkMode}
                    onChange={() => handlePreferenceChange('darkMode')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Dark Mode
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use dark theme for better visibility in low light
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Divider />

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.compactView}
                    onChange={() => handlePreferenceChange('compactView')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Compact View
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Show more content in less space
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </ModernCard>

        {/* Security Settings */}
        <ModernCard
          title="Security & Privacy"
          subtitle="Manage your account security"
          icon={<Security />}
          variant="gradient"
        >
          <Stack spacing={3}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                Your account is protected with industry-standard security measures.
                We recommend enabling two-factor authentication for additional security.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add an extra layer of security to your account
                </Typography>
              </Box>
              <StatusBadge status="warning" label="Not Enabled" />
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last changed 30 days ago
                </Typography>
              </Box>
              <StandardButton
                variant="outlined"
                size="small"
                onClick={() => navigate('/dashboard/change-password')}
              >
                Change Password
              </StandardButton>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Login Sessions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your active sessions
                </Typography>
              </Box>
              <StandardButton
                variant="outlined"
                size="small"
                onClick={() => navigate('/dashboard/sessions')}
              >
                View Sessions
              </StandardButton>
            </Box>
          </Stack>
        </ModernCard>

        {/* Data & Storage */}
        <ModernCard
          title="Data & Storage"
          subtitle="Manage your data and exports"
          icon={<Storage />}
          variant="glass"
        >
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Export Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download all your articles and data
                </Typography>
              </Box>
              <StandardButton
                variant="outlined"
                size="small"
                onClick={() => {/* Handle export */}}
              >
                Export
              </StandardButton>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Delete Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Permanently delete your account and all data
                </Typography>
              </Box>
              <StandardButton
                variant="outlined"
                color="error"
                size="small"
                onClick={() => navigate('/dashboard/delete-account')}
              >
                Delete Account
              </StandardButton>
            </Box>
          </Stack>
        </ModernCard>
      </Stack>
    </DashboardLayout>
  );
};

export default Settings;
