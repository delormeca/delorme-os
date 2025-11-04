import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorHandler from '@/utils/errorHandler';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { useCheckoutWithProduct } from '@/hooks/api/usePayments';

export const useErrorHandler = () => {
  const navigate = useNavigate();
  const { createSnackBar } = useSnackBarContext();
  const { checkoutWithProduct } = useCheckoutWithProduct();

  useEffect(() => {
    // Set the navigate function for the ErrorHandler
    ErrorHandler.setNavigate(navigate);
  }, [navigate]);

  const handleError = (error: any, showSnackbar: boolean = true) => {
    // Show user-friendly message in snackbar
    if (showSnackbar) {
      const message = ErrorHandler.getUserFriendlyMessage(error);
      createSnackBar({
        content: message,
        severity: 'error',
        autoHide: true,
      });
    }

    // Navigate to error page if needed
    if (ErrorHandler.shouldNavigateToErrorPage(error)) {
      ErrorHandler.handleHttpError(error, navigate);
    } else {
      // Log the error for non-navigating errors
      ErrorHandler.handleApiError(error);
    }
  };

  const handleApiError = (error: any, customMessage?: string) => {
    // Check if it's a plan upgrade requirement error
    if (ErrorHandler.isUpgradeRequiredError(error)) {
      const requiredPlan = ErrorHandler.getRequiredPlan(error);
      const message = customMessage || ErrorHandler.getUserFriendlyMessage(error);
      
      createSnackBar({
        content: message,
        severity: 'warning',
        autoHide: false,
      });

      // Only auto-redirect if not already on a dashboard page with permission guards
      // Permission guards will handle the upgrade prompts on those pages
      const currentPath = window.location.pathname;
      const isDashboardPage = currentPath.startsWith('/dashboard/');
      const isAnalyticsOrIntegrations = currentPath.includes('/analytics') || currentPath.includes('/integrations');
      
      if (!isDashboardPage || !isAnalyticsOrIntegrations) {
        setTimeout(() => {
          navigate('/pricing');
        }, 2000);
      }
      
    } else {
      const message = customMessage || ErrorHandler.getUserFriendlyMessage(error);
      
      createSnackBar({
        content: message,
        severity: 'error',
        autoHide: true,
      });
    }

    ErrorHandler.handleApiError(error, customMessage);
  };

  const handle404 = () => {
    navigate('/404');
  };

  const handle500 = (message?: string) => {
    navigate('/500', { state: { message } });
  };

  const handleJavaScriptError = (error: Error, errorInfo?: any) => {
    ErrorHandler.handleJavaScriptError(error, errorInfo);
    
    createSnackBar({
      content: 'An unexpected error occurred. Please refresh the page.',
      severity: 'error',
      autoHide: false,
    });
  };

  return {
    handleError,
    handleApiError,
    handle404,
    handle500,
    handleJavaScriptError,
    getUserFriendlyMessage: ErrorHandler.getUserFriendlyMessage,
  };
};

export default useErrorHandler; 