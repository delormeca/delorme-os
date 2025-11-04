/**
 * Feature Announcement Component
 *
 * Shows announcements about new features and plan upgrades.
 * Displays contextual messages based on user's current plan.
 */

import React, { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  Close,
  Upgrade,
  Star,
  TrendingUp,
  Extension,
  Analytics,
  Rocket,
} from "@mui/icons-material";
import { useUserPlan } from "@/hooks/api/usePlans";
import { useCheckoutWithProduct } from "@/hooks/api/usePayments";
import { StandardButton, ModernCard } from "@/components/ui";

interface FeatureAnnouncementProps {
  onDismiss?: () => void;
  compact?: boolean;
}

const FeatureAnnouncement: React.FC<FeatureAnnouncementProps> = ({
  onDismiss,
  compact = false,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { data: userPlan } = useUserPlan();
  const { checkoutWithProduct } = useCheckoutWithProduct();

  const currentPlan = userPlan?.current_plan || "free";

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = (productId: string) => {
    checkoutWithProduct(productId);
  };

  const getAnnouncementContent = () => {
    switch (currentPlan) {
      case "free":
        return {
          title: "Unlock Powerful Features!",
          message:
            "Upgrade to Starter plan to access article management and basic analytics.",
          features: [
            "Article Creation & Management",
            "Basic Analytics Dashboard",
            "Email Templates",
          ],
          action: "Upgrade to Starter",
          productId: "starter",
          color: "info" as const,
          icon: <Rocket />,
        };

      case "starter":
        return {
          title: "Take Your Startup to the Next Level!",
          message:
            "Upgrade to Pro for advanced analytics, API access, and premium features.",
          features: [
            "Advanced Analytics",
            "Full API Access",
            "Advanced Dashboard",
            "Priority Support",
          ],
          action: "Upgrade to Pro",
          productId: "pro",
          color: "primary" as const,
          icon: <Star />,
        };

      case "pro":
        return {
          title: "Go Premium for Ongoing Innovation!",
          message:
            "Subscribe to Premium for monthly updates, integrations, and collaboration tools.",
          features: [
            "Premium Integrations",
            "Advanced Reporting",
            "Team Collaboration",
            "Monthly Updates",
          ],
          action: "Subscribe to Premium",
          productId: "premium",
          color: "secondary" as const,
          icon: <TrendingUp />,
        };

      case "premium":
        return {
          title: "Scale with Enterprise Features!",
          message:
            "Upgrade to Enterprise for team management, custom integrations, and dedicated support.",
          features: [
            "Team Analytics",
            "Custom Integrations",
            "Enterprise SSO",
            "Dedicated Support",
          ],
          action: "Upgrade to Enterprise",
          productId: "enterprise",
          color: "success" as const,
          icon: <Extension />,
        };

      default:
        return null;
    }
  };

  const content = getAnnouncementContent();

  if (!content || dismissed || currentPlan === "enterprise") {
    return null;
  }

  if (compact) {
    const alertColor =
      content.color === "primary" || content.color === "secondary"
        ? "info"
        : content.color;
    return (
      <Alert
        severity={alertColor}
        action={
          <Stack direction="row" spacing={1}>
            <StandardButton
              size="small"
              variant="contained"
              color={content.color === "secondary" ? "primary" : content.color}
              onClick={() => handleUpgrade(content.productId)}
            >
              {content.action}
            </StandardButton>
            <IconButton size="small" onClick={handleDismiss}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        }
        sx={{ mb: 2 }}
      >
        <AlertTitle>{content.title}</AlertTitle>
        {content.message}
      </Alert>
    );
  }

  return (
    <Collapse in={!dismissed}>
      <Box sx={{ mb: 3 }}>
        <ModernCard
          title={content.title}
          subtitle={content.message}
          icon={content.icon}
          variant="gradient"
          action={
            <IconButton size="small" onClick={handleDismiss}>
              <Close />
            </IconButton>
          }
        >
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              What you'll get:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {content.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  variant="outlined"
                  color={content.color}
                  icon={<Star />}
                />
              ))}
            </Stack>
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" color="text.secondary">
              Join thousands of developers building successful startups
            </Typography>
            <StandardButton
              variant="contained"
              color={content.color === "secondary" ? "primary" : content.color}
              startIcon={<Upgrade />}
              onClick={() => handleUpgrade(content.productId)}
            >
              {content.action}
            </StandardButton>
          </Box>
        </ModernCard>
      </Box>
    </Collapse>
  );
};

export default FeatureAnnouncement;
