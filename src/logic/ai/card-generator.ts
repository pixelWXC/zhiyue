/**
 * Card Generation Service
 * Generates flashcard content using Gemini AI
 */

import { getProviderForScene, MODEL_NAMES } from './client'
import { CARD_GEN_USER_PROMPT } from '../prompts/card-gen'
import { promptService, PROMPT_KEYS } from '../prompts/prompt-service'
import type { FlashcardData } from '../../types/card'
import { jsonrepair } from 'jsonrepair'
import type { Token } from '../../stores/ai-store'

/**
 * Error messages for card generation
 * Centralized for easier maintenance and potential i18n
 */
const ERROR_MESSAGES = {
    EMPTY_RESPONSE: 'AI 返回了空响应',
    PARSE_FAILED: '无法解析 AI 返回的数据格式',
    MISSING_FIELD: (field: string) => `生成的卡片数据缺少必需字段: ${field}`,
    GENERATION_FAILED: '卡片生成失败'
} as const

/**
 * Configuration options for card generation
 */
export interface CardGenerationOptions {
    /** AI model to use (defaults to FLASH for speed) */
    model?: 'flash' | 'pro'
    /** Enable performance logging */
    enablePerfLog?: boolean
}

/**
 * Generate flashcard content from sentence and optional target token
 * 
 * @param apiKey - User's Gemini API key for authentication
 * @param sentence - The full example sentence to generate card from
 * @param targetToken - Optional specific token to focus the card on
 * @param options - Configuration options for generation behavior
 * @returns Promise resolving to complete FlashcardData with all required fields
 * @throws Error if API call fails, response is empty, or required fields are missing
 * 
 * @example
 * ```typescript
 * const card = await generateCardContent(
 *   'your-api-key',
 *   '猫がりんごを食べる',
 *   { word: '食べる', reading: 'たべる', romaji: 'taberu', pos: '動詞' },
 *   { model: 'flash', enablePerfLog: true }
 * )
 * ```
 */
export async function generateCardContent(
    apiKey: string,
    sentence: string,
    targetToken?: Token,
    options: CardGenerationOptions = {}
): Promise<FlashcardData> {
    const { model: modelChoice = 'flash', enablePerfLog = false } = options

    // Select model logic is now handled by provider/scene service preference, 
    // but here we override via scene selection if needed.
    // 'pro' maps to 'quality', 'flash' maps to 'speed'
    const scene = modelChoice === 'pro' ? 'quality' : 'speed'
    const provider = await getProviderForScene(apiKey, scene)

    // Select model based on options (Flash for speed, Pro for quality)
    const model = modelChoice === 'pro' ? MODEL_NAMES.PRO_THINKING : MODEL_NAMES.FLASH

    // Performance monitoring
    const perfStart = enablePerfLog ? performance.now() : 0

    try {
        // Load dynamic prompt
        const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.CARD_GEN_SYSTEM)

        const rawText = await provider.generate(
            CARD_GEN_USER_PROMPT(sentence, targetToken?.word),
            {
                systemPrompt,
                responseFormat: 'json',
                thinkingLevel: modelChoice === 'pro' ? 'low' : undefined
            }
        )

        if (!rawText.trim()) {
            throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE)
        }

        if (enablePerfLog) {
            console.log(`[Card Gen] API response received in ${(performance.now() - perfStart).toFixed(0)}ms`)
        }

        // Robust JSON parsing with repair
        let flashcardData: FlashcardData

        try {
            // Try direct parse first
            flashcardData = JSON.parse(rawText)
        } catch {
            // If direct parse fails, try repair
            try {
                const repaired = jsonrepair(rawText)
                flashcardData = JSON.parse(repaired)
            } catch (repairError) {
                console.error('[Card Gen] JSON parse error:', repairError)
                console.error('[Card Gen] Raw response:', rawText)
                throw new Error(ERROR_MESSAGES.PARSE_FAILED)
            }
        }

        // Validate required fields
        const requiredFields: (keyof FlashcardData)[] = [
            'targetWord',
            'reading',
            'sentence',
            'translation',
            'meaning',
            'hint',
            'sceneDescription'
        ]

        for (const field of requiredFields) {
            if (!flashcardData[field]) {
                throw new Error(ERROR_MESSAGES.MISSING_FIELD(field))
            }
        }

        if (enablePerfLog) {
            const totalTime = (performance.now() - perfStart).toFixed(0)
            console.log(`[Card Gen] ✅ Card generated successfully in ${totalTime}ms`)
            console.log(`[Card Gen] Model: ${model}, Target: ${targetToken?.word || 'auto-detect'}`)
        }

        return flashcardData

    } catch (error) {
        console.error('[Card Gen] ❌ Card generation failed:', error)
        throw error instanceof Error ? error : new Error(ERROR_MESSAGES.GENERATION_FAILED)
    }
}

/**
 * Generate sentence magic card image from Japanese sentence
 * Uses user-configured prompt template with sentence appended
 * @param apiKey - User's Gemini API key for authentication
 * @param sentence - The complete Japanese sentence to generate card image for
 * @returns Promise resolving to base64 data URL of the generated image
 * @throws Error if API call fails or prompt not configured
 * 
 * @example
 * ```typescript
 * const imageDataUrl = await generateSentenceImage(
 *   'your-api-key',
 *   '猫がりんごを食べる'
 * )
 * // imageDataUrl: "data:image/png;base64,iVBORw0K..."
 * ```
 */
export async function generateSentenceImage(
    apiKey: string,
    sentence: string
): Promise<string> {
    try {
        // Load user-configured prompt template (or default)
        const template = await promptService.getPrompt(PROMPT_KEYS.SENTENCE_CARD_IMAGE)

        // Import buildSentenceCardPrompt function
        const { buildSentenceCardPrompt } = await import('../prompts/sentence-card')

        // Build final prompt: template + sentence
        const finalPrompt = buildSentenceCardPrompt(template, sentence)

        // Call image generation AI service
        const { generateImage } = await import('./client')
        const imageDataUrl = await generateImage(apiKey, finalPrompt)

        return imageDataUrl

    } catch (error) {
        console.error('[Card Gen] ❌ Sentence image generation failed:', error)
        throw error instanceof Error ? error : new Error('整句卡片图片生成失败')
    }
}

/**
 * Generate word magic card image from word context
 * @param apiKey - User's Gemini API key for authentication
 * @param context - Word context including word, pronunciation, meaning, and sentence
 * @returns Promise resolving to base64 data URL of the generated image
 * @throws Error if API call fails
 */
export async function generateWordImage(
    apiKey: string,
    context: import('../prompts/word-card').WordContext
): Promise<string> {
    try {
        // Load user-configured prompt template (or default)
        const template = await promptService.getPrompt(PROMPT_KEYS.WORD_CARD_IMAGE)

        // Import builder
        const { buildWordCardPrompt } = await import('../prompts/word-card')

        // Build prompt
        const finalPrompt = buildWordCardPrompt(template, context)

        // Call image generation AI service
        const { generateImage } = await import('./client')
        const imageDataUrl = await generateImage(apiKey, finalPrompt)

        return imageDataUrl

    } catch (error) {
        console.error('[Card Gen] ❌ Word image generation failed:', error)
        throw error instanceof Error ? error : new Error('单词卡片图片生成失败')
    }
}
