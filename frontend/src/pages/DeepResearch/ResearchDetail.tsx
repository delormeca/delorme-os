import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Link,
  Paper,
  Tab,
  Tabs,
  LinearProgress,
  Card,
  CardContent,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  OpenInNew,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  DashboardLayout,
  PageHeader,
  LoadingState,
  StandardButton,
  ModernCard,
} from '@/components/ui';
import {
  useResearchDetail,
  useChatWithResearch,
  ChatMessageRead,
} from '@/hooks/api/useDeepResearch';
import { useResearchWebSocket } from '@/hooks/useResearchWebSocket';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ResearchDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { researchId } = useParams<{ researchId: string }>();
  const { data: research, isLoading } = useResearchDetail(researchId);
  const chatMutation = useChatWithResearch(researchId);
  const { messages: wsMessages, progress: wsProgress } = useResearchWebSocket(
    research?.status === 'processing' ? researchId || null : null
  );

  const [tabValue, setTabValue] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessageRead[]>([]);

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;

    try {
      const result = await chatMutation.mutateAsync({ content: chatMessage.trim() });
      setChatHistory((prev) => [...prev, result.message, result.response]);
      setChatMessage('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'processing':
        return <HourglassEmpty fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <LoadingState message="Loading research..." />
        </Box>
      </DashboardLayout>
    );
  }

  if (!research) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <Typography>Research not found</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  const displayProgress = research.status === 'processing' ? wsProgress || research.progress : research.progress;

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <PageHeader
          title={research.query}
          subtitle={
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Chip
                icon={getStatusIcon(research.status)}
                label={research.status.toUpperCase()}
                color={getStatusColor(research.status)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(research.created_at).toLocaleString()}
              </Typography>
            </Stack>
          }
          action={
            <StandardButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard/deep-researcher')}
            >
              Back to List
            </StandardButton>
          }
        />

        {/* Progress Bar */}
        {research.status === 'processing' && (
          <Card sx={{ mt: 3, mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Research in progress...</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(displayProgress)}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={displayProgress} sx={{ borderRadius: 1 }} />

              {/* WebSocket Messages */}
              {wsMessages.length > 0 && (
                <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                  {wsMessages.slice(-5).map((msg, idx) => (
                    <Typography key={idx} variant="caption" color="text.secondary" display="block">
                      {msg.content || msg.type}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata Card */}
        <ModernCard sx={{ mt: 3 }}>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Report Type
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {research.report_type.replace('_', ' ')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tone
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {research.tone}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sources
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {research.total_sources}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Cost
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ${research.cost_usd.toFixed(4)}
              </Typography>
            </Box>
            {research.duration_seconds && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(research.duration_seconds)}s
                </Typography>
              </Box>
            )}
          </Stack>
        </ModernCard>

        {/* Error Message */}
        {research.error_message && (
          <Card sx={{ mt: 3, bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
            <CardContent>
              <Typography variant="body2" color="error">
                <strong>Error:</strong> {research.error_message}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {research.status === 'completed' && (
          <ModernCard sx={{ mt: 3 }}>
            <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
              <Tab label="Report" />
              <Tab label={`Sources (${research.sources.length})`} />
              <Tab label="Chat" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Report Content */}
              {research.report_markdown ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    '& h1': { fontSize: '1.75rem', fontWeight: 600, mt: 3, mb: 2 },
                    '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 2, mb: 1.5 },
                    '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 1 },
                    '& p': { mb: 2, lineHeight: 1.7 },
                    '& ul, & ol': { mb: 2, pl: 3 },
                    '& li': { mb: 0.5 },
                    '& a': { color: theme.palette.primary.main, textDecoration: 'underline' },
                  }}
                >
                  <ReactMarkdown>{research.report_markdown}</ReactMarkdown>
                </Paper>
              ) : (
                <Typography color="text.secondary">Report not available</Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Sources List */}
              <List>
                {research.sources.map((source, idx) => (
                  <React.Fragment key={source.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight="bold">
                              {idx + 1}.
                            </Typography>
                            <Link href={source.url} target="_blank" rel="noopener noreferrer">
                              {source.title || source.url}
                              <OpenInNew fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                            </Link>
                            <Chip label={source.retriever} size="small" variant="outlined" />
                          </Stack>
                        }
                        secondary={source.summary}
                      />
                    </ListItem>
                    {idx < research.sources.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Chat Interface */}
              <Box>
                {/* Chat History */}
                <Box sx={{ mb: 3, maxHeight: 400, overflow: 'auto' }}>
                  {chatHistory.map((msg, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor:
                          msg.role === 'user'
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.secondary.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {msg.content}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Chat Input */}
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    placeholder="Ask a question about the research..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    disabled={chatMutation.isPending}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendChat}
                    disabled={!chatMessage.trim() || chatMutation.isPending}
                  >
                    <Send />
                  </IconButton>
                </Stack>
              </Box>
            </TabPanel>
          </ModernCard>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ResearchDetail;
