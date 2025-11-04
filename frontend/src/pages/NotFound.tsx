import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import { Home, ArrowBack, Search } from "@mui/icons-material";
import { styled, alpha, useTheme } from "@mui/material/styles";
import {
  CenteredPageLayout,
  ErrorCard,
  AuthPageLogo,
  StandardButton,
} from "@/components/ui";

// Styled components using design tokens

const FeatureChip = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  padding: theme.spacing(0.75, 1.5),
  background: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  borderRadius: theme.spacing(2),
  fontSize: "0.8rem",
  fontWeight: 500,
  color: theme.palette.primary.main,
  "& .MuiSvgIcon-root": {
    fontSize: "0.9rem",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0.5, 1.25),
    fontSize: "0.75rem",
    "& .MuiSvgIcon-root": {
      fontSize: "0.8rem",
    },
  },
}));

const NotFoundIcon = styled(Typography)(({ theme }) => ({
  fontSize: "6rem",
  fontWeight: 800,
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  lineHeight: 1,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    fontSize: "4rem",
  },
}));

const NotFound: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    window.history.length > 1 ? navigate(-1) : navigate("/");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <CenteredPageLayout>
      <ErrorCard>
        {/* Logo Section */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <AuthPageLogo />
        </Box>

        {/* 404 Header */}
        <Box sx={{ textAlign: "center", mb: 2.5 }}>
          <NotFoundIcon>404</NotFoundIcon>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              background: `linear-gradient(135deg, 
                  ${theme.palette.text.primary} 0%, 
                  ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Page Not Found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            The page you're looking for doesn't exist
          </Typography>
        </Box>

        {/* Feature Badges */}
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          sx={{ mb: 3 }}
          flexWrap="wrap"
          useFlexGap
        >
          <FeatureChip>
            <Search />
            Check URL
          </FeatureChip>
          <FeatureChip>
            <Home />
            Go Home
          </FeatureChip>
          <FeatureChip>
            <ArrowBack />
            Go Back
          </FeatureChip>
        </Stack>

        {/* Information Section */}
        <Box
          sx={{
            background: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 1.5,
            p: 3,
            mb: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Don't worry! It happens to the best of us. The page you're looking
            for might have been moved, deleted, or you may have mistyped the
            URL.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            💡 <strong>Tip:</strong> Try checking the URL for typos, or use the
            navigation to find what you're looking for.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack spacing={2}>
          <StandardButton
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            Go to Home
          </StandardButton>

          <StandardButton
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
          >
            Go Back
          </StandardButton>

          <StandardButton
            variant="text"
            fullWidth
            onClick={handleGoToDashboard}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.secondary, 0.04),
              },
            }}
          >
            Go to Dashboard
          </StandardButton>
        </Stack>

        {/* Additional Information */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            borderRadius: 1.5,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            🏠 <strong>Need help?</strong> • 🔍 Try our search • 💬 Contact
            support if you think this is an error
          </Typography>
        </Box>
      </ErrorCard>
    </CenteredPageLayout>
  );
};

export default NotFound;
