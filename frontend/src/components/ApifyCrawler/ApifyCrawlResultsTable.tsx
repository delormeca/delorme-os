/**
 * Apify Crawl Results Table
 *
 * Comprehensive data table showing all crawled pages with tags and on-page SEO metrics
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Link,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  OpenInNew,
  FilterList,
} from '@mui/icons-material';
import { ModernCard } from '@/components/ui';

// Mock data structure - replace with actual API data
interface CrawlResult {
  id: string;
  url: string;
  title: string;
  status_code: number;
  tags: string[];
  // On-page SEO metrics
  has_h1: boolean;
  has_meta_description: boolean;
  has_title: boolean;
  word_count: number;
  image_count: number;
  images_with_alt: number;
  internal_links: number;
  external_links: number;
  crawled_at: string;
}

interface ApifyCrawlResultsTableProps {
  crawlRunId: string;
}

export const ApifyCrawlResultsTable: React.FC<ApifyCrawlResultsTableProps> = ({
  crawlRunId,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // TODO: Replace with actual API call to fetch crawl results
  const mockResults: CrawlResult[] = [];
  const isLoading = false;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
    } else if (statusCode >= 400) {
      return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
    } else {
      return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
    }
  };

  const getSEOIssues = (result: CrawlResult): string[] => {
    const issues: string[] = [];
    if (!result.has_h1) issues.push('Missing H1');
    if (!result.has_meta_description) issues.push('Missing Meta Desc');
    if (!result.has_title) issues.push('Missing Title');
    if (result.word_count < 300) issues.push('Low Word Count');
    if (result.image_count > 0 && result.images_with_alt === 0) issues.push('No Alt Text');
    return issues;
  };

  const filteredResults = mockResults.filter((result) => {
    const matchesSearch = result.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => result.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <ModernCard variant="glass">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Crawl Results
          </Typography>
          <Chip
            label={`${filteredResults.length} pages`}
            color="primary"
            size="small"
          />
        </Box>

        {/* Search and filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="Search by URL or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Filter by tags">
            <IconButton size="small">
              <FilterList />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Results Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 300 }}>URL</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>SEO Issues</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Words</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Images</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Links (I/E)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isLoading ? 'Loading crawl results...' : 'No results found. Start a crawl to see data here.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredResults
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((result) => {
                  const seoIssues = getSEOIssues(result);
                  return (
                    <TableRow
                      key={result.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                    >
                      <TableCell>
                        <Tooltip title={`Status: ${result.status_code}`}>
                          {getStatusIcon(result.status_code)}
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: '0.875rem',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 300,
                          }}
                        >
                          {result.url}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                          }}
                        >
                          {result.title || <em>No title</em>}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {result.tags.slice(0, 2).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))}
                          {result.tags.length > 2 && (
                            <Chip
                              label={`+${result.tags.length - 2}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {seoIssues.slice(0, 2).map((issue) => (
                            <Chip
                              key={issue}
                              label={issue}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))}
                          {seoIssues.length > 2 && (
                            <Chip
                              label={`+${seoIssues.length - 2}`}
                              size="small"
                              color="error"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                          {seoIssues.length === 0 && (
                            <Chip
                              label="✓ OK"
                              size="small"
                              color="success"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">{result.word_count}</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">
                          {result.images_with_alt}/{result.image_count}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">
                          {result.internal_links}/{result.external_links}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Open page">
                          <IconButton
                            size="small"
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNew sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredResults.length > 0 && (
        <TablePagination
          component="div"
          count={filteredResults.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      )}
    </ModernCard>
  );
};
