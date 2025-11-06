import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  HourglassEmpty,
} from "@mui/icons-material";
import { StandardButton } from "@/components/ui";
import {
  useEngineSetupProgress,
  useCancelEngineSetup,
} from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";

interface EngineSetupProgressDialogProps {
  open: boolean;
  onClose: () => void;
  runId: string | null;
  clientId: string;
}

export const EngineSetupProgressDialog: React.FC<EngineSetupProgressDialogProps> = ({
  open,
  onClose,
  runId,
  clientId,
}) => {
  const queryClient = useQueryClient();

  // Poll progress every 2 seconds while in_progress or pending
  const { data: progress, isLoading } = useEngineSetupProgress(runId, open && !!runId);

  const { mutateAsync: cancelSetup, isPending: isCancelling } = useCancelEngineSetup();

  // Refresh client data when setup completes
  useEffect(() => {
    if (progress?.status === "completed") {
      // Invalidate queries to refresh client details and pages
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-pages"] });
      queryClient.invalidateQueries({ queryKey: ["client-page-count"] });
    }
  }, [progress?.status, clientId, queryClient]);

  const handleCancel = async () => {
    if (!runId) return;
    try {
      await cancelSetup(runId);
      onClose();
    } catch (error) {
      console.error("Failed to cancel setup:", error);
    }
  };

  const handleClose = () => {
    // Only allow closing if not in progress
    if (progress?.status !== "in_progress" && progress?.status !== "pending") {
      onClose();
    }
  };

  if (!runId || !progress) {
    return null;
  }

  const isInProgress = progress.status === "in_progress" || progress.status === "pending";
  const isCompleted = progress.status === "completed";
  const isFailed = progress.status === "failed";

  // Get status icon and color
  const getStatusDisplay = () => {
    if (isCompleted) {
      return { icon: <CheckCircle color="success" />, color: "success" as const, label: "Completed" };
    }
    if (isFailed) {
      return { icon: <ErrorIcon color="error" />, color: "error" as const, label: "Failed" };
    }
    if (progress.status === "pending") {
      return { icon: <HourglassEmpty color="info" />, color: "info" as const, label: "Pending" };
    }
    return { icon: <HourglassEmpty color="primary" />, color: "primary" as const, label: "In Progress" };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isInProgress}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Engine Setup Progress</Typography>
            <Chip
              icon={statusDisplay.icon}
              label={statusDisplay.label}
              color={statusDisplay.color}
              size="small"
            />
          </Box>
          <IconButton onClick={handleClose} disabled={isInProgress}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Progress Bar */}
          {isInProgress && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Processing pages...
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {progress.progress_percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.progress_percentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Current URL being processed */}
          {isInProgress && progress.current_url && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Currently processing:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  bgcolor: "action.hover",
                  p: 1,
                  borderRadius: 1,
                  wordBreak: "break-all",
                }}
              >
                {progress.current_url}
              </Typography>
            </Box>
          )}

          {/* Statistics */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Statistics
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Pages
                </Typography>
                <Typography variant="h6">{progress.total_pages}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Successful
                </Typography>
                <Typography variant="h6" color="success.main">
                  {progress.successful_pages}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Failed
                </Typography>
                <Typography variant="h6" color="error.main">
                  {progress.failed_pages}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Skipped (Duplicates)
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {progress.skipped_pages}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Completion Message */}
          {isCompleted && (
            <Alert severity="success">
              <Typography variant="body2">
                Successfully imported{" "}
                <strong>{progress.successful_pages}</strong> pages!
                {progress.skipped_pages > 0 && (
                  <> ({progress.skipped_pages} duplicates skipped)</>
                )}
                {progress.failed_pages > 0 && (
                  <> {progress.failed_pages} pages failed to import.</>
                )}
              </Typography>
            </Alert>
          )}

          {/* Error Message */}
          {isFailed && progress.error_message && (
            <Alert severity="error">
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Setup Failed
              </Typography>
              <Typography variant="body2">{progress.error_message}</Typography>
            </Alert>
          )}

          {/* Timing Information */}
          {(progress.started_at || progress.completed_at) && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {progress.started_at && (
                  <Box component="span" sx={{ display: "block" }}>
                    Started: {new Date(progress.started_at).toLocaleString()}
                  </Box>
                )}
                {progress.completed_at && (
                  <Box component="span" sx={{ display: "block" }}>
                    Completed: {new Date(progress.completed_at).toLocaleString()}
                  </Box>
                )}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {isInProgress ? (
          <>
            <StandardButton onClick={handleClose} disabled>
              Close
            </StandardButton>
            <StandardButton
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={isCancelling}
              startIcon={<CancelIcon />}
            >
              {isCancelling ? "Cancelling..." : "Cancel Setup"}
            </StandardButton>
          </>
        ) : (
          <StandardButton variant="contained" onClick={handleClose}>
            Close
          </StandardButton>
        )}
      </DialogActions>
    </Dialog>
  );
};
