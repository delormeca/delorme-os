/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientCreate } from '../models/ClientCreate';
import type { ClientDelete } from '../models/ClientDelete';
import type { ClientRead } from '../models/ClientRead';
import type { ClientUpdate } from '../models/ClientUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientsService {
    /**
     * Get Clients
     * Get all clients for the current user.
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static getClientsApiClientsGet(): CancelablePromise<Array<ClientRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/clients',
        });
    }
    /**
     * Create Client
     * Create a new client.
     * @param requestBody
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static createClientApiClientsPost(
        requestBody: ClientCreate,
    ): CancelablePromise<ClientRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/clients',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client
     * Get a client by ID.
     * @param clientId
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static getClientApiClientsClientIdGet(
        clientId: string,
    ): CancelablePromise<ClientRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Client
     * Update a client.
     * @param clientId
     * @param requestBody
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static updateClientApiClientsClientIdPut(
        clientId: string,
        requestBody: ClientUpdate,
    ): CancelablePromise<ClientRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Client
     * Delete a client. Requires password confirmation.
     * @param clientId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteClientApiClientsClientIdDelete(
        clientId: string,
        requestBody: ClientDelete,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/clients/{client_id}',
            path: {
                'client_id': clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
