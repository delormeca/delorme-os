/**
 * SitemapChangesTable - Compact table showing sitemap URL changes
 *
 * Displays changes detected in a sitemap tracker run:
 * - New URLs discovered
 * - Removed URLs
 * - Status code changes
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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TablePagination,
} from '@mui/material';
import {
  AddCircle,
  RemoveCircle,
  ChangeCircle,
  OpenInNew,
} from '@mui/icons-material';
import { useSitemapChanges } from '@/hooks/api/useSitemapChanges';
import { useTheme } from '@mui/material';

interface SitemapChangesTableProps {
  runId: string;
  compact?: boolean; // If true, show only summary/recent changes
  maxRows?: number; // Max rows to show in compact mode
}

export const SitemapChangesTable: React.FC<SitemapChangesTableProps> = ({
  runId,
  compact = false,
  maxRows = 10,
}) => {
  const theme = useTheme();
  const [changeTypeFilter, setChangeTypeFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(compact ? maxRows : 50);

  const { data, isLoading, error } = useSitemapChanges({
    run_id: runId,
    change_type: changeTypeFilter,
    page: page + 1, // API uses 1-based pagination
    page_size: pageSize,
  });

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: string) => {
    setChangeTypeFilter(newValue === 'all' ? undefined : newValue);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <AddCircle color="success" />;
      case 'removed':
        return <RemoveCircle color="error" />;
      case 'status_changed':
        return <ChangeCircle color="warning" />;
      default:
        return null;
    }
  };

  const getChangeLabel = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'New';
      case 'removed':
        return 'Removed';
      case 'status_changed':
        return 'Status Change';
      default:
        return changeType;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'success';
      case 'removed':
        return 'error';
      case 'status_changed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load changes: {(error as any).message || 'Unknown error'}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No changes detected in this run
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Change Type Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={changeTypeFilter || 'all'}
          onChange={handleChangeTab}
          aria-label="change type filter"
        >
          <Tab label="All Changes" value="all" />
          <Tab label="New URLs" value="added" />
          <Tab label="Removed" value="removed" />
          <Tab label="Status Changes" value="status_changed" />
        </Tabs>
      </Box>

      {/* Changes Table */}
      <TableContainer>
        <Table size={compact ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>URL</TableCell>
              <TableCell align="center">Old Status</TableCell>
              <TableCell align="center">New Status</TableCell>
              <TableCell>Detected At</TableCell>
              {!compact && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((change) => (
              <TableRow key={change.id} hover>
                {/* Change Type */}
                <TableCell>
                  <Tooltip title={getChangeLabel(change.change_type)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getChangeIcon(change.change_type)}
                      {!compact && (
                        <Chip
                          label={getChangeLabel(change.change_type)}
                          size="small"
                          color={getChangeColor(change.change_type) as any}
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                </TableCell>

                {/* URL */}
                <TableCell>
                  <Tooltip title={change.url}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: compact ? '0.7rem' : '0.75rem',
                        maxWidth: compact ? 300 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {change.url}
                    </Typography>
                  </Tooltip>
                </TableCell>

                {/* Old Status Code */}
                <TableCell align="center">
                  {change.old_status_code ? (
                    <Chip
                      label={change.old_status_code}
                      size="small"
                      color={change.old_status_code === 200 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>

                {/* New Status Code */}
                <TableCell align="center">
                  {change.new_status_code ? (
                    <Chip
                      label={change.new_status_code}
                      size="small"
                      color={change.new_status_code === 200 ? 'success' : 'warning'}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>

                {/* Detected At */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(change.detected_at)}
                  </Typography>
                </TableCell>

                {/* Actions */}
                {!compact && (
                  <TableCell align="center">
                    <Tooltip title="Open URL">
                      <IconButton
                        size="small"
                        href={change.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!compact && (
        <TablePagination
          component="div"
          count={data.total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}

      {/* Compact mode footer showing total */}
      {compact && data.total > data.items.length && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {data.items.length} of {data.total} changes
          </Typography>
        </Box>
      )}
    </Box>
  );
};
