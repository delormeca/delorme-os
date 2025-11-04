import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { CheckCircle, Error, CloudDownload } from '@mui/icons-material';

interface ScrapeResult {
  success_count: number;
  failed_count: number;
  total: number;
  results?: Array<{
    page_id: string;
    status: string;
    error?: string;
  }>;
  message: string;
}

interface ScrapingProgressModalProps {
  open: boolean;
  result: ScrapeResult | null;
  isLoading: boolean;
  onClose: () => void;
}

const ScrapingProgressModal: React.FC<ScrapingProgressModalProps> = ({
  open,
  result,
  isLoading,
  onClose,
}) => {
  const progress = result
    ? ((result.success_count + result.failed_count) / result.total) * 100
    : 0;

  const isComplete = result && result.success_count + result.failed_count === result.total;

  return (
    <Dialog
      open={open}
      onClose={isComplete ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!isComplete}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudDownload color="primary" />
          <Typography variant="h6">
            {isLoading ? 'Scraping Content...' : 'Scraping Complete'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Progress Bar */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {result
                  ? `${result.success_count + result.failed_count} / ${result.total}`
                  : '0 / 0'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>

          {/* Results Summary */}
          {result && (
            <>
              <Divider />

              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                  }}
                >
                  <CheckCircle />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.success_count} pages scraped successfully
                    </Typography>
                  </Box>
                </Box>

                {result.failed_count > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                    }}
                  >
                    <Error />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.failed_count} pages failed
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>

              {/* Failed Pages Details */}
              {result.results && result.failed_count > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Failed Pages:
                    </Typography>
                    <Box
                      sx={{
                        maxHeight: 200,
                        overflowY: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <List dense>
                        {result.results
                          .filter((r) => r.status === 'failed' || r.error)
                          .map((failedPage, index) => (
                            <ListItem key={failedPage.page_id || index}>
                              <ListItemIcon>
                                <Error color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={failedPage.page_id}
                                secondary={failedPage.error || 'Unknown error'}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ScrapingProgressModal;
