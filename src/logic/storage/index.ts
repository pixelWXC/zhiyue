/**
 * Reactive storage abstraction using VueUse
 * Provides unified interface for chrome.storage.local with reactivity
 * 
 * Architecture Rule: All storage keys must be defined here to prevent collisions
 */

import { useStorageAsync } from '@vueuse/core'
import type { UserSettings } from '@/types/shim'

/**
 * Storage key namespace prefix
 */
const PREFIX = 'zhiyue:'

/**
 * Centralized storage keys
 */
export const STORAGE_KEYS = {
    API_KEY: `${PREFIX}apiKey`,
    THEME: `${PREFIX}theme`,
    AUTO_CAPTURE: `${PREFIX}autoCapture`,
    PREFERRED_MODEL: `${PREFIX}preferredModel`,
    HISTORY: `${PREFIX}history`,
    CARDS: `${PREFIX}cards`,
    RAPID_TRANSLATION: `${PREFIX}rapidTranslation`,
    RAPID_TOKEN_DETAIL: `${PREFIX}rapidTokenDetail`,
    SHOW_BUBBLE: `${PREFIX}showBubble`, // Story 4-7: 页面气泡显示开关
} as const

/**
 * Storage adapter for chrome.storage.local
 */
const chromeStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        const result = await chrome.storage.local.get(key)
        const value = result[key]
        // VueUse expects string or null
        if (value === undefined || value === null) return null
        if (typeof value === 'string') return value
        // For non-string values, serialize them
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
 * Reactive user settings
 */
export function useSettings() {
    const apiKey = useStorageAsync(
        STORAGE_KEYS.API_KEY,
        '',
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    const theme = useStorageAsync<'light' | 'dark' | 'auto'>(
        STORAGE_KEYS.THEME,
        'auto',
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    const autoCapture = useStorageAsync(
        STORAGE_KEYS.AUTO_CAPTURE,
        true,
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    const preferredModel = useStorageAsync<'flash' | 'pro'>(
        STORAGE_KEYS.PREFERRED_MODEL,
        'flash',
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    const rapidTranslation = useStorageAsync(
        STORAGE_KEYS.RAPID_TRANSLATION,
        true, // Default: enabled
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    const rapidTokenDetail = useStorageAsync(
        STORAGE_KEYS.RAPID_TOKEN_DETAIL,
        true, // Default: enabled
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    // Story 4-7: 页面气泡显示开关
    const showBubble = useStorageAsync(
        STORAGE_KEYS.SHOW_BUBBLE,
        true, // Default: enabled (显示气泡)
        chromeStorageAdapter,
        { mergeDefaults: true }
    )

    return {
        apiKey,
        theme,
        autoCapture,
        preferredModel,
        rapidTranslation,
        rapidTokenDetail,
        showBubble, // Story 4-7
    }
}

/**
 * Helper function to parse boolean value from storage
 * Handles both string ("true"/"false") and boolean values
 * This is necessary because VueUse's useStorageAsync serializes booleans as strings
 */
function parseBoolean(value: any, defaultValue: boolean = true): boolean {
    if (value === undefined || value === null) return defaultValue
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value !== 'false' && value !== '0'
    return Boolean(value)
}

/**
 * Get all settings as plain object
 */
export async function getSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(Object.values(STORAGE_KEYS))
    return {
        apiKey: (result[STORAGE_KEYS.API_KEY] as string | undefined),
        theme: (result[STORAGE_KEYS.THEME] as 'light' | 'dark' | 'auto' | undefined) ?? 'auto',
        autoCapture: parseBoolean(result[STORAGE_KEYS.AUTO_CAPTURE], true),
        preferredModel: (result[STORAGE_KEYS.PREFERRED_MODEL] as 'flash' | 'pro' | undefined) ?? 'flash',
        rapidTranslation: parseBoolean(result[STORAGE_KEYS.RAPID_TRANSLATION], true),
        rapidTokenDetail: parseBoolean(result[STORAGE_KEYS.RAPID_TOKEN_DETAIL], true),
        showBubble: parseBoolean(result[STORAGE_KEYS.SHOW_BUBBLE], true), // Story 4-7
    }
}

/**
 * Update settings
 */
export async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const updates: Record<string, any> = {}
    if (settings.apiKey !== undefined) updates[STORAGE_KEYS.API_KEY] = settings.apiKey
    if (settings.theme !== undefined) updates[STORAGE_KEYS.THEME] = settings.theme
    if (settings.autoCapture !== undefined) updates[STORAGE_KEYS.AUTO_CAPTURE] = settings.autoCapture
    if (settings.preferredModel !== undefined) updates[STORAGE_KEYS.PREFERRED_MODEL] = settings.preferredModel

    await chrome.storage.local.set(updates)
}
