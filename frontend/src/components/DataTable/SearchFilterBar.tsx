import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  Settings,
} from '@mui/icons-material';

interface SearchFilterBarProps {
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onWordCountFilterChange: (min?: number, max?: number) => void;
  onClearFilters: () => void;
  onOpenColumnSettings?: () => void;
  activeFiltersCount?: number;
  searchValue?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  onSearchChange,
  onStatusFilterChange,
  onWordCountFilterChange,
  onClearFilters,
  onOpenColumnSettings,
  activeFiltersCount = 0,
  searchValue = '',
}) => {
  const [searchInput, setSearchInput] = useState(searchValue);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wordCountMin, setWordCountMin] = useState<string>('');
  const [wordCountMax, setWordCountMax] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilterChange(value);
  };

  const handleWordCountChange = () => {
    const min = wordCountMin ? parseInt(wordCountMin) : undefined;
    const max = wordCountMax ? parseInt(wordCountMax) : undefined;
    onWordCountFilterChange(min, max);
  };

  const handleClearAll = () => {
    setSearchInput('');
    setStatusFilter('all');
    setWordCountMin('');
    setWordCountMax('');
    onClearFilters();
  };

  const hasActiveFilters =
    searchInput !== '' ||
    statusFilter !== 'all' ||
    wordCountMin !== '' ||
    wordCountMax !== '';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        {/* Top row: Search and Column Settings */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Global Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by page name, URL, slug, or tag..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchInput('')}
                    edge="end"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Column Settings Button */}
          {onOpenColumnSettings && (
            <Tooltip title="Column visibility settings">
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={onOpenColumnSettings}
                sx={{ minWidth: 150 }}
              >
                Columns
              </Button>
            </Tooltip>
          )}
        </Stack>

        {/* Bottom row: Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Page Status</InputLabel>
            <Select
              value={statusFilter}
              label="Page Status"
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <MenuItem value="all">All Status Codes</MenuItem>
              <MenuItem value="200">200 OK</MenuItem>
              <MenuItem value="301">301 Redirect</MenuItem>
              <MenuItem value="302">302 Redirect</MenuItem>
              <MenuItem value="404">404 Not Found</MenuItem>
              <MenuItem value="500">500 Error</MenuItem>
              <MenuItem value="503">503 Unavailable</MenuItem>
            </Select>
          </FormControl>

          {/* Word Count Range Filter */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
              Word Count:
            </Typography>
            <TextField
              size="small"
              type="number"
              placeholder="Min"
              value={wordCountMin}
              onChange={(e) => setWordCountMin(e.target.value)}
              onBlur={handleWordCountChange}
              sx={{ width: 100 }}
            />
            <Typography variant="body2" color="text.secondary">
              to
            </Typography>
            <TextField
              size="small"
              type="number"
              placeholder="Max"
              value={wordCountMax}
              onChange={(e) => setWordCountMax(e.target.value)}
              onBlur={handleWordCountChange}
              sx={{ width: 100 }}
            />
          </Stack>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
              <Chip
                icon={<FilterList />}
                label={`${activeFiltersCount || 0} filter${activeFiltersCount !== 1 ? 's' : ''} active`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Button
                size="small"
                onClick={handleClearAll}
                startIcon={<Clear />}
                sx={{ textTransform: 'none' }}
              >
                Clear all
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
