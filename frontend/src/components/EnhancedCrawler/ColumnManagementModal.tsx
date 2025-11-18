/**
 * Column Management Modal
 *
 * Allows users to show/hide columns, reorder them, and reset to defaults.
 * Inspired by Screaming Frog's column configurator.
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Close,
  DragIndicator,
  Visibility,
  VisibilityOff,
  RestartAlt,
} from '@mui/icons-material';

export interface ColumnDefinition {
  id: string;
  label: string;
  minWidth: number;
  isPrimary: boolean;
  defaultVisible: boolean;
}

interface ColumnManagementModalProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  visibleColumns: string[];
  onApply: (visibleColumns: string[]) => void;
}

export const ColumnManagementModal: React.FC<ColumnManagementModalProps> = ({
  open,
  onClose,
  columns,
  visibleColumns,
  onApply,
}) => {
  const theme = useTheme();
  const [localVisibleColumns, setLocalVisibleColumns] = useState<string[]>(visibleColumns);

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalVisibleColumns(visibleColumns);
    }
  }, [open, visibleColumns]);

  const handleToggleColumn = (columnId: string) => {
    if (localVisibleColumns.includes(columnId)) {
      setLocalVisibleColumns(localVisibleColumns.filter((id) => id !== columnId));
    } else {
      setLocalVisibleColumns([...localVisibleColumns, columnId]);
    }
  };

  const handleShowAll = () => {
    setLocalVisibleColumns(columns.map((col) => col.id));
  };

  const handleHideAll = () => {
    // Only hide non-primary columns
    const primaryColumns = columns.filter((col) => col.isPrimary).map((col) => col.id);
    setLocalVisibleColumns(primaryColumns);
  };

  const handleResetToDefault = () => {
    const defaultColumns = columns.filter((col) => col.defaultVisible).map((col) => col.id);
    setLocalVisibleColumns(defaultColumns);
  };

  const handleApply = () => {
    onApply(localVisibleColumns);
    onClose();
  };

  const handleCancel = () => {
    setLocalVisibleColumns(visibleColumns);
    onClose();
  };

  const visibleCount = localVisibleColumns.length;
  const totalCount = columns.length;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Manage Columns
          </Typography>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={handleShowAll}
          >
            Show All
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityOff />}
            onClick={handleHideAll}
          >
            Hide All
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAlt />}
            onClick={handleResetToDefault}
          >
            Reset Default
          </Button>
        </Stack>

        {/* Column Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {visibleCount} of {totalCount} columns visible
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Column List */}
        <Stack spacing={1}>
          {columns.map((column) => {
            const isVisible = localVisibleColumns.includes(column.id);
            const isDisabled = column.isPrimary;

            return (
              <Box
                key={column.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: isVisible
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(144, 202, 249, 0.08)'
                      : 'rgba(25, 118, 210, 0.08)'
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isVisible
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(144, 202, 249, 0.12)'
                        : 'rgba(25, 118, 210, 0.12)'
                      : theme.palette.action.hover,
                  },
                }}
              >
                {/* Drag Handle (visual only for now) */}
                <DragIndicator
                  sx={{
                    fontSize: 20,
                    color: theme.palette.text.disabled,
                    cursor: 'grab',
                  }}
                />

                {/* Checkbox */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isVisible}
                      onChange={() => handleToggleColumn(column.id)}
                      disabled={isDisabled}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: isVisible ? 600 : 400 }}>
                        {column.label}
                      </Typography>
                      {isDisabled && (
                        <Typography variant="caption" color="text.secondary">
                          (cannot hide primary field)
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ flex: 1, m: 0 }}
                />
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleApply} variant="contained">
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
