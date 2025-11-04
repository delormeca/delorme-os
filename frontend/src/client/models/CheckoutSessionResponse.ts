/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for checkout session creation
 */
export type CheckoutSessionResponse = {
    /**
     * Stripe checkout URL
     */
    checkout_url: string;
    /**
     * Stripe session ID
     */
    session_id: string;
    /**
     * Session expiration time
     */
    expires_at: string;
};

