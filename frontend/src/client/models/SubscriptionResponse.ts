/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionStatus } from './SubscriptionStatus';
/**
 * Subscription response
 */
export type SubscriptionResponse = {
    /**
     * Subscription ID
     */
    id: string;
    /**
     * Subscription status
     */
    status: SubscriptionStatus;
    /**
     * Plan identifier
     */
    plan_id: string;
    /**
     * Current period start
     */
    current_period_start: string;
    /**
     * Current period end
     */
    current_period_end: string;
    /**
     * Trial end date
     */
    trial_end?: (string | null);
    /**
     * Will cancel at period end
     */
    cancel_at_period_end: boolean;
    /**
     * Stripe subscription ID
     */
    stripe_subscription_id?: (string | null);
    /**
     * Creation timestamp
     */
    created_at: string;
    /**
     * Last update timestamp
     */
    updated_at: string;
};

