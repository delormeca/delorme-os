/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArticleCreate } from '../models/ArticleCreate';
import type { ArticleRead } from '../models/ArticleRead';
import type { ArticleUpdate } from '../models/ArticleUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ArticlesService {
    /**
     * Create Article
     * @param requestBody
     * @returns ArticleRead Successful Response
     * @throws ApiError
     */
    public static createArticleApiArticlesPost(
        requestBody: ArticleCreate,
    ): CancelablePromise<ArticleRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/articles',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Articles
     * @param publishedOnly
     * @returns ArticleRead Successful Response
     * @throws ApiError
     */
    public static listArticlesApiArticlesGet(
        publishedOnly: boolean = false,
    ): CancelablePromise<Array<ArticleRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/articles',
            query: {
                'published_only': publishedOnly,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Article
     * @param articleId
     * @returns ArticleRead Successful Response
     * @throws ApiError
     */
    public static readArticleApiArticlesArticleIdGet(
        articleId: number,
    ): CancelablePromise<ArticleRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/articles/{article_id}',
            path: {
                'article_id': articleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Article
     * @param articleId
     * @param requestBody
     * @returns ArticleRead Successful Response
     * @throws ApiError
     */
    public static updateArticleApiArticlesArticleIdPut(
        articleId: number,
        requestBody: ArticleUpdate,
    ): CancelablePromise<ArticleRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/articles/{article_id}',
            path: {
                'article_id': articleId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Article
     * @param articleId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteArticleApiArticlesArticleIdDelete(
        articleId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/articles/{article_id}',
            path: {
                'article_id': articleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
