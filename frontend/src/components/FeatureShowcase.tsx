/**
 * Feature Showcase Component
 *
 * Displays plan-specific features with upgrade prompts.
 * Used to highlight exclusive features throughout the application.
 */

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  Alert,
  Divider,
} from "@mui/material";
import {
  Star,
  Lock,
  CheckCircle,
  Upgrade,
  Analytics,
  Group,
  Security,
  Speed,
  Assessment,
  Rocket,
  TrendingUp,
  Shield,
} from "@mui/icons-material";
import { useUserPlan } from "@/hooks/api/usePlans";
import { useCheckoutWithProduct } from "@/hooks/api/usePayments";
import { usePermission } from "@/components/PermissionGuard";
import { StandardButton, ModernCard } from "@/components/ui";

interface FeatureShowcaseProps {
  planType: "starter" | "pro" | "premium" | "enterprise";
  compact?: boolean;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  planType,
  compact = false,
}) => {
  const { data: userPlan } = useUserPlan();
  const { checkoutWithProduct } = useCheckoutWithProduct();

  const currentPlan = userPlan?.current_plan || "free";
  const hasAccess = getPlanLevel(currentPlan) >= getPlanLevel(planType);

  const planFeatures = getPlanFeatures(planType);
  const planIcon = getPlanIcon(planType);
  const planColor = getPlanColor(planType);

  const handleUpgrade = () => {
    const productMap: Record<string, string> = {
      starter: "starter",
      pro: "pro",
      premium: "premium",
      enterprise: "enterprise",
    };

    const productId = productMap[planType];
    if (productId) {
      checkoutWithProduct(productId);
    }
  };

  return (
    <ModernCard
      title={`${planType.charAt(0).toUpperCase() + planType.slice(1)} Features`}
      subtitle={getPlanDescription(planType)}
      icon={planIcon}
      variant={hasAccess ? "default" : "gradient"}
      action={
        <Chip
          label={hasAccess ? "Unlocked" : "Locked"}
          color={hasAccess ? "success" : "warning"}
          size="small"
          icon={hasAccess ? <CheckCircle /> : <Lock />}
        />
      }
    >
      <Stack spacing={1} mb={3}>
        {planFeatures.slice(0, compact ? 3 : 6).map((feature, index) => (
          <Box key={index} display="flex" alignItems="center" gap={1}>
            {hasAccess ? (
              <CheckCircle sx={{ color: "success.main", fontSize: 16 }} />
            ) : (
              <Lock sx={{ color: "warning.main", fontSize: 16 }} />
            )}
            <Typography
              variant="body2"
              color={hasAccess ? "text.primary" : "text.secondary"}
            >
              {feature}
            </Typography>
          </Box>
        ))}

        {planFeatures.length > (compact ? 3 : 6) && (
          <Typography variant="body2" color="text.secondary">
            +{planFeatures.length - (compact ? 3 : 6)} more features
          </Typography>
        )}
      </Stack>

      {!hasAccess && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" mb={2}>
              Upgrade to unlock these exclusive features
            </Typography>
            <StandardButton
              variant="contained"
              size={compact ? "small" : "medium"}
              startIcon={<Upgrade />}
              onClick={handleUpgrade}
              color={planColor as any}
            >
              Upgrade to {planType.charAt(0).toUpperCase() + planType.slice(1)}
            </StandardButton>
          </Box>
        </>
      )}
    </ModernCard>
  );
};

/**
 * Feature comparison component for pricing pages
 */
export const FeatureComparison: React.FC = () => {
  const { data: userPlan } = useUserPlan();
  const currentPlan = userPlan?.current_plan || "free";

  const plans = ["starter", "pro", "premium", "enterprise"] as const;

  return (
    <Box>
      <Typography variant="h5" component="h2" textAlign="center" mb={4}>
        Feature Comparison
      </Typography>

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={6} lg={3} key={plan}>
            <FeatureShowcase planType={plan} compact={false} />
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Your current plan:</strong>{" "}
          {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
        </Typography>
        <Typography variant="body2">
          You have access to {userPlan?.permissions?.length || 0} features.
          Upgrade to unlock more exclusive functionality!
        </Typography>
      </Alert>
    </Box>
  );
};

// Helper functions

function getPlanLevel(plan: string): number {
  const levels: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    premium: 3,
    enterprise: 4,
  };
  return levels[plan?.toLowerCase()] || 0;
}

function getPlanFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    starter: [
      "Article creation & management",
      "Basic analytics dashboard",
      "Email templates",
      "User profile management",
      "Basic reporting",
    ],
    pro: [
      "Advanced analytics & insights",
      "Full API access",
      "Advanced dashboard features",
      "Multi-tenant support",
      "Priority email support",
      "Advanced reporting tools",
    ],
    premium: [
      "Premium integrations (Slack, Zapier)",
      "Advanced reporting & data export",
      "Team collaboration features",
      "Custom report generation",
      "Custom components library",
      "Monthly feature updates",
    ],
    enterprise: [
      "Custom integrations & API",
      "Team analytics & management",
      "Enterprise SSO & security",
      "Audit logs & compliance",
      "Dedicated support channel",
      "White-label options",
      "SLA guarantee",
    ],
  };

  return features[plan] || [];
}

function getPlanDescription(plan: string): string {
  const descriptions: Record<string, string> = {
    starter:
      "Perfect for solo entrepreneurs getting started with essential features.",
    pro: "Everything you need to scale your startup with advanced tools.",
    premium:
      "Monthly subscription with ongoing premium features and integrations.",
    enterprise:
      "Complete enterprise solution with team management and custom features.",
  };

  return descriptions[plan] || "";
}

function getPlanIcon(plan: string) {
  switch (plan?.toLowerCase()) {
    case "starter":
      return <Rocket />;
    case "pro":
      return <Star />;
    case "premium":
      return <TrendingUp />;
    case "enterprise":
      return <Shield />;
    default:
      return <Speed />;
  }
}

function getPlanColor(plan: string) {
  switch (plan?.toLowerCase()) {
    case "starter":
      return "info";
    case "pro":
      return "primary";
    case "premium":
      return "secondary";
    case "enterprise":
      return "success";
    default:
      return "default";
  }
}

export default FeatureShowcase;
