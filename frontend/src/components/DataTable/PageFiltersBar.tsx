import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import {
  CheckCircle,
  Error,
  Image as ImageIcon,
  Code,
} from '@mui/icons-material';
import { FilterButton, FilterOption } from './FilterButton';

export interface PageFilters {
  onPageFactors: string[];
  statusCodes: string[];
}

interface PageFiltersBarProps {
  filters: PageFilters;
  onFiltersChange: (filters: PageFilters) => void;
  totalPages: number;
  filteredPages: number;
}

// On-Page Factor Filter Options
const ON_PAGE_FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'has_title',
    label: 'Has Title',
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  {
    id: 'missing_title',
    label: 'Missing Title',
    icon: <Error sx={{ fontSize: 16 }} />,
  },
  {
    id: 'has_meta',
    label: 'Has Meta Description',
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  {
    id: 'missing_meta',
    label: 'Missing Meta Description',
    icon: <Error sx={{ fontSize: 16 }} />,
  },
  {
    id: 'has_h1',
    label: 'Has H1',
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  {
    id: 'missing_h1',
    label: 'Missing H1',
    icon: <Error sx={{ fontSize: 16 }} />,
  },
  {
    id: 'has_images',
    label: 'Has Images',
    icon: <ImageIcon sx={{ fontSize: 16 }} />,
  },
  {
    id: 'missing_images',
    label: 'No Images',
    icon: <Error sx={{ fontSize: 16 }} />,
  },
];

// Status Code Filter Options
const STATUS_CODE_FILTER_OPTIONS: FilterOption[] = [
  {
    id: '200',
    label: '200 (OK)',
    icon: <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />,
  },
  {
    id: '301-302',
    label: '301/302 (Redirect)',
    icon: <Code sx={{ fontSize: 16, color: 'info.main' }} />,
  },
  {
    id: '404',
    label: '404 (Not Found)',
    icon: <Error sx={{ fontSize: 16, color: 'warning.main' }} />,
  },
  {
    id: '500',
    label: '500+ (Server Error)',
    icon: <Error sx={{ fontSize: 16, color: 'error.main' }} />,
  },
  {
    id: 'other',
    label: 'Other Status',
    icon: <Code sx={{ fontSize: 16 }} />,
  },
];

export const PageFiltersBar: React.FC<PageFiltersBarProps> = ({
  filters,
  onFiltersChange,
  totalPages,
  filteredPages,
}) => {
  const handleOnPageFactorsChange = (values: string[]) => {
    onFiltersChange({
      ...filters,
      onPageFactors: values,
    });
  };

  const handleStatusCodesChange = (values: string[]) => {
    onFiltersChange({
      ...filters,
      statusCodes: values,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({
      onPageFactors: [],
      statusCodes: [],
    });
  };

  const totalActiveFilters = filters.onPageFactors.length + filters.statusCodes.length;
  const isFiltering = totalActiveFilters > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Filter Buttons */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ flex: 1 }}
      >
        <FilterButton
          label="On-Page Factors"
          options={ON_PAGE_FILTER_OPTIONS}
          selectedValues={filters.onPageFactors}
          onChange={handleOnPageFactorsChange}
        />
        <FilterButton
          label="Status Codes"
          options={STATUS_CODE_FILTER_OPTIONS}
          selectedValues={filters.statusCodes}
          onChange={handleStatusCodesChange}
        />
      </Stack>

      {/* Active Filter Count */}
      {isFiltering && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${totalActiveFilters} filter${totalActiveFilters !== 1 ? 's' : ''} active`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label="Clear All"
            size="small"
            variant="outlined"
            onClick={handleClearAll}
            clickable
          />
        </Box>
      )}

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        Showing {filteredPages.toLocaleString()} of {totalPages.toLocaleString()} pages
      </Typography>
    </Box>
  );
};
