/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PlanInfoResponse = {
    user_id: string;
    current_plan: string;
    permissions: Array<string>;
    subscription: (Record<string, any> | null);
    purchases: Array<Record<string, any>>;
    plan_features: Record<string, any>;
};

