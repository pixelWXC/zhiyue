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

    return {
        apiKey,
        theme,
        autoCapture,
        preferredModel,
    }
}

/**
 * Get all settings as plain object
 */
export async function getSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(Object.values(STORAGE_KEYS))
    return {
        apiKey: (result[STORAGE_KEYS.API_KEY] as string | undefined),
        theme: (result[STORAGE_KEYS.THEME] as 'light' | 'dark' | 'auto' | undefined) ?? 'auto',
        autoCapture: (result[STORAGE_KEYS.AUTO_CAPTURE] as boolean | undefined) ?? true,
        preferredModel: (result[STORAGE_KEYS.PREFERRED_MODEL] as 'flash' | 'pro' | undefined) ?? 'flash',
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
