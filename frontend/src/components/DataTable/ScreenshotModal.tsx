import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';

interface ScreenshotModalProps {
  open: boolean;
  onClose: () => void;
  screenshotUrl: string | null | undefined;
  screenshotFullUrl?: string | null | undefined;
  pageUrl: string;
}

/**
 * Screenshot Modal Component
 *
 * Displays a page screenshot in a modal dialog with full-size view option.
 * Supports both thumbnail and full-page screenshots.
 */
export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  open,
  onClose,
  screenshotUrl,
  screenshotFullUrl,
  pageUrl,
}) => {
  const theme = useTheme();

  // Use full screenshot if available, otherwise use thumbnail
  const displayUrl = screenshotFullUrl || screenshotUrl;

  if (!displayUrl) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ flex: 1, pr: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Page Screenshot
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mt: 0.5,
            }}
          >
            {pageUrl}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => window.open(displayUrl, '_blank')}
            sx={{ color: 'primary.main' }}
            title="Open in new tab"
          >
            <OpenInNew />
          </IconButton>
          <IconButton size="small" onClick={onClose} title="Close">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            bgcolor: theme.palette.grey[100],
          }}
        >
          <Box
            component="img"
            src={displayUrl}
            alt="Page screenshot"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" font-size="18" text-anchor="middle" fill="%23999"%3EFailed to load screenshot%3C/text%3E%3C/svg%3E';
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};
