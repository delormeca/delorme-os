import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Rating,
  alpha,
  styled,
  useTheme,
  Fade,
  IconButton,
} from "@mui/material";
import { FormatQuote, LinkedIn, Twitter } from "@mui/icons-material";
import { landingPageConfig } from "@/config/landingPage";
import { useState, useEffect } from "react";
import Grid from '@mui/material/Grid2';

const TestimonialsContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
  maxWidth: 800,
  margin: "0 auto",
}));

const TestimonialsWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-20%",
    left: "-10%",
    right: "-10%",
    bottom: "-20%",
    background: `radial-gradient(ellipse 70% 50% at 50% 50%, 
      ${alpha(theme.palette.primary.main, 0.03)} 0%, 
      transparent 70%)`,
    pointerEvents: "none",
    zIndex: 0,
  },
}));

const TestimonialCard = styled(Card)(({ theme }) => ({
  height: "100%",
  background: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  position: "relative",
  overflow: "hidden",
  zIndex: 1,
  willChange: "transform",
  transition: "transform 0.2s ease-out",
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.06)}`,
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
    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
    "&::before": {
      opacity: 1,
    },
  },
}));

const QuoteIcon = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  width: 48,
  height: 48,
  borderRadius: theme.spacing(1),
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)}, 
    ${alpha(theme.palette.secondary.main, 0.1)})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& .MuiSvgIcon-root": {
    fontSize: "1.5rem",
    color: alpha(theme.palette.primary.main, 0.6),
  },
}));

const TestimonialContent = styled(Typography)(({ theme }) => ({
  fontSize: "1.1rem",
  lineHeight: 1.7,
  color: theme.palette.text.primary,
  fontStyle: "italic",
  position: "relative",
  mt: 4,
}));

const AuthorInfo = styled(Stack)(({ theme }) => ({
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  paddingTop: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const CompanyBadge = styled(Box)(({ theme }) => ({
  display: "inline-block",
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.spacing(3),
  background: alpha(theme.palette.info.main, 0.1),
  color: theme.palette.info.main,
  fontSize: "0.875rem",
  fontWeight: 600,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  whiteSpace: "nowrap",
}));

const RatingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const TestimonialsSection = () => {
  const theme = useTheme();
  const { testimonials } = landingPageConfig;
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

    const section = document.getElementById("testimonials");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  // Generate placeholder avatars if not provided
  const getAvatarSrc = (testimonial: any, index: number) => {
    return testimonial.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  return (
    <Box id="testimonials" component="section" sx={{ py: 8 }}>
      <TestimonialsContainer maxWidth="xl">
        <TestimonialsWrapper>
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
                {testimonials.title}
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
                Don't just take our word for it. Here's what real customers say about their experience
              </Typography>
            </SectionHeader>
          </Fade>

          <Grid container spacing={4}>
            {testimonials.testimonials.map((testimonial, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                <Fade in={isVisible} timeout={800 + index * 200}>
                  <TestimonialCard>
                    <CardContent sx={{ p: 4, position: "relative" }}>
                      <QuoteIcon>
                        <FormatQuote />
                      </QuoteIcon>

                      {/* Rating */}
                      {testimonial.rating && (
                        <RatingContainer>
                          <Rating
                            value={testimonial.rating}
                            readOnly
                            size="small"
                            sx={{
                              "& .MuiRating-iconFilled": {
                                color: theme.palette.warning.main,
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            {testimonial.rating}.0
                          </Typography>
                        </RatingContainer>
                      )}

                      {/* Testimonial Content */}
                      <TestimonialContent variant="body1" sx={{ mb: 4 }}>
                        {testimonial.content}
                      </TestimonialContent>

                      {/* Author Information */}
                      <AuthorInfo direction="row" spacing={3} alignItems="center">
                        <Avatar
                          src={getAvatarSrc(testimonial, index)}
                          alt={testimonial.name}
                          sx={{
                            width: 56,
                            height: 56,
                            border: `3px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {testimonial.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {testimonial.role}
                          </Typography>
                          <CompanyBadge>
                            {testimonial.company}
                          </CompanyBadge>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            sx={{
                              color: alpha(theme.palette.primary.main, 0.6),
                              "&:hover": {
                                color: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              },
                            }}
                          >
                            <LinkedIn fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{
                              color: alpha(theme.palette.info.main, 0.6),
                              "&:hover": {
                                color: theme.palette.info.main,
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                              },
                            }}
                          >
                            <Twitter fontSize="small" />
                          </IconButton>
                        </Stack>
                      </AuthorInfo>
                    </CardContent>
                  </TestimonialCard>
                </Fade>
              </Grid>
            ))}
          </Grid>

          {/* Summary Statistics */}
          <Fade in={isVisible} timeout={1200}>
            <Box sx={{ mt: 8, textAlign: "center" }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={6}
                justifyContent="center"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    4.9/5
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    500+
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Happy Customers
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    98%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Would Recommend
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Fade>
        </TestimonialsWrapper>
      </TestimonialsContainer>
    </Box>
  );
};

export default TestimonialsSection;
