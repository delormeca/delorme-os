import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close,
  FileDownload,
  Delete,
  CheckCircle,
  LocalOffer,
} from '@mui/icons-material';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll?: () => void;
  onDeselectAll: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onManageTags?: () => void;
  allSelected?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onExport,
  onDelete,
  onManageTags,
  allSelected = false,
}) => {
  const theme = useTheme();

  if (selectedCount === 0 && !allSelected) {
    return null;
  }

  const effectiveCount = allSelected ? totalCount : selectedCount;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        px: 3,
        py: 1.5,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        {/* Left side: Selection info */}
        <Stack direction="row" spacing={2} alignItems="center">
          <CheckCircle color="primary" />

          <Typography variant="body1" fontWeight={600} color="primary">
            {effectiveCount} {effectiveCount === 1 ? 'page' : 'pages'} selected
          </Typography>

          {!allSelected && selectedCount > 0 && selectedCount < totalCount && onSelectAll && (
            <Button
              size="small"
              onClick={onSelectAll}
              sx={{ textTransform: 'none' }}
            >
              Select all {totalCount.toLocaleString()} pages
            </Button>
          )}

          {(allSelected || selectedCount > 0) && (
            <Button
              size="small"
              onClick={onDeselectAll}
              sx={{ textTransform: 'none' }}
            >
              Clear selection
            </Button>
          )}
        </Stack>

        {/* Right side: Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          {onManageTags && (
            <Tooltip title="Manage tags for selected pages">
              <Button
                variant="outlined"
                size="small"
                startIcon={<LocalOffer />}
                onClick={onManageTags}
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                Manage Tags
              </Button>
            </Tooltip>
          )}

          {onExport && (
            <Tooltip title="Export selected pages">
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownload />}
                onClick={onExport}
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                Export
              </Button>
            </Tooltip>
          )}

          {onDelete && (
            <Tooltip title="Delete selected pages">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Delete />}
                onClick={onDelete}
                sx={{
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': {
                    borderColor: theme.palette.error.dark,
                    bgcolor: alpha(theme.palette.error.main, 0.04),
                  },
                }}
              >
                Delete
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Close">
            <IconButton size="small" onClick={onDeselectAll}>
              <Close />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};
