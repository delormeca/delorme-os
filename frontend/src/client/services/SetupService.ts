/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SetupService {
    /**
     * Create Superuser
     * Create the default superuser account.
     * This endpoint can be called once to initialize the superuser.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createSuperuserApiSetupCreateSuperuserGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/setup/create-superuser',
        });
    }
}
