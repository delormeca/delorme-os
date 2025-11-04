import {
  Box,
  Container,
  Typography,
  Stack,
  alpha,
  styled,
  useTheme,
  Fade,
} from "@mui/material";
import { TrendingUp, Groups, Speed, AttachMoney } from "@mui/icons-material";
import { landingPageConfig } from "@/config/landingPage";
import { useState, useEffect } from "react";
import Grid from '@mui/material/Grid2';

const StatsContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const StatsWrapper = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.05)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  borderRadius: theme.spacing(4),
  padding: theme.spacing(6),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backdropFilter: "blur(20px)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 80%, 
      ${alpha(theme.palette.primary.main, 0.1)} 0%, 
      transparent 50%), 
      radial-gradient(circle at 80% 20%, 
      ${alpha(theme.palette.secondary.main, 0.1)} 0%, 
      transparent 50%)`,
    pointerEvents: "none",
  },
}));

const StatCard = styled(Box)(({ theme }) => ({
  textAlign: "center",
  position: "relative",
  zIndex: 1,
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  willChange: "transform",
  transition: "transform 0.2s ease-out",
  "&:hover": {
    transform: "translateY(-3px) translateZ(0)",
    "& .stat-number": {
      transform: "scale(1.02) translateZ(0)",
    },
  },
}));

const StatIcon = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  margin: "0 auto",
  marginBottom: theme.spacing(2),
  "& .MuiSvgIcon-root": {
    fontSize: "1.75rem",
    color: theme.palette.common.white,
  },
}));

const StatNumber = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  color: theme.palette.primary.main,
  letterSpacing: "-0.02em",
  willChange: "transform",
  transition: "transform 0.2s ease-out",
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(6),
}));

// Icon mapping for stats
const statIconMapping: Record<string, React.ReactNode> = {
  companies: <Groups />,
  speed: <Speed />,
  trending: <TrendingUp />,
  revenue: <AttachMoney />,
  default: <TrendingUp />,
};

const getStatIcon = (label: string): React.ReactNode => {
  const key = label.toLowerCase();
  if (key.includes("startup") || key.includes("company") || key.includes("launched")) {
    return statIconMapping.companies;
  }
  if (key.includes("time") || key.includes("faster") || key.includes("speed")) {
    return statIconMapping.speed;
  }
  if (key.includes("revenue") || key.includes("$") || key.includes("generated")) {
    return statIconMapping.revenue;
  }
  return statIconMapping.trending;
};

const StatsSection = () => {
  const theme = useTheme();
  const { stats } = landingPageConfig;
  const [isVisible, setIsVisible] = useState(false);
  const [animatedNumbers, setAnimatedNumbers] = useState<Record<number, number>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Animate numbers
          stats.stats.forEach((stat, index) => {
            const numericValue = parseInt(stat.number.replace(/[^\d]/g, ""));
            if (numericValue) {
              let current = 0;
              const increment = numericValue / 60; // 60 frames for 1 second
              const timer = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                  current = numericValue;
                  clearInterval(timer);
                }
                setAnimatedNumbers(prev => ({
                  ...prev,
                  [index]: Math.floor(current)
                }));
              }, 16);
            }
          });
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById("stats");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [stats.stats]);

  const formatAnimatedNumber = (originalNumber: string, animatedValue: number): string => {
    if (originalNumber.includes("+")) {
      return `${animatedValue}+`;
    }
    if (originalNumber.includes("$")) {
      return `$${animatedValue.toLocaleString()}${originalNumber.includes("M") ? "M" : ""}+`;
    }
    if (originalNumber.includes("x")) {
      return `${animatedValue}x`;
    }
    if (originalNumber.includes("%")) {
      return `${animatedValue}%`;
    }
    return animatedValue.toString();
  };

  return (
    <Box id="stats" component="section" sx={{ py: 8 }}>
      <StatsContainer maxWidth="lg">
        <Fade in={isVisible} timeout={600}>
          <SectionHeader>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(135deg, 
                  ${theme.palette.text.primary} 0%, 
                  ${theme.palette.primary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {stats.title}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 400, maxWidth: 600, mx: "auto" }}
            >
              Numbers that speak for themselves
            </Typography>
          </SectionHeader>
        </Fade>

        <Fade in={isVisible} timeout={800}>
          <StatsWrapper>
            <Grid container spacing={4}>
              {stats.stats.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <StatCard>
                    <StatIcon>
                      {getStatIcon(stat.label)}
                    </StatIcon>
                    
                    <StatNumber
                      variant="h2"
                      className="stat-number"
                      sx={{ fontSize: { xs: "2.5rem", md: "3rem" } }}
                    >
                      {animatedNumbers[index] !== undefined 
                        ? formatAnimatedNumber(stat.number, animatedNumbers[index])
                        : stat.number
                      }
                    </StatNumber>
                    
                    <Typography
                      variant="h6"
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        color: theme.palette.text.primary 
                      }}
                    >
                      {stat.label}
                    </Typography>
                    
                    {stat.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.9rem" }}
                      >
                        {stat.description}
                      </Typography>
                    )}
                  </StatCard>
                </Grid>
              ))}
            </Grid>

            {/* Additional trust elements */}
            <Box sx={{ mt: 6, textAlign: "center" }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontStyle: "italic", opacity: 0.8 }}
              >
                Join the growing community of successful developers and startups
              </Typography>
            </Box>
          </StatsWrapper>
        </Fade>
      </StatsContainer>
    </Box>
  );
};

export default StatsSection; 