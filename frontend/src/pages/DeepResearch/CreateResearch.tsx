import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Slider,
  Typography,
  Stack,
  FormHelperText,
  SelectChangeEvent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  DashboardLayout,
  PageHeader,
  StandardButton,
  ModernCard,
} from '@/components/ui';
import {
  useCreateResearch,
  useAvailableRetrievers,
} from '@/hooks/api/useDeepResearch';

const REPORT_TYPES = [
  { value: 'research_report', label: 'Research Report (~2 min, $0.05-$0.15)', description: 'Standard research report with key findings' },
  { value: 'detailed_report', label: 'Detailed Report (~5 min, $0.15-$0.40)', description: 'Comprehensive analysis with deep insights' },
  { value: 'deep_research', label: 'Deep Research (~5 min, $0.30-$0.60)', description: 'Most thorough investigation with extensive sources' },
  { value: 'resource_report', label: 'Resource Report', description: 'Curated list of high-quality sources' },
  { value: 'outline_report', label: 'Outline Report', description: 'Structured outline for further exploration' },
];

const TONES = [
  'objective',
  'formal',
  'analytical',
  'persuasive',
  'informative',
  'explanatory',
  'descriptive',
  'critical',
  'comparative',
  'speculative',
  'reflective',
  'narrative',
  'humorous',
  'optimistic',
  'pessimistic',
];

const CreateResearch: React.FC = () => {
  const navigate = useNavigate();
  const createResearch = useCreateResearch();
  const { data: retrieversData } = useAvailableRetrievers();

  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('research_report');
  const [tone, setTone] = useState('objective');
  const [retrievers, setRetrievers] = useState<string[]>(['tavily']);
  const [maxIterations, setMaxIterations] = useState(5);
  const [searchDepth, setSearchDepth] = useState(5);

  const handleRetrieversChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setRetrievers(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      await createResearch.mutateAsync({
        query: query.trim(),
        report_type: reportType,
        tone,
        retrievers,
        max_iterations: maxIterations,
        search_depth: searchDepth,
        auto_start: true,
      });

      navigate('/dashboard/deep-researcher');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const selectedReportType = REPORT_TYPES.find(rt => rt.value === reportType);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <PageHeader
          title="Create Research"
          subtitle="Start a new AI-powered deep research query"
        />

        <ModernCard sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Query Input */}
            <TextField
              label="Research Question"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Enter your research question or topic..."
              helperText={`${query.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />

            {/* Report Type */}
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {selectedReportType && (
                <FormHelperText>{selectedReportType.description}</FormHelperText>
              )}
            </FormControl>

            {/* Tone */}
            <FormControl fullWidth>
              <InputLabel>Tone</InputLabel>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                label="Tone"
              >
                {TONES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>The tone and style of the generated report</FormHelperText>
            </FormControl>

            {/* Retrievers */}
            <FormControl fullWidth>
              <InputLabel>Search Retrievers</InputLabel>
              <Select
                multiple
                value={retrievers}
                onChange={handleRetrieversChange}
                input={<OutlinedInput label="Search Retrievers" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {retrieversData?.retrievers?.map((retriever) => (
                  <MenuItem
                    key={retriever.name}
                    value={retriever.name}
                    disabled={!retriever.is_configured}
                  >
                    <Box>
                      <Typography variant="body2">
                        {retriever.display_name}
                        {!retriever.is_configured && ' (not configured)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {retriever.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Select one or more search engines to use for research
              </FormHelperText>
            </FormControl>

            {/* Max Iterations */}
            <Box>
              <Typography gutterBottom>
                Max Iterations: <strong>{maxIterations}</strong>
              </Typography>
              <Slider
                value={maxIterations}
                onChange={(_, value) => setMaxIterations(value as number)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                valueLabelDisplay="auto"
              />
              <FormHelperText>
                Number of research iterations (more = deeper but slower)
              </FormHelperText>
            </Box>

            {/* Search Depth */}
            <Box>
              <Typography gutterBottom>
                Search Depth: <strong>{searchDepth}</strong>
              </Typography>
              <Slider
                value={searchDepth}
                onChange={(_, value) => setSearchDepth(value as number)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                valueLabelDisplay="auto"
              />
              <FormHelperText>
                Depth of search per iteration (more = more sources)
              </FormHelperText>
            </Box>

            {/* Submit Buttons */}
            <Stack direction="row" spacing={2}>
              <StandardButton
                variant="contained"
                onClick={handleSubmit}
                disabled={!query.trim() || createResearch.isPending}
                fullWidth
              >
                {createResearch.isPending ? 'Creating...' : 'Start Research'}
              </StandardButton>

              <StandardButton
                variant="outlined"
                onClick={() => navigate('/dashboard/deep-researcher')}
                disabled={createResearch.isPending}
              >
                Cancel
              </StandardButton>
            </Stack>
          </Stack>
        </ModernCard>
      </Box>
    </DashboardLayout>
  );
};

export default CreateResearch;
