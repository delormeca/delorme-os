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
  Chip,
} from "@mui/material";
import {
  Delete,
  Add,
  ViewList,
  ViewModule,
  MoreVert,
  CalendarToday,
  Edit,
  Language,
  Folder,
} from "@mui/icons-material";
import { useProjects, useDeleteProject } from "@/hooks/api/useProjects";
import { ProjectRead } from "@/client";
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

interface ProjectsListProps {
  clientId?: string;
  showCreateButton?: boolean;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  clientId,
  showCreateButton = true
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects(clientId);
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRead | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteProject = useDeleteProject();

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
    project: ProjectRead
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEdit = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedProject) {
      handleDelete(selectedProject);
    }
    handleMenuClose();
  };

  const handleDelete = (project: ProjectRead) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!projectToDelete) return;

    try {
      await deleteProject.mutateAsync({ projectId: projectToDelete.id, password });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      setDeleteError(null);
    } catch (error: any) {
      setDeleteError(error.body?.detail || "Incorrect password");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setDeleteError(null);
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <LoadingState message="Loading projects..." />
      </Box>
    );
  }

  // Empty state
  if (!projects || projects.length === 0) {
    if (!showCreateButton) {
      return (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            No projects yet
          </Typography>
        </Box>
      );
    }

    return (
      <PageLayout maxWidth="lg">
        <EmptyState
          title="No projects yet"
          description="Create your first project to start crawling and managing pages"
          action={{
            label: "Create Your First Project",
            onClick: () => navigate(clientId ? `/clients/${clientId}/projects/new` : "/projects/new"),
            variant: "contained",
          }}
        />
      </PageLayout>
    );
  }

  // Main content
  return (
    <Box>
      {showCreateButton && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <FeatureChip
              label={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
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
          </Box>
          <StandardButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(clientId ? `/clients/${clientId}/projects/new` : "/projects/new")}
          >
            Create Project
          </StandardButton>
        </Box>
      )}

      {viewMode === "grid" ? (
        // Grid View
        <Grid2 container spacing={3}>
          {projects.map((project) => (
            <Grid2 key={project.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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
                onClick={() => navigate(`/projects/${project.id}`)}
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
                    <Folder sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, project);
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
                    {project.name}
                  </Typography>

                  <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Language sx={{ fontSize: "1rem", color: "text.secondary" }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {truncateUrl(project.url)}
                    </Typography>
                  </Box>

                  {project.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {project.description}
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
                      Created {formatDateShort(project.created_at)}
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
                      navigate(`/projects/${project.id}`);
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
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="projects table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: { xs: 200, sm: 250 } }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: "none", md: "table-cell" } }}>
                  URL
                </TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>
                  Created
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Folder color="primary" />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {project.name}
                        </Typography>
                        {project.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: { xs: "block", sm: "none" },
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Typography variant="body2" color="text.secondary">
                      {truncateUrl(project.url, 50)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateShort(project.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <StandardIconButton
                        size="small"
                        variant="filled"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        <Edit />
                      </StandardIconButton>
                      <StandardIconButton
                        size="small"
                        variant="filled"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                      >
                        <Delete />
                      </StandardIconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
          Delete Project
        </MenuItem>
      </Menu>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        open={deleteDialogOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This will also delete all associated pages and data. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteProject.isPending}
        error={deleteError}
      />
    </Box>
  );
};

export default ProjectsList;
