import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Close, Add, Delete } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StandardButton } from "@/components/ui";
import { useStartEngineSetup, useValidateSitemap } from "@/hooks/api";

// Validation schema
const engineSetupSchema = z.discriminatedUnion("setup_type", [
  z.object({
    setup_type: z.literal("sitemap"),
    sitemap_url: z.string().url("Invalid sitemap URL").min(1, "Sitemap URL is required"),
    manual_urls: z.array(z.string()).optional(),
  }),
  z.object({
    setup_type: z.literal("manual"),
    sitemap_url: z.string().optional(),
    manual_urls: z.array(z.string().url("Invalid URL")).min(1, "At least one URL is required"),
  }),
]);

type EngineSetupFormInputs = z.infer<typeof engineSetupSchema>;

interface EngineSetupModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  defaultSitemapUrl?: string;
  onSetupStarted: (runId: string) => void;
}

export const EngineSetupModal: React.FC<EngineSetupModalProps> = ({
  open,
  onClose,
  clientId,
  clientName,
  defaultSitemapUrl,
  onSetupStarted,
}) => {
  const [setupType, setSetupType] = useState<"sitemap" | "manual">("sitemap");
  const [manualUrls, setManualUrls] = useState<string[]>([""]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");

  const { mutateAsync: startSetup, isPending } = useStartEngineSetup();
  const { mutateAsync: validateSitemap, isPending: isValidating } = useValidateSitemap();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EngineSetupFormInputs>({
    resolver: zodResolver(engineSetupSchema),
    defaultValues: {
      setup_type: "sitemap",
      sitemap_url: defaultSitemapUrl || "",
      manual_urls: [],
    },
  });

  const sitemapUrl = watch("sitemap_url");

  const handleSetupTypeChange = (type: "sitemap" | "manual") => {
    setSetupType(type);
    setValue("setup_type", type);
    if (type === "sitemap") {
      setValue("manual_urls", []);
    }
  };

  const handleAddUrlField = () => {
    const newUrls = [...manualUrls, ""];
    setManualUrls(newUrls);
    setValue("manual_urls", newUrls, { shouldValidate: false });
  };

  const handleRemoveUrlField = (index: number) => {
    const newUrls = manualUrls.filter((_, i) => i !== index);
    setManualUrls(newUrls.length === 0 ? [""] : newUrls);
    setValue("manual_urls", newUrls.length === 0 ? [] : newUrls, { shouldValidate: false });
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...manualUrls];
    newUrls[index] = value;
    setManualUrls(newUrls);
    setValue("manual_urls", newUrls, { shouldValidate: false });
  };

  const onSubmit = async (data: EngineSetupFormInputs) => {
    try {
      let requestData: any = {
        client_id: clientId,
        setup_type: data.setup_type,
      };

      if (data.setup_type === "sitemap") {
        requestData.sitemap_url = data.sitemap_url;
      } else {
        // Manual mode
        let urls: string[];
        if (bulkMode) {
          // Parse bulk URLs (one per line)
          urls = bulkUrls
            .split("\n")
            .map((url) => url.trim())
            .filter((url) => url.length > 0);
        } else {
          // Get URLs from individual fields
          urls = manualUrls.filter((url) => url.trim().length > 0);
        }
        requestData.manual_urls = urls;
      }

      const response = await startSetup(requestData);
      onSetupStarted(response.run_id);
      onClose();
    } catch (error) {
      console.error("Failed to start engine setup:", error);
    }
  };

  const handleValidateSitemap = async () => {
    const sitemapUrl = watch("sitemap_url");
    if (!sitemapUrl || errors.sitemap_url) return;

    try {
      await validateSitemap({ sitemap_url: sitemapUrl });
    } catch (error) {
      // Error handled by mutation hook
      console.error("Sitemap validation error:", error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">Setup Website Engine - {clientName}</Typography>
          <IconButton onClick={handleClose} disabled={isPending}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info">
              The Website Engine discovers all pages from your client's website to prepare them for crawling and content extraction.
            </Alert>

            {setupType === "manual" && errors.manual_urls && !Array.isArray(errors.manual_urls) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.manual_urls.message}
              </Alert>
            )}

            {/* Setup Type Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Choose Setup Method
              </Typography>
              <RadioGroup value={setupType} onChange={(e) => handleSetupTypeChange(e.target.value as "sitemap" | "manual")}>
                <FormControlLabel
                  value="sitemap"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Import from Sitemap
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically discover pages from an XML sitemap
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="manual"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Add Pages Manually
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Manually enter page URLs one by one or in bulk
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>

            {/* Sitemap Mode */}
            {setupType === "sitemap" && (
              <Box>
                <Controller
                  name="sitemap_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sitemap URL"
                      placeholder="https://example.com/sitemap.xml"
                      fullWidth
                      error={!!errors.sitemap_url}
                      helperText={errors.sitemap_url?.message}
                      disabled={isPending}
                    />
                  )}
                />
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    Enter the full URL of the XML sitemap file
                  </Typography>
                  <StandardButton
                    variant="outlined"
                    size="small"
                    onClick={handleValidateSitemap}
                    disabled={!watch("sitemap_url") || !!errors.sitemap_url || isPending || isValidating}
                    isLoading={isValidating}
                    loadingText="Validating..."
                  >
                    Test Sitemap
                  </StandardButton>
                </Box>
              </Box>
            )}

            {/* Manual Mode */}
            {setupType === "manual" && (
              <Box>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <StandardButton
                    variant={!bulkMode ? "contained" : "outlined"}
                    onClick={() => setBulkMode(false)}
                    size="small"
                  >
                    Single URLs
                  </StandardButton>
                  <StandardButton
                    variant={bulkMode ? "contained" : "outlined"}
                    onClick={() => setBulkMode(true)}
                    size="small"
                  >
                    Bulk Import
                  </StandardButton>
                </Box>

                {!bulkMode ? (
                  // Single URL mode
                  <Stack spacing={2}>
                    {manualUrls.map((url, index) => (
                      <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "start" }}>
                        <TextField
                          value={url}
                          onChange={(e) => handleUrlChange(index, e.target.value)}
                          label={`URL ${index + 1}`}
                          placeholder="https://example.com/page"
                          fullWidth
                          error={!!errors.manual_urls?.[index]}
                          helperText={errors.manual_urls?.[index]?.message}
                          disabled={isPending}
                        />
                        {manualUrls.length > 1 && (
                          <IconButton onClick={() => handleRemoveUrlField(index)} color="error" disabled={isPending}>
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    {manualUrls.length < 10 && (
                      <StandardButton
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={handleAddUrlField}
                        disabled={isPending}
                      >
                        Add Another URL
                      </StandardButton>
                    )}
                  </Stack>
                ) : (
                  // Bulk mode
                  <TextField
                    value={bulkUrls}
                    onChange={(e) => {
                      setBulkUrls(e.target.value);
                      // Parse and sync to form state
                      const parsedUrls = e.target.value
                        .split("\n")
                        .map(url => url.trim())
                        .filter(url => url.length > 0);
                      setValue("manual_urls", parsedUrls, { shouldValidate: false });
                    }}
                    label="URLs (one per line)"
                    placeholder={`https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3`}
                    multiline
                    rows={10}
                    fullWidth
                    disabled={isPending}
                    helperText="Paste URLs, one per line"
                  />
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <StandardButton onClick={handleClose} disabled={isPending}>
            Cancel
          </StandardButton>
          <StandardButton
            type="submit"
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            {isPending ? "Starting Setup..." : "Add Pages"}
          </StandardButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};
