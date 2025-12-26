/**
 * Settings Store
 * Manages user preferences and API keys
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendMessage } from 'webext-bridge/popup'
import { useSettings } from '@/logic/storage'

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

    // State for validation UI
    const validationStatus = ref<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
    const validationError = ref('')

    // Actions
    async function setApiKey(key: string) {
        storage.apiKey.value = key
        // Reset validation status when manually setting (unless we want to force validate)
        validationStatus.value = 'idle'
    }

    async function validateAndSaveApiKey(key: string) {
        if (!key) return

        validationStatus.value = 'validating'
        validationError.value = ''

        try {
            const result = await sendMessage('validate-api-key', { apiKey: key }, 'background')

            if (result.valid) {
                validationStatus.value = 'valid'
                storage.apiKey.value = key // Save only if valid
            } else {
                validationStatus.value = 'invalid'
                validationError.value = result.error || 'Invalid API Key'
            }
        } catch (e) {
            validationStatus.value = 'invalid'
            validationError.value = (e as Error).message
        }
    }

    async function setTheme(theme: 'light' | 'dark' | 'auto') {
        storage.theme.value = theme
    }

    async function toggleAutoCapture() {
        const currentValue = storage.autoCapture.value
        storage.autoCapture.value = !currentValue
    }

    return {
        // State
        apiKey: storage.apiKey,
        theme: storage.theme,
        autoCapture: storage.autoCapture,
        preferredModel: storage.preferredModel,
        validationStatus,
        validationError,

        // Getters
        hasApiKey,
        isDarkMode,

        // Actions
        setApiKey,
        validateAndSaveApiKey,
        setTheme,
        toggleAutoCapture,
    }
})
