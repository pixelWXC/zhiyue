/**
 * Settings Store
 * Manages user preferences and API keys
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettings } from '@/logic/storage'
import type { UserSettings } from '@/types/shim'

export const useSettingsStore = defineStore('settings', () => {
    // Reactive storage composables
    const storage = useSettings()

    // Computed getters
    const hasApiKey = computed(() => !!storage.apiKey.value)

    const isDarkMode = computed(() => {
        if (storage.theme.value === 'dark') return true
        if (storage.theme.value === 'light') return false
        // Auto mode: detect system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    // Actions
    async function setApiKey(key: string) {
        storage.apiKey.value = key
    }

    async function setTheme(theme: 'light' | 'dark' | 'auto') {
        storage.theme.value = theme
    }

    async function toggleAutoCapture() {
        storage.autoCapture.value = !storage.autoCapture.value
    }

    return {
        // State
        apiKey: storage.apiKey,
        theme: storage.theme,
        autoCapture: storage.autoCapture,
        preferredModel: storage.preferredModel,

        // Getters
        hasApiKey,
        isDarkMode,

        // Actions
        setApiKey,
        setTheme,
        toggleAutoCapture,
    }
})
