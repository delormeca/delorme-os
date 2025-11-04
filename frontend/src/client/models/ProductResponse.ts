/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentType } from './PaymentType';
/**
 * Product information response
 */
export type ProductResponse = {
    /**
     * Product identifier
     */
    id: string;
    /**
     * Product name
     */
    name: string;
    /**
     * Product description
     */
    description: string;
    /**
     * Payment type
     */
    type: PaymentType;
    /**
     * Price in cents
     */
    price_cents: number;
    /**
     * Currency code
     */
    currency: string;
    /**
     * Trial period for subscriptions
     */
    trial_period_days?: (number | null);
    /**
     * Product features
     */
    features: Array<string>;
};

