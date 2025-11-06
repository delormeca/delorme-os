/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProjectLeadCreate } from '../models/ProjectLeadCreate';
import type { ProjectLeadRead } from '../models/ProjectLeadRead';
import type { ProjectLeadUpdate } from '../models/ProjectLeadUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectLeadsService {
    /**
     * Get Project Leads
     * Get all project leads.
     * @returns ProjectLeadRead Successful Response
     * @throws ApiError
     */
    public static getProjectLeadsApiProjectLeadsGet(): CancelablePromise<Array<ProjectLeadRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/project-leads',
        });
    }
    /**
     * Create Project Lead
     * Create a new project lead.
     * @param requestBody
     * @returns ProjectLeadRead Successful Response
     * @throws ApiError
     */
    public static createProjectLeadApiProjectLeadsPost(
        requestBody: ProjectLeadCreate,
    ): CancelablePromise<ProjectLeadRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/project-leads',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Lead
     * Get a project lead by ID.
     * @param leadId
     * @returns ProjectLeadRead Successful Response
     * @throws ApiError
     */
    public static getProjectLeadApiProjectLeadsLeadIdGet(
        leadId: string,
    ): CancelablePromise<ProjectLeadRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/project-leads/{lead_id}',
            path: {
                'lead_id': leadId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Project Lead
     * Update a project lead.
     * @param leadId
     * @param requestBody
     * @returns ProjectLeadRead Successful Response
     * @throws ApiError
     */
    public static updateProjectLeadApiProjectLeadsLeadIdPut(
        leadId: string,
        requestBody: ProjectLeadUpdate,
    ): CancelablePromise<ProjectLeadRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/project-leads/{lead_id}',
            path: {
                'lead_id': leadId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Project Lead
     * Delete a project lead. Clients assigned to this lead will have their project_lead_id set to NULL.
     * @param leadId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteProjectLeadApiProjectLeadsLeadIdDelete(
        leadId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/project-leads/{lead_id}',
            path: {
                'lead_id': leadId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
