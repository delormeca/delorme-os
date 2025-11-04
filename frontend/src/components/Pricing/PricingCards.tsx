import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import { styled, alpha, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Chip, Tooltip, Stack, CircularProgress } from "@mui/material";
import { Check, Close, Star, Rocket, Speed, Shield, TrendingUp } from "@mui/icons-material";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";
import { useProducts, useCheckoutWithProduct } from "@/hooks/api/usePayments";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useUserPlan } from "@/hooks/api/usePlans";
import UpgradeDialog from "@/components/UpgradeDialog";
import { CTAButton, StandardButton } from "@/components/ui";

const ModernPricingCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.default, 0.90)} 100%)`,
  backdropFilter: "blur(20px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
  transition: "all 0.3s ease-out",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.05)} 0%, 
      ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
}));

const PopularCard = styled(ModernPricingCard)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.08)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.05)} 50%,
    ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  border: `2px solid ${theme.palette.primary.main}`,
  transform: "scale(1.05)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main})`,
  },
  "&:hover": {
    transform: "scale(1.05) translateY(-8px)",
  },
}));

const PriceDisplay = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
}));


const FeatureItem = ({
  children,
  tooltipText,
  missing,
}: {
  children: ReactNode;
  tooltipText?: string;
  missing?: boolean;
}) => (
  <Tooltip title={tooltipText || ""} placement="right" arrow>
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 1.5, 
      py: 1,
      transition: "all 0.2s ease-out",
      "&:hover": {
        transform: "translateX(4px)",
      },
    }}>
      {missing ? (
        <Close sx={{ color: "text.disabled", fontSize: "1.2rem" }} />
      ) : (
        <Check sx={{ color: "success.main", fontSize: "1.2rem" }} />
      )}
      <Typography 
        variant="body2" 
        sx={{ 
          color: missing ? "text.disabled" : "text.secondary",
          fontWeight: 500,
        }}
      >
        {children}
      </Typography>
    </Box>
  </Tooltip>
);

interface PricingCardsProps {
  showAllFeatures?: boolean;
  compact?: boolean;
  maxCards?: number;
}

const PricingCards = ({ showAllFeatures = true, compact = false, maxCards }: PricingCardsProps) => {
  const theme = useTheme();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { checkoutWithProduct, isLoading: checkoutLoading } = useCheckoutWithProduct();
  const { createSnackBar } = useSnackBarContext();
  const { data: userPlan } = useUserPlan();
  
  // Upgrade dialog state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<{
    plan: string;
    name: string;
    price: string;
    features: string[];
    billingType: 'one_time' | 'subscription';
  } | null>(null);

  const getIconForPlan = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Rocket />;
      case 'pro':
        return <Star />;
      case 'premium':
        return <TrendingUp />;
      case 'enterprise':
        return <Shield />;
      default:
        return <Rocket />;
    }
  };

  const formatPrice = (priceCents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(priceCents / 100);
  };

  const handlePurchase = (productId: string, product: any) => {
    if (!currentUser) {
      // Show a user-friendly message before redirecting
      createSnackBar({
        content: 'Please log in to continue with your purchase',
        severity: 'info',
        autoHide: false,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    // Check if this is an upgrade (user has a current plan)
    if (userPlan && userPlan.current_plan !== 'free') {
      // Show upgrade dialog with proration details
      setSelectedUpgrade({
        plan: productId,
        name: product.name,
        price: formatPrice(product.price_cents, product.currency),
        features: product.features,
        billingType: product.type === 'subscription' ? 'subscription' : 'one_time',
      });
      setUpgradeDialogOpen(true);
    } else {
      // Direct purchase for free users
      checkoutWithProduct(productId);
    }
  };

  const handleCloseUpgradeDialog = () => {
    setUpgradeDialogOpen(false);
    setSelectedUpgrade(null);
  };

  if (productsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (productsError || !products) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">
          Failed to load pricing information. Please try again later.
        </Typography>
      </Box>
    );
  }

  const displayProducts = maxCards ? products.slice(0, maxCards) : products;

  return (
    <Grid container spacing={4} justifyContent="center">
      {displayProducts.map((product, index) => {
        const isPopular = product.id === 'pro'; // Mark pro as popular
        const CardComponent = isPopular ? PopularCard : ModernPricingCard;
        const ButtonComponent = isPopular ? CTAButton : StandardButton;
        const isEnterprise = product.id.includes('enterprise');
        
        // Check if this is the user's current plan or included in their plan
        const currentPlan = userPlan?.current_plan || 'free';
        const isCurrentPlan = product.id === currentPlan;
        
        // Check if features are included in current plan (higher tier)
        const isIncludedInCurrentPlan = () => {
          if (currentPlan === 'premium' || currentPlan === 'enterprise') {
            return product.id === 'starter' || product.id === 'pro';
          }
          if (currentPlan === 'pro') {
            return product.id === 'starter';
          }
          if (currentPlan === 'enterprise') {
            return product.id === 'premium';
          }
          return false;
        };
        
        const featuresIncluded = isIncludedInCurrentPlan();
        
        return (
          <Grid size={{ xs: 12, md: 6, lg: maxCards && maxCards <= 2 ? 6 : 4 }} key={product.id}>
            <CardComponent>
              {isPopular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  size="small"
                  icon={<Star />}
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    fontWeight: 600,
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1, p: 0 }}>
                {/* Plan Header */}
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    gap: 1,
                    mb: 2,
                  }}>
                    <Box sx={{ color: "primary.main" }}>
                      {getIconForPlan(product.id)}
                    </Box>
                    <Typography variant={compact ? "h5" : "h4"} fontWeight={600}>
                      {product.name}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3,
                      minHeight: compact ? "auto" : 48,
                    }}
                  >
                    {product.description}
                  </Typography>
                  
                  <PriceDisplay>
                    <Typography 
                      variant={compact ? "h3" : "h2"} 
                      fontWeight={700}
                      color="primary.main"
                    >
                      {formatPrice(product.price_cents, product.currency)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {product.type === 'subscription' ? '/month' : 'one-time'}
                    </Typography>
                  </PriceDisplay>
                </Box>

                {/* Features List */}
                {showAllFeatures && (
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      What's included:
                    </Typography>
                    <Stack spacing={0.5}>
                      {product.features.map((feature, featureIndex) => (
                        <FeatureItem key={featureIndex}>
                          {feature}
                        </FeatureItem>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ p: 0, mt: "auto" }}>
                <ButtonComponent
                  fullWidth
                  size="large"
                  variant={isPopular ? undefined : "outlined"}
                  disabled={checkoutLoading || isCurrentPlan || featuresIncluded}
                  onClick={() => isEnterprise ? window.location.href = '/contact' : handlePurchase(product.id, product)}
                >
                  {checkoutLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : featuresIncluded ? (
                    'Included in Your Plan'
                  ) : isEnterprise ? (
                    'Contact Sales'
                  ) : (
                    `Get ${product.name}`
                  )}
                </ButtonComponent>
              </CardActions>
            </CardComponent>
          </Grid>
        );
      })}
      
      {/* Upgrade Dialog */}
      {selectedUpgrade && (
        <UpgradeDialog
          open={upgradeDialogOpen}
          onClose={handleCloseUpgradeDialog}
          targetPlan={selectedUpgrade.plan}
          planName={selectedUpgrade.name}
          planPrice={selectedUpgrade.price}
          planFeatures={selectedUpgrade.features}
          billingType={selectedUpgrade.billingType}
        />
      )}
    </Grid>
  );
};

export default PricingCards;
