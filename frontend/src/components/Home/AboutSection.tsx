import { 
  styled, 
  Container, 
  Typography, 
  Box, 
  Stack, 
  Card, 
  CardContent,
  alpha,
  useTheme,
  Fade,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import { 
  Rocket, 
  Speed, 
  Shield, 
  Group, 
  TrendingUp, 
  Code,
  Support,
  Star
} from "@mui/icons-material";
import { useState, useEffect } from "react";

const AboutSectionWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(12, 0),
  position: "relative",
  background: `linear-gradient(135deg, 
    ${theme.palette.background.default} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse 60% 40% at 30% 80%, 
      ${alpha(theme.palette.primary.main, 0.05)} 0%, 
      transparent 60%)`,
    pointerEvents: "none",
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
  position: "relative",
  zIndex: 1,
}));

const ValueCard = styled(Card)(({ theme }) => ({
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

const ValueIcon = styled(Box)(({ theme }) => ({
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

const StorySection = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(4),
  padding: theme.spacing(6),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.06)}`,
  position: "relative",
  zIndex: 1,
}));

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const values: Value[] = [
  {
    icon: <Speed />,
    title: "Speed & Efficiency",
    description: "We believe in getting you to market 3x faster without compromising on quality. Every feature is designed to accelerate your development process."
  },
  {
    icon: <Shield />,
    title: "Security First",
    description: "Built with enterprise-grade security practices. Your users' data is protected with industry-standard authentication and authorization systems."
  },
  {
    icon: <Code />,
    title: "Developer Experience",
    description: "Clean, maintainable code with comprehensive documentation. We prioritize code quality and developer happiness in everything we build."
  },
  {
    icon: <Support />,
    title: "Community Driven",
    description: "Our roadmap is shaped by real developer needs. Join our growing community of successful entrepreneurs and indie developers."
  }
];

const AboutSection = () => {
  const theme = useTheme();
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

    const section = document.getElementById("about");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <AboutSectionWrapper id="about">
      <Container maxWidth="xl">
        <Fade in={isVisible} timeout={600}>
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
              About CraftYourStartup
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 700,
                mx: "auto",
              }}
            >
              Empowering indie developers and entrepreneurs to build and launch successful products faster than ever before
            </Typography>
          </SectionHeader>
        </Fade>

        {/* Our Story */}
        <Fade in={isVisible} timeout={800}>
          <StorySection sx={{ mb: 8 }}>
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h3" sx={{ mb: 3, fontWeight: 600 }}>
                  Our Story
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, fontSize: "1.1rem" }}>
                  CraftYourStartup was born from the frustration of spending weeks setting up the same infrastructure for every new project. As indie developers ourselves, we knew there had to be a better way.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, fontSize: "1.1rem" }}>
                  After building dozens of SaaS products and working with hundreds of entrepreneurs, we've distilled the essential patterns and best practices into a comprehensive boilerplate that just works.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, fontSize: "1.1rem", color: "text.secondary" }}>
                  Today, we're proud to help developers launch their ideas 3x faster, with over 500+ successful projects built on our foundation.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                        500+
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        Projects Launched
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                        3x
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        Faster Development
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 1 }}>
                        98%
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        Developer Satisfaction
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </StorySection>
        </Fade>

        {/* Our Values */}
        <Fade in={isVisible} timeout={1000}>
          <Box sx={{ mb: 8 }}>
            <Typography variant="h3" sx={{ textAlign: "center", mb: 6, fontWeight: 600 }}>
              What Drives Us
            </Typography>
            <Grid container spacing={4}>
              {values.map((value, index) => (
                <Grid size={{ xs: 12, md: 6, lg: 3 }} key={index}>
                  <Fade in={isVisible} timeout={1200 + index * 200}>
                    <ValueCard>
                      <CardContent sx={{ p: 4, height: "100%" }}>
                        <Stack spacing={2} sx={{ height: "100%" }}>
                          <ValueIcon>
                            {value.icon}
                          </ValueIcon>
                          <Typography variant="h5" component="h3" fontWeight={600}>
                            {value.title}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ lineHeight: 1.6, flexGrow: 1 }}
                          >
                            {value.description}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </ValueCard>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* Mission Statement */}
        <Fade in={isVisible} timeout={1400}>
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h3" sx={{ mb: 4, fontWeight: 600 }}>
              Our Mission
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 800,
                mx: "auto",
                fontStyle: "italic",
              }}
            >
              "To democratize entrepreneurship by providing developers with the tools and foundation they need to turn their ideas into successful businesses, faster and more efficiently than ever before."
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} sx={{ color: theme.palette.warning.main, fontSize: "2rem" }} />
              ))}
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Trusted by developers worldwide
            </Typography>
          </Box>
        </Fade>
      </Container>
    </AboutSectionWrapper>
  );
};

export default AboutSection;
