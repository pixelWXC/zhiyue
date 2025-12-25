/**
 * AI Service Layer
 * Google GenAI SDK wrapper for Gemini API calls
 * 
 * This is a skeleton - full implementation in future stories
 */

export interface AIClientConfig {
    apiKey: string
    model: 'gemini-1.5-flash' | 'gemini-1.5-pro'
}

/**
 * Initialize AI client (placeholder)
 * Future implementation will use @google/generative-ai SDK
 */
export function createAIClient(config: AIClientConfig) {
    console.log('AI Client initialized with model:', config.model)

    return {
        analyzeText: async (text: string) => {
            // Placeholder - will be implemented in Story 1-4
            return { result: 'Analysis placeholder', tokens: 0 }
        },

        analyzeImage: async (imageData: string) => {
            // Placeholder - will be implemented in Story 1-8
            return { text: 'OCR placeholder', result: 'Analysis placeholder' }
        },
    }
}
