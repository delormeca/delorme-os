import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  alpha,
  styled,
  useTheme,
  Fade,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import {
  Security,
  Payment,
  Dashboard,
  Storage,
  CloudUpload,
  AdminPanelSettings,
  CheckCircle,
  TrendingUp,
  Speed,
  Lock,
  Code,
  Support,
} from "@mui/icons-material";
import { landingPageConfig } from "@/config/landingPage";
import { useState, useEffect } from "react";

const FeaturesContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
  maxWidth: 800,
  margin: "0 auto",
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: "100%",
  background: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  position: "relative",
  overflow: "hidden",
  willChange: "transform",
  transition: "transform 0.2s ease-out",
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: theme.palette.primary.main,
    opacity: 0,
    transition: "opacity 0.2s ease-out",
  },
  "&:hover": {
    transform: "translateY(-6px) translateZ(0)",
    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}`,
    "&::before": {
      opacity: 1,
    },
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)}, 
    ${alpha(theme.palette.secondary.main, 0.1)})`,
  marginBottom: theme.spacing(3),
  "& .MuiSvgIcon-root": {
    fontSize: "2rem",
    color: theme.palette.primary.main,
  },
}));

const BenefitsList = styled(List)(({ theme }) => ({
  padding: 0,
  "& .MuiListItem-root": {
    padding: theme.spacing(0.5, 0),
    "& .MuiListItemIcon-root": {
      minWidth: 32,
    },
    "& .MuiSvgIcon-root": {
      fontSize: "1rem",
      color: theme.palette.success.main,
    },
  },
}));

const FeatureTag = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  fontWeight: 600,
  fontSize: "0.75rem",
}));

// Icon mapping for configuration
const iconMapping: Record<string, React.ReactNode> = {
  Security: <Security />,
  Payment: <Payment />,
  Dashboard: <Dashboard />,
  Storage: <Storage />,
  CloudUpload: <CloudUpload />,
  AdminPanel: <AdminPanelSettings />,
  AdminPanelSettings: <AdminPanelSettings />,
  TrendingUp: <TrendingUp />,
  Speed: <Speed />,
  Lock: <Lock />,
  Code: <Code />,
  Support: <Support />,
};

const FeaturesSection = () => {
  const theme = useTheme();
  const { features } = landingPageConfig;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("features");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Box id="features" component="section" sx={{ py: 8 }}>
      <FeaturesContainer maxWidth="xl">
        <Fade in={isVisible} timeout={800}>
          <SectionHeader>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                background: `linear-gradient(135deg, 
                  ${theme.palette.text.primary} 0%, 
                  ${theme.palette.primary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {features.title}
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 600,
                mx: "auto",
                mb: 4,
              }}
            >
              {features.description}
            </Typography>
          </SectionHeader>
        </Fade>

        <Grid container spacing={4}>
          {features.features.map((feature, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index} component="div">
              <Fade in={isVisible} timeout={800 + index * 200}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: "100%" }}>
                    <Stack spacing={3} sx={{ height: "100%" }}>
                      {/* Icon and Title */}
                      <Box>
                        <FeatureIcon>
                          {iconMapping[feature.icon] || <Dashboard />}
                        </FeatureIcon>
                        
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="h5" component="h3" fontWeight={600}>
                            {feature.title}
                          </Typography>
                          <FeatureTag label="Pro" size="small" />
                        </Stack>

                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ lineHeight: 1.6 }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>

                      {/* Benefits List */}
                      <Box sx={{ flexGrow: 1, pb: 4 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ 
                            mb: 2, 
                            fontWeight: 600,
                            color: theme.palette.text.primary 
                          }}
                        >
                          What's Included:
                        </Typography>
                        <BenefitsList>
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <ListItem key={benefitIndex} disableGutters>
                              <ListItemIcon>
                                <CheckCircle />
                              </ListItemIcon>
                              <ListItemText
                                primary={benefit}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "text.secondary",
                                }}
                              />
                            </ListItem>
                          ))}
                        </BenefitsList>
                      </Box>
                    </Stack>
                  </CardContent>
                </FeatureCard>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Additional Value Proposition */}
        <Fade in={isVisible} timeout={1200}>
          <Box sx={{ mt: 8, textAlign: "center" }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
              Production-Ready from Day One
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              justifyContent="center"
              alignItems="center"
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Speed color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Launch 3x Faster
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skip months of setup
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Lock color="success" />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Enterprise Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Built-in best practices
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Support color="info" />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Full Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Documentation & help
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Fade>
      </FeaturesContainer>
    </Box>
  );
};

export default FeaturesSection;