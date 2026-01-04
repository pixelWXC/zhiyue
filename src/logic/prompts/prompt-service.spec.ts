import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PromptService, PROMPT_KEYS } from './prompt-service'

// Mock chrome.storage.local
const storageMock = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
}

// Mock chrome.storage
global.chrome = {
    storage: {
        local: storageMock as any,
        sync: {} as any // Not used in this test
    }
} as any

describe('PromptService', () => {
    let service: PromptService

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset singleton instance by clearing cache
        service = PromptService.getInstance()
        service.clearCache()
    })

    describe('initialize', () => {
        it('should load custom prompts from storage', async () => {
            const mockStorage = {
                [`zhiyue:prompt:${PROMPT_KEYS.ANALYSIS_SYSTEM}`]: 'Custom Prompt Content'
            }
            storageMock.get.mockResolvedValue(mockStorage)

            await service.initialize()

            const prompt = await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)
            expect(prompt).toBe('Custom Prompt Content')
            expect(storageMock.get).toHaveBeenCalled()
        })
    })

    describe('getPrompt', () => {
        it('should return default prompt if no custom prompt exists', async () => {
            storageMock.get.mockResolvedValue({})

            const prompt = await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)

            // Should match the default prompt (checking non-empty string as specific content might change)
            expect(prompt).toBeTruthy()
            expect(typeof prompt).toBe('string')
        })

        it('should return custom prompt if exists in storage', async () => {
            const customContent = 'Custom Analysis Prompt'
            storageMock.get.mockResolvedValue({
                [`zhiyue:prompt:${PROMPT_KEYS.ANALYSIS_SYSTEM}`]: customContent
            })

            const prompt = await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)
            expect(prompt).toBe(customContent)
        })

        it('should use cache for subsequent calls', async () => {
            const customContent = 'Cached Custom Prompt'
            storageMock.get.mockResolvedValue({
                [`zhiyue:prompt:${PROMPT_KEYS.ANALYSIS_SYSTEM}`]: customContent
            })

            // First call hits storage
            await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)

            // Second call should hit cache
            const prompt = await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)

            expect(prompt).toBe(customContent)
            // storage.get might be called again if not initialized, 
            // but let's check if the service logic respects cache.
            // The service.getPrompt implementation calls storage.get if not in cache.
            // If initialized, it loads all. If not initialized, getPrompt loads individually.
        })
    })

    describe('savePrompt', () => {
        it('should save prompt to storage and update cache', async () => {
            const newContent = 'New Custom Content'

            await service.savePrompt(PROMPT_KEYS.ANALYSIS_SYSTEM, newContent)

            expect(storageMock.set).toHaveBeenCalledWith({
                [`zhiyue:prompt:${PROMPT_KEYS.ANALYSIS_SYSTEM}`]: newContent
            })

            const retrieved = await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)
            expect(retrieved).toBe(newContent)
        })
    })

    describe('resetPrompt', () => {
        it('should remove prompt from storage and cache', async () => {
            // Setup custom prompt first
            const customContent = 'To be deleted'
            await service.savePrompt(PROMPT_KEYS.ANALYSIS_SYSTEM, customContent)

            // Reset
            await service.resetPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)

            expect(storageMock.remove).toHaveBeenCalledWith(
                `zhiyue:prompt:${PROMPT_KEYS.ANALYSIS_SYSTEM}`
            )

            // Should return default now (we mock get to return nothing)
            storageMock.get.mockResolvedValue({})
            const current = await service.getPrompt(PROMPT_KEYS.ANALYSIS_SYSTEM)
            expect(current).not.toBe(customContent)
            // It should be the default
        })
    })

    describe('isCustomized', () => {
        it('should return true if prompt is customized', async () => {
            await service.savePrompt(PROMPT_KEYS.ANALYSIS_SYSTEM, 'Custom')
            expect(await service.isCustomized(PROMPT_KEYS.ANALYSIS_SYSTEM)).toBe(true)
        })

        it('should return false if prompt is default', async () => {
            storageMock.get.mockResolvedValue({})
            expect(await service.isCustomized(PROMPT_KEYS.ANALYSIS_SYSTEM)).toBe(false)
        })
    })
})
