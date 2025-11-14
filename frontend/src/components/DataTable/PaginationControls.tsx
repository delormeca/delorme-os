import React from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';
import { Table } from '@tanstack/react-table';

interface PaginationControlsProps {
  table: Table<any>;
  totalCount?: number;
  // Server-side pagination props (optional - if not provided, uses client-side)
  currentPage?: number;
  currentPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  table,
  totalCount,
  currentPage: externalPage,
  currentPageSize: externalPageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const theme = useTheme();

  // Determine if we're using server-side pagination
  const isServerSidePagination = !!(onPageChange && onPageSizeChange);

  // Use external values for server-side, table state for client-side
  const pageIndex = isServerSidePagination ? (externalPage || 1) - 1 : table.getState().pagination.pageIndex;
  const pageSize = isServerSidePagination ? (externalPageSize || 50) : table.getState().pagination.pageSize;
  const pageCount = isServerSidePagination && totalCount
    ? Math.ceil(totalCount / pageSize)
    : table.getPageCount();
  const currentPage = pageIndex + 1;

  // Calculate showing range
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalCount || table.getFilteredRowModel().rows.length);
  const total = totalCount || table.getFilteredRowModel().rows.length;

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', pageCount];
    }

    if (currentPage >= pageCount - 3) {
      return [
        1,
        '...',
        pageCount - 4,
        pageCount - 3,
        pageCount - 2,
        pageCount - 1,
        pageCount,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      pageCount,
    ];
  };

  // Handlers that work with both client-side and server-side pagination
  const handlePageChange = (newPage: number) => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(newPage);
    } else {
      table.setPageIndex(newPage - 1);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (isServerSidePagination && onPageSizeChange) {
      onPageSizeChange(newPageSize);
    } else {
      table.setPageSize(newPageSize);
    }
  };

  const handlePreviousPage = () => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(currentPage - 1);
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(currentPage + 1);
    } else {
      table.nextPage();
    }
  };

  const canPreviousPage = isServerSidePagination ? currentPage > 1 : table.getCanPreviousPage();
  const canNextPage = isServerSidePagination ? currentPage < pageCount : table.getCanNextPage();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Left: Row count and page size selector */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Showing <strong>{startRow}</strong>-<strong>{endRow}</strong> of{' '}
          <strong>{total.toLocaleString()}</strong>
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              sx={{ minWidth: 80 }}
            >
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={250}>250</MenuItem>
              <MenuItem value={500}>500</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Right: Page navigation */}
      <Stack direction="row" spacing={1} alignItems="center">
        {/* First page button */}
        <IconButton
          onClick={() => handlePageChange(1)}
          disabled={!canPreviousPage}
          size="small"
        >
          <FirstPage />
        </IconButton>

        {/* Previous page button */}
        <IconButton
          onClick={handlePreviousPage}
          disabled={!canPreviousPage}
          size="small"
        >
          <ChevronLeft />
        </IconButton>

        {/* Page number buttons */}
        <Stack direction="row" spacing={0.5}>
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <Box
                key={`ellipsis-${idx}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  color: 'text.secondary',
                }}
              >
                ...
              </Box>
            ) : (
              <Button
                key={page}
                onClick={() => handlePageChange(Number(page))}
                variant={currentPage === page ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  minWidth: 40,
                  height: 40,
                  ...(currentPage === page && {
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }),
                }}
              >
                {page}
              </Button>
            )
          )}
        </Stack>

        {/* Next page button */}
        <IconButton
          onClick={handleNextPage}
          disabled={!canNextPage}
          size="small"
        >
          <ChevronRight />
        </IconButton>

        {/* Last page button */}
        <IconButton
          onClick={() => handlePageChange(pageCount)}
          disabled={!canNextPage}
          size="small"
        >
          <LastPage />
        </IconButton>
      </Stack>
    </Box>
  );
};
