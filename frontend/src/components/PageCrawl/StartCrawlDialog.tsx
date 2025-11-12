import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { PlayArrow, Close } from "@mui/icons-material";
import { useStartPageCrawl } from "@/hooks/api/usePageCrawl";

interface StartCrawlDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onCrawlStarted?: (crawlRunId: string) => void;
}

const StartCrawlDialog: React.FC<StartCrawlDialogProps> = ({
  open,
  onClose,
  clientId,
  onCrawlStarted,
}) => {
  const [runType, setRunType] = useState<"full" | "selective" | "manual">("full");
  const startCrawlMutation = useStartPageCrawl();

  const handleStart = async () => {
    try {
      console.log("Starting crawl with:", {
        client_id: clientId,
        run_type: runType,
      });

      const result = await startCrawlMutation.mutateAsync({
        client_id: clientId,
        run_type: runType,
      });

      console.log("Crawl started successfully:", result);

      // Extract crawl_run_id from job_id if needed
      // For now, we'll close the dialog and let the parent handle it
      if (onCrawlStarted) {
        onCrawlStarted(result.job_id);
      }

      onClose();
    } catch (error) {
      // Error handled by mutation hook
      console.error("Failed to start crawl:", error);
    }
  };

  const handleClose = () => {
    if (!startCrawlMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PlayArrow color="primary" />
          <Typography variant="h6" component="span">
            Start Page Crawl & Data Extraction
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            This will crawl all pages and extract 17 data points including AI
            embeddings and entities.
          </Alert>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Crawl Type
            </FormLabel>
            <RadioGroup
              value={runType}
              onChange={(e) => setRunType(e.target.value as any)}
            >
              <FormControlLabel
                value="full"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      Full Crawl
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crawl all pages discovered in engine setup
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="selective"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      Selective Crawl
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crawl only selected pages (coming soon)
                    </Typography>
                  </Box>
                }
                disabled
              />
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      Manual Pages
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crawl manually added pages only
                    </Typography>
                  </Box>
                }
                disabled
              />
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              What will be extracted:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                <li>Basic metadata (title, meta tags, headings)</li>
                <li>Content analysis (word count, structure)</li>
                <li>Links (internal, external, images)</li>
                <li>Schema markup & structured data</li>
                <li>AI embeddings for semantic search</li>
                <li>Entity extraction (people, orgs, locations)</li>
              </ul>
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Estimated cost: ~$0.002-0.02 per page (OpenAI + Google NLP)
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={startCrawlMutation.isPending}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          variant="contained"
          disabled={startCrawlMutation.isPending}
          startIcon={
            startCrawlMutation.isPending ? (
              <CircularProgress size={16} />
            ) : (
              <PlayArrow />
            )
          }
        >
          {startCrawlMutation.isPending ? "Starting..." : "Start Crawl"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartCrawlDialog;
