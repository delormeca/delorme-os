/**
 * Historical Dropdown Component
 *
 * Shows a dropdown with historical values for a specific datapoint.
 * Displays when user clicks the down arrow (▼) in a table cell.
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Stack,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  KeyboardArrowDown,
  Check,
  Warning,
} from '@mui/icons-material';
import { EnhancedDatapoint } from '@/hooks/api/useEnhancedCrawlResults';
import { format } from 'date-fns';

interface HistoricalDropdownProps {
  datapoint: EnhancedDatapoint;
  fieldName: string;
}

export const HistoricalDropdown: React.FC<HistoricalDropdownProps> = ({
  datapoint,
  fieldName,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  const currentDisplay = formatValue(datapoint.current);
  const hasHistory = datapoint.history && datapoint.history.length > 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {currentDisplay}
      </Typography>

      {hasHistory && (
        <>
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              padding: '2px',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <KeyboardArrowDown sx={{ fontSize: 16 }} />
          </IconButton>

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                maxWidth: 400,
                maxHeight: 400,
                overflow: 'auto',
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {fieldName} History
              </Typography>

              <Stack spacing={1.5}>
                {datapoint.history.map((historyItem, index) => {
                  const isLatest = index === 0;
                  const isSameAsNext =
                    index < datapoint.history.length - 1 &&
                    historyItem.value === datapoint.history[index + 1].value;

                  return (
                    <Box
                      key={`${historyItem.crawl_run_id}-${index}`}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: isLatest
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${
                          isLatest
                            ? theme.palette.success.main
                            : theme.palette.divider
                        }`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        {isLatest && (
                          <Check sx={{ fontSize: 16, color: 'success.main' }} />
                        )}
                        {!isSameAsNext && index > 0 && (
                          <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(historyItem.crawled_at)}
                        </Typography>
                        {isLatest && (
                          <Chip label="Current" size="small" color="success" sx={{ height: 18 }} />
                        )}
                        {!isSameAsNext && index > 0 && (
                          <Chip label="Changed" size="small" color="warning" sx={{ height: 18 }} />
                        )}
                      </Stack>

                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-word',
                          fontWeight: isLatest ? 600 : 400,
                        }}
                      >
                        {formatValue(historyItem.value)}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Version {historyItem.version}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};
