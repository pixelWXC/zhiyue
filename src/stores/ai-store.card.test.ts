/**
 * AI Store - Card Generation Integration Tests
 * 
 * 测试 Store 与 Card Generator Service 的集成
 * 
 * 使用方法：
 * pnpm test src/stores/ai-store.card.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAiStore } from './ai-store'
import type { FlashcardData } from '../types/card'

// Mock storage
vi.mock('../logic/storage', () => ({
    getSettings: vi.fn(async () => ({
        apiKey: 'test-api-key',
        theme: 'auto' as const,
        autoCapture: true,
        preferredModel: 'flash' as const
    }))
}))

// Mock card generator
vi.mock('../logic/ai/card-generator', () => ({
    generateCardContent: vi.fn()
}))

describe('AI Store - Card Generation', () => {
    beforeEach(async () => {
        setActivePinia(createPinia())
        vi.clearAllMocks()

        // Reset storage mock to default success state
        const { getSettings } = await import('../logic/storage')
            ; (getSettings as any).mockResolvedValue({
                apiKey: 'test-api-key',
                theme: 'auto',
                autoCapture: true,
                preferredModel: 'flash'
            })
    })

    describe('初始状态', () => {
        it('cardData 应该初始为 null', () => {
            const store = useAiStore()
            expect(store.cardData).toBeNull()
        })

        it('isGeneratingCard 应该初始为 false', () => {
            const store = useAiStore()
            expect(store.isGeneratingCard).toBe(false)
        })

        it('cardError 应该初始为 null', () => {
            const store = useAiStore()
            expect(store.cardError).toBeNull()
        })
    })

    describe('generateCard action', () => {
        it('应该成功生成卡片并更新状态', async () => {
            const store = useAiStore()

            const mockCardData: FlashcardData = {
                targetWord: '食べる',
                reading: 'たべる',
                sentence: '猫がりんごを食べる',
                meaning: '吃',
                hint: '表示进食动作',
                sceneDescription: 'Minimalist hand-drawn sketch on white background'
            }

            const { generateCardContent } = await import('../logic/ai/card-generator')
                ; (generateCardContent as any).mockResolvedValue(mockCardData)

            await store.generateCard('猫がりんごを食べる')

            expect(store.cardData).toEqual(mockCardData)
            expect(store.isGeneratingCard).toBe(false)
            expect(store.cardError).toBeNull()
        })

        it('应该在生成过程中设置 loading 状态', async () => {
            const store = useAiStore()

            const { generateCardContent } = await import('../logic/ai/card-generator')
                ; (generateCardContent as any).mockImplementation(
                    () => new Promise(resolve => setTimeout(resolve, 100))
                )

            const promise = store.generateCard('テスト')

            expect(store.isGeneratingCard).toBe(true)
            expect(store.cardData).toBeNull()

            await promise

            expect(store.isGeneratingCard).toBe(false)
        })

        it('应该在错误时设置 cardError', async () => {
            const store = useAiStore()

            const { generateCardContent } = await import('../logic/ai/card-generator')
                ; (generateCardContent as any).mockRejectedValue(
                    new Error('API 调用失败')
                )

            await store.generateCard('エラーテスト')

            expect(store.cardError).toBe('API 调用失败')
            expect(store.cardData).toBeNull()
            expect(store.isGeneratingCard).toBe(false)
        })

        it('应该在空句子时不执行生成', async () => {
            const store = useAiStore()

            const { generateCardContent } = await import('../logic/ai/card-generator')

            await store.generateCard('   ')

            expect(generateCardContent).not.toHaveBeenCalled()
        })

        it('应该在没有 API Key 时抛出错误', async () => {
            const { getSettings } = await import('../logic/storage')
                ; (getSettings as any).mockResolvedValue({
                    apiKey: '',
                    theme: 'auto',
                    autoCapture: true,
                    preferredModel: 'flash'
                })

            const store = useAiStore()
            await store.generateCard('テスト')

            expect(store.cardError).toContain('未配置 API Key')
        })

        it('应该支持传入目标词汇', async () => {
            const store = useAiStore()

            const mockCardData: FlashcardData = {
                targetWord: '食べる',
                reading: 'たべる',
                sentence: '猫がりんごを食べる',
                meaning: '吃',
                hint: '动词',
                sceneDescription: 'Test scene'
            }

            const { generateCardContent } = await import('../logic/ai/card-generator')
                ; (generateCardContent as any).mockResolvedValue(mockCardData)

            const targetToken = {
                word: '食べる',
                reading: 'たべる',
                romaji: 'taberu',
                pos: '動詞'
            }

            await store.generateCard('猫がりんごを食べる', targetToken)

            expect(generateCardContent).toHaveBeenCalledWith(
                'test-api-key',
                '猫がりんごを食べる',
                targetToken
            )
        })
    })

    describe('clearResults action', () => {
        it('应该清除卡片生成相关的所有状态', async () => {
            const store = useAiStore()

            // 先设置一些状态
            const mockCardData: FlashcardData = {
                targetWord: '食べる',
                reading: 'たべる',
                sentence: '猫がりんごを食べる',
                meaning: '吃',
                hint: '动词',
                sceneDescription: 'Test'
            }

            const { generateCardContent } = await import('../logic/ai/card-generator')
                ; (generateCardContent as any).mockResolvedValue(mockCardData)

            await store.generateCard('テスト')

            expect(store.cardData).not.toBeNull()

            // 清除状态
            store.clearResults()

            expect(store.cardData).toBeNull()
            expect(store.isGeneratingCard).toBe(false)
            expect(store.cardError).toBeNull()
        })
    })
})
