import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Chip,
  Stack,
  Typography,
  IconButton,
  Alert,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Close, Add, LocalOffer } from '@mui/icons-material';
import { StandardButton } from '@/components/ui';

interface TagManagementModalProps {
  open: boolean;
  onClose: () => void;
  selectedPageIds: string[];
  clientId: string;
  existingTags?: string[];
  allAvailableTags?: string[];
  onSave: (tags: string[], mode: 'replace' | 'append') => Promise<void>;
  isLoading?: boolean;
}

export const TagManagementModal: React.FC<TagManagementModalProps> = ({
  open,
  onClose,
  selectedPageIds,
  clientId,
  existingTags = [],
  allAvailableTags = [],
  onSave,
  isLoading = false,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [error, setError] = useState<string | null>(null);

  // Initialize tags when modal opens
  useEffect(() => {
    if (open) {
      setTags(existingTags);
      setInputValue('');
      setError(null);
      setMode('replace');
    }
  }, [open, existingTags]);

  const handleAddTag = (newTag: string | null) => {
    if (!newTag) return;

    const trimmedTag = newTag.trim();
    if (trimmedTag === '') {
      setError('Tag cannot be empty');
      return;
    }

    if (tags.includes(trimmedTag)) {
      setError('Tag already exists');
      return;
    }

    setTags([...tags, trimmedTag]);
    setInputValue('');
    setError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      event.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      await onSave(tags, mode);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tags');
    }
  };

  const isBulkEdit = selectedPageIds.length > 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalOffer color="primary" />
          <Typography variant="h6" component="span">
            Manage Tags
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Info Alert */}
          {isBulkEdit && (
            <Alert severity="info">
              Editing tags for {selectedPageIds.length} selected pages
            </Alert>
          )}

          {/* Tag Input with Autocomplete */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Add Tags
            </Typography>
            <Autocomplete
              freeSolo
              options={allAvailableTags.filter((tag) => !tags.includes(tag))}
              inputValue={inputValue}
              onInputChange={(event, newValue) => {
                setInputValue(newValue);
              }}
              onChange={(event, newValue) => {
                handleAddTag(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type a tag and press Enter"
                  size="small"
                  fullWidth
                  onKeyPress={handleKeyPress}
                  helperText="Press Enter to add, or select from existing tags"
                />
              )}
            />
          </Box>

          {/* Current Tags Display */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Current Tags ({tags.length})
            </Typography>
            {tags.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 2 }}
              >
                No tags added yet
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  minHeight: 60,
                }}
              >
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Bulk Edit Mode Selection */}
          {isBulkEdit && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Update Mode
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Replace all tags"
                  onClick={() => setMode('replace')}
                  color={mode === 'replace' ? 'primary' : 'default'}
                  variant={mode === 'replace' ? 'filled' : 'outlined'}
                  clickable
                />
                <Chip
                  label="Add to existing tags"
                  onClick={() => setMode('append')}
                  color={mode === 'append' ? 'primary' : 'default'}
                  variant={mode === 'append' ? 'filled' : 'outlined'}
                  clickable
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {mode === 'replace'
                  ? 'Will replace all existing tags on selected pages'
                  : 'Will add these tags to existing tags on selected pages'}
              </Typography>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <StandardButton onClick={onClose} variant="outlined" disabled={isLoading}>
          Cancel
        </StandardButton>
        <StandardButton
          onClick={handleSave}
          variant="contained"
          isLoading={isLoading}
          loadingText="Saving..."
          disabled={tags.length === 0}
        >
          Save Tags
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default TagManagementModal;
