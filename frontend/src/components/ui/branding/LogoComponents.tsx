import React from "react";
import { Box, Typography, styled, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { designTokens, styleHelpers } from "@/theme/customizations";

interface LogoProps {
  size?: "small" | "medium" | "large" | "xlarge";
  variant?: "horizontal" | "vertical" | "icon-only";
  clickable?: boolean;
  onClick?: () => void;
  href?: string;
  sx?: any;
}

interface LogoIconProps {
  size?: number;
  sx?: any;
}

interface LogoTextProps {
  size?: "small" | "medium" | "large" | "xlarge";
  sx?: any;
}

// Size configurations
const sizeConfig = {
  small: {
    iconSize: 32,
    textSize: "1rem",
    gap: 1,
    padding: 1,
  },
  medium: {
    iconSize: 40,
    textSize: "1.125rem",
    gap: 1.5,
    padding: 1.5,
  },
  large: {
    iconSize: 48,
    textSize: "1.25rem",
    gap: 1.5,
    padding: 2,
  },
  xlarge: {
    iconSize: 56,
    textSize: "1.5rem",
    gap: 2,
    padding: 2.5,
  },
};

// Logo icon component
const StyledLogoIcon = styled(Box)<{ iconSize: number }>(
  ({ theme, iconSize }) => ({
    ...styleHelpers.logoIcon(theme, iconSize),
    flexShrink: 0,
  })
);

// Logo text component
const StyledLogoText = styled(Typography)<{ textSize: string }>(
  ({ theme, textSize }) => ({
    ...styleHelpers.logoText(theme),
    fontSize: textSize,
  })
);

// Logo styling helper
const getLogoContainerStyles = (
  theme: any,
  variant: "horizontal" | "vertical" | "icon-only",
  gap: number,
  padding: number,
  clickable: boolean = false
) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: variant === "vertical" ? "center" : "flex-start",
  flexDirection: variant === "vertical" ? "column" : "row",
  gap: theme.spacing(gap),
  padding: theme.spacing(padding),
  borderRadius: theme.shape.borderRadius,
  textDecoration: "none",
  color: "inherit",
  transition: `all ${designTokens.animation.normal} ${designTokens.easing.standard}`,

  ...(clickable && {
    cursor: "pointer",
    "&:hover": {
      transform: "scale(1.02)",
      "& .logo-icon": {
        transform: "rotate(5deg)",
      },
    },
  }),
});

/**
 * Reusable logo icon component
 */
export const LogoIcon: React.FC<LogoIconProps> = ({ size = 48, sx }) => {
  return (
    <Box
      component="img"
      src="/assets/branding/icone_verte.png"
      alt="Delorme OS"
      className="logo-icon"
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        transition: `transform ${designTokens.animation.normal} ${designTokens.easing.standard}`,
        ...sx,
      }}
    />
  );
};

/**
 * Reusable logo text component (full logo image)
 */
export const LogoText: React.FC<LogoTextProps> = ({ size = "medium", sx }) => {
  const theme = useTheme();
  const config = sizeConfig[size];

  // Calculate height based on text size
  const heightMap = {
    small: 24,
    medium: 32,
    large: 40,
    xlarge: 48,
  };

  return (
    <Box
      component="img"
      src={theme.palette.mode === 'dark' ? "/assets/branding/LOGO_PRIMAIRE_BLANC.png" : "/assets/branding/LOGO_PRIMAIRE_NOIR.png"}
      alt="Delorme OS"
      sx={{
        height: heightMap[size],
        width: 'auto',
        objectFit: 'contain',
        ...sx,
      }}
    />
  );
};

/**
 * Complete logo component with multiple variants
 */
export const Logo: React.FC<LogoProps> = ({
  size = "medium",
  variant = "horizontal",
  clickable = true,
  onClick,
  href = "/",
  sx,
}) => {
  const navigate = useNavigate();
  const config = sizeConfig[size];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable) {
      navigate(href);
    }
  };

  const logoContent = (
    <>
      <LogoIcon size={config.iconSize} />
      {variant !== "icon-only" && <LogoText size={size} />}
    </>
  );

  if (clickable) {
    return (
      <Box
        component="button"
        onClick={handleClick}
        sx={(theme) => ({
          ...getLogoContainerStyles(theme, variant, config.gap, 0, true),
          background: "none",
          border: "none",
          ...sx,
        })}
      >
        {logoContent}
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        ...getLogoContainerStyles(
          theme,
          variant,
          config.gap,
          config.padding,
          false
        ),
        ...sx,
      })}
    >
      {logoContent}
    </Box>
  );
};

/**
 * Logo section for headers and footers
 */
export const LogoSection: React.FC<LogoProps> = (props) => {
  return <Logo {...props} />;
};

// Pre-configured logo variants for common use cases
export const HeaderLogo: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <Logo size="medium" variant="horizontal" onClick={onClick} />
);

export const FooterLogo: React.FC = () => (
  <Logo size="large" variant="horizontal" clickable={true} />
);

export const MobileLogo: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <Logo size="small" variant="horizontal" onClick={onClick} />
);

export const SidebarLogo: React.FC<{
  collapsed?: boolean;
  onClick?: () => void;
}> = ({ collapsed, onClick }) => (
  <Logo
    size="medium"
    variant={collapsed ? "icon-only" : "horizontal"}
    onClick={onClick}
  />
);

export const AuthPageLogo: React.FC = () => (
  <Logo size="large" variant="horizontal" clickable={true} />
);

export default Logo;
