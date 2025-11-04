import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  styled,
  alpha,
} from "@mui/material";
import {
  ErrorOutline,
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  Inbox,
} from "@mui/icons-material";
import { designTokens, styleHelpers } from "@/theme/customizations";
import { StandardButton } from "../StandardButton";

interface LoadingStateProps {
  message?: string;
  size?: "small" | "medium" | "large";
  fullHeight?: boolean;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "contained" | "outlined" | "text";
  };
  sx?: any;
}

interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info" | "pending";
  label: string;
  size?: "small" | "medium";
  sx?: any;
}

// Styled components for common patterns
const LoadingContainer = styled(Box)<{ fullHeight?: boolean }>(
  ({ theme, fullHeight }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(4),
    textAlign: "center",
    ...(fullHeight && {
      minHeight: "60vh",
    }),
  })
);

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6, 4),
  textAlign: "center",
  minHeight: "40vh",
}));

const EmptyStateIcon = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: styleHelpers.gradients.primarySubtle(theme),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(3),

  "& .MuiSvgIcon-root": {
    fontSize: "2.5rem",
    color: alpha(theme.palette.text.secondary, 0.6),
  },
}));

/**
 * Loading state component with consistent styling
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "medium",
  fullHeight = false,
}) => {
  const spinnerSize = size === "small" ? 24 : size === "large" ? 48 : 32;

  return (
    <LoadingContainer fullHeight={fullHeight}>
      <CircularProgress size={spinnerSize} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </LoadingContainer>
  );
};

/**
 * Empty state component for when there's no data
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox />,
  title,
  description,
  action,
  sx,
}) => {
  return (
    <EmptyStateContainer sx={sx}>
      <EmptyStateIcon>{icon}</EmptyStateIcon>

      <Typography
        variant="h6"
        component="h3"
        sx={{
          fontWeight: designTokens.typography.weights.semibold,
          mb: 1,
          color: "text.primary",
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      )}

      {action && (
        <StandardButton
          variant={action.variant || "contained"}
          onClick={action.onClick}
        >
          {action.label}
        </StandardButton>
      )}
    </EmptyStateContainer>
  );
};

/**
 * Status badge component for consistent status display
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "medium",
  sx,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircleOutline />,
          color: "success",
          bgcolor: (theme: any) => alpha(theme.palette.success.main, 0.1),
          borderColor: (theme: any) => alpha(theme.palette.success.main, 0.3),
        };
      case "error":
        return {
          icon: <ErrorOutline />,
          color: "error",
          bgcolor: (theme: any) => alpha(theme.palette.error.main, 0.1),
          borderColor: (theme: any) => alpha(theme.palette.error.main, 0.3),
        };
      case "warning":
        return {
          icon: <WarningAmberOutlined />,
          color: "warning",
          bgcolor: (theme: any) => alpha(theme.palette.warning.main, 0.1),
          borderColor: (theme: any) => alpha(theme.palette.warning.main, 0.3),
        };
      case "info":
        return {
          icon: <InfoOutlined />,
          color: "info",
          bgcolor: (theme: any) => alpha(theme.palette.info.main, 0.1),
          borderColor: (theme: any) => alpha(theme.palette.info.main, 0.3),
        };
      case "pending":
        return {
          icon: <CircularProgress size={16} />,
          color: "default",
          bgcolor: (theme: any) => alpha(theme.palette.text.secondary, 0.1),
          borderColor: (theme: any) => alpha(theme.palette.text.secondary, 0.3),
        };
      default:
        return {
          icon: null,
          color: "default",
          bgcolor: (theme: any) => alpha(theme.palette.text.secondary, 0.1),
          borderColor: (theme: any) => alpha(theme.palette.text.secondary, 0.3),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        padding:
          size === "small" ? theme.spacing(0.5, 1) : theme.spacing(0.75, 1.5),
        borderRadius: theme.shape.borderRadius,
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        fontWeight: designTokens.typography.weights.medium,
        backgroundColor: config.bgcolor(theme),
        border: `1px solid ${config.borderColor(theme)}`,
        color:
          config.color === "default"
            ? theme.palette.text.primary
            : (
                theme.palette[
                  config.color as "success" | "error" | "warning" | "info"
                ] as any
              )?.main || theme.palette.text.primary,
        ...sx,
      })}
    >
      {config.icon}
      {label}
    </Box>
  );
};

/**
 * Section header component for consistent page sections
 */
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  sx?: any;
}> = ({ title, subtitle, action, sx }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        mb: 3,
        gap: { xs: 1.5, sm: 0 },
        ...sx,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: designTokens.typography.weights.semibold,
            mb: subtitle ? 0.5 : 0,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box
          sx={{
            flexShrink: 0,
            ml: { xs: 0, sm: 2 },
            width: { xs: "100%", sm: "auto" },
            "& > *": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
};

/**
 * Page header component for dashboard pages
 */
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode;
  sx?: any;
}> = ({ title, subtitle, breadcrumbs, action, sx }) => {
  return (
    <Box sx={{ mb: 4, ...sx }}>
      {breadcrumbs && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && " / "}
              {crumb.href ? (
                <Box
                  component="span"
                  sx={{ color: "primary.main", cursor: "pointer" }}
                >
                  {crumb.label}
                </Box>
              ) : (
                crumb.label
              )}
            </React.Fragment>
          ))}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: designTokens.typography.weights.bold,
              mb: subtitle ? 1 : 0,
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.875rem", sm: "1rem" },
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Box
            sx={{
              flexShrink: 0,
              ml: { xs: 0, sm: 3 },
              width: { xs: "100%", sm: "auto" },
              "& > *": {
                width: { xs: "100%", sm: "auto" },
              },
            }}
          >
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Feature chip component for highlighting features
 */
export const FeatureChip: React.FC<{
  icon?: React.ReactNode;
  label: string;
  variant?: "default" | "outlined" | "filled";
  size?: "small" | "medium";
  sx?: any;
}> = ({ icon, label, variant = "default", size = "medium", sx }) => {
  return (
    <Box
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "flex-start",
        flexShrink: 0,
        gap: 0.75,
        padding:
          size === "small"
            ? theme.spacing(0.5, 1.25)
            : theme.spacing(0.75, 1.5),
        borderRadius: theme.shape.borderRadius,
        fontSize: size === "small" ? "0.75rem" : "0.8rem",
        fontWeight: designTokens.typography.weights.medium,

        ...(variant === "default" && {
          background: alpha(theme.palette.primary.main, 0.08),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          color: theme.palette.primary.main,
        }),

        ...(variant === "outlined" && {
          background: "transparent",
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          color: theme.palette.text.secondary,
        }),

        ...(variant === "filled" && {
          background: theme.palette.primary.main,
          border: "none",
          color: theme.palette.primary.contrastText,
        }),

        "& .MuiSvgIcon-root": {
          fontSize: size === "small" ? "0.8rem" : "0.9rem",
        },

        ...sx,
      })}
    >
      {icon}
      {label}
    </Box>
  );
};

export default {
  LoadingState,
  EmptyState,
  StatusBadge,
  SectionHeader,
  PageHeader,
  FeatureChip,
};
