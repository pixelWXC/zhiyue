/**
 * Card Generation Service
 * Generates flashcard content using Gemini AI
 */

import { getClient, MODEL_NAMES } from './client'
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
    const ai = getClient(apiKey)

    // Select model based on options (Flash for speed, Pro for quality)
    const model = modelChoice === 'pro' ? MODEL_NAMES.PRO_THINKING : MODEL_NAMES.FLASH

    // Performance monitoring
    const perfStart = enablePerfLog ? performance.now() : 0

    try {
        // Load dynamic prompt
        const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.CARD_GEN_SYSTEM)

        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: systemPrompt },
                        { text: CARD_GEN_USER_PROMPT(sentence, targetToken?.word) }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json' // Hint for JSON mode
            }
        })

        const rawText = response.text || ''

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
