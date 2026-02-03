/**
 * API Client for Zhiyue Backend Service
 * Handles authentication and API requests with JWT tokens
 */

import type { LoginCredentials, AuthResponse, UserProfile } from '@/types/auth';

// Default to localhost for development, can be overridden via environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Set the authentication token
     */
    setToken(token: string | null) {
        this.token = token;
    }

    /**
     * Get the current token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Make an HTTP request
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * Login with username and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Store token after successful login
        this.setToken(response.accessToken);
        return response;
    }

    /**
     * Get current user profile
     */
    async getProfile(): Promise<UserProfile> {
        return this.request<UserProfile>('/auth/profile');
    }

    /**
     * Record usage (for logged-in users)
     */
    async recordUsage(data: {
        action: string;
        tokensUsed: number;
        model?: string;
    }): Promise<void> {
        await this.request('/usage', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Get usage statistics
     */
    async getUsageStats(days?: number): Promise<{
        totalRequests: number;
        totalTokens: number;
        byAction: Record<string, { count: number; tokens: number }>;
    }> {
        const query = days ? `?days=${days}` : '';
        return this.request(`/usage/stats${query}`);
    }

    /**
     * Check quota availability
     */
    async checkQuota(tokens: number): Promise<{ hasQuota: boolean }> {
        return this.request(`/usage/check-quota?tokens=${tokens}`);
    }

    /**
     * Logout (clear token)
     */
    logout() {
        this.setToken(null);
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiClient };
