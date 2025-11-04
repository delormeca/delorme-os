/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelSubscriptionRequest } from '../models/CancelSubscriptionRequest';
import type { CheckoutSessionResponse } from '../models/CheckoutSessionResponse';
import type { CreateCheckoutRequest } from '../models/CreateCheckoutRequest';
import type { CustomerPortalResponse } from '../models/CustomerPortalResponse';
import type { ProductResponse } from '../models/ProductResponse';
import type { SubscriptionResponse } from '../models/SubscriptionResponse';
import type { WebhookEventResponse } from '../models/WebhookEventResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PaymentsService {
    /**
     * Get Products
     * Get all available products and plans
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static getProductsApiPaymentsProductsGet(): CancelablePromise<Array<ProductResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/products',
        });
    }
    /**
     * Get Product
     * Get a specific product by ID
     * @param productId
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static getProductApiPaymentsProductsProductIdGet(
        productId: string,
    ): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/products/{product_id}',
            path: {
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Checkout Session
     * Create a checkout session for either one-time payment or subscription
     * @param requestBody
     * @returns CheckoutSessionResponse Successful Response
     * @throws ApiError
     */
    public static createCheckoutSessionApiPaymentsCheckoutPost(
        requestBody: CreateCheckoutRequest,
    ): CancelablePromise<CheckoutSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/checkout',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Handle Checkout Success
     * Handle successful checkout completion
     * Returns either PaymentResponse for one-time payments or SubscriptionResponse for subscriptions
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static handleCheckoutSuccessApiPaymentsCheckoutSuccessGet(
        sessionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/checkout/success',
            query: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Subscription
     * Cancel the current user's subscription
     * @param requestBody
     * @returns SubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static cancelSubscriptionApiPaymentsSubscriptionsCancelPost(
        requestBody: CancelSubscriptionRequest,
    ): CancelablePromise<SubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/subscriptions/cancel',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Customer Portal
     * Create a customer portal session for subscription management
     * @param returnUrl
     * @returns CustomerPortalResponse Successful Response
     * @throws ApiError
     */
    public static createCustomerPortalApiPaymentsPortalPost(
        returnUrl?: (string | null),
    ): CancelablePromise<CustomerPortalResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/portal',
            query: {
                'return_url': returnUrl,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get User Payment Info
     * Get comprehensive payment information for the current user
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getUserPaymentInfoApiPaymentsUserInfoGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/user/info',
        });
    }
    /**
     * Handle Stripe Webhook
     * Handle Stripe webhook events
     * This endpoint is called by Stripe to notify about payment events
     * @returns WebhookEventResponse Successful Response
     * @throws ApiError
     */
    public static handleStripeWebhookApiPaymentsWebhookPost(): CancelablePromise<WebhookEventResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/webhook',
        });
    }
}
