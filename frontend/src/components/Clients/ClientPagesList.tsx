import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Error,
  Language,
  Schedule,
} from '@mui/icons-material';
import { useClientPages, type ClientPageSearchParams } from '@/hooks/api/useClientPages';
import { ModernCard } from '@/components/ui';

interface ClientPagesListProps {
  clientId: string;
}

export const ClientPagesList: React.FC<ClientPagesListProps> = ({ clientId }) => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useState<ClientPageSearchParams>({
    client_id: clientId,
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const { data: pagesData, isLoading } = useClientPages(searchParams);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => ({
      ...prev,
      search: event.target.value || undefined,
      page: 1, // Reset to first page on search
    }));
  };

  const handleFilterChange = (filter: 'all' | 'failed' | 'success') => {
    setSearchParams((prev) => ({
      ...prev,
      is_failed: filter === 'failed' ? true : filter === 'success' ? false : undefined,
      page: 1,
    }));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setSearchParams((prev) => ({ ...prev, page: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={80}
            sx={{ mb: 2, borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  const pages = pagesData?.pages || [];
  const totalPages = pagesData?.total_pages || 0;

  return (
    <Box>
      {/* Search and Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search pages by URL..."
          size="small"
          onChange={handleSearchChange}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            defaultValue="all"
            onChange={(e) => handleFilterChange(e.target.value as any)}
          >
            <MenuItem value="all">All Pages</MenuItem>
            <MenuItem value="success">Successful</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Pages List */}
      {pages.length === 0 ? (
        <ModernCard sx={{ textAlign: 'center', py: 6 }}>
          <Language sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            No pages found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search or filters
          </Typography>
        </ModernCard>
      ) : (
        <Stack spacing={2}>
          {pages.map((page) => (
            <ModernCard
              key={page.id}
              variant="glass"
              sx={{
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                {/* Status Icon */}
                <Box
                  sx={{
                    mt: 0.5,
                    color: page.is_failed ? 'error.main' : 'success.main',
                  }}
                >
                  {page.is_failed ? (
                    <Error sx={{ fontSize: 24 }} />
                  ) : (
                    <CheckCircle sx={{ fontSize: 24 }} />
                  )}
                </Box>

                {/* Page Details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {page.url}
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    {page.status_code && (
                      <Chip
                        label={`HTTP ${page.status_code}`}
                        size="small"
                        color={page.status_code >= 200 && page.status_code < 300 ? 'success' : 'error'}
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    )}

                    {page.slug && (
                      <Typography variant="caption" color="text.secondary">
                        Slug: {page.slug}
                      </Typography>
                    )}

                    {page.is_failed && page.failure_reason && (
                      <Chip
                        label={page.failure_reason}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}

                    {page.retry_count > 0 && (
                      <Typography variant="caption" color="warning.main">
                        {page.retry_count} {page.retry_count === 1 ? 'retry' : 'retries'}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(page.created_at)}
                      </Typography>
                    </Box>
                  </Stack>

                  {page.last_checked_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Last checked: {formatDate(page.last_checked_at)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </ModernCard>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={searchParams.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Summary */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {pages.length} of {pagesData?.total || 0} pages
        </Typography>
      </Box>
    </Box>
  );
};
