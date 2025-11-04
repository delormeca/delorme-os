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

const TermsOfUse = () => {
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
            Terms of Use
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
            Please read these terms carefully before using CraftYourStartup
          </Typography>

          <Box sx={{ "& > *:not(:last-child)": { mb: 4 } }}>
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Acceptance of Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                By using CraftYourStartup, you agree to these Terms of Use and our
                Privacy Policy. If you do not agree, please do not use our website.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Modification of Terms
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We reserve the right to change these terms at any time. Your
                continued use of the site after changes are posted constitutes your
                acceptance of the new terms.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Use of Website
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                You agree to use the website only for lawful purposes. You are
                prohibited from violating or attempting to violate any security
                features of the website.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Intellectual Property
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                All content on this website, including text, graphics, logos, and
                software, is the property of CraftYourStartup and is protected by
                intellectual property laws. Unauthorized use of this content is
                prohibited.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                User Contributions
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Any content you submit to the website, including comments and
                suggestions, becomes the property of CraftYourStartup. We reserve
                the right to use this content without restriction.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Privacy
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Your use of the website is also governed by our Privacy Policy,
                which is incorporated into these terms by this reference.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Links to Other Sites
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Our website may contain links to third-party websites. We are not
                responsible for the content or practices of these websites.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Disclaimer of Warranties
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                The website is provided "as is" without warranties of any kind. We
                do not guarantee that the site will be available at all times or
                free from errors.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Limitation of Liability
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                CraftYourStartup will not be liable for any damages arising from
                the use of, or inability to use, the website.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Governing Law
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                These terms are governed by the laws of the jurisdiction in which
                CraftYourStartup operates, without regard to its conflict of law
                provisions.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Contact Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                If you have any questions about these terms, please contact us at{" "}
                <Link 
                  to="mailto:info@YOUR_DOMAIN.com"
                  style={{ 
                    color: theme.palette.primary.main, 
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  info@YOUR_DOMAIN.com
                </Link>
              </Typography>
            </Box>
          </Box>
        </ContentCard>
      </Container>
    </PageWrapper>
  );
};

export default TermsOfUse;
