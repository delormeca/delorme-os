/**
 * Client Workflow Page
 *
 * Generic page for SEO workflow tools with specific implementations per workflow type
 */
import React from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  Assessment,
  Link as LinkIcon,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientDetail } from '@/hooks/api/useClients';
import {
  DashboardLayout,
  StandardIconButton,
  LoadingState,
  ModernCard,
} from '@/components/ui';

// Workflow configuration
const WORKFLOW_CONFIG = {
  'optimization-plan': {
    title: 'Optimization Plan',
    description: 'Generate comprehensive SEO optimization strategies',
    icon: TrendingUp,
    color: '#10b981',
  },
  'serp-analyzer': {
    title: 'SERP Analyzer',
    description: 'Analyze search engine results pages and competitor rankings',
    icon: Assessment,
    color: '#3b82f6',
  },
  'internal-linking-audit': {
    title: 'Internal Linking Audit',
    description: 'Audit internal link structure and identify opportunities',
    icon: LinkIcon,
    color: '#8b5cf6',
  },
  'internal-linking-report': {
    title: 'Internal Linking Report',
    description: 'Generate detailed reports on internal linking performance',
    icon: Assessment,
    color: '#f59e0b',
  },
};

type WorkflowType = keyof typeof WORKFLOW_CONFIG;

const ClientWorkflowPage: React.FC = () => {
  const { clientId, workflowType } = useParams<{ clientId: string; workflowType: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: client, isLoading, error } = useClientDetail(clientId || '');

  const workflow = WORKFLOW_CONFIG[workflowType as WorkflowType];

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading client..." />
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Client not found
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (!workflow) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Workflow not found
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  const WorkflowIcon = workflow.icon;

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <WorkflowIcon
              sx={{
                fontSize: 40,
                color: workflow.color,
              }}
            />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {workflow.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client.name} - {workflow.description}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Workflow Content */}
        <ModernCard variant="glass" sx={{ p: 4, textAlign: 'center' }}>
          <AutoAwesome sx={{ fontSize: 64, color: workflow.color, mb: 3, opacity: 0.8 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {workflow.title} - Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 'md', mx: 'auto' }}>
            {workflow.description}
          </Typography>

          <Alert severity="info" sx={{ textAlign: 'left', maxWidth: 'md', mx: 'auto' }}>
            <AlertTitle>Workflow Under Development</AlertTitle>
            This SEO workflow is currently being developed. It will include:
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>AI-powered analysis and recommendations</li>
              <li>Automated data collection and processing</li>
              <li>Comprehensive reporting and insights</li>
              <li>Integration with n8n automation workflows</li>
            </ul>
          </Alert>
        </ModernCard>
      </Box>
    </DashboardLayout>
  );
};

export default ClientWorkflowPage;
