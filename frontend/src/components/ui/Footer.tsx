import Box from "@mui/material/Box";
import { NavLink } from "react-router-dom";
import { 
  Container, 
  Link, 
  Stack, 
  styled, 
  Typography, 
  IconButton,
  Divider,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import { 
  Rocket, 
  Email, 
  LocationOn, 
  Phone,
  Twitter,
  GitHub,
  LinkedIn,
  YouTube,
  Article,
  Security,
  Support,
  Gavel,
  Policy,
  Business,
  Star,
} from "@mui/icons-material";

const FooterWrapper = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.background.paper} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  marginTop: theme.spacing(8),
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse 50% 30% at 50% 0%, 
      ${alpha(theme.palette.primary.main, 0.03)} 0%, 
      transparent 70%)`,
    pointerEvents: "none",
  },
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.08)} 0%, 
      ${alpha(theme.palette.primary.dark, 0.05)} 50%,
      ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    "&::before": {
      background: `radial-gradient(ellipse 50% 30% at 50% 0%, 
        ${alpha(theme.palette.primary.main, 0.1)} 0%, 
        transparent 70%)`,
    },
  }),
}));

const FooterContainer = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(4),
}));

const LogoSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: theme.spacing(1.5),
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  "& .MuiSvgIcon-root": {
    fontSize: "1.75rem",
    color: theme.palette.common.white,
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.5rem",
  background: `linear-gradient(135deg, 
    ${theme.palette.text.primary} 0%, 
    ${theme.palette.primary.main} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.01em",
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.125rem",
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -4,
    left: 0,
    width: 24,
    height: 2,
    background: theme.palette.primary.main,
    borderRadius: 1,
  },
}));

const FooterLink = styled(Link)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
  textDecoration: "none",
  fontSize: "0.95rem",
  fontWeight: 500,
  marginBottom: theme.spacing(1.5),
  transition: "all 0.2s ease-out",
  "&:hover": {
    color: theme.palette.primary.main,
    transform: "translateX(4px)",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1.1rem",
    opacity: 0.7,
  },
}));

const SocialButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  width: 44,
  height: 44,
  transition: "all 0.2s ease-out",
  "&:hover": {
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
    transform: "translateY(-2px)",
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const ContactCard = styled(Box)(({ theme }) => ({
  background: alpha(theme.palette.primary.main, 0.03),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  ...theme.applyStyles("dark", {
    background: alpha(theme.palette.primary.main, 0.08),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  }),
}));

const CreditsSection = styled(Box)(({ theme }) => ({
  textAlign: "center",
  paddingTop: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const TrustBadge = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.success.main, 0.1),
  color: theme.palette.success.main,
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
  fontWeight: 600,
  fontSize: "0.75rem",
  "& .MuiChip-icon": {
    color: theme.palette.success.main,
  },
}));

const footerSections = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "/#features", icon: <Business /> },
      { label: "Pricing", href: "/pricing", icon: <Star /> },
      { label: "Documentation", href: "#", icon: <Article /> },
      { label: "API Reference", href: "#", icon: <Article /> },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/#about", icon: <Business /> },
      { label: "Blog", href: "#", icon: <Article /> },
      { label: "Careers", href: "#", icon: <Business /> },
      { label: "Contact", href: "#contact", icon: <Email /> },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy", icon: <Policy /> },
      { label: "Terms of Service", href: "/terms", icon: <Gavel /> },
      { label: "Cookie Policy", href: "#", icon: <Policy /> },
      { label: "Security", href: "#", icon: <Security /> },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Help Center", href: "#", icon: <Support /> },
      { label: "Community", href: "#", icon: <Support /> },
      { label: "Status", href: "#", icon: <Support /> },
      { label: "Contact Support", href: "mailto:support@YOUR_DOMAIN.com", icon: <Email /> },
    ],
  },
};

const socialLinks = [
  { name: "Twitter", url: "https://twitter.com/YOUR_HANDLE", icon: <Twitter /> },
  { name: "GitHub", url: "https://github.com/YOUR_USERNAME", icon: <GitHub /> },
  { name: "LinkedIn", url: "https://linkedin.com/company/YOUR_COMPANY", icon: <LinkedIn /> },
  { name: "YouTube", url: "https://youtube.com/@YOUR_CHANNEL", icon: <YouTube /> },
];

export default function Footer() {
  const theme = useTheme();

  return (
    <FooterWrapper sx={{ component: "footer" }}>
      <FooterContainer maxWidth="lg">
        <Grid container spacing={6}>
          {/* Company Info & Contact */}
          <Grid size={{ xs: 12, md: 4 }}>
            <LogoSection>
              <LogoIcon>
                <Rocket />
              </LogoIcon>
              <LogoText variant="h5">
                CraftYourStartup
              </LogoText>
            </LogoSection>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ mb: 3, lineHeight: 1.6, fontSize: "1rem" }}
            >
              The fastest way to launch your SaaS startup. From idea to production in minutes, not months.
            </Typography>

            <ContactCard>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Email sx={{ fontSize: "1.2rem", color: "primary.main" }} />
                  <Typography variant="body2" color="text.secondary">
                    info@YOUR_DOMAIN.com
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn sx={{ fontSize: "1.2rem", color: "primary.main" }} />
                  <Typography variant="body2" color="text.secondary">
                    San Francisco, CA
                  </Typography>
                </Box>
              </Stack>
            </ContactCard>

            {/* Social Links */}
            <Box>
              <SectionTitle variant="h6">Follow Us</SectionTitle>
              <Stack direction="row" spacing={1}>
                                                  {socialLinks.map((social) => (
                   <Box
                     key={social.name}
                     component="a"
                     href={social.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     aria-label={social.name}
                     sx={{
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       width: 44,
                       height: 44,
                       borderRadius: "50%",
                       background: alpha(theme.palette.primary.main, 0.1),
                       color: theme.palette.primary.main,
                       border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                       textDecoration: "none",
                       transition: "all 0.2s ease-out",
                       "&:hover": {
                         background: theme.palette.primary.main,
                         color: theme.palette.common.white,
                         transform: "translateY(-2px)",
                         boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                       },
                     }}
                   >
                     {social.icon}
                   </Box>
                 ))}
               </Stack>
             </Box>
           </Grid>

           {/* Footer Links Sections */}
           {Object.entries(footerSections).map(([key, section]) => (
             <Grid size={{ xs: 6, sm: 6, md: 2 }} key={key}>
               <SectionTitle variant="h6">{section.title}</SectionTitle>
               <Stack spacing={0}>
                 {section.links.map((link) => (
                   <Box
                     key={link.label}
                     component={link.href.startsWith('http') ? 'a' : NavLink}
                     href={link.href.startsWith('http') ? link.href : undefined}
                     to={!link.href.startsWith('http') ? link.href : undefined}
                     target={link.href.startsWith('http') ? '_blank' : undefined}
                     rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                     sx={{
                       display: "flex",
                       alignItems: "center",
                       gap: 1,
                       color: "text.secondary",
                       textDecoration: "none",
                       fontSize: "0.95rem",
                       fontWeight: 500,
                       mb: 1.5,
                       transition: "all 0.2s ease-out",
                       "&:hover": {
                         color: "primary.main",
                         transform: "translateX(4px)",
                       },
                       "& .MuiSvgIcon-root": {
                         fontSize: "1.1rem",
                         opacity: 0.7,
                       },
                     }}
                   >
                     {link.icon}
                     {link.label}
                   </Box>
                 ))}
               </Stack>
             </Grid>
           ))}
        </Grid>

        {/* Trust Badges */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Stack 
            direction={{ xs: "column", sm: "row" }} 
            spacing={2} 
            justifyContent="center"
            alignItems="center"
          >
            <TrustBadge 
              icon={<Security />} 
              label="SOC 2 Compliant" 
              size="small" 
            />
            <TrustBadge 
              icon={<Star />} 
              label="99.9% Uptime" 
              size="small" 
            />
            <TrustBadge 
              icon={<Support />} 
              label="24/7 Support" 
              size="small" 
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 4, opacity: 0.5 }} />

        {/* Bottom Section */}
        <CreditsSection>
          <Stack 
            direction={{ xs: "column", md: "row" }} 
            justifyContent="space-between" 
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              © 2025 CraftYourStartup. All rights reserved.
            </Typography>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Built with
              </Typography>
              <Box
                component="a"
                href="https://craftyourstartup.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  textDecoration: "none",
                  color: "primary.main",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <img
                  src="/assets/hammer-logo-3.png"
                  alt="CraftYourStartup"
                  style={{ width: "16px", height: "16px" }}
                />
                CraftYourStartup
              </Box>
            </Stack>
          </Stack>
        </CreditsSection>
      </FooterContainer>
    </FooterWrapper>
  );
}
