import { Link } from "react-router-dom";
import { Container, Typography, Box, styled, alpha, useTheme } from "@mui/material";

const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: `linear-gradient(135deg, 
    ${theme.palette.background.default} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
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
      ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
    pointerEvents: "none",
  },
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${theme.palette.background.default} 0%, 
      ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
    "&::before": {
      background: `radial-gradient(ellipse 80% 100% at 50% 0%, 
        ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
    },
  }),
}));

const ContentCard = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.default, 0.90)} 100%)`,
  backdropFilter: "blur(20px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(6),
  position: "relative",
  zIndex: 1,
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.03)} 0%, 
      ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
}));

const PrivacyPolicy = () => {
  const theme = useTheme();

  return (
    <PageWrapper>
      <Container maxWidth="md">
        <ContentCard>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              textAlign: "center",
              background: `linear-gradient(135deg, 
                ${theme.palette.text.primary} 0%, 
                ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Privacy Policy
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              textAlign: "center", 
              mb: 6,
              fontSize: "1.1rem",
              fontWeight: 500,
            }}
          >
            Your privacy is important to us. Learn how we collect, use, and protect your data.
          </Typography>

          <Box sx={{ "& > *:not(:last-child)": { mb: 4 } }}>
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Information We Collect
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We collect information you provide directly to us, such as when you create an account, 
                make a purchase, or contact us for support. This may include your name, email address, 
                and payment information.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                How We Use Your Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We use the information we collect to provide, maintain, and improve our services, 
                process transactions, send you technical notices and support messages, and communicate 
                with you about products, services, and promotional offers.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Information Sharing
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy. We may share your information 
                with trusted service providers who assist us in operating our website and conducting our business.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Data Security
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of 
                transmission over the internet is 100% secure.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Cookies and Tracking
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We use cookies and similar tracking technologies to enhance your experience on our website, 
                analyze usage patterns, and personalize content. You can control cookies through your 
                browser settings.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Third-Party Services
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Our website may contain links to third-party websites or services. We are not responsible 
                for the privacy practices of these external sites. We encourage you to review their 
                privacy policies before providing any personal information.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Your Rights
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                You have the right to access, update, or delete your personal information. You may also 
                opt out of certain communications from us. To exercise these rights, please contact us 
                using the information provided below.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Changes to This Policy
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "last updated" date.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Contact Us
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                If you have any questions about this privacy policy or our data practices, please contact us at{" "}
                <Link 
                  to="mailto:privacy@YOUR_DOMAIN.com"
                  style={{ 
                    color: theme.palette.primary.main, 
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  privacy@YOUR_DOMAIN.com
                </Link>
              </Typography>
            </Box>
          </Box>
        </ContentCard>
      </Container>
    </PageWrapper>
  );
};

export default PrivacyPolicy;
