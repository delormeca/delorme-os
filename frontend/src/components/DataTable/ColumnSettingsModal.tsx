import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';

// Default visible columns (exclude large/technical fields by default)
const DEFAULT_VISIBLE_COLUMNS = [
  'select',
  'url',
  'slug',
  'page_status',
  'page_screenshot',
  'page_title',
  'meta_title',
  'meta_description',
  'h1',
  'canonical',
  'hreflang',
  'word_count',
  'meta_robots',
  'image_count',
  'last_crawled_at',
];

// Column definitions with labels and descriptions
const COLUMN_DEFINITIONS = [
  { id: 'select', label: 'Checkbox', description: 'Selection checkbox', alwaysVisible: true },
  { id: 'url', label: 'URL', description: 'Full page URL' },
  { id: 'slug', label: 'Slug', description: 'URL path' },
  { id: 'page_status', label: 'Page Status', description: 'HTTP status code' },
  { id: 'page_screenshot', label: 'Screenshot', description: 'Page thumbnail' },
  { id: 'page_title', label: 'Page Title', description: 'HTML title tag' },
  { id: 'meta_title', label: 'Meta Title', description: 'SEO meta title' },
  { id: 'meta_description', label: 'Meta Description', description: 'SEO meta description' },
  { id: 'h1', label: 'H1', description: 'Main heading' },
  { id: 'webpage_structure', label: 'Webpage Structure', description: 'Heading hierarchy' },
  { id: 'canonical', label: 'Canonical URL', description: 'Canonical link' },
  { id: 'hreflang', label: 'Hreflang', description: 'Language tags' },
  { id: 'schema', label: 'Schema Markup', description: 'Structured data' },
  { id: 'word_count', label: 'Word Count', description: 'Page word count' },
  { id: 'meta_robots', label: 'Meta Robots', description: 'Robots directives' },
  { id: 'internal_links', label: 'Internal Links', description: 'Links to same domain' },
  { id: 'image_count', label: 'Image Count', description: 'Number of images' },
  { id: 'external_links', label: 'External Links', description: 'Links to other domains' },
  { id: 'body_content', label: 'Body Content', description: 'Full page text (large)', hiddenByDefault: true },
  { id: 'body_content_embedding', label: 'Embedding', description: 'Vector data (technical)', hiddenByDefault: true },
  { id: 'salient_entities', label: 'Salient Entities', description: 'Extracted entities' },
  { id: 'last_crawled_at', label: 'Last Crawled', description: 'Crawl timestamp' },
];

interface ColumnSettingsModalProps {
  open: boolean;
  onClose: () => void;
  visibleColumns: string[];
  onSave: (columns: string[]) => void;
}

export const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
  open,
  onClose,
  visibleColumns,
  onSave,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(visibleColumns);

  useEffect(() => {
    setSelectedColumns(visibleColumns);
  }, [visibleColumns]);

  const handleToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(COLUMN_DEFINITIONS.map((col) => col.id));
  };

  const handleDeselectAll = () => {
    // Keep always-visible columns
    setSelectedColumns(
      COLUMN_DEFINITIONS.filter((col) => col.alwaysVisible).map((col) => col.id)
    );
  };

  const handleResetToDefault = () => {
    setSelectedColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  const handleSave = () => {
    onSave(selectedColumns);
    onClose();
  };

  const handleCancel = () => {
    setSelectedColumns(visibleColumns);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Column Visibility
          </Typography>
          <IconButton size="small" onClick={handleCancel}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2}>
          {/* Quick actions */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="small" variant="outlined" onClick={handleDeselectAll}>
              Deselect All
            </Button>
            <Button size="small" variant="outlined" onClick={handleResetToDefault}>
              Reset to Default
            </Button>
          </Stack>

          {/* Selection summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedColumns.length} of {COLUMN_DEFINITIONS.length} columns visible
            </Typography>
          </Box>

          <Divider />

          {/* Column list */}
          <FormGroup>
            {COLUMN_DEFINITIONS.map((column) => (
              <Box
                key={column.id}
                sx={{
                  py: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  borderRadius: 1,
                  px: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedColumns.includes(column.id)}
                      onChange={() => handleToggle(column.id)}
                      disabled={column.alwaysVisible}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">{column.label}</Typography>
                        {column.alwaysVisible && (
                          <Chip label="Always visible" size="small" sx={{ height: 20 }} />
                        )}
                        {column.hiddenByDefault && (
                          <Chip
                            label="Hidden by default"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {column.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ my: 0 }}
                />
              </Box>
            ))}
          </FormGroup>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};
