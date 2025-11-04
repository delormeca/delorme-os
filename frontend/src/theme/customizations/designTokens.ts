import { Theme, alpha } from "@mui/material/styles";

/**
 * Extended design tokens that complement the existing theme primitives
 * These tokens provide additional values for consistent component styling
 */
export const designTokens = {
  // Extended spacing scale (complements MUI's theme.spacing)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius scale
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    xxl: 12,
    round: "50%",
  },

  // Extended shadow scale (complements MUI shadows)
  shadows: {
    xs: "0 1px 3px rgba(0, 0, 0, 0.05)",
    sm: "0 2px 8px rgba(0, 0, 0, 0.08)",
    md: "0 4px 20px rgba(0, 0, 0, 0.12)",
    lg: "0 8px 30px rgba(0, 0, 0, 0.15)",
    xl: "0 12px 50px rgba(0, 0, 0, 0.18)",
  },

  // Animation durations
  animation: {
    fast: "0.15s",
    normal: "0.2s",
    slow: "0.3s",
    slower: "0.5s",
  },

  // Transition easings
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerated: "cubic-bezier(0, 0, 0.2, 1)",
    accelerated: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },

  // Typography scale (extends MUI typography)
  typography: {
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
  },

  // Layout dimensions
  layout: {
    headerHeight: 80,
    sidebarWidth: 280,
    sidebarCollapsedWidth: 72,

    // Container max widths for different page types
    containers: {
      // Form pages (auth, profile, settings)
      form: "sm", // 600px - Good for forms and focused content

      // Article pages (create, edit, view)
      article: "md", // 900px - Optimal for reading and writing

      // Dashboard pages (analytics, billing)
      dashboard: "lg", // 1200px - Good for data and multiple columns

      // Landing pages (home, pricing)
      landing: "xl", // 1536px - Full width for marketing content

      // Error pages
      error: "sm", // 600px - Focused error messaging
    },
  },

  // Component specific tokens
  components: {
    card: {
      borderRadius: 8,
      padding: 16,
      shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      hoverShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
      backdropBlur: "blur(20px)",
    },

    button: {
      borderRadius: {
        small: 6,
        medium: 8,
        large: 12,
      },
      padding: {
        small: "6px 12px",
        medium: "8px 16px",
        large: "12px 24px",
      },
    },

    input: {
      borderRadius: 8,
      height: {
        small: 40,
        medium: 48,
        large: 56,
      },
    },
  },
};

/**
 * Style helper functions that use theme primitives and design tokens
 * These work with the existing theme system
 */
export const styleHelpers = {
  // Glass morphism effect using theme colors
  glassMorphism: (theme: Theme, opacity = 0.98) => ({
    background: alpha(theme.palette.background.paper, opacity),
    backdropFilter: "blur(20px)",
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    ...theme.applyStyles("dark", {
      background: alpha(theme.palette.background.paper, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    }),
  }),

  // Hover lift effect
  hoverLift: (translateY = -2, shadowIntensity = 0.12) => ({
    transition: `all ${designTokens.animation.normal} ${designTokens.easing.standard}`,
    "&:hover": {
      transform: `translateY(${translateY}px)`,
      boxShadow: `0 8px 30px rgba(0, 0, 0, ${shadowIntensity})`,
    },
  }),

  // Focus ring using theme primary color
  focusRing: (theme: Theme) => ({
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: "2px",
    },
  }),

  // Gradient border using theme colors
  gradientBorder: (theme: Theme) => ({
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "3px",
      background: `linear-gradient(90deg, 
        ${theme.palette.primary.main}, 
        ${theme.palette.secondary.main})`,
      borderRadius: `${designTokens.borderRadius.md}px ${designTokens.borderRadius.md}px 0 0`,
    },
  }),

  // Responsive padding
  responsivePadding: (theme: Theme) => ({
    padding: theme.spacing(4, 5),
    [theme.breakpoints.down("md")]: {
      padding: theme.spacing(3, 4),
    },
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(3),
    },
  }),

  // Responsive max width
  responsiveMaxWidth: (theme: Theme) => ({
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    [theme.breakpoints.down("md")]: {
      maxWidth: "500px",
    },
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100%",
      margin: theme.spacing(1),
    },
  }),

  // Logo icon styling using theme colors
  logoIcon: (theme: Theme, size = 48) => ({
    width: size,
    height: size,
    borderRadius: theme.shape.borderRadius,
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
    "& .MuiSvgIcon-root": {
      fontSize: `${size * 0.6}px`,
      color: theme.palette.common.white,
    },
  }),

  // Logo text styling using theme colors
  logoText: (theme: Theme) => ({
    fontWeight: designTokens.typography.weights.bold,
    background: `linear-gradient(135deg, 
      ${theme.palette.text.primary} 0%, 
      ${theme.palette.primary.main} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.01em",
  }),

  // Section spacing
  sectionSpacing: (theme: Theme) => ({
    marginBottom: theme.spacing(6),
    [theme.breakpoints.down("md")]: {
      marginBottom: theme.spacing(4),
    },
  }),

  // Gradient backgrounds using theme colors
  gradients: {
    primary: (theme: Theme) => `linear-gradient(135deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main})`,

    primarySubtle: (theme: Theme) => `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.05)} 0%, 
      ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,

    background: (theme: Theme) => `linear-gradient(135deg, 
      ${theme.palette.background.default} 0%, 
      ${alpha(theme.palette.primary.main, 0.02)} 100%)`,

    glass: (theme: Theme) => `linear-gradient(135deg, 
      ${alpha(theme.palette.background.paper, 0.98)} 0%, 
      ${alpha(theme.palette.background.default, 0.95)} 100%)`,

    radialOverlay: (
      theme: Theme
    ) => `radial-gradient(ellipse 70% 50% at 50% 0%, 
      ${alpha(theme.palette.primary.main, 0.1)} 0%, 
      transparent 70%)`,
  },
};

export default designTokens;
