import React, { useState, useEffect } from 'react';
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
  Typography,
  Chip,
  useTheme,
  Tooltip,
} from '@mui/material';
import { CheckCircle, Cancel, HelpOutline } from '@mui/icons-material';
import { format } from 'date-fns';

interface PageWithStats {
  id: string;
  url: string;
  slug: string;
  status: string;
  is_in_sitemap: boolean;
  removed_from_sitemap_at: string | null;
  extraction_method: string | null;
  last_crawled_at: string | null;
  created_at: string;
  version_count: number;
  current_data: {
    meta_title?: { title: string };
    meta_description?: { description: string };
    h1?: { tags: string[] };
    h2?: { tags: string[] };
    body?: { word_count: number; char_count: number };
  } | null;
}

interface PagesDataTableProps {
  pages: PageWithStats[];
  selectedPages: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

const PagesDataTable: React.FC<PagesDataTableProps> = ({
  pages,
  selectedPages,
  onSelectionChange,
}) => {
  const theme = useTheme();
  const [selectAll, setSelectAll] = useState(false);

  // Update selectAll checkbox state when selection changes
  useEffect(() => {
    setSelectAll(pages.length > 0 && selectedPages.size === pages.length);
  }, [selectedPages, pages.length]);

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(pages.map((p) => p.id)));
    }
  };

  const handleSelectPage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    onSelectionChange(newSelected);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'crawled':
        return 'success';
      case 'crawling':
        return 'primary';
      case 'discovered':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (pages.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No pages available. Extract URLs from the sitemap to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        overflowX: 'auto',
        maxWidth: '100%',
        '& .MuiTable-root': {
          minWidth: 1200,
        },
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              padding="checkbox"
              sx={{
                position: 'sticky',
                left: 0,
                backgroundColor: theme.palette.background.paper,
                zIndex: 3,
                borderRight: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Checkbox
                indeterminate={selectedPages.size > 0 && selectedPages.size < pages.length}
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 300 }}>URL</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>In Sitemap</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Last Scraped</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Method</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Versions</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Meta Title</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>Meta Description</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>H1 Tags</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>H2 Tags</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Word Count</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pages.map((page) => (
            <TableRow
              key={page.id}
              hover
              onClick={() => handleSelectPage(page.id)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell
                padding="checkbox"
                sx={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: theme.palette.background.paper,
                  zIndex: 2,
                  borderRight: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Checkbox
                  checked={selectedPages.has(page.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPage(page.id);
                  }}
                />
              </TableCell>

              <TableCell>
                <Tooltip title={page.url}>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {page.url}
                  </Typography>
                </Tooltip>
              </TableCell>

              <TableCell>
                <Chip label={page.status} color={getStatusColor(page.status)} size="small" />
              </TableCell>

              <TableCell>
                {page.is_in_sitemap ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Tooltip
                    title={
                      page.removed_from_sitemap_at
                        ? `Removed on ${formatDate(page.removed_from_sitemap_at)}`
                        : 'Not in sitemap'
                    }
                  >
                    <Cancel color="error" fontSize="small" />
                  </Tooltip>
                )}
              </TableCell>

              <TableCell>
                <Typography variant="body2">{formatDate(page.last_crawled_at)}</Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {page.extraction_method || '-'}
                </Typography>
              </TableCell>

              <TableCell>
                <Chip label={page.version_count} size="small" variant="outlined" />
              </TableCell>

              <TableCell>
                <Tooltip title={page.current_data?.meta_title?.title || ''}>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {page.current_data?.meta_title?.title || '-'}
                  </Typography>
                </Tooltip>
              </TableCell>

              <TableCell>
                <Tooltip title={page.current_data?.meta_description?.description || ''}>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 250,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {page.current_data?.meta_description?.description || '-'}
                  </Typography>
                </Tooltip>
              </TableCell>

              <TableCell>
                <Chip
                  label={page.current_data?.h1?.tags?.length || 0}
                  size="small"
                  variant="outlined"
                />
              </TableCell>

              <TableCell>
                <Chip
                  label={page.current_data?.h2?.tags?.length || 0}
                  size="small"
                  variant="outlined"
                />
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {page.current_data?.body?.word_count?.toLocaleString() || '-'}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{formatDate(page.created_at)}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PagesDataTable;
