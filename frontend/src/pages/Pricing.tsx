import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { styled, alpha, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Container, Stack, Divider } from "@mui/material";
import { Speed, Shield, Support } from "@mui/icons-material";
import PricingCards from "@/components/Pricing/PricingCards";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";
import { useUserPlan } from "@/hooks/api/usePlans";
import { Chip, Alert } from "@mui/material";
import { StandardButton } from "@/components/ui";

const PricingWrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: `linear-gradient(135deg, 
    ${theme.palette.background.default} 0%, 
    ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
  position: "relative",
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(8),
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse 80% 50% at 50% -20%, 
      ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
    pointerEvents: "none",
  },
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${theme.palette.background.default} 0%, 
      ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
    "&::before": {
      background: `radial-gradient(ellipse 80% 100% at 50% 0%, 
        ${alpha(theme.palette.primary.main, 0.12)}, transparent)`,
    },
  }),
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
  position: "relative",
  zIndex: 1,
}));

const Pricing = () => {
  const theme = useTheme();
  const { data: currentUser } = useCurrentUser();
  const { data: userPlan } = useUserPlan();

  return (
    <PricingWrapper>
      <Container maxWidth="lg">
        {/* Header Section */}
        <HeaderSection>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              background: `linear-gradient(135deg, 
                ${theme.palette.text.primary} 0%, 
                ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Simple, Transparent Pricing
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              fontWeight: 400,
              maxWidth: 600,
              mx: "auto",
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Choose the perfect plan to launch your SaaS startup. No hidden fees,
            no surprises.
          </Typography>

          {/* Trust indicators */}
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 6 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Speed color="primary" />
              <Typography variant="body2" fontWeight={500}>
                3x Faster Launch
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Shield color="success" />
              <Typography variant="body2" fontWeight={500}>
                Production Ready
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Support color="info" />
              <Typography variant="body2" fontWeight={500}>
                Expert Support
              </Typography>
            </Box>
          </Stack>
        </HeaderSection>

        {/* Pricing Cards */}
        <Box sx={{ mb: 8 }}>
          <PricingCards showAllFeatures={true} />
        </Box>

        {/* Bottom CTA */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography variant="h4" fontWeight={600} sx={{ mb: 2 }}>
            Need a custom solution?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Contact our team for enterprise pricing and custom integrations
          </Typography>
          <Link to="/contact" style={{ textDecoration: "none" }}>
            <StandardButton variant="outlined" size="large">
              Contact Sales
            </StandardButton>
          </Link>
        </Box>
      </Container>
    </PricingWrapper>
  );
};

export default Pricing;
