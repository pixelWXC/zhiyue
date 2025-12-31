import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAiStore } from '../ai-store'
import type { FlashcardData } from '../../types/card'

// Mock VueUse's useClipboard
const mockCopy = vi.fn().mockResolvedValue(undefined)
const mockIsSupported = { value: true }

vi.mock('@vueuse/core', () => ({
    useClipboard: () => ({
        copy: mockCopy,
        isSupported: mockIsSupported
    })
}))

// Mock the formatter
vi.mock('../../logic/anki/exporter', () => ({
    formatDataForAnki: vi.fn((data, imageSrc) => {
        return `mocked_tsv_${data.targetWord}_${imageSrc ? 'with_image' : 'no_image'}`
    })
}))

describe('AI Store - Copy Card to Clipboard', () => {
    beforeEach(() => {
        // Create a fresh pinia instance for each test
        setActivePinia(createPinia())
        // Reset mock call counts
        mockCopy.mockClear()
    })

    const mockCardData: FlashcardData = {
        targetWord: '食べる',
        reading: 'たべる',
        sentence: '私は毎日朝ごはんを食べる。',
        meaning: 'to eat',
        hint: 'る-verb',
        sceneDescription: 'A person eating breakfast'
    }

    describe('copyCardToClipboard', () => {
        it('should copy card data to clipboard successfully when card data exists', async () => {
            const store = useAiStore()

            // Set card data
            store.cardData = mockCardData
            store.imageResult = null

            const result = await store.copyCardToClipboard()

            expect(result.success).toBe(true)
            expect(result.error).toBeUndefined()
            expect(mockCopy).toHaveBeenCalledTimes(1)
            expect(mockCopy).toHaveBeenCalledWith('mocked_tsv_食べる_no_image')
        })

        it('should copy card data with image when image exists', async () => {
            const store = useAiStore()

            // Set card data and image
            store.cardData = mockCardData
            store.imageResult = 'data:image/png;base64,test'

            const result = await store.copyCardToClipboard()

            expect(result.success).toBe(true)
            expect(mockCopy).toHaveBeenCalledTimes(1)
            expect(mockCopy).toHaveBeenCalledWith('mocked_tsv_食べる_with_image')
        })

        it('should return error when no card data exists', async () => {
            const store = useAiStore()

            // No card data set
            store.cardData = null

            const result = await store.copyCardToClipboard()

            expect(result.success).toBe(false)
            expect(result.error).toBe('没有可导出的卡片数据')
            expect(mockCopy).not.toHaveBeenCalled()
        })

        it('should call formatDataForAnki with correct parameters', async () => {
            const store = useAiStore()
            const { formatDataForAnki } = await import('../../logic/anki/exporter')

            store.cardData = mockCardData
            store.imageResult = 'data:image/png;base64,test'

            await store.copyCardToClipboard()

            expect(formatDataForAnki).toHaveBeenCalledWith(mockCardData, 'data:image/png;base64,test')
        })
    })
})
