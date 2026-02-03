/**
 * Authentication Store
 * Manages user login state, authentication, and quota
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/logic/api/client'
import { useAuth, setAuthState, clearAuthState } from '@/logic/auth'
import type { LoginCredentials, UserProfile } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
    // Reactive auth composable
    const { authToken, authUser, isAuthenticated, isUser, isAdmin } = useAuth()

    // Loading and error states
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Quota computed properties
    const quotaInfo = computed(() => {
        if (!authUser.value) return null
        const limit = authUser.value.quotaLimit ?? 0
        const used = authUser.value.quotaUsed ?? 0
        const remaining = authUser.value.quotaRemaining ?? Math.max(limit - used, 0)
        const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0
        return { limit, used, remaining, percentage }
    })

    /**
     * Login with credentials
     * Returns user profile on success, null on failure
     */
    async function login(credentials: LoginCredentials): Promise<UserProfile | null> {
        isLoading.value = true
        error.value = null

        try {
            const response = await apiClient.login(credentials)
            await setAuthState(response.accessToken, response.user)

            // Manually update refs to trigger reactivity immediately
            // This is necessary because chrome.storage.onChanged doesn't fire for changes made in the same context
            authToken.value = response.accessToken
            authUser.value = response.user

            return response.user
        } catch (e) {
            error.value = (e as Error).message || '登录失败，请检查账号密码'
            return null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Logout
     */
    async function logout(): Promise<void> {
        await clearAuthState()
        apiClient.logout()

        // Manually update refs
        authToken.value = null
        authUser.value = null
    }

    /**
     * Refresh user profile (get latest quota etc.)
     */
    async function refreshProfile(): Promise<void> {
        if (!isAuthenticated.value) return

        try {
            const profile = await apiClient.getProfile()
            if (authToken.value) {
                await setAuthState(authToken.value, profile)
                authUser.value = profile
            }
        } catch (e) {
            // If token is invalid, logout
            console.error('Failed to refresh profile:', e)
            await logout()
        }
    }

    /**
     * Check if user has enough quota for an operation
     */
    async function checkQuota(tokensNeeded: number): Promise<boolean> {
        if (!isAuthenticated.value) return false

        try {
            const result = await apiClient.checkQuota(tokensNeeded)
            return result.hasQuota
        } catch {
            return false
        }
    }

    return {
        // State
        authToken,
        authUser,
        isLoading,
        error,

        // Computed
        isAuthenticated,
        isUser,
        isAdmin,
        quotaInfo,

        // Actions
        login,
        logout,
        refreshProfile,
        checkQuota,
    }
})
