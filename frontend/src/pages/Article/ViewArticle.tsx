import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  Article,
  CalendarToday,
  Person,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useArticleDetail } from '@/hooks/api/useArticleDetail';
import { 
  DashboardLayout,
  ModernCard,
  StandardIconButton,
  LoadingState,
  StatusBadge,
  StandardButton
} from '@/components/ui';

const ViewArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: article, isLoading, error } = useArticleDetail(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading article..." />
      </DashboardLayout>
    );
  }

  if (error || !article) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8, maxWidth: 'md', mx: 'auto' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Article not found
          </Typography>
          <StandardButton
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/my-articles')}
          >
            Back to Articles
          </StandardButton>
        </Box>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <StandardIconButton
          variant="outlined"
          onClick={() => navigate('/dashboard/my-articles')}
        >
          <ArrowBack />
        </StandardIconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Article View
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reading mode
          </Typography>
        </Box>
        <StandardButton
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate(`/dashboard/my-articles/${article.id}/edit`)}
          size="small"
        >
          Edit
        </StandardButton>
      </Box>

      {/* Article Content */}
      <ModernCard variant="glass">
        {/* Article Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <StatusBadge
              status={article.is_published ? 'success' : 'warning'}
              label={article.is_published ? 'Published' : 'Draft'}
            />
            
            {article.published_at && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <CalendarToday sx={{ fontSize: '1rem' }} />
                <Typography variant="caption">
                  {formatDate(article.published_at)}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <Person sx={{ fontSize: '1rem' }} />
              <Typography variant="caption">
                {article.author}
              </Typography>
            </Box>
          </Box>

          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            {article.title}
          </Typography>
        </Box>

        {/* Article Content */}
        <Box 
          sx={{ 
            '& p': { 
              mb: 2, 
              lineHeight: 1.7,
              fontSize: '1.1rem',
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              mt: 3,
              mb: 2,
              fontWeight: 600,
            },
            '& ul, & ol': {
              mb: 2,
              pl: 3,
            },
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              pl: 2,
              ml: 0,
              fontStyle: 'italic',
              color: 'text.secondary',
            },
          }}
        >
          <Typography 
            variant="body1" 
            component="div"
            sx={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontSize: '1.1rem',
            }}
          >
            {article.content}
          </Typography>
        </Box>

        {/* Article Footer */}
        <Box sx={{ 
          mt: 4, 
          pt: 3, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Article sx={{ color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary">
              Article by {article.author}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <StandardButton
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/dashboard/my-articles/${article.id}/edit`)}
              size="small"
            >
              Edit Article
            </StandardButton>
            
            <StandardButton
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard/my-articles')}
              size="small"
            >
              Back to List
            </StandardButton>
          </Stack>
        </Box>
      </ModernCard>
      </Box>
    </DashboardLayout>
  );
};

export default ViewArticle;
