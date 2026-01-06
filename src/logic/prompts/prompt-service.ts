/**
 * Prompt Storage Service
 * 
 * Manages system prompts with support for user customization.
 * Prioritizes custom prompts from chrome.storage over hardcoded defaults.
 * 
 * Design Decisions:
 * - Uses chrome.storage.local for prompts (can be large)
 * - Uses chrome.storage.sync for API key (small, syncs across devices)
 * - Provides centralized access to all prompt types
 */

import { ANALYSIS_SYSTEM_PROMPT } from './analysis'
import { CARD_GEN_SYSTEM_PROMPT } from './card-gen'
import { QA_SYSTEM_PROMPT } from './qa'
import { SYNTAX_ANALYSIS_SYSTEM_PROMPT } from './syntax-analysis'
import { OCR_PROMPT } from './ocr'
import { RAPID_TRANSLATION_PROMPT } from './rapid-translation'
import { TOKEN_DETAIL_PROMPT } from './token-detail'
import { SENTENCE_CARD_IMAGE_PROMPT } from './sentence-card'
import { WORD_CARD_IMAGE_PROMPT } from './word-card'

/**
 * Prompt identifiers for storage and management
 */
export const PROMPT_KEYS = {
    ANALYSIS_SYSTEM: 'analysis_system',
    CARD_GEN_SYSTEM: 'card_gen_system',
    QA_SYSTEM: 'qa_system',
    SYNTAX_ANALYSIS_SYSTEM: 'syntax_analysis_system',
    OCR: 'ocr',
    RAPID_TRANSLATION: 'rapid_translation',
    TOKEN_DETAIL: 'token_detail',
    SENTENCE_CARD_IMAGE: 'sentence_card_image',
    WORD_CARD_IMAGE: 'word_card_image',
} as const

export type PromptKey = typeof PROMPT_KEYS[keyof typeof PROMPT_KEYS]

/**
 * Human-readable prompt metadata for UI display
 */
export interface PromptMetadata {
    id: PromptKey
    name: string
    description: string
    category: '分析' | '卡片' | 'QA' | '句法' | 'OCR' | '快速服务'
    isJsonOutput: boolean  // Warning: modifying JSON prompts can break output
}

/**
 * All available prompt metadata for UI rendering
 */
export const PROMPT_METADATA: PromptMetadata[] = [
    {
        id: PROMPT_KEYS.ANALYSIS_SYSTEM,
        name: '词法分析',
        description: '日语句子分词和词性标注的系统提示',
        category: '分析',
        isJsonOutput: true,
    },
    {
        id: PROMPT_KEYS.CARD_GEN_SYSTEM,
        name: '魔法卡片生成',
        description: '生成学习卡片内容和场景描述的系统提示',
        category: '卡片',
        isJsonOutput: true,
    },
    {
        id: PROMPT_KEYS.QA_SYSTEM,
        name: '互动问答',
        description: '日语学习问答辅导的系统提示',
        category: 'QA',
        isJsonOutput: false,
    },
    {
        id: PROMPT_KEYS.SYNTAX_ANALYSIS_SYSTEM,
        name: '句法分析',
        description: '日语依存文法分析的系统提示',
        category: '句法',
        isJsonOutput: true,
    },
    {
        id: PROMPT_KEYS.OCR,
        name: '图片识别',
        description: '从图片中提取日语文本的提示',
        category: 'OCR',
        isJsonOutput: false,
    },
    {
        id: PROMPT_KEYS.RAPID_TRANSLATION,
        name: '快速翻译',
        description: '日语到中文的快速翻译提示',
        category: '快速服务',
        isJsonOutput: false,
    },
    {
        id: PROMPT_KEYS.TOKEN_DETAIL,
        name: 'Token 详情',
        description: '快速词典查询，返回词义、语法和发音',
        category: '快速服务',
        isJsonOutput: true,
    },
    {
        id: PROMPT_KEYS.SENTENCE_CARD_IMAGE,
        name: '整句魔法卡片图片',
        description: '生成整句的手绘卡通风格场景图片提示',
        category: '卡片',
        isJsonOutput: false,
    },
    {
        id: PROMPT_KEYS.WORD_CARD_IMAGE,
        name: '单词魔法卡片图片',
        description: '生成单词的手绘卡通风格场景图片提示',
        category: '卡片',
        isJsonOutput: false,
    },
]

/**
 * Storage prefix for custom prompts
 */
const STORAGE_PREFIX = 'zhiyue:prompt:'

/**
 * Default prompts mapping (hardcoded values)
 */
const DEFAULT_PROMPTS: Record<PromptKey, string> = {
    [PROMPT_KEYS.ANALYSIS_SYSTEM]: ANALYSIS_SYSTEM_PROMPT,
    [PROMPT_KEYS.CARD_GEN_SYSTEM]: CARD_GEN_SYSTEM_PROMPT,
    [PROMPT_KEYS.QA_SYSTEM]: QA_SYSTEM_PROMPT,
    [PROMPT_KEYS.SYNTAX_ANALYSIS_SYSTEM]: SYNTAX_ANALYSIS_SYSTEM_PROMPT,
    [PROMPT_KEYS.OCR]: OCR_PROMPT,
    [PROMPT_KEYS.RAPID_TRANSLATION]: RAPID_TRANSLATION_PROMPT,
    [PROMPT_KEYS.TOKEN_DETAIL]: TOKEN_DETAIL_PROMPT,
    [PROMPT_KEYS.SENTENCE_CARD_IMAGE]: SENTENCE_CARD_IMAGE_PROMPT,
    [PROMPT_KEYS.WORD_CARD_IMAGE]: WORD_CARD_IMAGE_PROMPT,
}

/**
 * Prompt Service - Singleton pattern for managing system prompts
 * 
 * Provides methods to:
 * - Get prompts (prioritizes custom over default)
 * - Save custom prompts
 * - Reset to defaults
 * - Check if a prompt has been customized
 */
export class PromptService {
    private static instance: PromptService
    private cache: Map<PromptKey, string> = new Map()
    private initialized = false

    private constructor() {
        // Listen for external updates to prompts (e.g., from Settings page)
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                for (const key of Object.values(PROMPT_KEYS)) {
                    const storageKey = `${STORAGE_PREFIX}${key}`
                    if (changes[storageKey]) {
                        const { newValue } = changes[storageKey]
                        if (newValue) {
                            // Update cache with new custom prompt
                            this.cache.set(key, String(newValue))
                            console.log(`[PromptService] Updated cache for ${key}`)
                        } else {
                            // Prompt reset (removed from storage), remove from cache
                            this.cache.delete(key)
                            console.log(`[PromptService] Cleared cache for ${key} (reset to default)`)
                        }
                    }
                }
            }
        })
    }

    /**
     * Get singleton instance
     */
    static getInstance(): PromptService {
        if (!PromptService.instance) {
            PromptService.instance = new PromptService()
        }
        return PromptService.instance
    }

    /**
     * Initialize cache from storage
     * Call this on app startup for optimal performance
     */
    async initialize(): Promise<void> {
        if (this.initialized) return

        try {
            const keys = Object.values(PROMPT_KEYS).map(k => `${STORAGE_PREFIX}${k}`)
            const result = await chrome.storage.local.get(keys)

            for (const key of Object.values(PROMPT_KEYS)) {
                const storageKey = `${STORAGE_PREFIX}${key}`
                const value = result[storageKey] as string | undefined
                if (value) {
                    this.cache.set(key, value)
                }
            }

            this.initialized = true
        } catch (error) {
            console.error('[PromptService] Failed to initialize:', error)
        }
    }

    /**
     * Get a prompt by its key
     * Returns custom prompt if available, otherwise returns default
     * 
     * @param key - The prompt identifier
     * @returns The prompt text (custom or default)
     */
    async getPrompt(key: PromptKey): Promise<string> {
        // Try cache first
        if (this.cache.has(key)) {
            return this.cache.get(key)!
        }

        // Check storage for custom prompt
        try {
            const storageKey = `${STORAGE_PREFIX}${key}`
            const result = await chrome.storage.local.get(storageKey)

            const value = result[storageKey] as string | undefined
            if (value) {
                this.cache.set(key, value)
                return value
            }
        } catch (error) {
            console.warn(`[PromptService] Storage read failed for ${key}:`, error)
        }

        // Return default
        return this.getDefaultPrompt(key)
    }

    /**
     * Get the default (hardcoded) prompt
     * 
     * @param key - The prompt identifier
     * @returns The default prompt text
     */
    getDefaultPrompt(key: PromptKey): string {
        return DEFAULT_PROMPTS[key]
    }

    /**
     * Save a custom prompt
     * 
     * @param key - The prompt identifier
     * @param content - The new prompt content
     */
    async savePrompt(key: PromptKey, content: string): Promise<void> {
        const storageKey = `${STORAGE_PREFIX}${key}`

        try {
            await chrome.storage.local.set({ [storageKey]: content })
            this.cache.set(key, content)
        } catch (error) {
            console.error(`[PromptService] Failed to save prompt ${key}:`, error)
            throw error
        }
    }

    /**
     * Reset a prompt to its default value
     * 
     * @param key - The prompt identifier
     */
    async resetPrompt(key: PromptKey): Promise<void> {
        const storageKey = `${STORAGE_PREFIX}${key}`

        try {
            await chrome.storage.local.remove(storageKey)
            this.cache.delete(key)
        } catch (error) {
            console.error(`[PromptService] Failed to reset prompt ${key}:`, error)
            throw error
        }
    }

    /**
     * Check if a prompt has been customized
     * 
     * @param key - The prompt identifier
     * @returns True if customized, false if using default
     */
    async isCustomized(key: PromptKey): Promise<boolean> {
        // Check cache first
        if (this.cache.has(key)) {
            return true
        }

        try {
            const storageKey = `${STORAGE_PREFIX}${key}`
            const result = await chrome.storage.local.get(storageKey)
            return !!result[storageKey]
        } catch {
            return false
        }
    }

    /**
     * Get all prompts with their customization status
     * Useful for settings UI
     */
    async getAllPromptsStatus(): Promise<{
        id: PromptKey
        metadata: PromptMetadata
        isCustomized: boolean
        current: string
        default: string
    }[]> {
        const result: {
            id: PromptKey
            metadata: PromptMetadata
            isCustomized: boolean
            current: string
            default: string
        }[] = []

        for (const metadata of PROMPT_METADATA) {
            const current = await this.getPrompt(metadata.id)
            const defaultPrompt = this.getDefaultPrompt(metadata.id)
            const isCustomized = await this.isCustomized(metadata.id)

            result.push({
                id: metadata.id,
                metadata,
                isCustomized,
                current,
                default: defaultPrompt,
            })
        }

        return result
    }

    /**
     * Clear cache (useful for testing or force refresh)
     */
    clearCache(): void {
        this.cache.clear()
        this.initialized = false
    }
}

/**
 * Export singleton instance for convenience
 */
export const promptService = PromptService.getInstance()

/**
 * Reactive composable for Vue components
 * Uses the singleton service internally
 */
export function usePromptService() {
    const service = PromptService.getInstance()

    return {
        getPrompt: (key: PromptKey) => service.getPrompt(key),
        getDefaultPrompt: (key: PromptKey) => service.getDefaultPrompt(key),
        savePrompt: (key: PromptKey, content: string) => service.savePrompt(key, content),
        resetPrompt: (key: PromptKey) => service.resetPrompt(key),
        isCustomized: (key: PromptKey) => service.isCustomized(key),
        getAllPromptsStatus: () => service.getAllPromptsStatus(),
        initialize: () => service.initialize(),
    }
}
