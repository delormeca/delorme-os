import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarContext } from "@/context/SnackBarContext";

// Import generated API client and types
import {
  PaymentsService,
  ProductResponse,
  CreateCheckoutRequest,
  CheckoutSessionResponse,
  CancelSubscriptionRequest,
  SubscriptionResponse,
  CustomerPortalResponse,
} from "@/client";

// Types for user payment info (not yet in generated models)
interface PaymentResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  product_id: string;
  stripe_payment_intent_id?: string;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserPaymentInfo {
  active_subscription?: SubscriptionResponse;
  recent_payments: PaymentResponse[];
  total_spent: number;
}

// Helper function to extract error message from API errors
const extractErrorMessage = (error: any, fallbackMessage: string): string => {
  // Try different possible error message paths
  if (typeof error === "string") {
    return error;
  }
  
  // Handle authentication errors specifically
  if (error?.status === 401 || error?.statusCode === 401) {
    return "Please log in to continue with your purchase";
  }
  
  // Check for API error structure
  if (error?.body?.detail) {
    if (typeof error.body.detail === "string") {
      return error.body.detail;
    }
    if (error.body.detail?.message) {
      return error.body.detail.message;
    }
    // Handle case where detail is an object with message
    if (typeof error.body.detail === "object" && error.body.detail !== null) {
      return JSON.stringify(error.body.detail);
    }
  }
  
  // Check for structured error object
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }
  
  // Check for detail in main error object
  if (error?.detail) {
    if (typeof error.detail === "string") {
      return error.detail;
    }
    // Handle case where detail is an object
    if (typeof error.detail === "object" && error.detail !== null) {
      if (error.detail.message) {
        return error.detail.message;
      }
      return JSON.stringify(error.detail);
    }
  }
  
  // Check for OpenAPI client error structure
  if (error?.response?.data?.detail) {
    if (typeof error.response.data.detail === "string") {
      return error.response.data.detail;
    }
    if (error.response.data.detail?.message) {
      return error.response.data.detail.message;
    }
  }
  
  // Check for network errors
  if (error?.name === "NetworkError" || error?.code === "NETWORK_ERROR") {
    return "Network error - please check your connection and try again";
  }
  
  // Log the error structure for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled error structure:', error);
  }
  
  return fallbackMessage;
};

// Helper function for showing snackbars
const useSnackbar = () => {
  const { createSnackBar } = useSnackBarContext();
  
  const showSnackbar = (
    content: string,
    severity: "success" | "error" | "warning" | "info" = "info"
  ) => {
    createSnackBar({
      content,
      severity,
      autoHide: true,
    });
  };
  
  return { showSnackbar };
};

// Hooks
export const useProducts = () => {
  return useQuery({
    queryKey: ["payments", "products"],
    queryFn: () => PaymentsService.getProductsApiPaymentsProductsGet(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ["payments", "products", productId],
    queryFn: () =>
      PaymentsService.getProductApiPaymentsProductsProductIdGet(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCheckoutSession = () => {
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (request: CreateCheckoutRequest) =>
      PaymentsService.createCheckoutSessionApiPaymentsCheckoutPost(request),
    onSuccess: (data: CheckoutSessionResponse) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkout_url;
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, "Failed to create checkout session");
      showSnackbar(message, "error");
    },
  });
};

export const useHandleCheckoutSuccess = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (sessionId: string) =>
      PaymentsService.handleCheckoutSuccessApiPaymentsCheckoutSuccessGet(
        sessionId
      ),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["payments", "user-info"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      showSnackbar("Payment processed successfully!", "success");
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, "Failed to process payment");
      showSnackbar(message, "error");
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (request: CancelSubscriptionRequest) =>
      PaymentsService.cancelSubscriptionApiPaymentsSubscriptionsCancelPost(
        request
      ),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["payments", "user-info"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      showSnackbar("Subscription canceled successfully", "success");
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, "Failed to cancel subscription");
      showSnackbar(message, "error");
    },
  });
};

export const useCreateCustomerPortal = () => {
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (returnUrl?: string) =>
      PaymentsService.createCustomerPortalApiPaymentsPortalPost(returnUrl),
    onSuccess: (data: CustomerPortalResponse) => {
      // Redirect to Stripe customer portal
      window.location.href = data.portal_url;
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, "Failed to open customer portal");
      showSnackbar(message, "error");
    },
  });
};

export const useUserPaymentInfo = () => {
  return useQuery({
    queryKey: ["payments", "user-info"],
    queryFn: () => PaymentsService.getUserPaymentInfoApiPaymentsUserInfoGet(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Utility hooks
export const useCheckoutWithProduct = () => {
  const createCheckout = useCreateCheckoutSession();

  const checkoutWithProduct = (
    productId: string,
    options?: Partial<CreateCheckoutRequest>
  ) => {
    createCheckout.mutate({
      product_id: productId,
      success_url: `${window.location.origin}/dashboard/payment/success`,
      cancel_url: `${window.location.origin}/dashboard/payment/cancel`,
      allow_promotion_codes: true,
      ...options,
    });
  };

  return {
    checkoutWithProduct,
    isLoading: createCheckout.isPending,
    error: createCheckout.error,
  };
};

export const useSubscriptionStatus = () => {
  const { data: userPaymentInfo, isLoading } = useUserPaymentInfo();

  const hasActiveSubscription =
    userPaymentInfo?.active_subscription?.status === "active";
  const isTrialing =
    userPaymentInfo?.active_subscription?.status === "trialing";
  const isPastDue = userPaymentInfo?.active_subscription?.status === "past_due";
  const isCanceled =
    userPaymentInfo?.active_subscription?.status === "canceled";

  return {
    hasActiveSubscription,
    isTrialing,
    isPastDue,
    isCanceled,
    subscription: userPaymentInfo?.active_subscription,
    isLoading,
  };
};

// Export types for use in components
export type {
  ProductResponse,
  CreateCheckoutRequest,
  CheckoutSessionResponse,
  CancelSubscriptionRequest,
  SubscriptionResponse,
  PaymentResponse,
  UserPaymentInfo,
  CustomerPortalResponse,
};
