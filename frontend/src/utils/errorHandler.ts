import { NavigateFunction } from 'react-router-dom';

interface ErrorDetails {
  code?: number;
  message?: string;
  stack?: string;
  url?: string;
  timestamp?: string;
}

export class ErrorHandler {
  private static navigate: NavigateFunction | null = null;

  static setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  /**
   * Handle HTTP errors and navigate to appropriate error pages
   */
  static handleHttpError(error: any, navigate?: NavigateFunction) {
    const nav = navigate || this.navigate;
    
    if (!nav) {
      console.error('Navigate function not available for error handling');
      return;
    }

    const status = error?.status || error?.response?.status || 500;
    
    switch (status) {
      case 404:
        nav('/404');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        nav('/500');
        break;
      default:
        if (status >= 500) {
          nav('/500');
        } else if (status >= 400) {
          nav('/404');
        } else {
          nav('/error');
        }
    }
  }

  /**
   * Handle JavaScript errors
   */
  static handleJavaScriptError(error: Error, errorInfo?: any) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('JavaScript Error:', errorDetails);
      if (errorInfo) {
        console.error('Error Info:', errorInfo);
      }
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToService(errorDetails);
    }
  }

  /**
   * Handle API errors with custom messages
   */
  static handleApiError(error: any, customMessage?: string) {
    const errorDetails: ErrorDetails = {
      code: error?.status || error?.response?.status,
      message: customMessage || error?.message || 'An API error occurred',
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Log error
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', errorDetails);
    } else {
      this.logToService(errorDetails);
    }

    // Navigate to error page if needed
    if (errorDetails.code && errorDetails.code >= 500) {
      this.handleHttpError(error);
    }
  }

  /**
   * Log errors to external service (implement your preferred service)
   */
  private static logToService(errorDetails: ErrorDetails) {
    // Example implementations:
    
    // Sentry
    // Sentry.captureException(errorDetails);
    
    // LogRocket
    // LogRocket.captureException(errorDetails);
    
    // Custom API endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorDetails)
    // });

    console.error('Error logged:', errorDetails);
  }

  /**
   * Create a user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    const status = error?.status || error?.response?.status;
    const errorDetail = error?.detail || error?.response?.data?.detail || error?.body?.detail;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        // Check if it's a plan-related permission error
        if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'access_denied') {
          const requiredPlan = errorDetail.required_plan;
          if (requiredPlan) {
            return `This feature requires ${requiredPlan} plan or higher. Upgrade now to unlock!`;
          }
          return 'This feature requires a higher plan. Upgrade to unlock!';
        }
        const errorMessage = errorDetail?.message || error?.message || '';
        if (errorMessage.includes('plan') || errorMessage.includes('requires')) {
          return `${errorMessage} Upgrade now to unlock this feature!`;
        }
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error?.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Check if error is a plan upgrade requirement
   */
  static isUpgradeRequiredError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    const errorDetail = error?.detail || error?.response?.data?.detail || error?.body?.detail;
    
    // Check for structured access denied error
    if (status === 403 && 
        errorDetail && 
        typeof errorDetail === 'object' && 
        errorDetail.error === 'access_denied' &&
        errorDetail.required_plan) {
      return true;
    }
    
    // Check for plan-related error messages
    const errorMessage = errorDetail?.message || error?.message || '';
    if (status === 403 && (errorMessage.includes('plan') || errorMessage.includes('requires'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Get required plan from error
   */
  static getRequiredPlan(error: any): string | null {
    const errorDetail = error?.detail || error?.response?.data?.detail || error?.body?.detail;
    
    if (errorDetail && typeof errorDetail === 'object') {
      return errorDetail.required_plan || null;
    }
    
    // Try to extract plan from error message
    const errorMessage = errorDetail?.message || error?.message || '';
    const planMatch = errorMessage.match(/requires (\w+) plan/);
    if (planMatch) {
      return planMatch[1];
    }
    
    return null;
  }

  /**
   * Check if error should show error page vs inline error
   */
  static shouldNavigateToErrorPage(error: any): boolean {
    const status = error?.status || error?.response?.status;
    
    // Navigate to error page for server errors and 404s
    return status === 404 || status >= 500;
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  ErrorHandler.handleJavaScriptError(
    new Error(`Unhandled Promise Rejection: ${event.reason}`)
  );
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  ErrorHandler.handleJavaScriptError(
    new Error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`)
  );
});

export default ErrorHandler; 