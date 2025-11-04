/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Webhook processing response
 */
export type WebhookEventResponse = {
    /**
     * Stripe event ID
     */
    event_id: string;
    /**
     * Event type
     */
    event_type: string;
    /**
     * Whether event was processed
     */
    processed: boolean;
    /**
     * Processing result message
     */
    message: string;
};

