/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_generate_backup_api_clients_backup_post } from '../models/Body_generate_backup_api_clients_backup_post';
import type { ClientBulkDelete } from '../models/ClientBulkDelete';
import type { ClientCreate } from '../models/ClientCreate';
import type { ClientDelete } from '../models/ClientDelete';
import type { ClientRead } from '../models/ClientRead';
import type { ClientSitemapTest } from '../models/ClientSitemapTest';
import type { ClientSitemapTestResult } from '../models/ClientSitemapTestResult';
import type { ClientUpdate } from '../models/ClientUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientsService {
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
     * Get Clients
     * Get all clients (shared across platform). Supports search and filtering.
     * @param search Search by name or website URL
     * @param projectLeadId Filter by project lead
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static getClientsApiClientsGet(
        search?: (string | null),
        projectLeadId?: (string | null),
    ): CancelablePromise<Array<ClientRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/clients',
            query: {
                'search': search,
                'project_lead_id': projectLeadId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client By Slug
     * Get a client by slug (URL-friendly identifier).
     * @param slug
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static getClientBySlugApiClientsSlugSlugGet(
        slug: string,
    ): CancelablePromise<ClientRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/clients/slug/{slug}',
            path: {
                'slug': slug,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Client
     * Get a client by ID or slug.
     * @param clientIdentifier
     * @returns ClientRead Successful Response
     * @throws ApiError
     */
    public static getClientApiClientsClientIdentifierGet(
        clientIdentifier: string,
    ): CancelablePromise<ClientRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/clients/{client_identifier}',
            path: {
                'client_identifier': clientIdentifier,
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
    /**
     * Test Sitemap
     * Test a sitemap URL to validate it and count URLs.
     * @param requestBody
     * @returns ClientSitemapTestResult Successful Response
     * @throws ApiError
     */
    public static testSitemapApiClientsTestSitemapPost(
        requestBody: ClientSitemapTest,
    ): CancelablePromise<ClientSitemapTestResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/clients/test-sitemap',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Delete Clients
     * Delete multiple clients. Optionally creates a backup .zip file.
     * Returns the backup file if create_backup=True.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static bulkDeleteClientsApiClientsBulkDeletePost(
        requestBody: ClientBulkDelete,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/clients/bulk-delete',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Backup
     * Generate a backup .zip file for specific clients.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateBackupApiClientsBackupPost(
        requestBody: Body_generate_backup_api_clients_backup_post,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/clients/backup',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
