/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CurrentUserResponse } from '../models/CurrentUserResponse';
import type { ForgotPasswordRequest } from '../models/ForgotPasswordRequest';
import type { ForgotPasswordResponse } from '../models/ForgotPasswordResponse';
import type { LoginForm } from '../models/LoginForm';
import type { LoginResponse } from '../models/LoginResponse';
import type { ResetPasswordRequest } from '../models/ResetPasswordRequest';
import type { SignupForm } from '../models/SignupForm';
import type { UserUpdate } from '../models/UserUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Current User
     * @returns CurrentUserResponse Successful Response
     * @throws ApiError
     */
    public static currentUserApiAuthCurrentGet(): CancelablePromise<CurrentUserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/current',
        });
    }
    /**
     * Login
     * @param requestBody
     * @returns LoginResponse Successful Response
     * @throws ApiError
     */
    public static loginApiAuthLoginPost(
        requestBody: LoginForm,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Logout
     * @returns any Successful Response
     * @throws ApiError
     */
    public static logoutApiAuthLogoutGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/logout',
        });
    }
    /**
     * Signup
     * @param requestBody
     * @returns LoginResponse Successful Response
     * @throws ApiError
     */
    public static signupApiAuthSignupPost(
        requestBody: SignupForm,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/signup',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Google Callback
     * @returns LoginResponse Successful Response
     * @throws ApiError
     */
    public static googleCallbackApiAuthGoogleCallbackGet(): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/google_callback',
        });
    }
    /**
     * Google Authorize
     * @returns any Successful Response
     * @throws ApiError
     */
    public static googleAuthorizeApiAuthGoogleAuthorizeGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/google/authorize',
        });
    }
    /**
     * Update User Profile
     * @param requestBody
     * @returns UserUpdate Successful Response
     * @throws ApiError
     */
    public static updateUserProfileApiAuthProfilePut(
        requestBody: UserUpdate,
    ): CancelablePromise<UserUpdate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/auth/profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Forgot Password
     * Request password reset email
     * @param requestBody
     * @returns ForgotPasswordResponse Successful Response
     * @throws ApiError
     */
    public static forgotPasswordApiAuthForgotPasswordPost(
        requestBody: ForgotPasswordRequest,
    ): CancelablePromise<ForgotPasswordResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/forgot-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reset Password
     * Reset password using token
     * @param requestBody
     * @returns ForgotPasswordResponse Successful Response
     * @throws ApiError
     */
    public static resetPasswordApiAuthResetPasswordPost(
        requestBody: ResetPasswordRequest,
    ): CancelablePromise<ForgotPasswordResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
