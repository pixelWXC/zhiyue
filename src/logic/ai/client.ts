import { GoogleGenAI } from '@google/genai'
import { ANALYSIS_SYSTEM_PROMPT } from '../prompts/analysis'

// Strict user-mandated model constants
export const MODEL_NAMES = {
    FLASH: 'gemini-3-flash-preview',
    PRO_THINKING: 'gemini-3-pro-preview',
    IMAGE: 'gemini-3-pro-image-preview'
} as const

/**
 * Initialize the GenAI Client
 */
export function getClient(apiKey: string) {
    return new GoogleGenAI({ apiKey })
}

/**
 * Generate a streaming analysis using strict user-defined models
 * @param apiKey User API key
 * @param text Text to analyze
 * @param mode 'flash' for speed (gemini-3-flash), 'thinking' for depth (gemini-3-pro-thinking)
 */
export async function createAnalysisStream(apiKey: string, text: string, mode: 'flash' | 'thinking' = 'thinking') {
    const ai = getClient(apiKey)

    // Select model strictly based on user rules
    const model = mode === 'flash' ? MODEL_NAMES.FLASH : MODEL_NAMES.PRO_THINKING

    // Configure specific parameters for thinking models
    const config: any = {}

    if (mode === 'thinking') {
        config.thinkingConfig = {
            thinkingLevel: "low" // Start with low for standard analysis
        }
    }

    return await ai.models.generateContentStream({
        model,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: ANALYSIS_SYSTEM_PROMPT },
                    { text: `Please analyze this text: "${text}"` }
                ]
            }
        ],
        config
    })
}
