/**
 * Enhanced Crawl Results Table
 *
 * Comprehensive table showing all crawled pages with historical tracking.
 * Similar to Screaming Frog - always shows all URLs with datapoints + history per cell.
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
  Checkbox,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Chip,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import {
  Search,
  ViewColumn,
  Label,
  Visibility,
} from '@mui/icons-material';
import { useEnhancedCrawlResults, EnhancedCrawlPageData } from '@/hooks/api/useEnhancedCrawlResults';
import { HistoricalDropdown } from './HistoricalDropdown';
import { ModernCard, LoadingState } from '@/components/ui';

interface EnhancedCrawlResultsTableProps {
  clientId: string;
  clientName?: string;
  lastCrawl?: string;
}

export const EnhancedCrawlResultsTable: React.FC<EnhancedCrawlResultsTableProps> = ({
  clientId,
  clientName,
  lastCrawl,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0); // MUI TablePagination uses 0-indexed pages
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Fetch data
  const { data, isLoading, error } = useEnhancedCrawlResults({
    clientId,
    search: searchQuery,
    page: page + 1, // Backend uses 1-indexed pages
    page_size: rowsPerPage,
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setSelectedRows(new Set()); // Clear selection when changing pages
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedRows(new Set());
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && data) {
      const allIds = new Set(data.pages.map((p) => p.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const isAllSelected = data && selectedRows.size === data.pages.length && data.pages.length > 0;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < (data?.pages.length || 0);

  if (isLoading) {
    return (
      <ModernCard variant="glass">
        <LoadingState message="Loading crawl results..." />
      </ModernCard>
    );
  }

  if (error) {
    return (
      <ModernCard variant="glass">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="error">
            Error loading crawl results. Please try again.
          </Typography>
        </Box>
      </ModernCard>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ModernCard variant="glass">
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            {clientName && (
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {clientName}
              </Typography>
            )}
            {lastCrawl && (
              <Typography variant="body2" color="text.secondary">
                Last crawl: {lastCrawl}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${data.total} pages`}
            color="primary"
            size="small"
          />
        </Stack>

        {/* Toolbar */}
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <TextField
            placeholder="Search URLs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
          >
            Quick Views
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Label />}
          >
            Manage tags
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ViewColumn />}
          >
            Manage columns
          </Button>
        </Stack>

        {selectedRows.size > 0 && (
          <Chip
            label={`${selectedRows.size} selected`}
            onDelete={() => setSelectedRows(new Set())}
            color="primary"
            size="small"
          />
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ backgroundColor: theme.palette.background.paper }}>
                <Checkbox
                  indeterminate={isSomeSelected}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 300, backgroundColor: theme.palette.background.paper }}>
                URL
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 200, backgroundColor: theme.palette.background.paper }}>
                H1
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 200, backgroundColor: theme.palette.background.paper }}>
                META-TITLE
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 200, backgroundColor: theme.palette.background.paper }}>
                Meta-desc
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 150, backgroundColor: theme.palette.background.paper }}>
                Word Count
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120, backgroundColor: theme.palette.background.paper }}>
                Images
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 150, backgroundColor: theme.palette.background.paper }}>
                Links (I/E)
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120, backgroundColor: theme.palette.background.paper }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No pages found. Start a crawl to see data here.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.pages.map((pageData: EnhancedCrawlPageData) => {
                const isSelected = selectedRows.has(pageData.id);

                return (
                  <TableRow
                    key={pageData.id}
                    hover
                    selected={isSelected}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(pageData.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 300,
                        }}
                      >
                        {pageData.url}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <HistoricalDropdown datapoint={pageData.h1} fieldName="H1" />
                    </TableCell>

                    <TableCell>
                      <HistoricalDropdown datapoint={pageData.meta_title} fieldName="Meta Title" />
                    </TableCell>

                    <TableCell>
                      <HistoricalDropdown datapoint={pageData.meta_description} fieldName="Meta Description" />
                    </TableCell>

                    <TableCell>
                      <HistoricalDropdown datapoint={pageData.word_count} fieldName="Word Count" />
                    </TableCell>

                    <TableCell>
                      <HistoricalDropdown datapoint={pageData.image_count} fieldName="Images" />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HistoricalDropdown
                          datapoint={pageData.internal_link_count}
                          fieldName="Internal Links"
                        />
                        <Typography variant="body2" color="text.secondary">/</Typography>
                        <HistoricalDropdown
                          datapoint={pageData.external_link_count}
                          fieldName="External Links"
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <HistoricalDropdown datapoint={pageData.status_code} fieldName="Status Code" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {data.pages.length > 0 && (
        <TablePagination
          component="div"
          count={data.total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
        />
      )}
    </ModernCard>
  );
};
