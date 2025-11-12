import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
  ImageOutlined,
} from '@mui/icons-material';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { ClientPageRead } from '@/client';

interface DataTableProps {
  clientId: string;
  data: ClientPageRead[];
  isLoading?: boolean;
  visibleColumns?: string[];
}

export const DataTable: React.FC<DataTableProps> = ({
  clientId,
  data,
  isLoading = false,
  visibleColumns = [],
}) => {
  const theme = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowId: string, columnId: string) => {
    const key = `${rowId}_${columnId}`;
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isRowExpanded = (rowId: string, columnId: string) => {
    return expandedRows.has(`${rowId}_${columnId}`);
  };

  // Define all 22 columns
  const columns = useMemo<ColumnDef<ClientPageRead>[]>(
    () => [
      // Checkbox column
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            size="small"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            size="small"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      // URL column
      {
        id: 'url',
        accessorKey: 'url',
        header: 'URL',
        cell: ({ row }) => (
          <Tooltip title={row.original.url}>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.original.url}
            </Typography>
          </Tooltip>
        ),
        size: 300,
      },
      // Slug column
      {
        id: 'slug',
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => row.original.slug || 'N/A',
        size: 200,
      },
      // Page Status column
      {
        id: 'page_status',
        accessorKey: 'status_code',
        header: 'Status',
        cell: ({ row }) => {
          const statusCode = row.original.status_code;
          if (!statusCode) return <Chip label="N/A" size="small" />;

          const isSuccess = statusCode >= 200 && statusCode < 300;
          return (
            <Chip
              label={`HTTP ${statusCode}`}
              size="small"
              color={isSuccess ? 'success' : 'error'}
              icon={isSuccess ? <CheckCircle /> : <Error />}
            />
          );
        },
        size: 100,
      },
      // Page Screenshot column
      {
        id: 'page_screenshot',
        accessorKey: 'screenshot_url',
        header: 'Screenshot',
        cell: ({ row }) => {
          const screenshotUrl = row.original.screenshot_url;
          return screenshotUrl ? (
            <Box
              component="img"
              src={screenshotUrl}
              alt="Page screenshot"
              sx={{
                width: 100,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1,
                cursor: 'pointer',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 100,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <ImageOutlined sx={{ color: 'grey.400' }} />
            </Box>
          );
        },
        size: 120,
      },
      // Page Title column
      {
        id: 'page_title',
        accessorKey: 'page_title',
        header: 'Page Title',
        cell: ({ row }) => row.original.page_title || 'N/A',
        size: 250,
      },
      // Meta Title column
      {
        id: 'meta_title',
        accessorKey: 'meta_title',
        header: 'Meta Title',
        cell: ({ row }) => row.original.meta_title || 'N/A',
        size: 250,
      },
      // Meta Description column
      {
        id: 'meta_description',
        accessorKey: 'meta_description',
        header: 'Meta Description',
        cell: ({ row }) => {
          const desc = row.original.meta_description;
          if (!desc) return 'N/A';
          return (
            <Typography variant="body2" sx={{ maxWidth: 300 }}>
              {desc.substring(0, 100)}
              {desc.length > 100 && '...'}
            </Typography>
          );
        },
        size: 300,
      },
      // H1 column
      {
        id: 'h1',
        accessorKey: 'h1',
        header: 'H1',
        cell: ({ row }) => row.original.h1 || 'N/A',
        size: 200,
      },
      // Canonical URL column
      {
        id: 'canonical',
        accessorKey: 'canonical_url',
        header: 'Canonical',
        cell: ({ row }) => row.original.canonical_url || 'N/A',
        size: 250,
      },
      // Hreflang column
      {
        id: 'hreflang',
        accessorKey: 'hreflang',
        header: 'Hreflang',
        cell: ({ row }) => row.original.hreflang || 'N/A',
        size: 100,
      },
      // Word Count column
      {
        id: 'word_count',
        accessorKey: 'word_count',
        header: 'Word Count',
        cell: ({ row }) => row.original.word_count?.toLocaleString() || 'N/A',
        size: 100,
      },
      // Meta Robots column
      {
        id: 'meta_robots',
        accessorKey: 'meta_robots',
        header: 'Meta Robots',
        cell: ({ row }) => row.original.meta_robots || 'N/A',
        size: 150,
      },
      // Image Count column
      {
        id: 'image_count',
        accessorKey: 'image_count',
        header: 'Images',
        cell: ({ row }) => row.original.image_count?.toLocaleString() || 'N/A',
        size: 100,
      },
      // Last Crawled At column
      {
        id: 'last_crawled_at',
        accessorKey: 'last_crawled_at',
        header: 'Last Crawled',
        cell: ({ row }) => formatDate(row.original.last_crawled_at),
        size: 180,
      },
      // Expandable columns will be added in next task
    ],
    []
  );

  // Filter columns based on visibility
  const visibleColumnsArray = visibleColumns.length > 0
    ? columns.filter((col) => visibleColumns.includes(col.id as string))
    : columns;

  const table = useReactTable({
    data,
    columns: visibleColumnsArray,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading data...</Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        boxShadow: theme.shadows[2],
      }}
    >
      <Table stickyHeader>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    bgcolor: theme.palette.grey[100],
                    fontWeight: 600,
                    minWidth: header.column.getSize(),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              selected={row.getIsSelected()}
              sx={{
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {table.getRowModel().rows.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};
