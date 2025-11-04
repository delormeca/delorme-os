import {
  Box,
  Container,
  Typography,
  Button,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { landingPageConfig } from "@/config/landingPage";
import { useNavigate } from "react-router-dom";
import PricingCards from "@/components/Pricing/PricingCards";

const PricingContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
  maxWidth: 800,
  margin: "0 auto",
}));

const PricingWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-10%",
    left: "-5%",
    right: "-5%",
    bottom: "-10%",
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.02)} 0%, 
      ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
    borderRadius: theme.spacing(6),
    pointerEvents: "none",
    zIndex: 0,
  },
}));

const PricingPreviewSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pricing } = landingPageConfig;

  const handleViewAllPlans = () => {
    navigate("/pricing");
  };

  return (
    <Box id="pricing-preview" component="section" sx={{ py: 8 }}>
      <PricingContainer maxWidth="xl">
        <PricingWrapper>
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
              {pricing.title}
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 600,
                mx: "auto",
                mb: 2,
              }}
            >
              {pricing.description}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, my: 6 }}
            >
              ✨ Launch faster, build better, scale easier
            </Typography>
          </SectionHeader>

          <PricingCards 
            showAllFeatures={true} 
            compact={true} 
            maxCards={3} 
          />

          {/* View All Plans CTA */}
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Button
              variant="text"
              size="large"
              onClick={handleViewAllPlans}
              endIcon={<ArrowForward />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1.1rem",
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              {pricing.ctaText}
            </Button>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, fontStyle: "italic" }}
            >
              🔒 Secure payment • 💰 30-day money-back guarantee • 🚀 Instant access
            </Typography>
          </Box>
        </PricingWrapper>
      </PricingContainer>
    </Box>
  );
};

export default PricingPreviewSection; 