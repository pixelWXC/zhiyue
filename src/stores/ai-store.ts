/**
 * AI Store
 * Manages AI request/response state and streaming
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jsonrepair } from 'jsonrepair'
import type { FlashcardData } from '../types/card'
import type { WordContext } from '../logic/prompts'
import { hasAnyApiKeyConfigured, getSettings } from '../logic/storage'

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

    // Card Generation State
    const cardData = ref<FlashcardData | null>(null)
    const isGeneratingCard = ref(false)
    const cardError = ref<string | null>(null)

    // Image Generation State
    const isGeneratingImage = ref(false)
    const imageResult = ref<string | null>(null) // Base64 data URL
    const imageError = ref<string | null>(null)

    // Sentence Card State
    const isSentenceCardGenerating = ref(false)
    const sentenceCardImage = ref<string | null>(null) // Base64 data URL
    const sentenceCardError = ref<string | null>(null)

    // Word Card State
    const isWordCardGenerating = ref(false)
    const wordCardImage = ref<string | null>(null) // Base64 data URL
    const wordCardError = ref<string | null>(null)

    // Rapid Services State
    const rapidTranslationText = ref('')
    const isRapidTranslating = ref(false)
    const rapidTranslationError = ref<string | null>(null)

    const tokenDetailData = ref<any>(null)
    const isTokenDetailLoading = ref(false)
    const tokenDetailError = ref<string | null>(null)

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
        cardData.value = null
        isGeneratingCard.value = false
        cardError.value = null
        imageResult.value = null
        isGeneratingImage.value = false
        imageError.value = null
    }

    /**
     * Load cached analysis result from quick analysis bubble
     * This avoids re-analyzing when sidebar opens with already complete results
     */
    function loadCachedResult(
        text: string,
        data: AnalysisData,
        rapidTranslation?: string
    ) {
        console.log('[AI Store] Loading cached analysis result')

        // Set the parsed data
        parsedData.value = data

        // Create and set the result object
        const result: AnalysisResult = {
            id: Date.now().toString(),
            text: text,
            result: JSON.stringify(data),
            data: data,
            timestamp: Date.now(),
            mode: 'flash' // Mark as from quick analysis
        }
        currentResult.value = result
        history.value.unshift(result)

        // Set rapid translation if provided
        if (rapidTranslation) {
            rapidTranslationText.value = rapidTranslation
        }

        // Reset any streaming/loading states
        isStreaming.value = false
        isLoading.value = false
        error.value = null
    }

    // Main Analysis Action with Port connection
    async function analyzeText(text: string) {
        if (!text.trim()) return

        isLoading.value = true
        isStreaming.value = true
        streamingText.value = ''
        parsedData.value = { tokens: [] } // Initialize empty
        error.value = null

        // Reset rapid translation state
        rapidTranslationText.value = ''
        rapidTranslationError.value = null
        isRapidTranslating.value = false

        // Trigger rapid translation in parallel (non-blocking)
        triggerRapidTranslation(text)

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

        // Reset token detail state
        tokenDetailData.value = null
        tokenDetailError.value = null

        // Trigger rapid token detail query if token is selected
        if (token?.word) {
            triggerTokenDetail(token.word)
        }
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

    // Card Generation Action
    async function generateCard(
        sentence: string,
        targetToken?: Token,
        options?: { model?: 'flash' | 'pro', enablePerfLog?: boolean }
    ) {
        if (!sentence.trim()) return

        isGeneratingCard.value = true
        cardData.value = null
        cardError.value = null

        try {
            // Check if any API key is configured
            if (!await hasAnyApiKeyConfigured()) {
                throw new Error('未配置 API Key，请先在设置中配置')
            }

            // Import and call card generator with options
            const { generateCardContent } = await import('../logic/ai/card-generator')
            const result = await generateCardContent(
                '', // apiKey 参数已废弃，由 getSceneService 内部处理
                sentence,
                targetToken,
                options
            )

            cardData.value = result

        } catch (e) {
            console.error('[AI Store] Card generation failed', e)
            cardError.value = (e as Error).message
        } finally {
            isGeneratingCard.value = false
        }
    }

    /**
     * Clear only card generation state
     * Useful when user wants to generate a new card without clearing analysis results
     */
    function clearCardData() {
        cardData.value = null
        isGeneratingCard.value = false
        cardError.value = null
    }

    /**
     * Generate flashcard illustration from scene description
     * @param sceneDescription Scene description to convert into an image
     */
    async function generateCardImage(sceneDescription: string) {
        if (!sceneDescription.trim()) {
            imageError.value = '场景描述不能为空'
            return
        }

        isGeneratingImage.value = true
        imageResult.value = null
        imageError.value = null

        try {
            // Check if any API key is configured
            if (!await hasAnyApiKeyConfigured()) {
                throw new Error('未配置 API Key，请先在设置中配置')
            }

            // Import and call image generation service
            const { generateImage } = await import('../logic/ai/client')
            const dataUrl = await generateImage('', sceneDescription) // apiKey 参数已废弃

            imageResult.value = dataUrl

        } catch (e) {
            console.error('[AI Store] Image generation failed', e)
            imageError.value = (e as Error).message
        } finally {
            isGeneratingImage.value = false
        }
    }

    /**
     * Clear only image generation state
     */
    function clearImageData() {
        imageResult.value = null
        isGeneratingImage.value = false
        imageError.value = null
    }

    /**
     * Rapid Translation Trigger (Parallel, Non-blocking)
     * Automatically triggered when text analysis starts
     */
    async function triggerRapidTranslation(text: string) {
        // Check if rapid translation is enabled
        const settings = await getSettings()

        if (!settings.rapidTranslation) {
            console.log('[Rapid Translation] Disabled by settings')
            return
        }

        isRapidTranslating.value = true
        rapidTranslationText.value = ''
        rapidTranslationError.value = null

        let port: chrome.runtime.Port | null = null

        try {
            port = chrome.runtime.connect({ name: 'ai-stream' })

            port.onMessage.addListener((msg) => {
                if (msg.error) {
                    rapidTranslationError.value = msg.error
                    isRapidTranslating.value = false
                    port?.disconnect()
                } else if (msg.chunk) {
                    rapidTranslationText.value += msg.chunk
                } else if (msg.done) {
                    isRapidTranslating.value = false
                    port?.disconnect()
                }
            })

            port.postMessage({ action: 'rapid-translation', text })

        } catch (error) {
            console.error('[Rapid Translation] Failed', error)
            rapidTranslationError.value = '快速翻译失败'
            isRapidTranslating.value = false
        }
    }

    /**
     * Token Detail Rapid Query Trigger
     * Automatically triggered when a token is selected
     */
    async function triggerTokenDetail(tokenWord: string) {
        // Check if rapid token detail is enabled
        const settings = await getSettings()

        if (!settings.rapidTokenDetail) {
            console.log('[Token Detail] Disabled by settings')
            return
        }

        isTokenDetailLoading.value = true
        tokenDetailData.value = null
        tokenDetailError.value = null

        let port: chrome.runtime.Port | null = null
        let fullResponse = ''

        try {
            port = chrome.runtime.connect({ name: 'ai-stream' })

            port.onMessage.addListener((msg) => {
                if (msg.error) {
                    tokenDetailError.value = msg.error
                    isTokenDetailLoading.value = false
                    port?.disconnect()
                } else if (msg.chunk) {
                    fullResponse += msg.chunk
                } else if (msg.done) {
                    isTokenDetailLoading.value = false

                    // Parse JSON response
                    try {
                        tokenDetailData.value = JSON.parse(fullResponse)
                    } catch (e) {
                        console.error('[Token Detail] Failed to parse JSON:', e)
                        tokenDetailError.value = '解析失败'
                    }

                    port?.disconnect()
                }
            })

            port.postMessage({ action: 'token-detail', token: tokenWord })

        } catch (error) {
            console.error('[Token Detail] Query failed', error)
            tokenDetailError.value = '查询失败'
            isTokenDetailLoading.value = false
        }
    }


    /**
     * Generate sentence magic card image
     * @param sentence - Japanese sentence to generate card for
     * @returns Promise resolving when generation completes
     */
    async function generateSentenceCard(sentence: string): Promise<void> {
        if (!sentence.trim()) {
            sentenceCardError.value = '句子不能为空'
            return
        }

        isSentenceCardGenerating.value = true
        sentenceCardImage.value = null
        sentenceCardError.value = null

        try {
            // Check if any API key is configured
            if (!await hasAnyApiKeyConfigured()) {
                throw new Error('未配置 API Key，请先在设置中配置')
            }

            // Import and call sentence card image generator
            const { generateSentenceImage } = await import('../logic/ai/card-generator')
            const imageDataUrl = await generateSentenceImage('', sentence) // apiKey 参数已废弃

            sentenceCardImage.value = imageDataUrl

        } catch (e) {
            console.error('[AI Store] Sentence card generation failed', e)
            sentenceCardError.value = (e as Error).message
        } finally {
            isSentenceCardGenerating.value = false
        }
    }

    /**
     * Clear sentence card generation state
     */
    function clearSentenceCard() {
        sentenceCardImage.value = null
        isSentenceCardGenerating.value = false
        sentenceCardError.value = null
    }

    /**
     * Generate word magic card image
     */
    async function generateWordCard(context: WordContext): Promise<void> {
        isWordCardGenerating.value = true
        wordCardImage.value = null
        wordCardError.value = null

        try {
            // Check if any API key is configured
            if (!await hasAnyApiKeyConfigured()) throw new Error('未配置 API Key，请先在设置中配置')

            const { generateWordImage } = await import('../logic/ai/card-generator')
            const imageDataUrl = await generateWordImage('', context) // apiKey 参数已废弃

            wordCardImage.value = imageDataUrl
        } catch (e) {
            console.error('[AI Store] Word card generation failed', e)
            wordCardError.value = (e as Error).message
        } finally {
            isWordCardGenerating.value = false
        }
    }

    function clearWordCard() {
        wordCardImage.value = null
        isWordCardGenerating.value = false
        wordCardError.value = null
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
        loadCachedResult,

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
        askQuestion,

        // Card Generation
        cardData,
        isGeneratingCard,
        cardError,
        generateCard,
        clearCardData,

        // Image Generation
        isGeneratingImage,
        imageResult,
        imageError,
        generateCardImage,
        clearImageData,

        // Rapid Services
        rapidTranslationText,
        isRapidTranslating,
        rapidTranslationError,
        tokenDetailData,
        isTokenDetailLoading,
        tokenDetailError,
        triggerRapidTranslation,
        triggerTokenDetail,

        // Sentence Card Generation
        isSentenceCardGenerating,
        sentenceCardImage,
        sentenceCardError,
        generateSentenceCard,
        clearSentenceCard,

        // Word Card
        isWordCardGenerating,
        wordCardImage,
        wordCardError,
        generateWordCard,
        clearWordCard
    }
})
