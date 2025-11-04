import React from 'react';
import { Box, Container, Typography, styled } from '@mui/material';
import { designTokens, styleHelpers } from '@/theme/customizations';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  centered?: boolean;
  fullHeight?: boolean;
  withPadding?: boolean;
  sx?: any;
}

interface CenteredPageLayoutProps {
  children: React.ReactNode;
  maxWidth?: number | string;
  sx?: any;
}

interface HeroSectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'minimal';
  sx?: any;
}

// Base page wrapper for consistent page structure
const PageWrapper = styled(Box)<{ fullHeight?: boolean; withPadding?: boolean }>(
  ({ theme, fullHeight, withPadding }) => ({
    width: '100%',
    minHeight: fullHeight ? '100vh' : 'auto',
    position: 'relative',
    ...(withPadding && {
      padding: theme.spacing(2),
      paddingTop: theme.spacing(12),
      paddingBottom: theme.spacing(6),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1),
        paddingTop: theme.spacing(10),
        paddingBottom: theme.spacing(4),
      },
    }),
  })
);

// Centered page layout for auth pages and error pages
const CenteredWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  ...styleHelpers.responsivePadding(theme),
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(6),
}));

// Hero section component for landing pages
const HeroSectionWrapper = styled(Box)<{ variant?: 'default' | 'gradient' | 'minimal' }>(
  ({ theme, variant = 'default' }) => ({
    borderRadius: theme.shape.borderRadius * 2,  // Slightly larger for hero sections
    padding: theme.spacing(6, 4),
    marginBottom: theme.spacing(4),
    position: 'relative',
    overflow: 'hidden',
    
    ...(variant === 'default' && {
      background: styleHelpers.gradients.background(theme),
      border: `1px solid ${styleHelpers.glassMorphism(theme).border}`,
    }),
    
    ...(variant === 'gradient' && {
      background: styleHelpers.gradients.primarySubtle(theme),
      border: `1px solid ${theme.palette.primary.main}20`,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: styleHelpers.gradients.radialOverlay(theme),
        pointerEvents: 'none',
      },
    }),
    
    ...(variant === 'minimal' && {
      background: 'transparent',
      border: 'none',
    }),
    
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(4, 3),
      borderRadius: theme.shape.borderRadius * 1.5,
    },
    
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(3, 2),
      borderRadius: theme.shape.borderRadius,
    },
  })
);

/**
 * Base page layout component for consistent page structure
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  maxWidth = 'lg',
  centered = false,
  fullHeight = false,
  withPadding = false,
  sx,
}) => {
  const WrapperComponent = centered ? CenteredWrapper : PageWrapper;
  
  const content = maxWidth ? (
    <Container maxWidth={maxWidth} sx={{ position: 'relative', zIndex: 1 }}>
      {children}
    </Container>
  ) : (
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      {children}
    </Box>
  );

  return (
    <WrapperComponent
      fullHeight={fullHeight}
      withPadding={withPadding}
      sx={sx}
    >
      {content}
    </WrapperComponent>
  );
};

/**
 * Centered page layout for auth and error pages
 */
export const CenteredPageLayout: React.FC<CenteredPageLayoutProps> = ({
  children,
  maxWidth = 600,
  sx,
}) => {
  return (
    <CenteredWrapper sx={sx}>
      <Box
        sx={{
          width: '100%',
          maxWidth,
          margin: '0 auto',
          ...styleHelpers.responsiveMaxWidth,
        }}
      >
        {children}
      </Box>
    </CenteredWrapper>
  );
};

/**
 * Hero section component for landing pages
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  children,
  variant = 'default',
  sx,
}) => {
  return (
    <HeroSectionWrapper variant={variant} sx={sx}>
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {children}
      </Box>
    </HeroSectionWrapper>
  );
};

export default PageLayout;
