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

export interface SyntaxNode {
    token: string
    reading?: string
    partOfSpeech: string
    role: string
    children: SyntaxNode[]
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

    // Syntax State
    const syntaxData = ref<SyntaxNode | null>(null)
    const isSyntaxLoading = ref(false)

    // Q&A State
    const selectedToken = ref<Token | null>(null)
    const qaHistory = ref<{ question: string, answer: string }[]>([])
    const isQaStreaming = ref(false)
    const qaStreamText = ref('')

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

    function clearResults() {
        currentResult.value = null
        streamingText.value = ''
        parsedData.value = null
        error.value = null
        selectedToken.value = null
        qaHistory.value = []
        qaStreamText.value = ''
        isQaStreaming.value = false
        syntaxData.value = null
        isSyntaxLoading.value = false
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

    // Q&A Actions
    function selectToken(token: Token | null) {
        selectedToken.value = token
        qaHistory.value = [] // Reset chat when changing token (or keep it?) -> Let's reset for context switch
        qaStreamText.value = ''
        isQaStreaming.value = false
    }

    async function askQuestion(question: string) {
        if (!question.trim() || !currentResult.value) return

        isQaStreaming.value = true
        qaStreamText.value = ''

        let port: chrome.runtime.Port | null = null

        try {
            port = chrome.runtime.connect({ name: 'ai-stream' })

            port.onMessage.addListener((msg) => {
                if (msg.error) {
                    // Handle error (append to chat?)
                    qaStreamText.value = `❌ 错误: ${msg.error}`
                    isQaStreaming.value = false
                    port?.disconnect()
                } else if (msg.chunk) {
                    qaStreamText.value += msg.chunk
                } else if (msg.done) {
                    isQaStreaming.value = false
                    qaHistory.value.push({
                        question,
                        answer: qaStreamText.value
                    })
                    qaStreamText.value = ''
                    port?.disconnect()
                }
            })

            // Context construction
            const contextSentence = currentResult.value.text
            const contextToken = selectedToken.value?.word || '全文'

            port.postMessage({
                action: 'ask-question',
                sentence: contextSentence,
                token: contextToken,
                question
            })

        } catch (e) {
            console.error('QA Connection failed', e)
            qaStreamText.value = `❌ 连接失败: ${(e as Error).message}`
            isQaStreaming.value = false
        }
    }

    // Syntax Analysis Action
    async function analyzeSyntax(text: string) {
        if (!text.trim()) return

        isSyntaxLoading.value = true
        syntaxData.value = null
        error.value = null

        try {
            const { sendMessage } = await import('webext-bridge/popup')
            const response = await sendMessage('analyze-syntax', { text }, 'background')

            if (response.success && response.data) {
                syntaxData.value = response.data
            } else if (response.error) {
                error.value = response.error
            }
        } catch (e) {
            console.error('Syntax Analysis failed', e)
            error.value = (e as Error).message
        } finally {
            isSyntaxLoading.value = false
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
        clearResults,

        // Syntax
        syntaxData,
        isSyntaxLoading,
        analyzeSyntax,

        // Q&A
        selectedToken,
        qaHistory,
        isQaStreaming,
        qaStreamText,
        selectToken,
        askQuestion
    }
})
