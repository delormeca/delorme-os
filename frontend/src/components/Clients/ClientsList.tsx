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
  TextField,
  InputAdornment,
  Checkbox,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Toolbar,
  Select,
  FormControl,
  InputLabel,
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
  Search,
  FilterList,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Pause,
  Person,
  FolderOpen,
  Archive,
  GetApp,
} from "@mui/icons-material";
import { useClients, useDeleteClient, useBulkDeleteClients } from "@/hooks/api/useClients";
import { useProjectLeads } from "@/hooks/api/useProjectLeads";
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

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [projectLeadFilter, setProjectLeadFilter] = useState<string>("");

  // Data fetching
  const { data: clients, isLoading } = useClients(searchTerm, projectLeadFilter || undefined);
  const { data: projectLeads = [] } = useProjectLeads();
  const queryClient = useQueryClient();

  // View and selection state
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [manageMode, setManageMode] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRead | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRead | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bulk delete state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [createBackup, setCreateBackup] = useState(true);

  const deleteClient = useDeleteClient();
  const bulkDeleteClients = useBulkDeleteClients();

  // Helper functions
  const formatDateShort = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string): "success" | "error" | "warning" | "default" => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "onboarding":
        return "warning";
      case "paused":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <CheckCircle fontSize="small" />;
      case "inactive":
        return <Cancel fontSize="small" />;
      case "onboarding":
        return <HourglassEmpty fontSize="small" />;
      case "paused":
        return <Pause fontSize="small" />;
      default:
        return null;
    }
  };

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = new Set(clients?.map((c) => c.id) || []);
      setSelectedClientIds(allIds);
    } else {
      setSelectedClientIds(new Set());
    }
  };

  const handleSelectOne = (clientId: string) => {
    const newSelected = new Set(selectedClientIds);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const handleToggleManageMode = () => {
    setManageMode(!manageMode);
    setSelectedClientIds(new Set());
  };

  // Context menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, client: ClientRead) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleEdit = () => {
    if (selectedClient) {
      navigate(`/clients/${selectedClient.slug}`);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedClient) {
      handleDelete(selectedClient);
    }
    handleMenuClose();
  };

  // Single delete handlers
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

  // Bulk delete handlers
  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    const clientIds = Array.from(selectedClientIds);
    try {
      const response = await bulkDeleteClients.mutateAsync({
        clientIds,
        createBackup,
      });

      // If backup was created, the response will be a Blob (zip file)
      if (createBackup && response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `clients_backup_${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setBulkDeleteDialogOpen(false);
      setSelectedClientIds(new Set());
      setManageMode(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteDialogOpen(false);
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

  const isAllSelected = selectedClientIds.size === clients.length && clients.length > 0;
  const isSomeSelected = selectedClientIds.size > 0 && selectedClientIds.size < clients.length;

  // Main content
  return (
    <PageLayout maxWidth="lg">
      <PageHeader
        title="My Clients"
        subtitle="Manage your clients and their projects"
        action={
          <Stack direction="column" spacing={2} alignItems="start">
            <Stack direction="row" spacing={1} alignItems="start" flexWrap="wrap">
              <FeatureChip
                label={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
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

              <StandardButton
                variant={manageMode ? "contained" : "outlined"}
                startIcon={<FilterList />}
                onClick={handleToggleManageMode}
                size="small"
              >
                {manageMode ? "Exit Manage" : "Manage"}
              </StandardButton>
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

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Search by name or website..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Project Lead</InputLabel>
            <Select
              value={projectLeadFilter}
              label="Project Lead"
              onChange={(e) => setProjectLeadFilter(e.target.value)}
            >
              <MenuItem value="">All Leads</MenuItem>
              {projectLeads.map((lead) => (
                <MenuItem key={lead.id} value={lead.id}>
                  {lead.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Bulk Action Toolbar */}
      {manageMode && selectedClientIds.size > 0 && (
        <Paper
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <Toolbar sx={{ px: { sm: 0 } }}>
            <Typography sx={{ flex: "1 1 100%" }} variant="subtitle1">
              {selectedClientIds.size} selected
            </Typography>
            <Stack direction="row" spacing={1}>
              <StandardButton
                variant="outlined"
                startIcon={<Archive />}
                onClick={handleBulkDeleteClick}
                color="error"
              >
                Delete Selected
              </StandardButton>
            </Stack>
          </Toolbar>
        </Paper>
      )}

      {viewMode === "grid" ? (
        // Grid View
        <Grid2 container spacing={3}>
          {clients.map((client) => {
            const isSelected = selectedClientIds.has(client.id);
            return (
              <Grid2 key={client.id} size={{ xs: 12, sm: 6, lg: 4, xl: 2.4 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    border: isSelected
                      ? `2px solid ${theme.palette.primary.main}`
                      : "1px solid transparent",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  onClick={() => {
                    if (manageMode) {
                      handleSelectOne(client.id);
                    } else {
                      navigate(`/clients/${client.slug}`);
                    }
                  }}
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
                      {/* Logo or Business Icon */}
                      {client.logo_url ? (
                        <Avatar
                          src={client.logo_url}
                          alt={client.name}
                          sx={{ width: 48, height: 48 }}
                          variant="rounded"
                        />
                      ) : (
                        <Business sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                      )}

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {manageMode && (
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOne(client.id);
                            }}
                            size="small"
                          />
                        )}
                        {!manageMode && (
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
                        )}
                      </Box>
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

                    {/* Status Badge */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(client.status)}
                        label={client.status}
                        color={getStatusColor(client.status)}
                        size="small"
                      />
                    </Box>

                    {client.industry && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {client.industry}
                      </Typography>
                    )}

                    {/* Stats */}
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FolderOpen sx={{ fontSize: "1rem", color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {client.page_count} pages
                        </Typography>
                      </Box>
                      {client.project_lead && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Person sx={{ fontSize: "1rem", color: "text.secondary" }} />
                          <Typography variant="caption" color="text.secondary">
                            {client.project_lead.name}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

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

                  {!manageMode && (
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <StandardButton
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.slug}`);
                        }}
                        sx={{ flex: 1 }}
                      >
                        View Details
                      </StandardButton>
                    </CardActions>
                  )}
                </Card>
              </Grid2>
            );
          })}
        </Grid2>
      ) : (
        // List View
        <Grid2 size={12} spacing={3}>
          <Grid2 size={12}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="clients table">
                <TableHead>
                  <TableRow>
                    {manageMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={isSomeSelected}
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", md: "table-cell" } }}>
                      Industry
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", md: "table-cell" } }}>
                      Pages
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", lg: "table-cell" } }}>
                      Project Lead
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>
                      Created
                    </TableCell>
                    {!manageMode && (
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((client) => {
                    const isSelected = selectedClientIds.has(client.id);
                    return (
                      <TableRow
                        key={client.id}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? alpha(theme.palette.primary.main, 0.08)
                            : "transparent",
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                        onClick={() => {
                          if (manageMode) {
                            handleSelectOne(client.id);
                          } else {
                            navigate(`/clients/${client.slug}`);
                          }
                        }}
                      >
                        {manageMode && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOne(client.id);
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {client.logo_url ? (
                              <Avatar
                                src={client.logo_url}
                                alt={client.name}
                                sx={{ width: 32, height: 32 }}
                                variant="rounded"
                              />
                            ) : (
                              <Business color="primary" />
                            )}
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {client.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          <Chip
                            icon={getStatusIcon(client.status)}
                            label={client.status}
                            color={getStatusColor(client.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {client.industry || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Typography variant="body2">{client.page_count}</Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {client.project_lead?.name || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateShort(client.created_at)}
                          </Typography>
                        </TableCell>
                        {!manageMode && (
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <StandardIconButton
                                size="small"
                                variant="filled"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/clients/${client.slug}`);
                                }}
                              >
                                <Edit sx={{ fontSize: "18px" }} />
                              </StandardIconButton>

                              <StandardIconButton
                                size="small"
                                variant="filled"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(client);
                                }}
                              >
                                <Delete sx={{ fontSize: "18px" }} />
                              </StandardIconButton>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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
        <MenuItem onClick={handleDeleteFromMenu} sx={{ gap: 1, color: "error.main" }}>
          <Delete fontSize="small" />
          Delete Client
        </MenuItem>
      </Menu>

      {/* Single Delete - Password Confirmation Dialog */}
      <PasswordConfirmDialog
        open={deleteDialogOpen}
        title="Delete Client"
        message={`Are you sure you want to delete "${clientToDelete?.name}"? This will also delete all associated projects. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteClient.isPending}
        error={deleteError}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={handleCancelBulkDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete {selectedClientIds.size} Clients?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete {selectedClientIds.size} selected client
            {selectedClientIds.size !== 1 ? "s" : ""}? This will also delete all associated
            projects. This action cannot be undone.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Create backup before deleting</Typography>
                <Typography variant="caption" color="text.secondary">
                  Download a .zip file with all client data
                </Typography>
              </Box>
            }
          />
        </DialogContent>
        <DialogActions>
          <StandardButton onClick={handleCancelBulkDelete} variant="outlined">
            Cancel
          </StandardButton>
          <StandardButton
            onClick={handleConfirmBulkDelete}
            variant="contained"
            color="error"
            startIcon={createBackup ? <GetApp /> : <Delete />}
            isLoading={bulkDeleteClients.isPending}
            loadingText={createBackup ? "Creating Backup..." : "Deleting..."}
          >
            {createBackup ? "Backup & Delete" : "Delete"}
          </StandardButton>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default ClientsList;
