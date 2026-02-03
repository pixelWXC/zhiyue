/**
 * Authentication Types
 * Types for user authentication and quota management
 */

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface UserProfile {
    id: string;
    username: string;
    role: 'guest' | 'user' | 'admin';
    quotaLimit: number;
    quotaUsed: number;
    quotaRemaining: number;
}

export interface AuthResponse {
    accessToken: string;
    user: UserProfile;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    token: string | null;
}
