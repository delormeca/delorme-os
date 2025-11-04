/**
 * Integrations Page
 * 
 * Displays available integrations based on user's plan.
 * Allows users to set up and manage third-party integrations.
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Extension,
  Settings,
  CheckCircle,
  Error,
  Info,
  Launch,
  Add,
  Close,
} from '@mui/icons-material';
import { PermissionGuard } from '@/components/PermissionGuard';
import { 
  useAvailableIntegrations, 
  useIntegrationStatus, 
  useIntegrationDetails,
  useSetupIntegration 
} from '@/hooks/api/useIntegrations';
import { useUserPlan } from '@/hooks/api/usePlans';
import { useSnackBarContext } from '@/context/SnackBarContext';
import DashboardLayout from '@/components/ui/DashboardLayout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integrations-tabpanel-${index}`}
      aria-labelledby={`integrations-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const IntegrationCard: React.FC<{
  integration: any;
  onSetup: (id: string) => void;
  onViewDetails: (id: string) => void;
}> = ({ integration, onSetup, onViewDetails }) => {
  const getStatusColor = (available: boolean, setupRequired: boolean) => {
    if (!available) return 'error';
    if (setupRequired) return 'warning';
    return 'success';
  };

  const getStatusText = (available: boolean, setupRequired: boolean) => {
    if (!available) return 'Unavailable';
    if (setupRequired) return 'Setup Required';
    return 'Ready';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="div">
            {integration.name}
          </Typography>
          <Chip
            label={getStatusText(integration.available, integration.setup_required)}
            color={getStatusColor(integration.available, integration.setup_required)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {integration.description}
        </Typography>

        <Box mb={2}>
          <Chip 
            label={integration.category} 
            variant="outlined" 
            size="small" 
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {integration.features && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Features:
            </Typography>
            <Stack spacing={0.5}>
              {integration.features.slice(0, 3).map((feature: string, index: number) => (
                <Typography key={index} variant="body2" color="text.secondary">
                  • {feature}
                </Typography>
              ))}
              {integration.features.length > 3 && (
                <Typography variant="body2" color="text.secondary">
                  +{integration.features.length - 3} more features
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button size="small" onClick={() => onViewDetails(integration.id)}>
          Details
        </Button>
        {integration.available && (
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => onSetup(integration.id)}
            disabled={!integration.setup_required}
          >
            {integration.setup_required ? 'Setup' : 'Configured'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const Integrations: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [setupConfig, setSetupConfig] = useState<Record<string, string>>({});

  const { data: userPlan } = useUserPlan();
  const { data: availableIntegrations, isLoading } = useAvailableIntegrations();
  const { data: integrationStatus } = useIntegrationStatus();
  const { data: integrationDetails } = useIntegrationDetails(selectedIntegration || '');
  const setupIntegration = useSetupIntegration();
  const { createSnackBar } = useSnackBarContext();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSetup = (integrationId: string) => {
    setSelectedIntegration(integrationId);
    setSetupDialogOpen(true);
    setSetupConfig({});
  };

  const handleViewDetails = (integrationId: string) => {
    setSelectedIntegration(integrationId);
    setDetailsDialogOpen(true);
  };

  const handleSetupSubmit = async () => {
    if (!selectedIntegration) return;

    try {
      await setupIntegration.mutateAsync({
        integrationId: selectedIntegration,
        config: setupConfig,
      });

      createSnackBar({
        content: 'Integration setup completed successfully!',
        severity: 'success',
      });

      setSetupDialogOpen(false);
      setSetupConfig({});
    } catch (error) {
      createSnackBar({
        content: 'Failed to setup integration. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleCloseDialogs = () => {
    setSetupDialogOpen(false);
    setDetailsDialogOpen(false);
    setSelectedIntegration(null);
    setSetupConfig({});
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading integrations...</Typography>
      </Container>
    );
  }

  const integrationTiers = availableIntegrations?.integrations || {};
  const allIntegrations = [
    ...(integrationTiers.basic || []),
    ...(integrationTiers.premium || []),
    ...(integrationTiers.enterprise || []),
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ width: '100%' }}>
        <Box mb={4}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1.2 
            }}
          >
            Integrations
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{ gap: { xs: 1, sm: 2 } }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Current Plan:
              </Typography>
              <Chip 
                label={userPlan?.current_plan || 'Free'} 
                color="primary" 
                variant="outlined"
                size="small"
              />
            </Stack>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Available Integrations: {availableIntegrations?.total_available || 0}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, width: '100%' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="integration tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: { xs: 0, sm: 1 },
              },
              '& .MuiTab-root': {
                minWidth: { xs: 'auto', sm: 120 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                padding: { xs: '12px 8px', sm: '12px 16px' },
                '& .MuiSvgIcon-root': {
                  display: { xs: 'none', sm: 'block' },
                },
              },
            }}
          >
            <Tab label="All Integrations" icon={<Extension />} iconPosition="start" />
            <Tab label="My Integrations" icon={<Settings />} iconPosition="start" />
            <Tab label="Basic" />
            <Tab label="Premium" />
            <Tab label="Enterprise" />
          </Tabs>
        </Box>

      {/* All Integrations Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {allIntegrations.map((integration: any) => (
            <Grid item xs={12} md={6} lg={4} key={integration.id}>
              <IntegrationCard
                integration={integration}
                onSetup={handleSetup}
                onViewDetails={handleViewDetails}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* My Integrations Tab */}
      <TabPanel value={tabValue} index={1}>
        {integrationStatus && integrationStatus.integrations && integrationStatus.integrations.length > 0 ? (
          <Grid container spacing={3}>
            {integrationStatus.integrations.map((integration: any) => (
              <Grid item xs={12} md={6} lg={4} key={integration.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{integration.name}</Typography>
                      <Chip
                        label={integration.status}
                        color={integration.status === 'active' ? 'success' : 'warning'}
                        size="small"
                        icon={integration.status === 'active' ? <CheckCircle /> : <Error />}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Last used: {new Date(integration.last_used).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Events sent: {integration.events_sent}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleViewDetails(integration.id)}>
                      Manage
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No integrations configured yet. Set up your first integration from the available options.
          </Alert>
        )}
      </TabPanel>

      {/* Basic Integrations Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {integrationTiers.basic?.map((integration: any) => (
            <Grid item xs={12} md={6} lg={4} key={integration.id}>
              <IntegrationCard
                integration={integration}
                onSetup={handleSetup}
                onViewDetails={handleViewDetails}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Premium Integrations Tab */}
      <TabPanel value={tabValue} index={3}>
        <PermissionGuard feature="premium_integrations">
          <Grid container spacing={3}>
            {integrationTiers.premium?.map((integration: any) => (
              <Grid item xs={12} md={6} lg={4} key={integration.id}>
                <IntegrationCard
                  integration={integration}
                  onSetup={handleSetup}
                  onViewDetails={handleViewDetails}
                />
              </Grid>
            ))}
          </Grid>
        </PermissionGuard>
      </TabPanel>

      {/* Enterprise Integrations Tab */}
      <TabPanel value={tabValue} index={4}>
        <PermissionGuard feature="custom_integrations">
          <Grid container spacing={3}>
            {integrationTiers.enterprise?.map((integration: any) => (
              <Grid item xs={12} md={6} lg={4} key={integration.id}>
                <IntegrationCard
                  integration={integration}
                  onSetup={handleSetup}
                  onViewDetails={handleViewDetails}
                />
              </Grid>
            ))}
          </Grid>
        </PermissionGuard>
      </TabPanel>

      {/* Setup Dialog */}
      <Dialog 
        open={setupDialogOpen} 
        onClose={handleCloseDialogs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Setup Integration
            <IconButton onClick={handleCloseDialogs} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure your integration settings below. You can change these later.
          </Alert>
          
          <Stack spacing={3}>
            <TextField
              label="API Key"
              type="password"
              fullWidth
              value={setupConfig.apiKey || ''}
              onChange={(e) => setSetupConfig({ ...setupConfig, apiKey: e.target.value })}
              helperText="Your integration API key"
            />
            <TextField
              label="Webhook URL"
              fullWidth
              value={setupConfig.webhookUrl || ''}
              onChange={(e) => setSetupConfig({ ...setupConfig, webhookUrl: e.target.value })}
              helperText="Optional webhook URL for notifications"
            />
            <TextField
              label="Additional Settings"
              multiline
              rows={3}
              fullWidth
              value={setupConfig.settings || ''}
              onChange={(e) => setSetupConfig({ ...setupConfig, settings: e.target.value })}
              helperText="JSON configuration (optional)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleSetupSubmit}
            variant="contained"
            disabled={setupIntegration.isPending}
          >
            {setupIntegration.isPending ? 'Setting up...' : 'Setup Integration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={handleCloseDialogs}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Integration Details
            <IconButton onClick={handleCloseDialogs} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {integrationDetails && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {integrationDetails.name}
                </Typography>
                <Typography variant="body1" paragraph>
                  {integrationDetails.description}
                </Typography>
                <Chip 
                  label={integrationDetails.category} 
                  variant="outlined" 
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>

              {!integrationDetails.has_access && (
                <Alert severity="warning">
                  This integration requires {integrationDetails.required_plan} plan or higher.
                </Alert>
              )}

              {integrationDetails.setup_steps && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Setup Steps
                  </Typography>
                  <Stack spacing={1}>
                    {integrationDetails.setup_steps.map((step: string, index: number) => (
                      <Typography key={index} variant="body2">
                        {index + 1}. {step}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}

              {integrationDetails.features && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Features
                  </Typography>
                  <Stack spacing={1}>
                    {Object.entries(integrationDetails.features).map(([feature, description]) => (
                      <Box key={feature}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {feature.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {description as string}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Close</Button>
          {integrationDetails?.has_access && (
            <Button 
              variant="contained"
              startIcon={<Settings />}
              onClick={() => {
                handleCloseDialogs();
                handleSetup(integrationDetails.id);
              }}
            >
              Configure
            </Button>
          )}
        </DialogActions>
      </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default Integrations;
