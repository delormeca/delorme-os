import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid2,
  IconButton,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useTheme,
  Paper,
} from "@mui/material";
import {
  Delete,
  Add,
  ViewList,
  ViewModule,
  MoreVert,
  CalendarToday,
  Edit,
  Business,
} from "@mui/icons-material";
import { useClients, useDeleteClient } from "@/hooks/api/useClients";
import { ClientRead } from "@/client";
import {
  StandardButton,
  StandardIconButton,
  PageLayout,
  PageHeader,
  LoadingState,
  EmptyState,
  FeatureChip,
  PasswordConfirmDialog,
} from "@/components/ui";
import { useNavigate } from "react-router-dom";

export const ClientsList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRead | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteClient = useDeleteClient();

  const formatDateShort = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    client: ClientRead
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleEdit = () => {
    if (selectedClient) {
      navigate(`/clients/${selectedClient.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedClient) {
      handleDelete(selectedClient);
    }
    handleMenuClose();
  };

  const handleDelete = (client: ClientRead) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!clientToDelete) return;

    try {
      await deleteClient.mutateAsync({ clientId: clientToDelete.id, password });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      setDeleteError(null);
    } catch (error: any) {
      setDeleteError(error.body?.detail || "Incorrect password");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
    setDeleteError(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout maxWidth="lg">
        <LoadingState message="Loading your clients..." />
      </PageLayout>
    );
  }

  // Empty state
  if (!clients || clients.length === 0) {
    return (
      <PageLayout maxWidth="lg">
        <EmptyState
          title="No clients yet"
          description="Start by creating your first client to organize your projects"
          action={{
            label: "Create Your First Client",
            onClick: () => navigate("/clients/new"),
            variant: "contained",
          }}
        />
      </PageLayout>
    );
  }

  // Main content
  return (
    <PageLayout maxWidth="lg">
      <PageHeader
        title="My Clients"
        subtitle="Manage your clients and their projects"
        action={
          <Stack direction="column" spacing={2} alignItems="start">
            <Stack direction="row" spacing={1} alignItems="start">
              <FeatureChip
                label={`${clients.length} client${
                  clients.length !== 1 ? "s" : ""
                }`}
                variant="outlined"
              />

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <StandardButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/clients/new")}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Create Client
            </StandardButton>
          </Stack>
        }
      />

      {viewMode === "grid" ? (
        // Grid View
        <Grid2 container spacing={3}>
          {clients.map((client) => (
            <Grid2 key={client.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Business
                      sx={{ fontSize: 40, color: theme.palette.primary.main }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, client);
                      }}
                      sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    {client.name}
                  </Typography>

                  {client.industry && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {client.industry}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "text.secondary",
                    }}
                  >
                    <CalendarToday sx={{ fontSize: "1rem" }} />
                    <Typography variant="caption">
                      Created {formatDateShort(client.created_at)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <StandardButton
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clients/${client.id}`);
                    }}
                    sx={{ flex: 1 }}
                  >
                    View Details
                  </StandardButton>
                </CardActions>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      ) : (
        // List View
        <Grid2 size={12} spacing={3}>
          <Grid2 size={12}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="clients table">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        minWidth: { xs: 200, sm: 250 },
                        whiteSpace: "nowrap",
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      Industry
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        minWidth: 120,
                        whiteSpace: "nowrap",
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      Created
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        minWidth: 120,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                        },
                      }}
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <TableCell
                        sx={{
                          minWidth: { xs: 200, sm: 250 },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Business color="primary" />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                            }}
                          >
                            {client.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          {client.industry || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          {formatDateShort(client.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={{ xs: 0.5, sm: 1 }}
                          sx={{
                            flexWrap: { xs: "wrap", sm: "nowrap" },
                            gap: { xs: 0.5, sm: 0 },
                          }}
                        >
                          <StandardIconButton
                            size="small"
                            variant="filled"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client.id}`);
                            }}
                            sx={{
                              minWidth: { xs: 32, sm: 36 },
                              minHeight: { xs: 32, sm: 36 },
                              padding: { xs: "6px", sm: "8px" },
                            }}
                          >
                            <Edit
                              sx={{ fontSize: { xs: "16px", sm: "18px" } }}
                            />
                          </StandardIconButton>

                          <StandardIconButton
                            size="small"
                            variant="filled"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client);
                            }}
                            sx={{
                              minWidth: { xs: 32, sm: 36 },
                              minHeight: { xs: 32, sm: 36 },
                              padding: { xs: "6px", sm: "8px" },
                            }}
                          >
                            <Delete
                              sx={{ fontSize: { xs: "16px", sm: "18px" } }}
                            />
                          </StandardIconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid2>
        </Grid2>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.shape.borderRadius}px`,
              minWidth: 180,
            },
          },
        }}
      >
        <MenuItem onClick={handleEdit} sx={{ gap: 1 }}>
          <Edit fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem
          onClick={handleDeleteFromMenu}
          sx={{ gap: 1, color: "error.main" }}
        >
          <Delete fontSize="small" />
          Delete Client
        </MenuItem>
      </Menu>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        open={deleteDialogOpen}
        title="Delete Client"
        message={`Are you sure you want to delete "${clientToDelete?.name}"? This will also delete all associated projects. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteClient.isPending}
        error={deleteError}
      />
    </PageLayout>
  );
};

export default ClientsList;
