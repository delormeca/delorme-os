import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  styled,
  alpha,
} from '@mui/material';
import { designTokens, styleHelpers } from '@/theme/customizations';

interface UniversalCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'outlined' | 'minimal';
  hover?: boolean;
  withGradientBorder?: boolean;
  sx?: any;
}

interface ModernCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated';
  hover?: boolean;
  withGradientBorder?: boolean;
  onClick?: () => void;
  sx?: any;
}

interface ErrorCardProps {
  children: React.ReactNode;
  withGradientBorder?: boolean;
  sx?: any;
}

interface AuthCardProps {
  children: React.ReactNode;
  withGradientBorder?: boolean;
  sx?: any;
}

// Style function for card variants
const getCardStyles = (
  theme: any,
  variant: string = 'default',
  hover: boolean = false,
  gradientBorder: boolean = false
) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: `all ${designTokens.animation.normal} ${designTokens.easing.standard}`,
  
  // Base variant styles
  ...(variant === 'default' && {
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    boxShadow: designTokens.shadows.sm,
  }),
  
  ...(variant === 'glass' && {
    ...styleHelpers.glassMorphism(theme),
    boxShadow: designTokens.shadows.md,
  }),
  
  ...(variant === 'gradient' && {
    background: styleHelpers.gradients.primarySubtle(theme),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    boxShadow: designTokens.shadows.sm,
  }),
  
  ...(variant === 'elevated' && {
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: designTokens.shadows.lg,
  }),
  
  ...(variant === 'outlined' && {
    background: 'transparent',
    border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
    boxShadow: 'none',
  }),
  
  ...(variant === 'minimal' && {
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
  }),
  
  // Hover effects
  ...(hover && {
    cursor: 'pointer',
    ...styleHelpers.hoverLift(),
    '&:hover': {
      ...styleHelpers.hoverLift()['&:hover'],
      ...(variant === 'glass' && {
        background: alpha(theme.palette.background.paper, 0.99),
      }),
      ...(variant === 'gradient' && {
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.08)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }),
    },
  }),
  
  // Gradient border
  ...(gradientBorder && styleHelpers.gradientBorder(theme)),
  
  // Dark mode adjustments
  ...theme.applyStyles('dark', {
    ...(variant === 'default' && {
      background: alpha(theme.palette.background.paper, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`,
    }),
    ...(variant === 'glass' && {
      background: alpha(theme.palette.background.paper, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    }),
    ...(variant === 'gradient' && {
      background: `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.main, 0.08)} 0%, 
        ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    }),
  }),
});

// Standard Card header
const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  
  '& .MuiCardHeader-title': {
    fontSize: designTokens.typography.sizes.lg,
    fontWeight: designTokens.typography.weights.semibold,
    color: theme.palette.text.primary,
    textAlign: 'left',
  },
  
  '& .MuiCardHeader-subheader': {
    fontSize: designTokens.typography.sizes.sm,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
}));

// Icon container for card headers
const IconContainer = styled(Box)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  background: styleHelpers.gradients.primarySubtle(theme),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
    color: theme.palette.primary.main,
  },
}));

/**
 * Universal card component for all card use cases
 */
export const UniversalCard: React.FC<UniversalCardProps> = ({
  children,
  variant = 'default',
  hover = false,
  withGradientBorder = false,
  sx,
}) => {
  return (
    <Card
      sx={(theme) => ({
        ...getCardStyles(theme, variant, hover, withGradientBorder),
        borderRadius: `${theme.shape.borderRadius}px`,
        ...sx,
      })}
    >
      {children}
    </Card>
  );
};

/**
 * Modern card with header support
 */
export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  subtitle,
  icon,
  action,
  children,
  variant = 'glass',
  hover = false,
  withGradientBorder = false,
  onClick,
  sx,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={(theme) => ({
        ...getCardStyles(theme, variant, hover, withGradientBorder),
        borderRadius: `${theme.shape.borderRadius}px`,
        ...sx,
      })}
    >
      {(title || icon || action) && (
        <StyledCardHeader
          avatar={icon && <IconContainer>{icon}</IconContainer>}
          title={title}
          subheader={subtitle}
          action={action}
        />
      )}
      <CardContent sx={{ pt: title || icon || action ? 0 : undefined }}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Error card for error pages
 */
export const ErrorCard: React.FC<ErrorCardProps> = ({
  children,
  withGradientBorder = true,
  sx,
}) => {
  return (
    <Card
      sx={(theme) => ({
        ...getCardStyles(theme, 'glass', false, withGradientBorder),
        borderRadius: `${theme.shape.borderRadius}px`,
        ...styleHelpers.responsiveMaxWidth(theme),
        ...styleHelpers.responsivePadding(theme),
        ...sx,
      })}
    >
      <CardContent sx={{ p: 0 }}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Auth card for authentication pages
 */
export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  withGradientBorder = true,
  sx,
}) => {
  return (
    <Card
      sx={(theme) => ({
        ...getCardStyles(theme, 'glass', false, withGradientBorder),
        borderRadius: `${theme.shape.borderRadius}px`,
        maxWidth: 450,
        width: '100%',
        margin: '0 auto',
        ...styleHelpers.responsivePadding(theme),
        ...sx,
      })}
    >
      <CardContent sx={{ p: 0 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default UniversalCard;
