/**
 * ClientPagesTable - Comprehensive table showing all client pages with datapoints
 *
 * Shows all URLs available for crawling, whether from sitemap or manually added,
 * with all available SEO datapoints and metadata.
 */
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
  TablePagination,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Delete,
  OpenInNew,
  CheckCircle,
  Error,
  TravelExplore,
} from '@mui/icons-material';
import { useClientPages, useDeleteClientPage } from '@/hooks/api/useClientPages';
import { ModernCard } from '@/components/ui';
import { useTheme } from '@mui/material';
import type { ClientPageRead } from '@/client';

interface ClientPagesTableProps {
  clientId: string;
}

export const ClientPagesTable: React.FC<ClientPagesTableProps> = ({ clientId }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Fetch pages
  const { data, isLoading, error } = useClientPages({
    client_id: clientId,
    page: page + 1, // API uses 1-based pagination
    page_size: pageSize,
    search: searchDebounced,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const { mutate: deletePage } = useDeleteClientPage();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(0); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = (pageId: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      deletePage(pageId);
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'sitemap_auto':
        return 'success';
      case 'manual':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'sitemap_auto':
        return 'Sitemap';
      case 'manual':
        return 'Manual';
      default:
        return source;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUrl = (url: string) => {
    if (url.length > 60) {
      return url.substring(0, 57) + '...';
    }
    return url;
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load pages: {(error as any).message || 'Unknown error'}
      </Alert>
    );
  }

  return (
    <ModernCard variant="glass">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Available Pages
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data?.total || 0} pages ready for crawling
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !data || data.pages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TravelExplore sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No pages yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pull pages from sitemap or add them manually to get started
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell align="center">Source</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Crawls</TableCell>
                    <TableCell align="right">Word Count</TableCell>
                    <TableCell align="right">Images</TableCell>
                    <TableCell>Last Checked</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.pages.map((page: ClientPageRead) => (
                    <TableRow
                      key={page.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      {/* URL */}
                      <TableCell>
                        <Tooltip title={page.url}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {page.url}
                          </Typography>
                        </Tooltip>
                        {page.page_title && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {page.page_title}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Source */}
                      <TableCell align="center">
                        <Chip
                          label={getSourceLabel(page.source || 'manual')}
                          size="small"
                          color={getSourceColor(page.source || 'manual')}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        {page.is_failed ? (
                          <Tooltip title={page.failure_reason || 'Failed'}>
                            <Chip
                              icon={<Error />}
                              label={`${page.status_code || 'Error'}`}
                              size="small"
                              color="error"
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            icon={<CheckCircle />}
                            label={page.status_code || '-'}
                            size="small"
                            color={page.status_code === 200 ? 'success' : 'warning'}
                          />
                        )}
                      </TableCell>

                      {/* Crawl Count */}
                      <TableCell align="center">
                        <Chip
                          label={page.crawl_count || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Word Count */}
                      <TableCell align="right">
                        <Typography variant="body2">
                          {page.word_count?.toLocaleString() || '-'}
                        </Typography>
                      </TableCell>

                      {/* Image Count */}
                      <TableCell align="right">
                        <Typography variant="body2">
                          {page.image_count || '-'}
                        </Typography>
                      </TableCell>

                      {/* Last Checked */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(page.last_checked_at)}
                        </Typography>
                      </TableCell>

                      {/* Created */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(page.created_at)}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Open URL">
                            <IconButton
                              size="small"
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(page.id)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={data.total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Box>
    </ModernCard>
  );
};
