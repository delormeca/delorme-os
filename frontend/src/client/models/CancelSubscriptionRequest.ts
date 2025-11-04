/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to cancel a subscription
 */
export type CancelSubscriptionRequest = {
    /**
     * Cancel immediately or at period end
     */
    immediately?: boolean;
    /**
     * Cancellation reason
     */
    reason?: (string | null);
};

