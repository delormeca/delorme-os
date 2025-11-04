/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProjectCreate } from '../models/ProjectCreate';
import type { ProjectDelete } from '../models/ProjectDelete';
import type { ProjectRead } from '../models/ProjectRead';
import type { ProjectUpdate } from '../models/ProjectUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectsService {
    /**
     * Create Project
     * Create a new project.
     * @param requestBody
     * @returns ProjectRead Successful Response
     * @throws ApiError
     */
    public static createProjectApiProjectsPost(
        requestBody: ProjectCreate,
    ): CancelablePromise<ProjectRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Projects
     * Get all projects for the current user, optionally filtered by client_id.
     * @param clientId
     * @returns ProjectRead Successful Response
     * @throws ApiError
     */
    public static getProjectsApiProjectsGet(
        clientId?: (string | null),
    ): CancelablePromise<Array<ProjectRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects',
            query: {
                'client_id': clientId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project
     * Get a project by ID.
     * @param projectId
     * @returns ProjectRead Successful Response
     * @throws ApiError
     */
    public static getProjectApiProjectsProjectIdGet(
        projectId: string,
    ): CancelablePromise<ProjectRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Project
     * Update a project.
     * @param projectId
     * @param requestBody
     * @returns ProjectRead Successful Response
     * @throws ApiError
     */
    public static updateProjectApiProjectsProjectIdPut(
        projectId: string,
        requestBody: ProjectUpdate,
    ): CancelablePromise<ProjectRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Project
     * Delete a project. Requires password confirmation.
     * @param projectId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteProjectApiProjectsProjectIdDelete(
        projectId: string,
        requestBody: ProjectDelete,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
