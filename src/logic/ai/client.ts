import { GoogleGenAI } from '@google/genai'
import { ANALYSIS_SYSTEM_PROMPT } from '../prompts/analysis'
import { QA_SYSTEM_PROMPT, QA_USER_PROMPT } from '../prompts/qa'
import { OCR_PROMPT } from '../prompts/ocr'
import { SYNTAX_ANALYSIS_SYSTEM_PROMPT } from '../prompts/syntax-analysis'

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

/**
 * Generate a Q&A answer stream
 */
export async function createQaStream(apiKey: string, sentence: string, token: string, question: string) {
    const ai = getClient(apiKey)
    const model = MODEL_NAMES.FLASH // Use Flash for Q&A speed

    return await ai.models.generateContentStream({
        model,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: QA_SYSTEM_PROMPT },
                    { text: QA_USER_PROMPT(sentence, token, question) }
                ]
            }
        ]
    })
}

/**
 * Recognize Japanese text from an image using Gemini Vision
 * @param apiKey User API key
 * @param base64Image Base64-encoded image data (without data:image/... prefix)
 * @param mimeType Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns Extracted Japanese text
 */
export async function recognizeTextFromImage(apiKey: string, base64Image: string, mimeType: string): Promise<string> {
    const ai = getClient(apiKey)
    const model = MODEL_NAMES.FLASH // Use Flash for cost efficiency

    const response = await ai.models.generateContent({
        model,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64Image
                        }
                    },
                    { text: OCR_PROMPT }
                ]
            }
        ]
    })

    return response.text || ''
}

/**
 * Generate a deep syntax analysis stream using Thinking Mode
 * @param apiKey User API key
 * @param text Text to analyze
 */
export async function createSyntaxStream(apiKey: string, text: string) {
    const ai = getClient(apiKey)
    const model = MODEL_NAMES.PRO_THINKING

    // High thinking level for deep structural analysis
    const config: any = {
        thinkingConfig: {
            thinkingLevel: "high",
            includeThoughts: false // We only want the final JSON
        },
        responseMimeType: 'application/json' // Enforce JSON mode if supported or just helps hint
    }

    return await ai.models.generateContentStream({
        model,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: SYNTAX_ANALYSIS_SYSTEM_PROMPT },
                    { text: `Analyze this sentence: "${text}"` }
                ]
            }
        ],
        config
    })
}
