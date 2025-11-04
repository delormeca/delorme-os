"""
Payment-related exception classes for comprehensive error handling
"""

import logging
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class PaymentBaseException(Exception):
    """Base payment exception class"""

    def __init__(
        self,
        message: str,
        error_code: str = "PAYMENT_ERROR",
        details: Optional[Dict[str, Any]] = None,
        original_error: Optional[Exception] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.original_error = original_error
        super().__init__(self.message)

        # Log the error
        logger.error(
            f"PaymentError [{self.error_code}]: {self.message}",
            extra={
                "error_code": self.error_code,
                "details": self.details,
                "original_error": (
                    str(self.original_error) if self.original_error else None
                ),
            },
        )


class PaymentConfigurationError(PaymentBaseException):
    """Payment configuration related errors"""

    def __init__(self, message: str, config_key: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="PAYMENT_CONFIG_ERROR",
            details={"config_key": config_key} if config_key else {},
        )


class StripeConnectionError(PaymentBaseException):
    """Stripe API connection errors"""

    def __init__(self, message: str, stripe_error: Optional[Exception] = None):
        super().__init__(
            message=message,
            error_code="STRIPE_CONNECTION_ERROR",
            original_error=stripe_error,
        )


class InvalidProductError(PaymentBaseException):
    """Invalid product configuration errors"""

    def __init__(self, product_id: str, reason: str = "Product not found"):
        super().__init__(
            message=f"Invalid product '{product_id}': {reason}",
            error_code="INVALID_PRODUCT",
            details={"product_id": product_id, "reason": reason},
        )


class PaymentProcessingError(PaymentBaseException):
    """Payment processing errors"""

    def __init__(self, message: str, payment_intent_id: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="PAYMENT_PROCESSING_ERROR",
            details=(
                {"payment_intent_id": payment_intent_id} if payment_intent_id else {}
            ),
        )


class SubscriptionError(PaymentBaseException):
    """Subscription related errors"""

    def __init__(self, message: str, subscription_id: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="SUBSCRIPTION_ERROR",
            details={"subscription_id": subscription_id} if subscription_id else {},
        )


class WebhookValidationError(PaymentBaseException):
    """Webhook validation errors"""

    def __init__(self, message: str, event_id: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="WEBHOOK_VALIDATION_ERROR",
            details={"event_id": event_id} if event_id else {},
        )


class CustomerNotFoundError(PaymentBaseException):
    """Customer not found errors"""

    def __init__(self, customer_identifier: str):
        super().__init__(
            message=f"Customer not found: {customer_identifier}",
            error_code="CUSTOMER_NOT_FOUND",
            details={"customer_identifier": customer_identifier},
        )


class DuplicatePaymentError(PaymentBaseException):
    """Duplicate payment errors"""

    def __init__(self, transaction_id: str):
        super().__init__(
            message=f"Duplicate payment detected: {transaction_id}",
            error_code="DUPLICATE_PAYMENT",
            details={"transaction_id": transaction_id},
        )


class InsufficientPermissionsError(PaymentBaseException):
    """Insufficient permissions for payment operations"""

    def __init__(self, operation: str, user_id: Optional[str] = None):
        super().__init__(
            message=f"Insufficient permissions for operation: {operation}",
            error_code="INSUFFICIENT_PERMISSIONS",
            details={"operation": operation, "user_id": user_id},
        )


class RefundError(PaymentBaseException):
    """Refund processing errors"""

    def __init__(self, message: str, payment_intent_id: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="REFUND_ERROR",
            details=(
                {"payment_intent_id": payment_intent_id} if payment_intent_id else {}
            ),
        )


class FileAccessError(PaymentBaseException):
    """File access/download errors"""

    def __init__(self, message: str, file_path: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="FILE_ACCESS_ERROR",
            details={"file_path": file_path} if file_path else {},
        )


# HTTP Exception Converters
def payment_exception_to_http(exc: PaymentBaseException) -> HTTPException:
    """Convert payment exception to HTTP exception"""

    # Map error codes to HTTP status codes
    status_map = {
        "PAYMENT_CONFIG_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "STRIPE_CONNECTION_ERROR": status.HTTP_502_BAD_GATEWAY,
        "INVALID_PRODUCT": status.HTTP_400_BAD_REQUEST,
        "PAYMENT_PROCESSING_ERROR": status.HTTP_402_PAYMENT_REQUIRED,
        "SUBSCRIPTION_ERROR": status.HTTP_400_BAD_REQUEST,
        "WEBHOOK_VALIDATION_ERROR": status.HTTP_400_BAD_REQUEST,
        "CUSTOMER_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "DUPLICATE_PAYMENT": status.HTTP_409_CONFLICT,
        "INSUFFICIENT_PERMISSIONS": status.HTTP_403_FORBIDDEN,
        "REFUND_ERROR": status.HTTP_400_BAD_REQUEST,
        "FILE_ACCESS_ERROR": status.HTTP_404_NOT_FOUND,
    }

    status_code = status_map.get(exc.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    return HTTPException(
        status_code=status_code,
        detail={
            "error_type": "payment_error",
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


# Exception Handler for FastAPI
async def payment_exception_handler(request, exc: PaymentBaseException):
    """FastAPI exception handler for payment exceptions"""
    http_exc = payment_exception_to_http(exc)
    return JSONResponse(status_code=http_exc.status_code, content=http_exc.detail)


# Context Managers for Error Handling
class PaymentErrorContext:
    """Context manager for handling payment errors with automatic conversion"""

    def __init__(self, operation: str, **context_data):
        self.operation = operation
        self.context_data = context_data

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type and issubclass(exc_type, PaymentBaseException):
            # Re-raise payment exceptions as-is
            return False
        elif exc_type:
            # Convert other exceptions to payment exceptions
            # Include context data in the message instead of as kwargs
            context_info = (
                ", ".join(f"{k}={v}" for k, v in self.context_data.items())
                if self.context_data
                else ""
            )
            message = f"Unexpected error during {self.operation}: {str(exc_val)}"
            if context_info:
                message += f" (Context: {context_info})"

            raise PaymentProcessingError(message) from exc_val
        return False


# Validation Decorators
def handle_stripe_errors(func):
    """Decorator to handle Stripe-specific errors"""
    from functools import wraps

    import stripe

    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except stripe.error.CardError as e:
            raise PaymentProcessingError(f"Card error: {e.user_message}")
        except stripe.error.RateLimitError:
            raise StripeConnectionError("Rate limit exceeded, please try again later")
        except stripe.error.InvalidRequestError as e:
            raise PaymentProcessingError(f"Invalid request: {str(e)}")
        except stripe.error.AuthenticationError as e:
            raise PaymentConfigurationError(
                "Stripe authentication failed - check API keys"
            )
        except stripe.error.APIConnectionError as e:
            raise StripeConnectionError("Failed to connect to Stripe API")
        except stripe.error.StripeError as e:
            raise PaymentProcessingError(f"Stripe error: {str(e)}")

    return wrapper


def validate_user_permissions(required_permission: str):
    """Decorator to validate user permissions for payment operations"""

    def decorator(func):
        from functools import wraps

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from function arguments
            user = None
            for arg in args + tuple(kwargs.values()):
                if hasattr(arg, "email") and hasattr(
                    arg, "id"
                ):  # Assume this is user object
                    user = arg
                    break

            if not user:
                raise InsufficientPermissionsError(
                    f"User authentication required for {required_permission}"
                )

            # Add your permission validation logic here
            # For now, just ensure user exists
            return await func(*args, **kwargs)

        return wrapper

    return decorator
