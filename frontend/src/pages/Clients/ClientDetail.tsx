import React from 'react';
import {
  Box,
  Typography,
  Stack,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  CalendarToday,
  Edit,
  Delete,
  Add,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail, useDeleteClient } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  ModernCard,
  StandardIconButton,
  LoadingState,
  StandardButton,
} from '@/components/ui';
import { ProjectsList } from '@/components/Projects/ProjectsList';
import { useConfirm } from 'material-ui-confirm';
import { useQueryClient } from '@tanstack/react-query';

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { data: client, isLoading, error } = useClientDetail(clientId || '');
  const { mutateAsync: deleteClient } = useDeleteClient();

  const handleDelete = async () => {
    if (!client) return;

    const result = await confirm({
      description: `Are you sure you want to delete "${client.name}"? This will also delete all associated projects and data.`,
      title: 'Delete Client',
      confirmationText: 'Delete',
      cancellationText: 'Cancel',
    });

    if (result.confirmed) {
      await deleteClient(client.id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading client..." />
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Client not found
          </Typography>
          <StandardButton
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/clients')}
          >
            Back to Clients
          </StandardButton>
        </Box>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate('/clients')}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Client Details
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <StandardButton
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/clients/${client.id}/edit`)}
              size="small"
            >
              Edit
            </StandardButton>
            <StandardButton
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
              size="small"
            >
              Delete
            </StandardButton>
          </Stack>
        </Box>

        {/* Client Information Card */}
        <ModernCard variant="glass" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'start', gap: 3 }}>
            <Business
              sx={{
                fontSize: 64,
                color: theme.palette.primary.main,
                opacity: 0.8,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {client.name}
              </Typography>

              <Stack spacing={2}>
                {client.industry && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Industry
                    </Typography>
                    <Typography variant="body1">
                      {client.industry}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Created
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarToday sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formatDate(client.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </ModernCard>

        {/* Projects Section */}
        <Box>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Projects
            </Typography>
            <StandardButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate(`/clients/${client.id}/projects/new`)}
            >
              Add Project
            </StandardButton>
          </Box>

          <ProjectsList clientId={client.id} showCreateButton={false} />
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default ClientDetail;
