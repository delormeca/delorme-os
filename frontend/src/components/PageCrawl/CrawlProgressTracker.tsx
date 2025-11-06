import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  HourglassEmpty,
  Speed,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { usePageCrawlStatus, useCancelPageCrawl } from "@/hooks/api/usePageCrawl";
import { formatDistanceToNow } from "date-fns";

interface CrawlProgressTrackerProps {
  crawlRunId: string | null;
  onComplete?: () => void;
}

const CrawlProgressTracker: React.FC<CrawlProgressTrackerProps> = ({
  crawlRunId,
  onComplete,
}) => {
  const { data: status, isLoading } = usePageCrawlStatus(crawlRunId, !!crawlRunId);
  const cancelMutation = useCancelPageCrawl();
  const [showErrors, setShowErrors] = useState(false);
  const [showCosts, setShowCosts] = useState(false);

  // Call onComplete when crawl finishes
  useEffect(() => {
    if (
      status &&
      (status.status === "completed" || status.status === "failed") &&
      onComplete
    ) {
      onComplete();
    }
  }, [status?.status, onComplete]);

  if (!crawlRunId) {
    return null;
  }

  if (isLoading || !status) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <HourglassEmpty />
            <Typography>Loading crawl status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    switch (status.status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "in_progress":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "failed":
        return <Error color="error" />;
      case "in_progress":
        return <HourglassEmpty color="primary" />;
      default:
        return <HourglassEmpty />;
    }
  };

  const totalCost =
    (status.api_costs?.openai_embeddings?.cost_usd || 0) +
    (status.api_costs?.google_nlp?.cost_usd || 0);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            {getStatusIcon()}
            <div>
              <Typography variant="h6">Page Crawl Progress</Typography>
              <Typography variant="body2" color="text.secondary">
                {status.current_status_message || "Processing pages..."}
              </Typography>
            </div>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={status.status.toUpperCase()}
              color={getStatusColor()}
              size="small"
            />
            {status.status === "in_progress" && (
              <IconButton
                size="small"
                onClick={() => {
                  const jobId = `page_crawl_${status.id}_${status.status}`;
                  cancelMutation.mutate(jobId);
                }}
                disabled={cancelMutation.isPending}
                title="Cancel crawl"
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {status.progress_percentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={status.progress_percentage}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {status.total_pages}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Pages
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {status.successful_pages}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Successful
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="error">
                {status.failed_pages}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Failed
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4">
                {status.total_pages - status.successful_pages - status.failed_pages}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Current Page */}
        {status.current_page_url && status.status === "in_progress" && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<Speed />}>
            <Typography variant="body2" noWrap>
              Currently crawling: <strong>{status.current_page_url}</strong>
            </Typography>
          </Alert>
        )}

        {/* Performance Metrics */}
        {status.performance_metrics && (
          <Box mb={2}>
            <Divider sx={{ mb: 1 }} />
            <Grid container spacing={2}>
              {status.performance_metrics.avg_time_per_page && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Time/Page
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {status.performance_metrics.avg_time_per_page.toFixed(2)}s
                  </Typography>
                </Grid>
              )}
              {status.performance_metrics.pages_per_minute && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Pages/Minute
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {status.performance_metrics.pages_per_minute.toFixed(1)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* API Costs */}
        {status.api_costs && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ cursor: "pointer" }}
              onClick={() => setShowCosts(!showCosts)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={600}>
                  API Costs: ${totalCost.toFixed(4)}
                </Typography>
              </Box>
              <IconButton size="small">
                {showCosts ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={showCosts}>
              <Box sx={{ mt: 1, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align="right">Requests</TableCell>
                      <TableCell align="right">Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {status.api_costs.openai_embeddings && (
                      <TableRow>
                        <TableCell>OpenAI Embeddings</TableCell>
                        <TableCell align="right">
                          {status.api_costs.openai_embeddings.requests}
                          {status.api_costs.openai_embeddings.tokens && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              ({status.api_costs.openai_embeddings.tokens.toLocaleString()}{" "}
                              tokens)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          ${status.api_costs.openai_embeddings.cost_usd.toFixed(6)}
                        </TableCell>
                      </TableRow>
                    )}
                    {status.api_costs.google_nlp && (
                      <TableRow>
                        <TableCell>Google NLP</TableCell>
                        <TableCell align="right">
                          {status.api_costs.google_nlp.requests}
                        </TableCell>
                        <TableCell align="right">
                          ${status.api_costs.google_nlp.cost_usd.toFixed(6)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Errors */}
        {status.errors && status.errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ cursor: "pointer" }}
              onClick={() => setShowErrors(!showErrors)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Error fontSize="small" color="error" />
                <Typography variant="body2" fontWeight={600} color="error">
                  {status.errors.length} Error{status.errors.length > 1 ? "s" : ""}
                </Typography>
              </Box>
              <IconButton size="small">
                {showErrors ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={showErrors}>
              <Box sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
                {status.errors.map((error, index) => (
                  <Alert severity="error" sx={{ mb: 1 }} key={index}>
                    <Typography variant="body2" fontWeight={600}>
                      {error.url}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {error.error}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {error.timestamp &&
                        formatDistanceToNow(new Date(error.timestamp), {
                          addSuffix: true,
                        })}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Completion Message */}
        {status.status === "completed" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✅ Crawl completed successfully! Extracted data from{" "}
              {status.successful_pages} of {status.total_pages} pages.
            </Typography>
            {status.completed_at && (
              <Typography variant="caption" color="text.secondary" display="block">
                Completed{" "}
                {formatDistanceToNow(new Date(status.completed_at), { addSuffix: true })}
              </Typography>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CrawlProgressTracker;
