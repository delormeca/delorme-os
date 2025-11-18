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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search,
  ViewColumn,
  Label,
  Visibility,
  CheckCircle,
  Link as LinkIcon,
  Image,
  Code,
  Speed,
  Language,
  DataObject,
  TextFields,
  Share,
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

// Column definitions with metadata - All 83+ datapoints from Apify
const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // Core - always visible
  { id: 'url', label: 'URL', minWidth: 300, isPrimary: true, defaultVisible: true },

  // Core SEO - visible by default
  { id: 'h1', label: 'H1', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'meta_title', label: 'Meta Title', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'meta_description', label: 'Meta Description', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'page_title', label: 'Page Title', minWidth: 200, isPrimary: false, defaultVisible: true },
  { id: 'canonical_url', label: 'Canonical URL', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'meta_robots', label: 'Meta Robots', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'word_count', label: 'Word Count', minWidth: 120, isPrimary: false, defaultVisible: true },
  { id: 'status_code', label: 'Status', minWidth: 100, isPrimary: false, defaultVisible: true },

  // Dates
  { id: 'publishing_date', label: 'Publishing Date', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'last_modified', label: 'Last Modified', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Headings
  { id: 'h1_count', label: 'H1 Count', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'h2_count', label: 'H2 Count', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'h3_count', label: 'H3 Count', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'h4_count', label: 'H4 Count', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'h5_count', label: 'H5 Count', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'h6_count', label: 'H6 Count', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'h1_list', label: 'H1 List', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'webpage_structure', label: 'Page Structure', minWidth: 200, isPrimary: false, defaultVisible: false },

  // Content
  { id: 'raw_text', label: 'Raw Text', minWidth: 250, isPrimary: false, defaultVisible: false },
  { id: 'markdown_text', label: 'Markdown', minWidth: 250, isPrimary: false, defaultVisible: false },
  { id: 'character_count', label: 'Char Count', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'readability_score', label: 'Readability', minWidth: 120, isPrimary: false, defaultVisible: false },

  // Page Metrics
  { id: 'page_weight_kb', label: 'Size (KB)', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'page_weight_mb', label: 'Size (MB)', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'load_time_ms', label: 'Load Time (ms)', minWidth: 130, isPrimary: false, defaultVisible: false },

  // SEO Metadata
  { id: 'meta_keywords', label: 'Meta Keywords', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'meta_viewport', label: 'Meta Viewport', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'meta_generator', label: 'Meta Generator', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Structured Data
  { id: 'schema_markup', label: 'Schema Markup', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'schema_types', label: 'Schema Types', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'hreflang', label: 'Hreflang', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Links
  { id: 'internal_links', label: 'Internal Links', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'internal_link_count', label: 'Links (I)', minWidth: 100, isPrimary: false, defaultVisible: true },
  { id: 'external_links', label: 'External Links', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'external_link_count', label: 'Links (E)', minWidth: 100, isPrimary: false, defaultVisible: true },
  { id: 'total_link_count', label: 'Total Links', minWidth: 100, isPrimary: false, defaultVisible: false },

  // Media
  { id: 'image_count', label: 'Images', minWidth: 100, isPrimary: false, defaultVisible: true },
  { id: 'image_alt_texts', label: 'Image Alt Texts', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'video_count', label: 'Videos', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'iframe_count', label: 'Iframes', minWidth: 100, isPrimary: false, defaultVisible: false },

  // Open Graph
  { id: 'og_title', label: 'OG Title', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'og_description', label: 'OG Description', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'og_image', label: 'OG Image', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'og_type', label: 'OG Type', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'og_url', label: 'OG URL', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'og_site_name', label: 'OG Site Name', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'og_locale', label: 'OG Locale', minWidth: 100, isPrimary: false, defaultVisible: false },

  // Twitter Card
  { id: 'twitter_card', label: 'Twitter Card', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'twitter_title', label: 'Twitter Title', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'twitter_description', label: 'Twitter Desc', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'twitter_image', label: 'Twitter Image', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'twitter_site', label: 'Twitter Site', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'twitter_creator', label: 'Twitter Creator', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Facebook
  { id: 'fb_app_id', label: 'FB App ID', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'fb_admins', label: 'FB Admins', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Apify Crawl Info
  { id: 'http_status_code', label: 'HTTP Status', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'apify_loaded_url', label: 'Loaded URL', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'apify_loaded_time', label: 'Load Time', minWidth: 150, isPrimary: false, defaultVisible: false },
  { id: 'apify_referrer_url', label: 'Referrer URL', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'apify_crawl_depth', label: 'Crawl Depth', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'apify_request_handler_mode', label: 'Handler Mode', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Apify Flags
  { id: 'apify_has_html', label: 'Has HTML', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'apify_has_markdown', label: 'Has Markdown', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'apify_has_screenshot', label: 'Has Screenshot', minWidth: 130, isPrimary: false, defaultVisible: false },

  // Screenshots
  { id: 'screenshot_url', label: 'Screenshot URL', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'screenshot_file', label: 'Screenshot File', minWidth: 200, isPrimary: false, defaultVisible: false },

  // HTML Technical Info
  { id: 'html_lang', label: 'HTML Lang', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'html_dir', label: 'HTML Dir', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'charset', label: 'Charset', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'favicon', label: 'Favicon', minWidth: 150, isPrimary: false, defaultVisible: false },

  // Forms & Interactivity
  { id: 'form_count', label: 'Forms', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'input_count', label: 'Inputs', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'button_count', label: 'Buttons', minWidth: 100, isPrimary: false, defaultVisible: false },

  // Scripts & Styles
  { id: 'script_count', label: 'Scripts', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'style_count', label: 'Styles', minWidth: 100, isPrimary: false, defaultVisible: false },
  { id: 'external_scripts', label: 'External Scripts', minWidth: 200, isPrimary: false, defaultVisible: false },
  { id: 'external_stylesheets', label: 'External Styles', minWidth: 200, isPrimary: false, defaultVisible: false },

  // Language & Author
  { id: 'language', label: 'Language', minWidth: 120, isPrimary: false, defaultVisible: false },
  { id: 'author', label: 'Author', minWidth: 150, isPrimary: false, defaultVisible: false },
];

// Preset Quick Views
interface QuickView {
  id: string;
  label: string;
  description: string;
  icon: React.ReactElement;
  columns: string[];
}

const QUICK_VIEWS: QuickView[] = [
  {
    id: 'default',
    label: 'Default View',
    description: 'Core SEO columns',
    icon: <CheckCircle fontSize="small" />,
    columns: ['url', 'h1', 'meta_title', 'meta_description', 'page_title', 'word_count', 'status_code', 'internal_link_count', 'external_link_count', 'image_count'],
  },
  {
    id: 'seo_overview',
    label: 'SEO Overview',
    description: 'All SEO metadata fields',
    icon: <CheckCircle fontSize="small" />,
    columns: [
      'url', 'h1', 'meta_title', 'meta_description', 'page_title', 'canonical_url', 'meta_robots',
      'word_count', 'status_code', 'meta_keywords', 'meta_viewport', 'meta_generator',
      'hreflang', 'publishing_date', 'last_modified',
    ],
  },
  {
    id: 'content_analysis',
    label: 'Content Analysis',
    description: 'Content quality and structure',
    icon: <TextFields fontSize="small" />,
    columns: [
      'url', 'h1', 'word_count', 'character_count', 'readability_score',
      'h1_count', 'h2_count', 'h3_count', 'h4_count', 'h5_count', 'h6_count',
      'h1_list', 'webpage_structure', 'raw_text', 'markdown_text',
    ],
  },
  {
    id: 'link_analysis',
    label: 'Link Analysis',
    description: 'Internal and external links',
    icon: <LinkIcon fontSize="small" />,
    columns: [
      'url', 'status_code', 'internal_links', 'internal_link_count',
      'external_links', 'external_link_count', 'total_link_count', 'canonical_url',
    ],
  },
  {
    id: 'media_audit',
    label: 'Media Audit',
    description: 'Images, videos, and media',
    icon: <Image fontSize="small" />,
    columns: [
      'url', 'image_count', 'image_alt_texts', 'video_count', 'iframe_count',
      'screenshot_url', 'screenshot_file', 'favicon',
    ],
  },
  {
    id: 'social_og',
    label: 'Social/OG Tags',
    description: 'Open Graph and Twitter Card',
    icon: <Share fontSize="small" />,
    columns: [
      'url', 'og_title', 'og_description', 'og_image', 'og_type', 'og_url', 'og_site_name', 'og_locale',
      'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image', 'twitter_site', 'twitter_creator',
      'fb_app_id', 'fb_admins',
    ],
  },
  {
    id: 'technical_seo',
    label: 'Technical SEO',
    description: 'Performance and technical',
    icon: <Speed fontSize="small" />,
    columns: [
      'url', 'status_code', 'http_status_code', 'page_weight_kb', 'page_weight_mb',
      'load_time_ms', 'html_lang', 'html_dir', 'charset', 'meta_viewport',
      'apify_loaded_time', 'apify_crawl_depth',
    ],
  },
  {
    id: 'schema_structured',
    label: 'Schema & Structured Data',
    description: 'Schema markup and hreflang',
    icon: <Code fontSize="small" />,
    columns: [
      'url', 'schema_markup', 'schema_types', 'hreflang',
      'language', 'html_lang', 'og_locale',
    ],
  },
  {
    id: 'apify_data',
    label: 'Apify Crawl Data',
    description: 'All Apify-specific information',
    icon: <DataObject fontSize="small" />,
    columns: [
      'url', 'http_status_code', 'apify_loaded_url', 'apify_loaded_time',
      'apify_referrer_url', 'apify_crawl_depth', 'apify_request_handler_mode',
      'apify_has_html', 'apify_has_markdown', 'apify_has_screenshot',
      'screenshot_url', 'screenshot_file',
    ],
  },
  {
    id: 'all_columns',
    label: 'All Columns',
    description: 'Show everything',
    icon: <Visibility fontSize="small" />,
    columns: COLUMN_DEFINITIONS.map((col) => col.id),
  },
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
  const [quickViewsAnchorEl, setQuickViewsAnchorEl] = useState<null | HTMLElement>(null);
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

  const handleQuickViewsClick = (event: React.MouseEvent<HTMLElement>) => {
    setQuickViewsAnchorEl(event.currentTarget);
  };

  const handleQuickViewsClose = () => {
    setQuickViewsAnchorEl(null);
  };

  const handleApplyQuickView = (view: QuickView) => {
    setVisibleColumns(view.columns);
    handleQuickViewsClose();
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
            onClick={handleQuickViewsClick}
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
                      // Special handling for URL column (no historical dropdown)
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

                      // Generic handling for all datapoint columns with historical tracking
                      // Access datapoint using bracket notation
                      const datapoint = (pageData as any)[column.id];

                      return (
                        <TableCell key={column.id}>
                          <HistoricalDropdown
                            datapoint={datapoint}
                            fieldName={column.label}
                          />
                        </TableCell>
                      );
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

      {/* Quick Views Menu */}
      <Menu
        anchorEl={quickViewsAnchorEl}
        open={Boolean(quickViewsAnchorEl)}
        onClose={handleQuickViewsClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxHeight: 500,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Quick Views
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Apply preset column configurations
          </Typography>
        </Box>

        {QUICK_VIEWS.map((view, index) => (
          <Box key={view.id}>
            {index === 1 && <Divider />}
            {index === QUICK_VIEWS.length - 1 && <Divider />}
            <MenuItem
              onClick={() => handleApplyQuickView(view)}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                {view.icon}
              </ListItemIcon>
              <ListItemText
                primary={view.label}
                secondary={view.description}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>
          </Box>
        ))}
      </Menu>

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
