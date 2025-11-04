import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
} from '@mui/material';
import {
  Home,
  Refresh,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { ErrorCard, AuthPageLogo, CTAButton, StandardButton } from '@/components/ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}


class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleResetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI can be provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          pt: 12,
          pb: 6,
        }}>
          <Container maxWidth="sm">
            <ErrorCard>
              {/* Logo Section */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <AuthPageLogo />
              </Box>

              {/* Error Header */}
              <Box sx={{ textAlign: "center", mb: 2.5 }}>
                <Typography sx={{
                  fontSize: { xs: '3rem', sm: '4rem' },
                  lineHeight: 1,
                  mb: 2,
                }}>
                  ⚠️
                </Typography>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                }}>
                  Something Went Wrong
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  An unexpected error occurred in the application
                </Typography>
              </Box>

              {/* Information Section */}
              <Box sx={{ 
                background: alpha('#1976d2', 0.05),
                border: `1px solid ${alpha('#1976d2', 0.15)}`,
                borderRadius: 1.5,
                p: 3,
                mb: 3,
                textAlign: "center"
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Don't worry! This is likely a temporary issue. Try refreshing the page or returning to the home page.
                </Typography>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: alpha('#f44336', 0.1),
                    borderRadius: 1,
                    textAlign: "left"
                  }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                      <strong>Error:</strong> {this.state.error.message}
                    </Typography>
                    {this.state.error.stack && (
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace', 
                        color: 'error.main',
                        mt: 1,
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}>
                        {this.state.error.stack}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Stack spacing={2}>
                <CTAButton
                  fullWidth
                  size="large"
                  startIcon={<Refresh />}
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </CTAButton>

                <StandardButton
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                >
                  Go to Home
                </StandardButton>

                <StandardButton
                  variant="text"
                  fullWidth
                  onClick={this.handleResetError}
                >
                  Try Again
                </StandardButton>
              </Stack>

              {/* Additional Information */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: alpha('#2196f3', 0.1), 
                borderRadius: 1.5,
                textAlign: "center"
              }}>
                <Typography variant="body2" color="text.secondary">
                  🔧 <strong>Developers:</strong> Check the console for more details • 📧 <strong>Report:</strong> Contact support if this persists
                </Typography>
              </Box>
            </ErrorCard>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 