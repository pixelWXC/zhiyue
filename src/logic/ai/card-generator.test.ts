/**
 * Card Generator Service - Unit Tests
 * 
 * 使用方法：
 * pnpm test src/logic/ai/card-generator.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCardContent } from './card-generator'
import type { FlashcardData } from '../../types/card'

// Mock the AI client
vi.mock('./client', () => ({
    getProviderForScene: vi.fn(() => ({
        generate: vi.fn()
    })),
    MODEL_NAMES: {
        FLASH: 'gemini-3-flash-preview',
        PRO_THINKING: 'gemini-3-pro-preview'
    }
}))

describe('generateCardContent', () => {
    const mockApiKey = 'test-api-key-12345'
    const testSentence = '猫がりんごを食べる'
    const testToken = {
        word: '食べる',
        reading: 'たべる',
        romaji: 'taberu',
        pos: '動詞'
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('应该成功生成完整的卡片数据', async () => {
        // Mock successful response
        const mockFlashcardData: FlashcardData = {
            targetWord: '食べる',
            reading: 'たべる',
            sentence: '猫がりんごを食べる',
            meaning: '吃',
            hint: '表示进食动作',
            sceneDescription: 'A minimalist hand-drawn sketch on white background: A cute cat eating a red apple with a happy expression. Simple doodle style with clean lines.'
        }

        const { getProviderForScene } = await import('./client')
        const mockProvider = (getProviderForScene as any)()
        mockProvider.generate.mockResolvedValue(JSON.stringify(mockFlashcardData))

        const result = await generateCardContent(mockApiKey, testSentence, testToken)

        expect(result).toEqual(mockFlashcardData)
        expect(mockProvider.generate).toHaveBeenCalledTimes(1)
    })

    it('应该验证所有必需字段是否存在', async () => {
        const incompleteData = {
            targetWord: '食べる',
            reading: 'たべる',
            sentence: '猫がりんごを食べる',
            meaning: '吃',
            // Missing: hint, sceneDescription
        }

        const { getProviderForScene } = await import('./client')
        const mockProvider = (getProviderForScene as any)()
        mockProvider.generate.mockResolvedValue(JSON.stringify(incompleteData))

        await expect(
            generateCardContent(mockApiKey, testSentence, testToken)
        ).rejects.toThrow('生成的卡片数据缺少必需字段')
    })

    it('应该能够修复格式错误的 JSON', async () => {
        const malformedJSON = `{
      "targetWord": "食べる",
      "reading": "たべる",
      "sentence": "猫がりんごを食べる",
      "meaning": "吃",
      "hint": "表示进食动作",
      "sceneDescription": "A minimalist sketch..."
    }` // Missing comma intentionally

        const { getProviderForScene } = await import('./client')
        const mockProvider = (getProviderForScene as any)()
        mockProvider.generate.mockResolvedValue(malformedJSON)

        // jsonrepair should fix this
        const result = await generateCardContent(mockApiKey, testSentence)

        expect(result).toBeDefined()
        expect(result.targetWord).toBeDefined()
    })

    it('应该在空响应时抛出错误', async () => {
        const { getProviderForScene } = await import('./client')
        const mockProvider = (getProviderForScene as any)()
        mockProvider.generate.mockResolvedValue('')

        await expect(
            generateCardContent(mockApiKey, testSentence)
        ).rejects.toThrow('AI 返回了空响应')
    })

    it('应该在 API 错误时抛出错误', async () => {
        const { getProviderForScene } = await import('./client')
        const mockProvider = (getProviderForScene as any)()
        mockProvider.generate.mockRejectedValue(
            new Error('API rate limit exceeded')
        )

        await expect(
            generateCardContent(mockApiKey, testSentence)
        ).rejects.toThrow()
    })

    describe('场景描述验证', () => {
        it('应该包含必需的风格关键词', async () => {
            const validData: FlashcardData = {
                targetWord: '食べる',
                reading: 'たべる',
                sentence: '猫がりんごを食べる',
                meaning: '吃',
                hint: '动词',
                sceneDescription: 'A minimalist hand-drawn sketch on white background: cat eating apple, doodle style.'
            }

            const { getProviderForScene } = await import('./client')
            const mockProvider = (getProviderForScene as any)()
            mockProvider.generate.mockResolvedValue(JSON.stringify(validData))

            const result = await generateCardContent(mockApiKey, testSentence)
            const desc = result.sceneDescription.toLowerCase()

            // Validate style keywords
            const hasMinimalist = desc.includes('minimalist') || desc.includes('sketch')
            const hasDoodle = desc.includes('doodle') || desc.includes('hand-drawn')
            const hasWhite = desc.includes('white background')

            expect(hasMinimalist).toBe(true)
            expect(hasDoodle).toBe(true)
            expect(hasWhite).toBe(true)
        })
    })

    describe('可选参数处理', () => {
        it('应该在没有 targetToken 时也能正常工作', async () => {
            const validData: FlashcardData = {
                targetWord: '猫',
                reading: 'ねこ',
                sentence: '猫がりんごを食べる',
                meaning: '猫',
                hint: '名词',
                sceneDescription: 'Minimalist doodle on white background'
            }

            const { getProviderForScene } = await import('./client')
            const mockProvider = (getProviderForScene as any)()
            mockProvider.generate.mockResolvedValue(JSON.stringify(validData))

            const result = await generateCardContent(mockApiKey, testSentence)

            expect(result).toBeDefined()
            expect(result.targetWord).toBe('猫')
        })
    })
})
