import React, { useState, useMemo, useCallback } from 'react';
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
  Tooltip,
  alpha,
  useTheme,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  ImageOutlined,
  LocalOffer,
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
} from '@tanstack/react-table';
import { ClientPageRead } from '@/client';
import { BulkActionsBar } from './BulkActionsBar';
import { PaginationControls } from './PaginationControls';
import { SearchFilterBar } from './SearchFilterBar';
import { ColumnSettingsModal } from './ColumnSettingsModal';
import { PageFiltersBar, PageFilters } from './PageFiltersBar';
import { TagManagementModal } from './TagManagementModal';
import { ScreenshotModal } from './ScreenshotModal';
import { useBulkUpdateTags, useClientTags } from '@/hooks/api';
import {
  WebpageStructureCell,
  LinksCell,
  SalientEntitiesCell,
  BodyContentCell,
  SchemaCell,
} from './ExpandableCell';

interface EnhancedDataTableProps {
  clientId: string;
  data: ClientPageRead[];
  totalCount?: number;
  isLoading?: boolean;
  onExport?: (selectedIds: string[]) => void;
  onDelete?: (selectedIds: string[]) => void;
}

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS = [
  'select',
  'url',
  'slug',
  'tags',
  'page_status',
  'page_screenshot',
  'page_title',
  'meta_description',
  'h1',
  'canonical',
  'hreflang',
  'word_count',
  'meta_robots',
  'image_count',
  'last_crawled_at',
];

export const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({
  clientId,
  data,
  totalCount,
  isLoading = false,
  onExport,
  onDelete,
}) => {
  const theme = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [allSelected, setAllSelected] = useState(false);
  const [pageFilters, setPageFilters] = useState<PageFilters>({
    onPageFactors: [],
    statusCodes: [],
  });
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    url: string | null | undefined;
    fullUrl?: string | null | undefined;
    pageUrl: string;
  } | null>(null);

  // Tag management hooks
  const { mutateAsync: bulkUpdateTags, isPending: isUpdatingTags } = useBulkUpdateTags();
  const { data: clientTagsData } = useClientTags(clientId);

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

  // Client-side filtering logic
  const filteredData = useMemo(() => {
    // If no filters applied, return original data
    if (pageFilters.onPageFactors.length === 0 && pageFilters.statusCodes.length === 0) {
      return data;
    }

    return data.filter((page) => {
      // Check on-page factors (OR logic within this category)
      let onPageMatch = pageFilters.onPageFactors.length === 0; // Default to true if no filters
      if (pageFilters.onPageFactors.length > 0) {
        onPageMatch = pageFilters.onPageFactors.some((factor: string) => {
          switch (factor) {
            case 'has_title':
              return !!page.page_title && page.page_title.trim().length > 0;
            case 'missing_title':
              return !page.page_title || page.page_title.trim().length === 0;
            case 'has_meta':
              return !!page.meta_description && page.meta_description.trim().length > 0;
            case 'missing_meta':
              return !page.meta_description || page.meta_description.trim().length === 0;
            case 'has_h1':
              return !!page.h1 && page.h1.trim().length > 0;
            case 'missing_h1':
              return !page.h1 || page.h1.trim().length === 0;
            case 'has_images':
              return !!page.image_count && page.image_count > 0;
            case 'missing_images':
              return !page.image_count || page.image_count === 0;
            default:
              return false;
          }
        });
      }

      // Check status codes (OR logic within this category)
      let statusMatch = pageFilters.statusCodes.length === 0; // Default to true if no filters
      if (pageFilters.statusCodes.length > 0) {
        statusMatch = pageFilters.statusCodes.some((code: string) => {
          const statusCode = page.status_code;
          if (!statusCode) return code === 'other';

          switch (code) {
            case '200':
              return statusCode === 200;
            case '301-302':
              return statusCode === 301 || statusCode === 302;
            case '404':
              return statusCode === 404;
            case '500':
              return statusCode >= 500;
            case 'other':
              return statusCode !== 200 && statusCode !== 301 && statusCode !== 302 && statusCode !== 404 && statusCode < 500;
            default:
              return false;
          }
        });
      }

      // AND logic between categories
      return onPageMatch && statusMatch;
    });
  }, [data, pageFilters]);

  // Define all 22+ columns
  const columns = useMemo<ColumnDef<ClientPageRead>[]>(
    () => [
      // 1. Checkbox column
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
      // 2. URL column
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
      // 3. Slug column
      {
        id: 'slug',
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => row.original.slug || 'N/A',
        size: 200,
      },
      // 4. Tags column
      {
        id: 'tags',
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
          const tags = row.original.tags;
          if (!tags || tags.length === 0) {
            return (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No tags
              </Typography>
            );
          }
          return (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  icon={<LocalOffer sx={{ fontSize: 14 }} />}
                  variant="outlined"
                  color="primary"
                />
              ))}
              {tags.length > 3 && (
                <Chip
                  label={`+${tags.length - 3}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          );
        },
        size: 250,
      },
      // 5. Page Status column
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
      // 5. Page Screenshot column
      {
        id: 'page_screenshot',
        accessorKey: 'screenshot_url',
        header: 'Screenshot',
        cell: ({ row }) => {
          const screenshotUrl = row.original.screenshot_url;
          const screenshotFullUrl = row.original.screenshot_full_url;
          const pageUrl = row.original.url;

          const handleClick = () => {
            if (screenshotUrl) {
              setSelectedScreenshot({
                url: screenshotUrl,
                fullUrl: screenshotFullUrl,
                pageUrl: pageUrl,
              });
              setScreenshotModalOpen(true);
            }
          };

          return screenshotUrl ? (
            <Box
              component="img"
              src={screenshotUrl}
              alt="Page screenshot"
              onClick={handleClick}
              sx={{
                width: 100,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: theme.shadows[4],
                },
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
        enableSorting: false,
        size: 120,
      },
      // 6. Page Title column
      {
        id: 'page_title',
        accessorKey: 'page_title',
        header: 'Page Title',
        cell: ({ row }) => row.original.page_title || 'N/A',
        size: 250,
      },
      // 7. Meta Title column
      {
        id: 'meta_title',
        accessorKey: 'meta_title',
        header: 'Meta Title',
        cell: ({ row }) => row.original.meta_title || 'N/A',
        size: 250,
      },
      // 8. Meta Description column
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
      // 9. H1 column
      {
        id: 'h1',
        accessorKey: 'h1',
        header: 'H1',
        cell: ({ row }) => row.original.h1 || 'N/A',
        size: 200,
      },
      // 10. Webpage Structure column (EXPANDABLE)
      {
        id: 'webpage_structure',
        accessorKey: 'webpage_structure',
        header: 'Webpage Structure',
        cell: ({ row }) => (
          <WebpageStructureCell structure={row.original.webpage_structure} />
        ),
        enableSorting: false,
        size: 300,
      },
      // 11. Canonical URL column
      {
        id: 'canonical',
        accessorKey: 'canonical_url',
        header: 'Canonical',
        cell: ({ row }) => row.original.canonical_url || 'N/A',
        size: 250,
      },
      // 12. Hreflang column
      {
        id: 'hreflang',
        accessorKey: 'hreflang',
        header: 'Hreflang',
        cell: ({ row }) => row.original.hreflang || 'N/A',
        size: 100,
      },
      // 13. Schema Markup column (EXPANDABLE)
      {
        id: 'schema',
        accessorKey: 'schema_markup',
        header: 'Schema Markup',
        cell: ({ row }) => <SchemaCell schema={row.original.schema_markup} />,
        enableSorting: false,
        size: 200,
      },
      // 14. Word Count column
      {
        id: 'word_count',
        accessorKey: 'word_count',
        header: 'Word Count',
        cell: ({ row }) => row.original.word_count?.toLocaleString() || 'N/A',
        size: 100,
      },
      // 15. Meta Robots column
      {
        id: 'meta_robots',
        accessorKey: 'meta_robots',
        header: 'Meta Robots',
        cell: ({ row }) => row.original.meta_robots || 'N/A',
        size: 150,
      },
      // 16. Internal Links column (EXPANDABLE)
      {
        id: 'internal_links',
        accessorKey: 'internal_links',
        header: 'Internal Links',
        cell: ({ row }) => (
          <LinksCell links={row.original.internal_links} linkType="internal" />
        ),
        enableSorting: false,
        size: 150,
      },
      // 17. Image Count column
      {
        id: 'image_count',
        accessorKey: 'image_count',
        header: 'Images',
        cell: ({ row }) => row.original.image_count?.toLocaleString() || 'N/A',
        size: 100,
      },
      // 18. External Links column (EXPANDABLE)
      {
        id: 'external_links',
        accessorKey: 'external_links',
        header: 'External Links',
        cell: ({ row }) => (
          <LinksCell links={row.original.external_links} linkType="external" />
        ),
        enableSorting: false,
        size: 150,
      },
      // 19. Body Content column (EXPANDABLE - hidden by default)
      {
        id: 'body_content',
        accessorKey: 'body_content',
        header: 'Body Content',
        cell: ({ row }) => <BodyContentCell content={row.original.body_content} />,
        enableSorting: false,
        size: 400,
      },
      // 20. Body Content Embedding column (hidden by default)
      {
        id: 'body_content_embedding',
        accessorKey: 'body_content_embedding',
        header: 'Embedding',
        cell: () => <Typography variant="body2">Vector data</Typography>,
        enableSorting: false,
        size: 150,
      },
      // 21. Salient Entities column (EXPANDABLE)
      {
        id: 'salient_entities',
        accessorKey: 'salient_entities',
        header: 'Salient Entities',
        cell: ({ row }) => (
          <SalientEntitiesCell entities={row.original.salient_entities} />
        ),
        enableSorting: false,
        size: 200,
      },
      // 22. Last Crawled At column
      {
        id: 'last_crawled_at',
        accessorKey: 'last_crawled_at',
        header: 'Last Crawled',
        cell: ({ row }) => formatDate(row.original.last_crawled_at),
        size: 180,
      },
    ],
    []
  );

  // Filter columns based on visibility
  const displayColumns = useMemo(
    () => columns.filter((col) => visibleColumns.includes(col.id as string)),
    [columns, visibleColumns]
  );

  const table = useReactTable({
    data: filteredData,
    columns: displayColumns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  // Get selected row IDs
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((key) => data[parseInt(key)]?.id)
      .filter(Boolean) as string[];
  }, [rowSelection, data]);

  // Handlers
  const handleSelectAll = useCallback(() => {
    setAllSelected(true);
    // Select all visible rows
    table.toggleAllPageRowsSelected(true);
  }, [table]);

  const handleDeselectAll = useCallback(() => {
    setAllSelected(false);
    setRowSelection({});
  }, []);

  const handleExport = useCallback(() => {
    if (onExport) {
      const idsToExport = allSelected
        ? data.map((row) => row.id)
        : selectedIds;
      onExport(idsToExport);
    }
  }, [onExport, allSelected, data, selectedIds]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      const idsToDelete = allSelected
        ? data.map((row) => row.id)
        : selectedIds;
      onDelete(idsToDelete);
    }
  }, [onDelete, allSelected, data, selectedIds]);

  const handleManageTags = useCallback(() => {
    setTagModalOpen(true);
  }, []);

  const handleSaveTags = useCallback(async (tags: string[], mode: 'replace' | 'append') => {
    const pageIds = allSelected ? data.map((row) => row.id) : selectedIds;
    await bulkUpdateTags({
      page_ids: pageIds,
      tags,
      mode,
    });
  }, [allSelected, data, selectedIds, bulkUpdateTags]);

  const handleSaveColumnSettings = useCallback((columns: string[]) => {
    setVisibleColumns(columns);
    // Save to localStorage
    localStorage.setItem('dataTableVisibleColumns', JSON.stringify(columns));
  }, []);

  // Load column settings from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('dataTableVisibleColumns');
    if (saved) {
      try {
        setVisibleColumns(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved column settings');
      }
    }
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter Bar */}
      <SearchFilterBar
        onSearchChange={setGlobalFilter}
        onStatusFilterChange={(value) => {
          if (value === 'all') {
            setColumnFilters((prev) => prev.filter((f) => f.id !== 'status_code'));
          } else {
            setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== 'status_code'),
              { id: 'status_code', value: parseInt(value) },
            ]);
          }
        }}
        onWordCountFilterChange={(min, max) => {
          setColumnFilters((prev) => [
            ...prev.filter((f) => f.id !== 'word_count'),
            { id: 'word_count', value: { min, max } },
          ]);
        }}
        onClearFilters={() => {
          setGlobalFilter('');
          setColumnFilters([]);
          setPageFilters({ onPageFactors: [], statusCodes: [] });
        }}
        onOpenColumnSettings={() => setColumnSettingsOpen(true)}
        activeFiltersCount={columnFilters.length + (globalFilter ? 1 : 0) + pageFilters.onPageFactors.length + pageFilters.statusCodes.length}
        searchValue={globalFilter}
      />

      {/* Page Filters Bar */}
      <Box sx={{ mb: 2 }}>
        <PageFiltersBar
          filters={pageFilters}
          onFiltersChange={setPageFilters}
          totalPages={data.length}
          filteredPages={filteredData.length}
        />
      </Box>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={totalCount || data.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onManageTags={handleManageTags}
        onExport={onExport ? handleExport : undefined}
        onDelete={onDelete ? handleDelete : undefined}
        allSelected={allSelected}
      />

      {/* Data Table */}
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

      {/* Pagination Controls */}
      <PaginationControls table={table} totalCount={totalCount} />

      {/* Column Settings Modal */}
      <ColumnSettingsModal
        open={columnSettingsOpen}
        onClose={() => setColumnSettingsOpen(false)}
        visibleColumns={visibleColumns}
        onSave={handleSaveColumnSettings}
      />

      {/* Tag Management Modal */}
      <TagManagementModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        selectedPageIds={allSelected ? data.map((row) => row.id) : selectedIds}
        clientId={clientId}
        allAvailableTags={clientTagsData?.tags || []}
        onSave={handleSaveTags}
        isLoading={isUpdatingTags}
      />

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <ScreenshotModal
          open={screenshotModalOpen}
          onClose={() => {
            setScreenshotModalOpen(false);
            setSelectedScreenshot(null);
          }}
          screenshotUrl={selectedScreenshot.url}
          screenshotFullUrl={selectedScreenshot.fullUrl}
          pageUrl={selectedScreenshot.pageUrl}
        />
      )}
    </Box>
  );
};
