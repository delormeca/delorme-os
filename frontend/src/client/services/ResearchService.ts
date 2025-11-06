/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageCreate } from '../models/ChatMessageCreate';
import type { ChatMessageResponse } from '../models/ChatMessageResponse';
import type { ResearchRequestCreate } from '../models/ResearchRequestCreate';
import type { ResearchRequestDetail } from '../models/ResearchRequestDetail';
import type { ResearchRequestRead } from '../models/ResearchRequestRead';
import type { RetrieverListResponse } from '../models/RetrieverListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResearchService {
    /**
     * Create Research
     * Create a new research request and optionally start execution in background.
     *
     * Args:
     * research_data: Research request parameters
     * background_tasks: FastAPI background tasks
     * db: Database session
     * current_user: Current authenticated user
     *
     * Returns:
     * Created research request
     * @param requestBody
     * @returns ResearchRequestRead Successful Response
     * @throws ApiError
     */
    public static createResearchApiResearchPost(
        requestBody: ResearchRequestCreate,
    ): CancelablePromise<ResearchRequestRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/research',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Research
     * Get all research requests for the current user.
     *
     * Args:
     * skip: Number of records to skip
     * limit: Maximum number of records to return
     * db: Database session
     * current_user: Current authenticated user
     *
     * Returns:
     * List of research requests
     * @param skip
     * @param limit
     * @returns ResearchRequestRead Successful Response
     * @throws ApiError
     */
    public static listResearchApiResearchGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<Array<ResearchRequestRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/research',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Research Detail
     * Get detailed information about a specific research request.
     *
     * Args:
     * research_id: UUID of the research request
     * db: Database session
     * current_user: Current authenticated user
     *
     * Returns:
     * Detailed research request with sources and report
     * @param researchId
     * @returns ResearchRequestDetail Successful Response
     * @throws ApiError
     */
    public static getResearchDetailApiResearchResearchIdGet(
        researchId: string,
    ): CancelablePromise<ResearchRequestDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/research/{research_id}',
            path: {
                'research_id': researchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Research
     * Delete a research request and all associated data.
     *
     * Args:
     * research_id: UUID of the research request
     * db: Database session
     * current_user: Current authenticated user
     *
     * Returns:
     * Success message
     * @param researchId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteResearchApiResearchResearchIdDelete(
        researchId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/research/{research_id}',
            path: {
                'research_id': researchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Research
     * Cancel a running research request.
     *
     * Args:
     * research_id: UUID of the research request
     * db: Database session
     * current_user: Current authenticated user
     *
     * Returns:
     * Updated research request with cancelled status
     * @param researchId
     * @returns ResearchRequestRead Successful Response
     * @throws ApiError
     */
    public static cancelResearchApiResearchResearchIdCancelPost(
        researchId: string,
    ): CancelablePromise<ResearchRequestRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/research/{research_id}/cancel',
            path: {
                'research_id': researchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Chat With Research
     * Chat with AI about research results.
     *
     * Args:
     * research_id: UUID of the research request
     * message: User's chat message
     * db: Database session
     * current_user: Current authenticated user
     *
     * Returns:
     * Chat response containing both user message and AI response
     * @param researchId
     * @param requestBody
     * @returns ChatMessageResponse Successful Response
     * @throws ApiError
     */
    public static chatWithResearchApiResearchResearchIdChatPost(
        researchId: string,
        requestBody: ChatMessageCreate,
    ): CancelablePromise<ChatMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/research/{research_id}/chat',
            path: {
                'research_id': researchId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Available Retrievers
     * Get list of available search retrievers with their configuration status.
     *
     * Returns:
     * List of retrievers with configuration information
     * @returns RetrieverListResponse Successful Response
     * @throws ApiError
     */
    public static getAvailableRetrieversApiResearchRetrieversListGet(): CancelablePromise<RetrieverListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/research/retrievers/list',
        });
    }
}
