/**
 * AI Store
 * Manages AI request/response state and streaming
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AnalysisResult {
    id: string
    text: string
    result: string
    tokens?: number
    timestamp: number
    mode: 'flash' | 'pro'
}

export const useAiStore = defineStore('ai', () => {
    // State
    const isLoading = ref(false)
    const currentResult = ref<AnalysisResult | null>(null)
    const history = ref<AnalysisResult[]>([])
    const error = ref<string | null>(null)

    // Streaming state
    const streamingText = ref('')
    const isStreaming = ref(false)

    // Getters
    const hasHistory = computed(() => history.value.length > 0)
    const lastResult = computed(() => history.value[0])

    // Actions
    function setLoading(loading: boolean) {
        isLoading.value = loading
        if (!loading) {
            isStreaming.value = false
            streamingText.value = ''
        }
    }

    function setError(err: string | null) {
        error.value = err
    }

    function startStreaming() {
        isStreaming.value = true
        streamingText.value = ''
    }

    function appendStreamChunk(chunk: string) {
        streamingText.value += chunk
    }

    function finishStreaming(result: AnalysisResult) {
        isStreaming.value = false
        currentResult.value = result
        history.value.unshift(result)
        streamingText.value = ''
    }

    function clearHistory() {
        history.value = []
    }

    function removeFromHistory(id: string) {
        history.value = history.value.filter(r => r.id !== id)
    }

    return {
        // State
        isLoading,
        currentResult,
        history,
        error,
        streamingText,
        isStreaming,

        // Getters
        hasHistory,
        lastResult,

        // Actions
        setLoading,
        setError,
        startStreaming,
        appendStreamChunk,
        finishStreaming,
        clearHistory,
        removeFromHistory,
    }
})
