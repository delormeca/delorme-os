/**
 * Plan Status Component
 *
 * Displays current plan status, available features, and upgrade options.
 * Used in dashboard and other areas to show plan information.
 */

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Star,
  Upgrade,
  CheckCircle,
  Lock,
  TrendingUp,
  Speed,
  Shield,
  Rocket,
} from "@mui/icons-material";
import { useUserPlan, useAvailableUpgrades } from "@/hooks/api/usePlans";
import { useCheckoutWithProduct } from "@/hooks/api/usePayments";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { StandardButton, ModernCard } from "@/components/ui";

interface PlanStatusProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
  showFeatureCount?: boolean;
}

const PlanStatus: React.FC<PlanStatusProps> = ({
  compact = false,
  showUpgradeButton = true,
  showFeatureCount = true,
}) => {
  const { data: userPlan, isLoading } = useUserPlan();
  const { data: upgrades } = useAvailableUpgrades();
  const { checkoutWithProduct } = useCheckoutWithProduct();
  const { createSnackBar } = useSnackBarContext();

  const getPlanIcon = (plan: string) => {
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
  };

  const getPlanColor = (plan: string) => {
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
  };

  const getPlanProgress = (plan: string) => {
    const progressMap: Record<string, number> = {
      free: 20,
      starter: 40,
      pro: 60,
      premium: 80,
      enterprise: 100,
    };
    return progressMap[plan?.toLowerCase()] || 0;
  };

  const handleUpgrade = () => {
    if (!upgrades || upgrades.length === 0) {
      createSnackBar({
        content: "No upgrades available",
        severity: "info",
      });
      return;
    }

    // Get the next available upgrade
    const nextUpgrade = upgrades[0];
    const planToProductMap: Record<string, string> = {
      starter: "starter",
      pro: "pro",
      premium: "premium",
      enterprise: "enterprise",
    };

    const productId = planToProductMap[nextUpgrade.plan];
    if (productId) {
      checkoutWithProduct(productId);
    }
  };

  if (isLoading) {
    return (
      <ModernCard title="Plan Status" icon={<Speed />}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={100}
        >
          <LinearProgress sx={{ width: "100%" }} />
        </Box>
      </ModernCard>
    );
  }

  const currentPlan = userPlan?.current_plan || "free";
  const planIcon = getPlanIcon(currentPlan);
  const planColor = getPlanColor(currentPlan);
  const planProgress = getPlanProgress(currentPlan);
  const featureCount = userPlan?.permissions?.length || 0;

  return (
    <ModernCard
      title={`${
        currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
      } Plan`}
      subtitle="Current subscription level"
      icon={planIcon}
      variant="gradient"
      action={
        <Chip
          label={currentPlan.toUpperCase()}
          color={planColor as any}
          size="small"
        />
      }
    >
      {!compact && (
        <>
          <Box mb={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2" color="text.secondary">
                Plan Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {planProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={planProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            />
          </Box>

          {showFeatureCount && (
            <Box mb={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                  <Typography variant="body2">
                    {featureCount} features unlocked
                  </Typography>
                </Box>

                {upgrades && upgrades.length > 0 && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Lock sx={{ color: "warning.main", fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {upgrades[0]?.new_features?.length || 0} more available
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
        </>
      )}

      {showUpgradeButton && upgrades && upgrades.length > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Upgrade to {upgrades[0]?.plan}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ${upgrades[0]?.price}/
              {upgrades[0]?.billing_type?.includes("subscription")
                ? "month"
                : "one-time"}
            </Typography>
          </Box>

          <StandardButton
            variant="contained"
            size={compact ? "small" : "medium"}
            startIcon={<Upgrade />}
            onClick={handleUpgrade}
            color="primary"
          >
            Upgrade
          </StandardButton>
        </Box>
      )}

      {(!upgrades || upgrades.length === 0) && currentPlan !== "enterprise" && (
        <Box textAlign="center" py={1}>
          <Typography variant="body2" color="text.secondary">
            You're on the highest available plan!
          </Typography>
        </Box>
      )}
    </ModernCard>
  );
};

/**
 * Compact plan badge for headers and navigation
 */
export const PlanBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { data: userPlan } = useUserPlan();
  const currentPlan = userPlan?.current_plan || "free";
  const planColor = getPlanColor(currentPlan);
  const planIcon = getPlanIcon(currentPlan);

  return (
    <Tooltip title={`Current plan: ${currentPlan}`}>
      <Chip
        label={currentPlan.toUpperCase()}
        color={planColor as any}
        icon={planIcon}
        size="small"
        onClick={onClick}
        clickable={!!onClick}
        sx={{
          fontWeight: 600,
          "& .MuiChip-icon": {
            fontSize: 16,
          },
        }}
      />
    </Tooltip>
  );
};

// Helper functions (duplicated for standalone use)
const getPlanIcon = (plan: string) => {
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
};

const getPlanColor = (plan: string) => {
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
};

export default PlanStatus;
