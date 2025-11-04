/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to create a checkout session
 */
export type CreateCheckoutRequest = {
    /**
     * Product identifier
     */
    product_id: string;
    /**
     * Custom success URL
     */
    success_url?: (string | null);
    /**
     * Custom cancel URL
     */
    cancel_url?: (string | null);
    /**
     * Pre-fill customer email
     */
    customer_email?: (string | null);
    /**
     * Additional metadata
     */
    metadata?: (Record<string, string> | null);
    /**
     * Allow promotion codes
     */
    allow_promotion_codes?: boolean;
};

