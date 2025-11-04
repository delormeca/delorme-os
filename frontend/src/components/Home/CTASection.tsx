import {
  Box,
  Container,
  Typography,
  Stack,
  alpha,
  styled,
  useTheme,
  Fade,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import {
  Rocket,
  PlayArrow,
  Schedule,
  Star,
  CheckCircle,
} from "@mui/icons-material";
import { landingPageConfig } from "@/config/landingPage";
import { useSignUpDialogContext } from "@/context/SignUpDialogContext";
import { useState, useEffect } from "react";
import { StandardButton, CTAButton } from "@/components/ui";

const CTAContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

const CTAWrapper = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.08)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
  borderRadius: `${theme.shape.borderRadius * 2}px`,
  padding: theme.spacing(8, 4),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backdropFilter: "blur(20px)",
  position: "relative",
  overflow: "hidden",
  textAlign: "center",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse 70% 50% at 50% 0%, 
      ${alpha(theme.palette.primary.main, 0.1)} 0%, 
      transparent 70%), 
      radial-gradient(ellipse 70% 50% at 50% 100%, 
      ${alpha(theme.palette.secondary.main, 0.1)} 0%, 
      transparent 70%)`,
    pointerEvents: "none",
  },
}));

const CTAContent = styled(Box)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
}));

const TrustElement = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2, 3),
  background: alpha(theme.palette.background.paper, 0.7),
  borderRadius: theme.spacing(3),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const UrgencyBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.warning.main, 0.1)}, 
    ${alpha(theme.palette.error.main, 0.1)})`,
  color: theme.palette.warning.main,
  borderRadius: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
  fontWeight: 600,
  fontSize: "0.875rem",
  marginBottom: theme.spacing(3),
}));

const FeatureHighlight = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(1),
  color: theme.palette.success.main,
  "& .MuiSvgIcon-root": {
    fontSize: "1.25rem",
  },
}));

const CTASection = () => {
  const theme = useTheme();
  const { handleOpen } = useSignUpDialogContext();
  const { cta } = landingPageConfig;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById("final-cta");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const handlePrimaryAction = () => {
    handleOpen();
  };

  const handleSecondaryAction = () => {
    // Replace with your actual demo booking link
    window.open("https://calendly.com/YOUR_CALENDLY_LINK", "_blank");
  };

  return (
    <Box id="final-cta" component="section" sx={{ py: 8 }}>
      <CTAContainer maxWidth="lg">
        <Fade in={isVisible} timeout={800}>
          <CTAWrapper>
            <CTAContent>
              {/* Urgency Element */}
              <UrgencyBadge>
                <Schedule fontSize="small" />
                Limited Time: Get started today and save 20%
              </UrgencyBadge>

              {/* Main Headline */}
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
                  fontSize: { xs: "2rem", md: "3rem" },
                }}
              >
                {cta.title}
              </Typography>

              {/* Description */}
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 700,
                  mx: "auto",
                  mb: 5,
                }}
              >
                {cta.description}
              </Typography>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                justifyContent="center"
                sx={{ mb: 6 }}
              >
                <CTAButton
                  size="large"
                  startIcon={<Rocket />}
                  onClick={handlePrimaryAction}
                  sx={{ px: 6, py: 2, fontSize: "1.2rem", fontWeight: 700 }}
                >
                  {cta.primaryCTA}
                </CTAButton>
                {cta.secondaryCTA && (
                  <StandardButton
                    variant="outlined"
                    size="large"
                    icon={<PlayArrow />}
                    onClick={handleSecondaryAction}
                    sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
                  >
                    {cta.secondaryCTA}
                  </StandardButton>
                )}
              </Stack>

              {/* Trust and Social Proof */}
              <Grid container spacing={3} justifyContent="center" alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TrustElement>
                    <AvatarGroup max={4} sx={{ justifyContent: "center" }}>
                      <Avatar alt="Developer" sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>D1</Avatar>
                      <Avatar alt="Developer" sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>D2</Avatar>
                      <Avatar alt="Developer" sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>D3</Avatar>
                      <Avatar alt="Developer" sx={{ width: 32, height: 32, bgcolor: 'info.main' }}>D4</Avatar>
                    </AvatarGroup>
                    <Box textAlign="left">
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Star sx={{ color: theme.palette.warning.main, fontSize: "1rem" }} />
                        <Typography variant="body2" fontWeight={600}>5.0</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        500+ developers
                      </Typography>
                    </Box>
                  </TrustElement>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TrustElement>
                    <FeatureHighlight>
                      <CheckCircle />
                      <Typography variant="body2" fontWeight={600}>
                        30-day money-back guarantee
                      </Typography>
                    </FeatureHighlight>
                  </TrustElement>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TrustElement>
                    <FeatureHighlight>
                      <CheckCircle />
                      <Typography variant="body2" fontWeight={600}>
                        Instant access after purchase
                      </Typography>
                    </FeatureHighlight>
                  </TrustElement>
                </Grid>
              </Grid>

              {/* Additional Benefits */}
              <Box sx={{ mt: 6 }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: "italic", opacity: 0.9 }}
                >
                  🚀 Launch in days, not months • 💰 Save $10,000+ in development costs • 🛡️ Enterprise-grade security
                </Typography>
              </Box>
            </CTAContent>
          </CTAWrapper>
        </Fade>
      </CTAContainer>
    </Box>
  );
};

export default CTASection; 