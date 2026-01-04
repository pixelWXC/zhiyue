import { GoogleGenAI } from '@google/genai'
import { QA_USER_PROMPT } from '../prompts/qa'
import { promptService, PROMPT_KEYS } from '../prompts/prompt-service'

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

    // Load dynamic prompt
    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)

    return await ai.models.generateContentStream({
        model,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: systemPrompt },
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

    // Load dynamic prompt
    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.QA_SYSTEM)

    return await ai.models.generateContentStream({
        model,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: systemPrompt },
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

    // Load dynamic prompt
    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.OCR)

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
                    { text: systemPrompt }
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

    // Load dynamic prompt
    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.SYNTAX_ANALYSIS_SYSTEM)

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
                    { text: systemPrompt },
                    { text: `Analyze this sentence: "${text}"` }
                ]
            }
        ],
        config
    })
}

/**
 * Generate an illustration from a scene description
 * @param apiKey User API key (must not be empty)
 * @param sceneDescription Scene description to convert into an image (must not be empty)
 * @returns Base64 data URL for the generated image (format: data:image/[type];base64,...)
 * @throws {Error} 场景描述不能为空 - if sceneDescription is empty or whitespace
 * @throws {Error} API Key 不能为空 - if apiKey is empty or whitespace
 * @throws {Error} 图像生成失败：API 未返回图像数据 - if no image data in response
 * @throws {Error} API errors (quota exceeded, network errors, invalid prompts, etc.)
 */
export async function generateImage(apiKey: string, sceneDescription: string): Promise<string> {
    // Input validation (defensive programming)
    if (!apiKey?.trim()) {
        throw new Error('API Key 不能为空')
    }
    if (!sceneDescription?.trim()) {
        throw new Error('场景描述不能为空')
    }

    const ai = getClient(apiKey)
    const model = MODEL_NAMES.IMAGE // gemini-3-pro-image-preview

    try {
        const response = await ai.models.generateContent({
            model,
            contents: sceneDescription
        })

        // Extract inline image data from response
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0]
            const parts = candidate.content?.parts

            if (parts) {
                for (const part of parts) {
                    if (part.inlineData) {
                        // Return as data URL for direct use in <img> src
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    }
                }
            }
        }

        // No image data found in response
        throw new Error('图像生成失败：API 未返回图像数据')

    } catch (error) {
        console.error('[AI Client] Image generation failed:', error)
        throw error instanceof Error ? error : new Error('图像生成失败')
    }
}

