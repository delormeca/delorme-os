import {
  styled,
  Container,
  Stack,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  Rating,
  alpha,
  Fade,
  Zoom,
  keyframes,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useTheme } from "@mui/material/styles";
import { PlayArrow, Rocket, Speed, Security, CheckCircle, Code, DataObject, CloudUpload, Psychology } from "@mui/icons-material";
import { landingPageConfig } from "@/config/landingPage";
import { useSignUpDialogContext } from "@/context/SignUpDialogContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import { StandardButton, CTAButton as StandardCTAButton } from "@/components/ui";

const HeroSectionWrapper = styled("section")(({ theme }) => ({
  position: "relative",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  background: `linear-gradient(135deg, 
    ${theme.palette.background.default} 0%, 
    ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${theme.palette.background.default} 0%, 
      ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
  }),
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse 80% 50% at 50% -20%, 
      ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
    ...theme.applyStyles("dark", {
      background: `radial-gradient(ellipse 80% 100% at 50% 0%, 
        ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
    }),
  },
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 2,
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(8),
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.text.primary} 0%, 
    ${theme.palette.primary.main} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 700,
  letterSpacing: "-0.02em",
}));

// Removed unused styled components for better performance

// Optimized minimal animation for performance
const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

const gentleGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15), 
                0 0 40px rgba(59, 130, 246, 0.1); 
  }
  50% { 
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.25), 
                0 0 60px rgba(59, 130, 246, 0.15); 
  }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

// Enhanced components with beautiful glow effects
const TechCard = styled(Box)(({ theme }) => ({
  position: "absolute",
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  boxShadow: `
    0 4px 20px ${alpha(theme.palette.primary.main, 0.1)},
    0 8px 40px ${alpha(theme.palette.primary.main, 0.05)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}
  `,
  animation: `${subtleFloat} 8s ease-in-out infinite, ${gentleGlow} 4s ease-in-out infinite`,
  transition: 'all 0.3s ease',
  backdropFilter: "blur(10px)",
  
  "&:hover": {
    transform: "translateY(-8px) scale(1.02)",
    boxShadow: `
      0 8px 30px ${alpha(theme.palette.primary.main, 0.2)},
      0 16px 60px ${alpha(theme.palette.primary.main, 0.1)},
      inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}
    `,
  },
  
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.background.paper, 0.9)} 0%, 
      ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    boxShadow: `
      0 4px 20px ${alpha(theme.palette.primary.main, 0.15)},
      0 8px 40px ${alpha(theme.palette.primary.main, 0.08)},
      inset 0 1px 0 ${alpha(theme.palette.primary.main, 0.1)}
    `,
  }),
}));

const TechBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  borderRadius: theme.spacing(3),
  color: theme.palette.common.white,
  fontWeight: 600,
  fontSize: "0.9rem",
  boxShadow: `
    0 4px 15px ${alpha(theme.palette.primary.main, 0.4)},
    0 8px 25px ${alpha(theme.palette.primary.main, 0.2)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}
  `,
  transition: 'all 0.3s ease',
  
  "&:hover": {
    boxShadow: `
      0 6px 20px ${alpha(theme.palette.primary.main, 0.5)},
      0 12px 35px ${alpha(theme.palette.primary.main, 0.3)},
      inset 0 1px 0 ${alpha(theme.palette.common.white, 0.3)}
    `,
    transform: "scale(1.05)",
  },
}));

const CodePreview = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)` 
    : `linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: "0.9rem",
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: `
    0 8px 25px ${alpha(theme.palette.primary.main, 0.15)},
    0 16px 40px ${alpha(theme.palette.common.black, 0.1)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}
  `,
  backdropFilter: "blur(10px)",
  position: "relative",
  overflow: "hidden",
  
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "2px",
    background: `linear-gradient(90deg, 
      transparent, 
      ${theme.palette.primary.main}, 
      transparent)`,
    animation: `${pulseGlow} 3s ease-in-out infinite`,
  },
  
  "& .comment": { color: theme.palette.success.main },
  "& .keyword": { color: theme.palette.primary.main },
  "& .string": { color: theme.palette.warning.main },
  "& .function": { color: theme.palette.secondary.main },
  
  ...theme.applyStyles("dark", {
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    boxShadow: `
      0 8px 25px ${alpha(theme.palette.primary.main, 0.2)},
      0 16px 40px ${alpha(theme.palette.primary.main, 0.1)},
      inset 0 1px 0 ${alpha(theme.palette.primary.main, 0.1)}
    `,
  }),
}));

// Ambient background glow elements
const AmbientGlow = styled(Box)(({ theme }) => ({
  position: "absolute",
  borderRadius: "50%",
  background: `radial-gradient(circle, 
    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.05)} 50%, 
    transparent 70%)`,
  animation: `${pulseGlow} 6s ease-in-out infinite`,
  pointerEvents: "none",
  filter: "blur(40px)",
}));

// Cleaned up - removed unused styled components

// Optimized tech stack data - memoized outside component to prevent re-creation
const techStackData = [
  { name: "FastAPI", icon: Code, colors: "linear-gradient(135deg, #009688, #4CAF50)", position: { top: "10%", left: "10%" } },
  { name: "React", icon: DataObject, colors: "linear-gradient(135deg, #61dafb, #21d4fd)", position: { top: "5%", right: "15%" } },
  { name: "Secure", icon: Security, colors: "linear-gradient(135deg, #ff6b6b, #ee5a24)", position: { top: "30%", right: "5%" } },
  { name: "Deploy", icon: CloudUpload, colors: "linear-gradient(135deg, #a8edea, #fed6e3)", position: { top: "50%", left: "5%" } },
  { name: "AI-Ready", icon: Psychology, colors: "linear-gradient(135deg, #667eea, #764ba2)", position: { top: "25%", left: "40%" } },
  { name: "Fast", icon: Speed, colors: "linear-gradient(135deg, #f093fb, #f5576c)", position: { top: "45%", right: "25%" } },
];

const HeroSection = () => {
  const theme = useTheme();
  const { handleOpen } = useSignUpDialogContext();
  const { hero } = landingPageConfig;
  const [isVisible, setIsVisible] = useState(false);

  // Simplified effect - no continuous timers for better performance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleGetStarted = useCallback(() => {
    handleOpen();
  }, [handleOpen]);

  const handleWatchDemo = useCallback(() => {
    window.open(hero.demoVideoUrl, "_blank");
  }, [hero.demoVideoUrl]);

  // Memoized trust indicators
  const trustIndicators = useMemo(() => 
    hero.trustIndicators.map((indicator, index) => (
      <Chip
        key={indicator}
        icon={<CheckCircle />}
        label={indicator}
        size="small"
        sx={{
          backgroundColor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          "& .MuiChip-icon": {
            color: theme.palette.success.main,
          },
        }}
      />
    )), [hero.trustIndicators, theme]);

  // Memoized tech cards to prevent unnecessary re-renders
  const techCards = useMemo(() => 
    techStackData.map((tech, index) => {
      const IconComponent = tech.icon;
      return (
        <TechCard
          key={tech.name}
          sx={{
            ...tech.position,
            animationDelay: `${index * 0.5}s`,
            opacity: isVisible ? 1 : 0,
            transition: `opacity 0.6s ease ${index * 0.2}s`,
          }}
        >
          <TechBadge sx={{ background: tech.colors }}>
            <IconComponent sx={{ fontSize: "1.2rem" }} />
            {tech.name}
          </TechBadge>
        </TechCard>
      );
    }), [isVisible]);

  return (
    <HeroSectionWrapper>
      <HeroContent maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          {/* Left Column - Content */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Fade in={isVisible} timeout={800}>
              <Stack spacing={4}>
                {/* Trust Indicators */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {trustIndicators}
                </Stack>

                {/* Main Headline */}
                <Box>
                  <GradientText
                    variant="h1"
                    sx={{
                      fontSize: { xs: "2.5rem", md: "3.5rem", lg: "4rem" },
                      lineHeight: 1.1,
                      mb: 2,
                    }}
                  >
                    {hero.headline}
                  </GradientText>
                  <Typography
                    variant="h4"
                    color="primary"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: "1.25rem", md: "1.5rem" },
                    }}
                  >
                    {hero.subheadline}
                  </Typography>
                </Box>

                {/* Description */}
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                    lineHeight: 1.6,
                    maxWidth: 600,
                    fontWeight: 400,
                  }}
                >
                  {hero.description}
                </Typography>

                {/* CTA Buttons */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mt: 4 }}
                >
                  <StandardCTAButton
                    size="large"
                    startIcon={<Rocket />}
                    onClick={handleGetStarted}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {hero.primaryCTA}
                  </StandardCTAButton>
                  {hero.secondaryCTA && (
                    <StandardButton
                      variant="outlined"
                      size="large"
                      icon={<PlayArrow />}
                      onClick={handleWatchDemo}
                      sx={{ px: 4, py: 1.5 }}
                    >
                      {hero.secondaryCTA}
                    </StandardButton>
                  )}
                </Stack>

                {/* Social Proof */}
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mt: 4 }}>
                  <AvatarGroup max={4}>
                    <Avatar alt="User 1" sx={{ bgcolor: 'primary.main' }}>U1</Avatar>
                    <Avatar alt="User 2" sx={{ bgcolor: 'secondary.main' }}>U2</Avatar>
                    <Avatar alt="User 3" sx={{ bgcolor: 'success.main' }}>U3</Avatar>
                    <Avatar alt="User 4" sx={{ bgcolor: 'info.main' }}>U4</Avatar>
                  </AvatarGroup>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Rating value={5} size="small" readOnly />
                      <Typography variant="body2" fontWeight={600}>
                        5.0
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      500+ developers trust us
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Fade>
          </Grid>

          {/* Right Column - Enhanced Visual */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box
              sx={{
                position: "relative",
                height: "500px",
                width: "100%",
                display: { xs: 'none', lg: 'block' }, // Hide on mobile for better performance
                overflow: "visible",
              }}
            >
              {/* Ambient Background Glows */}
              <AmbientGlow
                sx={{
                  width: "200px",
                  height: "200px",
                  top: "10%",
                  left: "20%",
                  animationDelay: "0s",
                  opacity: isVisible ? 0.6 : 0,
                  transition: 'opacity 1s ease 0.5s',
                }}
              />
              <AmbientGlow
                sx={{
                  width: "150px",
                  height: "150px",
                  top: "40%",
                  right: "15%",
                  animationDelay: "2s",
                  background: `radial-gradient(circle, 
                    ${alpha(theme.palette.secondary.main, 0.08)} 0%, 
                    ${alpha(theme.palette.warning.main, 0.03)} 50%, 
                    transparent 70%)`,
                  opacity: isVisible ? 0.5 : 0,
                  transition: 'opacity 1s ease 0.8s',
                }}
              />
              <AmbientGlow
                sx={{
                  width: "120px",
                  height: "120px",
                  bottom: "20%",
                  left: "10%",
                  animationDelay: "4s",
                  background: `radial-gradient(circle, 
                    ${alpha(theme.palette.success.main, 0.06)} 0%, 
                    ${alpha(theme.palette.info.main, 0.03)} 50%, 
                    transparent 70%)`,
                  opacity: isVisible ? 0.4 : 0,
                  transition: 'opacity 1s ease 1s',
                }}
              />

              {/* Enhanced Tech Stack Cards */}
              {techCards}

              {/* Enhanced Code Preview */}
              <CodePreview
                sx={{
                  position: "absolute",
                  bottom: "5%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "85%",
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.8s ease 0.6s',
                  zIndex: 2,
                }}
              >
                <Typography component="div" sx={{ lineHeight: 1.6, position: "relative", zIndex: 1 }}>
                  <span className="comment">// Deploy in minutes</span><br/>
                  <span className="keyword">npm</span> <span className="string">install</span><br/>
                  <span className="keyword">npm</span> <span className="string">run dev</span><br/>
                  <span className="comment">// ✅ Ready to launch!</span>
                </Typography>
              </CodePreview>

              {/* Enhanced Success Metric */}
              <Box
                sx={{
                  position: "absolute",
                  top: "65%",
                  right: "10%",
                  background: `linear-gradient(135deg, 
                    ${theme.palette.success.main}, 
                    ${theme.palette.success.dark})`,
                  color: "white",
                  padding: 2,
                  borderRadius: 2,
                  boxShadow: `
                    0 8px 25px ${alpha(theme.palette.success.main, 0.4)},
                    0 16px 40px ${alpha(theme.palette.success.main, 0.2)},
                    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}
                  `,
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${alpha(theme.palette.success.light, 0.3)}`,
                  opacity: isVisible ? 1 : 0,
                  transition: 'all 0.8s ease 0.8s',
                  animation: `${subtleFloat} 6s ease-in-out infinite`,
                  animationDelay: "1s",
                  zIndex: 2,
                  
                  "&:hover": {
                    transform: "translateY(-4px) scale(1.05)",
                    boxShadow: `
                      0 12px 35px ${alpha(theme.palette.success.main, 0.5)},
                      0 20px 50px ${alpha(theme.palette.success.main, 0.3)},
                      inset 0 1px 0 ${alpha(theme.palette.common.white, 0.3)}
                    `,
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  3x Faster 🚀
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Launch Time
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </HeroContent>
    </HeroSectionWrapper>
  );
};

export default HeroSection;
