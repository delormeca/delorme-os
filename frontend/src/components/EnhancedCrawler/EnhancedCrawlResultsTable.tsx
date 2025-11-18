/**
 * Enhanced Crawl Results Table
 *
 * Comprehensive table showing all crawled pages with historical tracking.
 * Similar to Screaming Frog - always shows all URLs with datapoints + history per cell.
 */
import React, { useState, useEffect } from 'react';
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
import { ColumnManagementModal, ColumnDefinition } from './ColumnManagementModal';
import { ModernCard, LoadingState } from '@/components/ui';

interface EnhancedCrawlResultsTableProps {
  clientId: string;
  clientName?: string;
  lastCrawl?: string;
}

// Column definitions with metadata
const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { id: 'url', label: 'URL', minWidth: 300, isPrimary: true, defaultVisible: true },
  { id: 'h1', label: 'H1', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'meta_title', label: 'META-TITLE', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'meta_description', label: 'Meta-desc', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'word_count', label: 'Word Count', minWidth: 150, isPrimary: false, defaultVisible: true },
  { id: 'image_count', label: 'Images', minWidth: 120, isPrimary: false, defaultVisible: true },
  { id: 'internal_link_count', label: 'Links (I)', minWidth: 120, isPrimary: false, defaultVisible: true },
  { id: 'external_link_count', label: 'Links (E)', minWidth: 120, isPrimary: false, defaultVisible: true },
  { id: 'status_code', label: 'Status', minWidth: 120, isPrimary: false, defaultVisible: true },
];

// LocalStorage key for column preferences
const getColumnPrefsKey = (clientId: string) => `enhanced-table-columns-${clientId}`;

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
  const [columnManagementOpen, setColumnManagementOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(getColumnPrefsKey(clientId));
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        return prefs.visibleColumns || COLUMN_DEFINITIONS.map((col) => col.id);
      } catch {
        return COLUMN_DEFINITIONS.map((col) => col.id);
      }
    }
    return COLUMN_DEFINITIONS.map((col) => col.id);
  });

  // Persist column preferences to localStorage
  useEffect(() => {
    const prefs = {
      visibleColumns,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(getColumnPrefsKey(clientId), JSON.stringify(prefs));
  }, [visibleColumns, clientId]);

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
            onClick={() => setColumnManagementOpen(true)}
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
              {COLUMN_DEFINITIONS.filter((col) => visibleColumns.includes(col.id)).map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    fontWeight: 600,
                    minWidth: column.minWidth,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} sx={{ textAlign: 'center', py: 4 }}>
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

                    {COLUMN_DEFINITIONS.filter((col) => visibleColumns.includes(col.id)).map((column) => {
                      // Render cell based on column type
                      if (column.id === 'url') {
                        return (
                          <TableCell key={column.id}>
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
                        );
                      }

                      if (column.id === 'h1') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.h1} fieldName="H1" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'meta_title') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.meta_title} fieldName="Meta Title" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'meta_description') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.meta_description} fieldName="Meta Description" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'word_count') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.word_count} fieldName="Word Count" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'image_count') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.image_count} fieldName="Images" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'internal_link_count') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.internal_link_count} fieldName="Links (I)" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'external_link_count') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.external_link_count} fieldName="Links (E)" />
                          </TableCell>
                        );
                      }

                      if (column.id === 'status_code') {
                        return (
                          <TableCell key={column.id}>
                            <HistoricalDropdown datapoint={pageData.status_code} fieldName="Status Code" />
                          </TableCell>
                        );
                      }

                      return null;
                    })}
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

      {/* Column Management Modal */}
      <ColumnManagementModal
        open={columnManagementOpen}
        onClose={() => setColumnManagementOpen(false)}
        columns={COLUMN_DEFINITIONS}
        visibleColumns={visibleColumns}
        onApply={(newVisibleColumns) => {
          setVisibleColumns(newVisibleColumns);
        }}
      />
    </ModernCard>
  );
};
