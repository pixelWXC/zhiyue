/**
 * Unit tests for AI Store - Image Generation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAiStore } from '../ai-store'

// Mock storage
vi.mock('../../logic/storage', () => ({
    getSettings: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' })
}))

// Mock client
vi.mock('../../logic/ai/client', () => ({
    generateImage: vi.fn().mockResolvedValue('data:image/png;base64,mockbase64data')
}))

describe('AI Store - Image Generation', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('should have image generation state initialized', () => {
        const store = useAiStore()

        expect(store.isGeneratingImage).toBe(false)
        expect(store.imageResult).toBeNull()
        expect(store.imageError).toBeNull()
    })

    it('should generate card image successfully', async () => {
        const store = useAiStore()
        const mockScene = 'A cat eating an apple'

        await store.generateCardImage(mockScene)

        expect(store.imageResult).toBe('data:image/png;base64,mockbase64data')
        expect(store.isGeneratingImage).toBe(false)
        expect(store.imageError).toBeNull()
    })

    it('should handle empty scene description', async () => {
        const store = useAiStore()

        await store.generateCardImage('')

        expect(store.imageError).toBe('场景描述不能为空')
        expect(store.imageResult).toBeNull()
    })

    it('should handle generation errors', async () => {
        const store = useAiStore()

        // Mock error
        const { generateImage } = await import('../../logic/ai/client')
        vi.mocked(generateImage).mockRejectedValueOnce(new Error('API Error'))

        await store.generateCardImage('A cat')

        expect(store.imageError).toBe('API Error')
        expect(store.imageResult).toBeNull()
        expect(store.isGeneratingImage).toBe(false)
    })

    it('should clear image data', () => {
        const store = useAiStore()

        // Set some state
        store.imageResult = 'data:image/png;base64,test'
        store.imageError = 'Some error'

        store.clearImageData()

        expect(store.imageResult).toBeNull()
        expect(store.imageError).toBeNull()
        expect(store.isGeneratingImage).toBe(false)
    })

    it('should export generateCardImage action', () => {
        const store = useAiStore()
        expect(typeof store.generateCardImage).toBe('function')
    })

    it('should handle missing API key', async () => {
        const store = useAiStore()

        // Mock getSettings to return empty API key
        const { getSettings } = await import('../../logic/storage')
        vi.mocked(getSettings).mockResolvedValueOnce({
            apiKey: '',
            theme: 'auto',
            autoCapture: false,
            preferredModel: 'flash'
        })

        await store.generateCardImage('A cat eating an apple')

        expect(store.imageError).toContain('未配置 API Key')
        expect(store.imageResult).toBeNull()
        expect(store.isGeneratingImage).toBe(false)
    })
})
