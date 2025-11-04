import React from 'react';
import {
  Button,
  ButtonProps,
  IconButton,
  IconButtonProps,
  Fab,
  FabProps,
  CircularProgress,
  styled,
  alpha,
  useTheme,
} from '@mui/material';
import { lighten } from '@mui/material/styles';

// Extended props for StandardButton
interface StandardButtonProps extends Omit<ButtonProps, 'sx'> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  sx?: ButtonProps['sx'];
}

// Extended props for StandardIconButton
interface StandardIconButtonProps extends Omit<IconButtonProps, 'sx'> {
  variant?: 'default' | 'outlined' | 'filled';
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  sx?: IconButtonProps['sx'];
}

// Extended props for StandardFab
interface StandardFabProps extends Omit<FabProps, 'sx'> {
  sx?: FabProps['sx'];
}

// Base styled button with consistent styling
const BaseButton = styled(Button)<ButtonProps>(({ theme, size }) => {  
  return {
    borderRadius: theme.shape.borderRadius,
    textTransform: 'none',
    fontWeight: 600,
    transition: 'all 0.2s ease-out',
    
    // Subtle shadow for contained buttons
    '&.MuiButton-contained': {
      boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
      '&:hover': {
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.12)}`,
        transform: 'translateY(-1px)',
      },
      
      '&.MuiButton-containedSuccess:hover': {
        backgroundColor: lighten(theme.palette.success.main, 0.05),
      },
      '&.MuiButton-containedError:hover': {
        backgroundColor: lighten(theme.palette.error.main, 0.05),
      },
      '&.MuiButton-containedWarning:hover': {
        backgroundColor: lighten(theme.palette.warning.main, 0.05),
      },
      '&.MuiButton-containedInfo:hover': {
        backgroundColor: lighten(theme.palette.info.main, 0.05),
      },
    },
    
    '&.MuiButton-outlined': {
      borderWidth: '1px',
      '&:hover': {
        borderWidth: '1px',
        transform: 'translateY(-1px)',
        backgroundColor: alpha(theme.palette.action.hover, 0.04),
      },
    },
    
    '&.MuiButton-text': {
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.06),
      },
    },
  };
});

// Helper function to get color from theme palette
const getColorFromPalette = (theme: any, color: string) => {
  switch (color) {
    case 'primary':
      return theme.palette.primary.main;
    case 'secondary':
      return theme.palette.secondary.main;
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'info':
      return theme.palette.info.main;
    case 'success':
      return theme.palette.success.main;
    default:
      return theme.palette.primary.main;
  }
};

// Styled icon button with consistent styling
const BaseIconButton = styled(IconButton)<StandardIconButtonProps>(({ theme, variant = 'default', color = 'default' }) => {
  const colorValue = getColorFromPalette(theme, color);
  
  return {
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.2s ease-out',
    
    ...(variant === 'filled' && {
      backgroundColor: alpha(colorValue, 0.06),
      '&:hover': {
        backgroundColor: alpha(colorValue, 0.12),
        transform: 'translateY(-1px)',
      },
    }),
    
    ...(variant === 'outlined' && {
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      '&:hover': {
        border: `1px solid ${alpha(colorValue, 0.3)}`,
        backgroundColor: alpha(colorValue, 0.04),
        transform: 'translateY(-1px)',
      },
    }),
    
    ...(variant === 'default' && {
      '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.08),
        transform: 'translateY(-1px)',
      },
    }),
  };
});

// Styled FAB with consistent styling
const BaseFab = styled(Fab)<StandardFabProps>(({ theme }) => ({
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
  '&:hover': {
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.2s ease-out',
}));

// CTA Button for special hero actions
export const CTAButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  color: theme.palette.common.white,
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.2s ease-out',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.dark}, 
      ${theme.palette.secondary.dark})`,
  },
  '&:disabled': {
    background: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

// Back Button for navigation
export const BackButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.06),
    transform: 'translateX(-2px)',
    boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.08)}`,
  },
  transition: 'all 0.2s ease-out',
}));

/**
 * StandardButton Component
 * 
 * A button component that follows CraftYourStartup design guidelines with:
 * - Consistent border radius based on size
 * - Proper text transformation (none)
 * - Consistent font weight (600)
 * - Loading state support
 * - Icon support
 * - Enhanced hover effects
 */
export const StandardButton: React.FC<StandardButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  icon,
  disabled,
  startIcon,
  variant = 'text',
  color = 'primary',
  onClick,
  sx,
  ...props
}) => {
  const theme = useTheme();
  
  // Determine spinner color based on button variant and color
  const getSpinnerColor = () => {
    if (variant === 'contained') {
      // For contained buttons, inherit the text color (automatically contrasts with background)
      return 'inherit';
    } else {
      // For outlined and text buttons, use the theme color
      return color === 'primary' ? theme.palette.primary.main : 
             color === 'secondary' ? theme.palette.secondary.main :
             color === 'error' ? theme.palette.error.main :
             color === 'success' ? theme.palette.success.main :
             color === 'warning' ? theme.palette.warning.main :
             color === 'info' ? theme.palette.info.main :
             theme.palette.text.primary;
    }
  };
  
  const buttonStartIcon = isLoading 
    ? <CircularProgress 
        size={20} 
        sx={{ color: getSpinnerColor() }} 
      />
    : startIcon || icon;

  const buttonText = isLoading && loadingText ? loadingText : children;

  // Handle click prevention during loading without disabling the button
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <BaseButton
      {...props}
      variant={variant}
      color={color}
      disabled={disabled} // Only disabled if explicitly disabled, not during loading
      startIcon={buttonStartIcon}
      onClick={handleClick}
      sx={{
        // Maintain proper styling during loading without disabled appearance
        ...(isLoading && {
          pointerEvents: 'none', // Prevent any interaction during loading
          cursor: 'default',
        }),
        ...sx,
      }}
    >
      {buttonText}
    </BaseButton>
  );
};

/**
 * StandardIconButton Component
 * 
 * An icon button component with consistent styling and variants:
 * - default: Basic hover effect
 * - filled: Background color with hover
 * - outlined: Border with hover effects
 */
export const StandardIconButton: React.FC<StandardIconButtonProps> = ({
  children,
  variant = 'default',
  ...props
}) => {
  return (
    <BaseIconButton {...props} variant={variant}>
      {children}
    </BaseIconButton>
  );
};

/**
 * StandardFab Component
 * 
 * A floating action button with consistent styling and enhanced hover effects.
 */
export const StandardFab: React.FC<StandardFabProps> = ({
  children,
  ...props
}) => {
  return (
    <BaseFab {...props}>
      {children}
    </BaseFab>
  );
};

// Export default as StandardButton
export default StandardButton; 