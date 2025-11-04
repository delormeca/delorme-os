import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import { Home, Refresh, Support } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  CenteredPageLayout,
  ErrorCard,
  AuthPageLogo,
  StandardButton,
  FeatureChip,
} from "@/components/ui";

interface ServerErrorProps {
  errorCode?: number;
  title?: string;
  message?: string;
  showRefresh?: boolean;
  showSupport?: boolean;
}

const ServerError: React.FC<ServerErrorProps> = ({
  errorCode = 500,
  title = "Server Error",
  message = "We're experiencing technical difficulties. Please try again later.",
  showRefresh = true,
  showSupport = true,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const getErrorIcon = () => {
    switch (errorCode) {
      case 502:
        return "🔧";
      case 503:
        return "🚧";
      case 504:
        return "⏱️";
      default:
        return "⚠️";
    }
  };

  const getSpecificMessage = () => {
    switch (errorCode) {
      case 502:
        return "Bad Gateway - Our servers are temporarily unable to handle your request.";
      case 503:
        return "Service Unavailable - We're performing maintenance. Please check back soon.";
      case 504:
        return "Gateway Timeout - The request took longer than expected to process.";
      default:
        return message;
    }
  };

  return (
    <CenteredPageLayout>
      <ErrorCard>
        {/* Logo Section */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <AuthPageLogo />
        </Box>

        {/* Error Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: "4rem",
              mb: 1,
              [theme.breakpoints.down("sm")]: {
                fontSize: "3rem",
              },
            }}
          >
            {getErrorIcon()}
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 700,
              color: "error.main",
              mb: 1,
            }}
          >
            {errorCode}
          </Typography>

          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {title}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {getSpecificMessage()}
          </Typography>
        </Box>

        {/* Feature Chips */}
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          sx={{ mb: 3 }}
          flexWrap="wrap"
          useFlexGap
        >
          {showRefresh && (
            <FeatureChip
              icon={<Refresh />}
              label="Try Again"
              variant="outlined"
            />
          )}
          <FeatureChip icon={<Home />} label="Go Home" variant="outlined" />
          {showSupport && (
            <FeatureChip
              icon={<Support />}
              label="Get Help"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Action Buttons */}
        <Stack spacing={2}>
          {showRefresh && (
            <StandardButton
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Try Again
            </StandardButton>
          )}

          <StandardButton
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            Go to Home
          </StandardButton>

          {showSupport && (
            <StandardButton
              variant="text"
              fullWidth
              startIcon={<Support />}
              href="mailto:support@craftyourstartup.com"
              sx={{ color: "text.secondary" }}
            >
              Contact Support
            </StandardButton>
          )}
        </Stack>

        {/* Status page link for 503 errors */}
        {errorCode === 503 && (
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Check our status page for updates
            </Typography>
          </Box>
        )}
      </ErrorCard>
    </CenteredPageLayout>
  );
};

export default ServerError;
