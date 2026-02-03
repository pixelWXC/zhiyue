/**
 * Reactive authentication storage
 * Manages user session and tokens
 */

import { useStorageAsync } from '@vueuse/core'
import { computed, watch } from 'vue'
import { STORAGE_KEYS } from '@/logic/storage'
import { apiClient } from '@/logic/api/client'
import type { UserProfile } from '@/types/auth'

/**
 * Storage adapter for chrome.storage.local
 */
const chromeStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        const result = await chrome.storage.local.get(key)
        const value = result[key]
        if (value === undefined || value === null) return null
        if (typeof value === 'string') return value
        return JSON.stringify(value)
    },
    setItem: async (key: string, value: string) => {
        await chrome.storage.local.set({ [key]: value })
    },
    removeItem: async (key: string) => {
        await chrome.storage.local.remove(key)
    },
}

/**
 * Reactive authentication composable
 */
export function useAuth() {
    // Reactive storage for auth token
    const authToken = useStorageAsync<string | null>(
        STORAGE_KEYS.AUTH_TOKEN,
        null,
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    // Reactive storage for user profile
    const authUserSerializer = {
        read: (value: string): UserProfile | null => {
            if (!value) return null
            try {
                return JSON.parse(value) as UserProfile
            } catch {
                return null
            }
        },
        write: (value: UserProfile | null): string => JSON.stringify(value),
    }
    const authUser = useStorageAsync<UserProfile | null>(
        STORAGE_KEYS.AUTH_USER,
        null,
        chromeStorageAdapter,
        { mergeDefaults: true, serializer: authUserSerializer }
    )

    // Computed states
    const isAuthenticated = computed(() => !!authToken.value)
    const isUser = computed(() => authUser.value?.role === 'user' || authUser.value?.role === 'admin')
    const isAdmin = computed(() => authUser.value?.role === 'admin')

    // Sync token with API client
    watch(authToken, (newToken) => {
        apiClient.setToken(newToken)
    }, { immediate: true })

    // Listen to chrome storage changes to sync state across contexts (side panel, popup, background)
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            if (changes[STORAGE_KEYS.AUTH_TOKEN]) {
                const newValue = changes[STORAGE_KEYS.AUTH_TOKEN]?.newValue
                // Verify if value actually changed to avoid loop
                if (authToken.value !== newValue) {
                    authToken.value = (newValue as string) || null
                }
            }
            if (changes[STORAGE_KEYS.AUTH_USER]) {
                const newValue = changes[STORAGE_KEYS.AUTH_USER]?.newValue
                let parsedUser = null

                if (typeof newValue === 'string') {
                    try {
                        parsedUser = JSON.parse(newValue)
                    } catch {
                        parsedUser = null
                    }
                } else if (typeof newValue === 'object') {
                    parsedUser = newValue
                }

                // Prevent infinite loop by checking if value actually changed
                const currentStr = JSON.stringify(authUser.value)
                // newValue is already a string (from storage raw) or we stringify it if it's object?
                // Based on adapter, newValue from local.onChanged is likely the stored value (string).
                // But let's be safe and normalized.

                let newValueStr = ''
                if (typeof newValue === 'string') {
                    newValueStr = newValue
                } else {
                    newValueStr = JSON.stringify(newValue)
                }

                // If the stored string (newValue) matches our current state stringified, skip update
                if (currentStr === newValueStr) {
                    return
                }

                authUser.value = parsedUser
            }
        }
    })

    return {
        // State
        authToken,
        authUser,

        // Computed
        isAuthenticated,
        isUser,
        isAdmin,
    }
}

/**
 * Get authentication state synchronously (for background script)
 */
export async function getAuthState(): Promise<{ token: string | null; user: UserProfile | null }> {
    const result = await chrome.storage.local.get([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.AUTH_USER,
    ])

    const token: string | null = (result[STORAGE_KEYS.AUTH_TOKEN] as string | undefined) || null
    let user: UserProfile | null = null

    // Parse if stored as JSON string
    const rawUser = result[STORAGE_KEYS.AUTH_USER]
    if (typeof rawUser === 'string') {
        try {
            user = JSON.parse(rawUser) as UserProfile
        } catch {
            user = null
        }
    } else if (rawUser && typeof rawUser === 'object') {
        user = rawUser as UserProfile
    }

    return { token, user }
}

/**
 * Set authentication state
 */
export async function setAuthState(token: string | null, user: UserProfile | null): Promise<void> {
    if (token && user) {
        await chrome.storage.local.set({
            [STORAGE_KEYS.AUTH_TOKEN]: token,
            [STORAGE_KEYS.AUTH_USER]: JSON.stringify(user),
        })
        apiClient.setToken(token)
    } else {
        await chrome.storage.local.remove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.AUTH_USER,
        ])
        apiClient.setToken(null)
    }
}

/**
 * Clear authentication state (logout)
 */
export async function clearAuthState(): Promise<void> {
    await setAuthState(null, null)
}
