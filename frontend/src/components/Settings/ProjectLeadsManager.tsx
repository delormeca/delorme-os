import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, Person } from '@mui/icons-material';
import { StandardButton, FormInput, FormSection } from '@/components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useProjectLeads,
  useCreateProjectLead,
  useUpdateProjectLead,
  useDeleteProjectLead,
} from '@/hooks/api/useProjectLeads';
import type { ProjectLeadRead } from '@/client';

const projectLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
});

type ProjectLeadFormData = z.infer<typeof projectLeadSchema>;

export const ProjectLeadsManager: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ProjectLeadRead | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<ProjectLeadRead | null>(null);

  const { data: leads = [], isLoading } = useProjectLeads();
  const createMutation = useCreateProjectLead();
  const updateMutation = useUpdateProjectLead();
  const deleteMutation = useDeleteProjectLead();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectLeadFormData>({
    resolver: zodResolver(projectLeadSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const handleOpenDialog = (lead?: ProjectLeadRead) => {
    if (lead) {
      setEditingLead(lead);
      reset({
        name: lead.name,
        email: lead.email,
      });
    } else {
      setEditingLead(null);
      reset({
        name: '',
        email: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLead(null);
    reset();
  };

  const handleSave = async (data: ProjectLeadFormData) => {
    try {
      if (editingLead) {
        await updateMutation.mutateAsync({
          leadId: editingLead.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      handleCloseDialog();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteClick = (lead: ProjectLeadRead) => {
    setLeadToDelete(lead);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (leadToDelete) {
      try {
        await deleteMutation.mutateAsync(leadToDelete.id);
        setDeleteConfirmOpen(false);
        setLeadToDelete(null);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Loading project leads...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Manage project leads who are responsible for client accounts
        </Typography>
        <StandardButton
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="small"
        >
          Add Lead
        </StandardButton>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Clients</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Box sx={{ py: 4 }}>
                    <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      No project leads yet. Add your first lead to get started.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {lead.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lead.email}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={lead.client_count}
                      size="small"
                      color={lead.client_count > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(lead)}
                      title="Edit"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(lead)}
                      title="Delete"
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLead ? 'Edit Project Lead' : 'Add Project Lead'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSave)}>
          <DialogContent>
            <FormSection>
              <Stack spacing={3}>
                <FormInput
                  name="name"
                  control={control}
                  errors={errors}
                  label="Full Name"
                  placeholder="Enter full name"
                  required
                />
                <FormInput
                  name="email"
                  control={control}
                  errors={errors}
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address"
                  required
                />
              </Stack>
            </FormSection>
          </DialogContent>
          <DialogActions>
            <StandardButton onClick={handleCloseDialog} variant="outlined">
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              variant="contained"
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              {editingLead ? 'Update' : 'Create'}
            </StandardButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm">
        <DialogTitle>Delete Project Lead?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{leadToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {leadToDelete && leadToDelete.client_count > 0 ? (
              <>
                This lead is currently assigned to {leadToDelete.client_count} client(s).
                These clients will be unassigned but not deleted.
              </>
            ) : (
              'This action cannot be undone.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <StandardButton onClick={() => setDeleteConfirmOpen(false)} variant="outlined">
            Cancel
          </StandardButton>
          <StandardButton
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            isLoading={deleteMutation.isPending}
            loadingText="Deleting..."
          >
            Delete
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
