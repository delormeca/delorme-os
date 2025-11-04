import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Divider,
} from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { StandardButton } from '@/components/ui';

interface SitemapDiffResult {
  new_urls: string[];
  removed_urls: string[];
  new_count: number;
  removed_count: number;
  unchanged_count: number;
  total_in_sitemap: number;
  message: string;
}

interface SitemapDiffNotificationProps {
  result: SitemapDiffResult | null;
  onClose: () => void;
  onKeepRemovedPages: () => void;
  onDeleteRemovedPages: () => void;
}

const SitemapDiffNotification: React.FC<SitemapDiffNotificationProps> = ({
  result,
  onClose,
  onKeepRemovedPages,
  onDeleteRemovedPages,
}) => {
  const [showNewPagesSnackbar, setShowNewPagesSnackbar] = useState(false);
  const [showRemovedDialog, setShowRemovedDialog] = useState(false);

  React.useEffect(() => {
    if (result) {
      // Show snackbar for new pages
      if (result.new_count > 0) {
        setShowNewPagesSnackbar(true);
      }

      // Show dialog for removed pages
      if (result.removed_count > 0) {
        setShowRemovedDialog(true);
      }
    }
  }, [result]);

  const handleKeepPages = () => {
    setShowRemovedDialog(false);
    onKeepRemovedPages();
    onClose();
  };

  const handleDeletePages = () => {
    setShowRemovedDialog(false);
    onDeleteRemovedPages();
    onClose();
  };

  if (!result) return null;

  return (
    <>
      {/* Snackbar for new pages */}
      <Snackbar
        open={showNewPagesSnackbar}
        autoHideDuration={5000}
        onClose={() => setShowNewPagesSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowNewPagesSnackbar(false)}
          severity="success"
          icon={<CheckCircle />}
          sx={{ width: '100%' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Discovered {result.new_count} new page{result.new_count !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="caption">
            They've been automatically added to your project.
          </Typography>
        </Alert>
      </Snackbar>

      {/* Dialog for removed pages */}
      <Dialog
        open={showRemovedDialog}
        onClose={() => setShowRemovedDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            <Typography variant="h6">Pages Removed from Sitemap</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            These {result.removed_count} page{result.removed_count !== 1 ? 's have' : ' has'} been removed from the sitemap.
            Do you want to keep them in your project?
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Removed URLs:
          </Typography>

          <Box
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.default',
            }}
          >
            <List dense>
              {result.removed_urls.map((url, index) => (
                <React.Fragment key={url}>
                  <ListItem>
                    <ListItemText
                      primary={url}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { wordBreak: 'break-all' }
                      }}
                    />
                  </ListItem>
                  {index < result.removed_urls.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Keep Pages:</strong> The pages will remain in your project but marked as not in sitemap.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              <strong>Remove Pages:</strong> The pages and all their data will be permanently deleted.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <StandardButton onClick={handleKeepPages} variant="outlined">
            Keep Pages
          </StandardButton>
          <StandardButton onClick={handleDeletePages} variant="contained" color="error">
            Remove Pages
          </StandardButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SitemapDiffNotification;
