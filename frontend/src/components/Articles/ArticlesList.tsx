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
import { useConfirm } from "material-ui-confirm";
import {
  Delete,
  Add,
  ViewList,
  ViewModule,
  MoreVert,
  CalendarToday,
  Visibility,
  Edit,
} from "@mui/icons-material";
import { useArticles } from "@/hooks/api/useArticles";
import { ArticleRead } from "@/client";
import { useDeleteArticle } from "@/hooks/api/useDeleteArticle";
import {
  StandardButton,
  StandardIconButton,
  PageLayout,
  PageHeader,
  ModernCard,
  LoadingState,
  EmptyState,
  StatusBadge,
  FeatureChip,
} from "@/components/ui";
import { useNavigate } from "react-router-dom";

export const ArticlesList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: articles, isLoading, error } = useArticles();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleRead | null>(
    null
  );

  const { mutateAsync: deleteArticle } = useDeleteArticle();

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
    article: ArticleRead
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedArticle(article);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedArticle(null);
  };

  const handleEdit = () => {
    if (selectedArticle) {
      navigate(`/dashboard/my-articles/${selectedArticle.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = async () => {
    if (selectedArticle) {
      await handleDelete(selectedArticle);
    }
    handleMenuClose();
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const handleDelete = async (article: ArticleRead) => {
    const result = await confirm({
      description: `Are you sure you want to delete "${article.title}"?`,
      title: "Delete Article",
      confirmationText: "Delete",
      cancellationText: "Cancel",
    });

    if (result.confirmed) {
      await deleteArticle(article.id);
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout maxWidth="lg">
        <LoadingState message="Loading your articles..." />
      </PageLayout>
    );
  }

  // Empty state
  if (!articles || articles.length === 0) {
    return (
      <PageLayout maxWidth="lg">
        <EmptyState
          title="No articles yet"
          description="Start creating content to share your ideas with the world"
          action={{
            label: "Create Your First Article",
            onClick: () => navigate("/dashboard/my-articles/new"),
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
        title="My Articles"
        subtitle="Manage and organize your content"
        action={
          <Stack direction="column" spacing={2} alignItems="start">
            <Stack direction="row" spacing={1} alignItems="start">
              <FeatureChip
                label={`${articles.length} article${
                  articles.length !== 1 ? "s" : ""
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
              onClick={() => navigate("/dashboard/my-articles/new")}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Create Article
            </StandardButton>
          </Stack>
        }
      />

      {viewMode === "grid" ? (
        // Grid View
        <Grid2 container spacing={3}>
          {articles.map((article) => (
            <Grid2 key={article.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[4],
                  },
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
                    <StatusBadge
                      status={article.is_published ? "success" : "warning"}
                      label={article.is_published ? "Published" : "Draft"}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, article)}
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
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {article.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.5,
                    }}
                  >
                    {truncateContent(article.content)}
                  </Typography>

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
                      {article.published_at
                        ? formatDateShort(article.published_at)
                        : "Draft"}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <StandardButton
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() =>
                      navigate(`/dashboard/my-articles/${article.id}/edit`)
                    }
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </StandardButton>

                  {article.is_published && (
                    <StandardIconButton
                      size="small"
                      variant="filled"
                      color="primary"
                      onClick={() =>
                        navigate(`/dashboard/my-articles/${article.id}/view`)
                      }
                    >
                      <Visibility />
                    </StandardIconButton>
                  )}
                </CardActions>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      ) : (
        <Grid2 size={12} spacing={3}>
          <Grid2 size={12}>
            {/* <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}> */}
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="articles table">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        minWidth: { xs: 200, sm: 250 },
                        whiteSpace: "nowrap",
                      }}
                    >
                      Title
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        minWidth: 120,
                        whiteSpace: "nowrap",
                        display: { xs: "none", sm: "table-cell" }, // Hide on mobile
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
                  {articles.map((article) => (
                    <TableRow
                      key={article.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          minWidth: { xs: 200, sm: 250 },
                          maxWidth: { xs: 200, sm: 300 },
                        }}
                      >
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              mb: 0.5,
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              display: "-webkit-box",
                              WebkitLineClamp: { xs: 1, sm: 2 },
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {article.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              display: { xs: "none", sm: "-webkit-box" },
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {truncateContent(article.content, 80)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <StatusBadge
                          status={article.is_published ? "success" : "warning"}
                          label={article.is_published ? "Published" : "Draft"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 120,
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          {article.published_at
                            ? formatDateShort(article.published_at)
                            : "Draft"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
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
                            onClick={() =>
                              navigate(
                                `/dashboard/my-articles/${article.id}/edit`
                              )
                            }
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

                          {article.is_published && (
                            <StandardIconButton
                              size="small"
                              variant="filled"
                              color="primary"
                              onClick={() =>
                                navigate(
                                  `/dashboard/my-articles/${article.id}/view`
                                )
                              }
                              sx={{
                                minWidth: { xs: 32, sm: 36 },
                                minHeight: { xs: 32, sm: 36 },
                                padding: { xs: "6px", sm: "8px" },
                              }}
                            >
                              <Visibility
                                sx={{ fontSize: { xs: "16px", sm: "18px" } }}
                              />
                            </StandardIconButton>
                          )}

                          <StandardIconButton
                            size="small"
                            variant="filled"
                            color="error"
                            onClick={() => handleDelete(article)}
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
            {/* </Box> */}
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
          Edit Article
        </MenuItem>
        {selectedArticle?.is_published && (
          <MenuItem
            onClick={() => {
              navigate(`/dashboard/my-articles/${selectedArticle.id}/view`);
              handleMenuClose();
            }}
            sx={{ gap: 1 }}
          >
            <Visibility fontSize="small" />
            View Article
          </MenuItem>
        )}
        <MenuItem
          onClick={handleDeleteFromMenu}
          sx={{ gap: 1, color: "error.main" }}
        >
          <Delete fontSize="small" />
          Delete Article
        </MenuItem>
      </Menu>
    </PageLayout>
  );
};

export default ArticlesList;
