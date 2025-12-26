/**
 * AI Store
 * Manages AI request/response state and streaming
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jsonrepair } from 'jsonrepair'

export interface Token {
    word: string
    reading: string
    romaji: string
    pos: string
    meaning?: string // Optional for future or 2nd stage
}

export interface AnalysisData {
    tokens: Token[]
    translation?: string
}

export interface AnalysisResult {
    id: string
    text: string
    result: string // Raw JSON string
    data?: AnalysisData // Parsed data
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
    const parsedData = ref<AnalysisData | null>(null)

    // Getters
    const hasHistory = computed(() => history.value.length > 0)
    const lastResult = computed(() => history.value[0])

    // Actions
    function setLoading(loading: boolean) {
        isLoading.value = loading
        if (!loading) {
            isStreaming.value = false
            streamingText.value = ''
            parsedData.value = null
        }
    }

    function setError(err: string | null) {
        error.value = err
    }

    function startStreaming() {
        isStreaming.value = true
        streamingText.value = ''
        parsedData.value = null
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

    // Main Analysis Action with Port connection
    async function analyzeText(text: string) {
        if (!text.trim()) return

        isLoading.value = true
        isStreaming.value = true
        streamingText.value = ''
        parsedData.value = { tokens: [] } // Initialize empty
        error.value = null

        // Explicitly type the port to avoid null checks logic flow issues, though initialization is null
        let port: chrome.runtime.Port | null = null

        try {
            port = chrome.runtime.connect({ name: 'ai-stream' })

            port.onMessage.addListener((msg) => {
                if (msg.error) {
                    error.value = msg.error
                    isLoading.value = false
                    isStreaming.value = false
                    port?.disconnect()
                } else if (msg.chunk) {
                    streamingText.value += msg.chunk

                    // Attempt to repair and parse JSON
                    try {
                        const repaired = jsonrepair(streamingText.value)
                        const parsed = JSON.parse(repaired)

                        if (Array.isArray(parsed)) {
                            // Handle array response (User Prompt Format)
                            // Map prompt keys to internal store interface
                            parsedData.value = {
                                tokens: parsed.map((t: any) => ({
                                    word: t.word,
                                    reading: t.furigana || t.reading || '', // Map furigana to reading
                                    romaji: t.romaji || '',
                                    pos: t.pos,
                                    meaning: t.meaning
                                }))
                            }
                        } else if (parsed && Array.isArray(parsed.tokens)) {
                            // Handle object response (Legacy/Alternative)
                            parsedData.value = parsed
                        }
                    } catch (e) {
                        // Silent failure on partial JSON
                    }

                } else if (msg.done) {
                    isLoading.value = false
                    isStreaming.value = false

                    // Final parse attempt
                    let finalData: AnalysisData = { tokens: [] }
                    try {
                        const repaired = jsonrepair(streamingText.value)
                        const parsed = JSON.parse(repaired)

                        if (Array.isArray(parsed)) {
                            finalData = {
                                tokens: parsed.map((t: any) => ({
                                    word: t.word,
                                    reading: t.furigana || t.reading || '',
                                    romaji: t.romaji || '',
                                    pos: t.pos,
                                    meaning: t.meaning
                                }))
                            }
                        } else if (parsed && Array.isArray(parsed.tokens)) {
                            finalData = parsed
                        }
                        parsedData.value = finalData
                    } catch (e) {
                        console.error('Final parse failed', e)
                    }

                    // Save result
                    const result: AnalysisResult = {
                        id: Date.now().toString(),
                        text: text,
                        result: streamingText.value,
                        data: finalData,
                        timestamp: Date.now(),
                        mode: 'pro' // Defaulting to pro for this flow
                    }
                    currentResult.value = result
                    history.value.unshift(result)
                    port?.disconnect()
                }
            })

            // Send initial request
            port.postMessage({ action: 'analyze', text })

        } catch (e) {
            console.error('Connection failed', e)
            error.value = (e as Error).message
            isLoading.value = false
            isStreaming.value = false
        }
    }

    return {
        // State
        isLoading,
        currentResult,
        history,
        error,
        streamingText,
        isStreaming,
        parsedData,

        // Getters
        hasHistory,
        lastResult,

        // Actions
        analyzeText,
        setLoading,
        setError,
        startStreaming,
        appendStreamChunk,
        finishStreaming,
        clearHistory,
        removeFromHistory,
    }
})
