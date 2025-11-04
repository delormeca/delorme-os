import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid2,
  Stack,
  Alert,
  LinearProgress,
  alpha,
} from "@mui/material";
import {
  Rocket,
  Article,
  Dashboard,
  Edit,
  Delete,
  Visibility,
  Save,
  ArrowBack,
  Palette,
  Code,
  Settings,
  Security,
  Speed,
  Star,
  MoreVert,
  Publish,
  Schedule,
  TrendingUp,
  Analytics,
  ArrowForward,
  CheckCircle,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  DashboardLayout,
  PageHeader,
  ModernCard,
  FormInput,
  StandardButton,
  StandardIconButton,
  StandardFab,
  CTAButton as StandardCTAButton,
  FeatureChip,
  StatusBadge,
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";
import { useSnackBarContext } from "../context/SnackBarContext";

// CraftYourStartup Brand Colors
// Use actual theme colors for accurate representation
const getThemeColors = (theme: any) => ({
  primary: theme.palette.primary.main,
  secondary: theme.palette.secondary.main,
  success: theme.palette.success.main,
  warning: theme.palette.warning.main,
  error: theme.palette.error.main,
  info: theme.palette.info.main,
});

// Color swatch component
const ColorSwatch: React.FC<{ color: string }> = ({ color }) => (
  <Box
    sx={{
      width: 80,
      height: 80,
      borderRadius: 2.5,
      backgroundColor: color,
      border: "3px solid rgba(255,255,255,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "1.5rem",
      fontWeight: "bold",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      flexShrink: 0,
    }}
  />
);

interface DemoFormData {
  title: string;
  content: string;
  email: string;
}

const UIGuidelines: React.FC = () => {
  const theme = useTheme();
  const { createSnackBar } = useSnackBarContext();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Get actual theme colors
  const craftColors = getThemeColors(theme);

  // Form setup using our unified form system
  const form = useStandardForm<DemoFormData>({
    schema: formSchemas.article,
    defaultValues: {
      title: "",
      content: "",
      email: "",
    },
  });

  const onDemoSubmit = (data: DemoFormData) => {
    createSnackBar({
      content: "Form submitted successfully!",
      autoHide: true,
      severity: "success",
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: "lg", mx: "auto" }}>
        <PageHeader
          title="Design System"
          subtitle="Complete guide to building consistent, professional interfaces"
          action={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <FeatureChip icon={<Code />} label="React + TypeScript" />
              <FeatureChip icon={<Palette />} label="Material-UI" />
              <FeatureChip icon={<Speed />} label="Performance Optimized" />
              <FeatureChip icon={<Security />} label="Production Ready" />
            </Stack>
          }
        />

        <Stack spacing={4}>
          {/* Brand Colors */}
          <ModernCard
            title="Brand Colors"
            subtitle="Primary color palette and usage guidelines for consistent branding"
            icon={<Palette />}
            variant="glass"
          >
            <Grid2 container spacing={3}>
              {Object.entries(craftColors).map(([name, color]) => (
                <Grid2 key={name} size={{ xs: 12, sm: 6, md: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      p: 3,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.action.hover,
                          0.04
                        ),
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <ColorSwatch color={color} />
                    <Box textAlign="center">
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          textTransform: "capitalize",
                        }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {name === "primary" &&
                          "Main brand color for primary actions"}
                        {name === "secondary" && "Accent color for highlights"}
                        {name === "success" &&
                          "Positive actions and confirmations"}
                        {name === "warning" && "Cautions and important notices"}
                        {name === "error" && "Errors and critical alerts"}
                        {name === "info" &&
                          "Information and neutral content (distinct purple)"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {color}
                      </Typography>
                    </Box>
                  </Box>
                </Grid2>
              ))}
            </Grid2>
          </ModernCard>

          {/* Button System */}
          <ModernCard
            title="Button System"
            subtitle="Unified button components with consistent styling and behavior"
            icon={<Settings />}
            variant="glass"
          >
            <Grid2 container spacing={4}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "primary.main", mb: 3 }}
                >
                  Button Variants
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Primary Actions (Contained)
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 2 }}
                    >
                      <StandardButton variant="contained" icon={<Save />}>
                        Save Article
                      </StandardButton>
                      <StandardButton
                        variant="contained"
                        color="success"
                        icon={<Publish />}
                      >
                        Publish Now
                      </StandardButton>
                      <StandardButton
                        variant="contained"
                        color="error"
                        icon={<Delete />}
                      >
                        Delete
                      </StandardButton>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Secondary Actions (Outlined)
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 2 }}
                    >
                      <StandardButton variant="outlined" icon={<Edit />}>
                        Edit Article
                      </StandardButton>
                      <StandardButton variant="outlined" icon={<ArrowBack />}>
                        Cancel
                      </StandardButton>
                      <StandardButton
                        variant="outlined"
                        color="info"
                        icon={<Visibility />}
                      >
                        Preview
                      </StandardButton>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Tertiary Actions (Text)
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <StandardButton variant="text" icon={<ArrowForward />}>
                        View All
                      </StandardButton>
                      <StandardButton variant="text" icon={<Analytics />}>
                        Learn More
                      </StandardButton>
                      <StandardButton variant="text" color="error">
                        Skip
                      </StandardButton>
                    </Stack>
                  </Box>
                </Stack>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "secondary.main", mb: 3 }}
                >
                  Special Buttons & States
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Loading States
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 2 }}
                    >
                      <StandardButton
                        variant="contained"
                        isLoading={true}
                        loadingText="Saving..."
                      >
                        Save Article
                      </StandardButton>
                      <StandardButton variant="outlined" disabled>
                        Disabled
                      </StandardButton>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Icon Buttons
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <StandardIconButton variant="filled" color="primary">
                        <Edit />
                      </StandardIconButton>
                      <StandardIconButton variant="outlined" color="error">
                        <Delete />
                      </StandardIconButton>
                      <StandardIconButton>
                        <Visibility />
                      </StandardIconButton>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      CTA Button
                    </Typography>
                    <StandardCTAButton startIcon={<Rocket />}>
                      Get Started Today
                    </StandardCTAButton>
                  </Box>
                </Stack>
              </Grid2>
            </Grid2>
          </ModernCard>

          {/* Form Components */}
          <ModernCard
            title="Form Components"
            subtitle="Unified form inputs with validation and consistent styling"
            icon={<Edit />}
            variant="glass"
          >
            <form onSubmit={form.onSubmit}>
              <Stack spacing={3}>
                <FormInput
                  name="title"
                  control={form.control}
                  label="Article Title"
                  placeholder="Enter a compelling title"
                  helperText="Used throughout the application for consistent form styling"
                  fullWidth
                />

                <FormInput
                  name="content"
                  control={form.control}
                  label="Article Content"
                  multiline
                  rows={4}
                  placeholder="Write your article content..."
                  helperText="Multiline input with consistent styling"
                  fullWidth
                />

                <FormInput
                  name="email"
                  control={form.control}
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  helperText="Email validation with proper error handling"
                  fullWidth
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <StandardButton variant="outlined" startIcon={<ArrowBack />}>
                    Cancel
                  </StandardButton>
                  <StandardCTAButton
                    type="submit"
                    startIcon={<Save />}
                    sx={{ flex: 1 }}
                  >
                    Save Form
                  </StandardCTAButton>
                </Stack>
              </Stack>
            </form>
          </ModernCard>

          {/* Dashboard Components */}
          <ModernCard
            title="Dashboard Components"
            subtitle="Core dashboard interface elements with consistent styling"
            icon={<Dashboard />}
            variant="glass"
          >
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <ModernCard
                  title="Total Articles"
                  icon={<Article />}
                  variant="gradient"
                  action={
                    <StandardIconButton onClick={handleMenuClick}>
                      <MoreVert />
                    </StandardIconButton>
                  }
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 40px ${alpha(
                        theme.palette.common.black,
                        0.1
                      )}`,
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: "2.5rem",
                      background: `linear-gradient(135deg, 
                        ${theme.palette.primary.main}, 
                        ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      lineHeight: 1,
                    }}
                  >
                    42
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    All articles created
                  </Typography>
                </ModernCard>
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <ModernCard
                  title="Published"
                  icon={<Publish />}
                  variant="gradient"
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 40px ${alpha(
                        theme.palette.common.black,
                        0.1
                      )}`,
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: "2.5rem",
                      color: "success.main",
                      lineHeight: 1,
                    }}
                  >
                    28
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Live articles
                  </Typography>
                </ModernCard>
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <ModernCard
                  title="Drafts"
                  icon={<Schedule />}
                  variant="gradient"
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 40px ${alpha(
                        theme.palette.common.black,
                        0.1
                      )}`,
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: "2.5rem",
                      color: "warning.main",
                      lineHeight: 1,
                    }}
                  >
                    14
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Work in progress
                  </Typography>
                </ModernCard>
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <ModernCard
                  title="Publish Rate"
                  icon={<TrendingUp />}
                  variant="gradient"
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 40px ${alpha(
                        theme.palette.common.black,
                        0.1
                      )}`,
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: "2.5rem",
                      color: "info.main",
                      lineHeight: 1,
                    }}
                  >
                    67%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={67}
                    sx={{
                      mt: 2,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha("#000", 0.1),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 3,
                        background: `linear-gradient(90deg, 
                          ${theme.palette.primary.main}, 
                          ${theme.palette.secondary.main})`,
                      },
                    }}
                  />
                </ModernCard>
              </Grid2>
            </Grid2>
          </ModernCard>

          {/* Design Principles */}
          <ModernCard
            title="Design Principles"
            subtitle="Core standards and guidelines for consistent UI development"
            icon={<CheckCircle />}
            variant="glass"
          >
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}
                >
                  Core Design Standards
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Consistent spacing using 8px grid system
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Semantic color usage for clear communication
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Glassmorphism effects for modern aesthetics
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Hover animations for interactive feedback
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Form validation with clear error messaging
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Accessibility-first component design
                  </Typography>
                </Stack>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 2, color: "secondary.main" }}
                >
                  Application-Specific Features
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Progress indicators for user workflows
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Dashboard cards for data visualization
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Quick action panels for productivity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Real-time feedback and notifications
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Mobile-responsive grid layouts
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    • Loading states for async operations
                  </Typography>
                </Stack>
              </Grid2>
            </Grid2>
          </ModernCard>
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default UIGuidelines;
