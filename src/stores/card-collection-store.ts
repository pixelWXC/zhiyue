/**
 * 卡片收藏 Store
 * 管理词汇卡片的收藏、制卡任务和通知状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    addCard,
    getAllCards,
    getCardById,
    deleteCard as dbDeleteCard,
    updateReviewTime as dbUpdateReviewTime,
    addTask,
    updateTask,
    getPendingTasks,
    searchCards
} from '@/db/card-store'
import type {
    VocabCard,
    CreateCardContext,
    AIGeneratedCardContent
} from '@/types/vocab-card'
import { getProviderForScene } from '@/logic/ai/client'
import { buildVocabCardContentPromptAsync } from '@/logic/prompts/vocab-card-content'
import { jsonrepair } from 'jsonrepair'

export const useCardCollectionStore = defineStore('cardCollection', () => {
    // ============ State ============

    /** 所有卡片列表 */
    const cards = ref<VocabCard[]>([])

    /** 是否正在加载卡片 */
    const isLoading = ref(false)

    /** 是否正在创建卡片 */
    const isCreatingCard = ref(false)

    /** 当前正在制作的单词 */
    const currentCreatingWord = ref<string>('')

    /** 当前制卡进度消息 */
    const currentProgressMessage = ref<string>('')

    /** 最新完成的卡片（用于通知） */
    const lastCompletedCard = ref<VocabCard | null>(null)

    /** 是否显示完成通知 */
    const showCompletionNotification = ref(false)

    /** 当前制卡任务ID */
    const currentTaskId = ref<number | null>(null)

    /** 错误信息 */
    const error = ref<string | null>(null)

    // ============ Getters ============

    /** 卡片总数 */
    const cardCount = computed(() => cards.value.length)

    /** 是否有卡片 */
    const hasCards = computed(() => cards.value.length > 0)

    // ============ Actions ============

    /**
     * 加载所有卡片
     */
    async function loadCards() {
        isLoading.value = true
        try {
            cards.value = await getAllCards()
        } catch (e) {
            console.error('Failed to load cards:', e)
            error.value = '加载卡片失败'
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 根据ID获取卡片
     */
    async function getCard(id: number): Promise<VocabCard | undefined> {
        // 先从缓存查找
        const cached = cards.value.find(c => c.id === id)
        if (cached) return cached

        // 从数据库查找
        return await getCardById(id)
    }

    /**
     * 删除卡片
     */
    async function deleteCard(id: number) {
        try {
            await dbDeleteCard(id)
            cards.value = cards.value.filter(c => c.id !== id)
        } catch (e) {
            console.error('Failed to delete card:', e)
            error.value = '删除卡片失败'
        }
    }

    /**
     * 更新复习时间
     */
    async function updateReviewTime(id: number) {
        try {
            await dbUpdateReviewTime(id)
            // 更新本地缓存
            const card = cards.value.find(c => c.id === id)
            if (card) {
                card.lastReviewAt = Date.now()
                card.reviewCount = (card.reviewCount || 0) + 1
            }
        } catch (e) {
            console.error('Failed to update review time:', e)
        }
    }

    /**
     * 搜索卡片
     */
    async function search(keyword: string): Promise<VocabCard[]> {
        if (!keyword.trim()) {
            return cards.value
        }
        return await searchCards(keyword)
    }

    /**
     * 关闭完成通知
     * 只隐藏通知气泡，不清空 lastCompletedCard
     * 这样其他组件（如 CardCreationConfirm）仍可以访问完成的卡片
     */
    function dismissNotification() {
        showCompletionNotification.value = false
        // 不再清空 lastCompletedCard，让其保留到下一次制卡开始
    }

    /**
     * 生成卡片内容（调用 AI）
     * 使用 speed 场景的 Provider 生成例句、搭配和等级信息
     */
    async function generateCardContent(context: CreateCardContext): Promise<AIGeneratedCardContent> {
        const prompt = await buildVocabCardContentPromptAsync({
            word: context.word,
            reading: context.reading,
            meaning: context.meaning,
            pos: context.pos,
            sourceSentence: context.sentence
        })

        // 直接调用 AI Provider
        const provider = await getProviderForScene('', 'speed')
        const rawText = await provider.generate(prompt, {
            responseFormat: 'json'
        })

        // 解析 AI 返回的 JSON
        try {
            // 提取 JSON 部分
            const jsonMatch = rawText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('无法解析 AI 响应')
            }

            const repaired = jsonrepair(jsonMatch[0])
            const parsed = JSON.parse(repaired) as AIGeneratedCardContent

            // 验证必要字段
            if (!parsed.examples || !Array.isArray(parsed.examples)) {
                parsed.examples = []
            }
            if (!parsed.collocations || !Array.isArray(parsed.collocations)) {
                parsed.collocations = []
            }
            if (typeof parsed.level !== 'number') {
                parsed.level = 3 // 默认 N3
            }

            return parsed
        } catch (e) {
            console.error('Failed to parse AI response:', e)
            throw new Error('AI 响应解析失败')
        }
    }

    /**
     * 生成卡片图片（调用 AI）
     * 使用已有的 generateWordImage 函数
     */
    async function generateCardImage(context: CreateCardContext): Promise<string> {
        // 直接调用已有的图片生成函数
        const { generateWordImage } = await import('@/logic/ai/card-generator')
        return await generateWordImage('', {
            word: context.word,
            kana: context.reading,
            meaning: context.meaning,
            sentence: context.sentence || ''
        })
    }

    /**
     * 开始异步制卡
     * @param context 制卡上下文
     */
    async function startCardCreation(context: CreateCardContext) {
        if (isCreatingCard.value) {
            console.warn('Already creating a card')
            return
        }

        isCreatingCard.value = true
        currentCreatingWord.value = context.word
        currentProgressMessage.value = '正在准备制卡...'
        error.value = null
        // 清空之前的完成状态，准备接收新的结果
        lastCompletedCard.value = null
        showCompletionNotification.value = false

        try {
            // 1. 创建任务记录
            // Use JSON parse/stringify to remove any Vue proxies that might cause DataCloneError
            const plainContext = JSON.parse(JSON.stringify(context))
            const taskId = await addTask({
                status: 'pending',
                word: plainContext.word,
                context: plainContext,
                createdAt: Date.now()
            })
            currentTaskId.value = taskId

            // 2. 更新状态：生成内容
            currentProgressMessage.value = '正在生成卡片内容...'
            await updateTask(taskId, {
                status: 'generating_content',
                progressMessage: '正在生成例句和搭配...'
            })

            // 3. 调用 AI 生成卡片内容
            let cardContent: AIGeneratedCardContent
            try {
                cardContent = await generateCardContent(plainContext)
            } catch (e) {
                // 内容生成失败，使用默认值
                console.warn('Card content generation failed, using defaults:', e)
                cardContent = {
                    level: 3,
                    examples: [],
                    collocations: []
                }
            }

            // 4. 更新状态：生成图片
            currentProgressMessage.value = '正在绘制卡片插图...'
            await updateTask(taskId, {
                status: 'generating_image',
                progressMessage: '正在生成场景图片...'
            })

            // 5. 调用 AI 生成图片
            const imageUrl = await generateCardImage(plainContext)

            // 6. 创建卡片并保存
            const card: Omit<VocabCard, 'id'> = {
                word: plainContext.word,
                reading: plainContext.reading,
                meaning: plainContext.meaning,
                pos: plainContext.pos,
                pitch: plainContext.pitch,
                tones: plainContext.tones,
                level: cardContent.level,
                examples: cardContent.examples,
                collocations: cardContent.collocations,
                imageUrl,
                createdAt: Date.now(),
                reviewCount: 0,
                sourceUrl: plainContext.sourceUrl,
                sourceSentence: plainContext.sentence
            }

            // Ensure card data is also plain object
            const plainCard = JSON.parse(JSON.stringify(card))
            const cardId = await addCard(plainCard)
            const savedCard = { ...plainCard, id: cardId }

            // 7. 更新任务为完成状态
            await updateTask(taskId, {
                status: 'completed',
                completedAt: Date.now(),
                cardId
            })

            // 8. 更新本地状态
            cards.value.unshift(savedCard)
            lastCompletedCard.value = savedCard
            showCompletionNotification.value = true

            // 9. 更新 Badge（提供视觉反馈）
            try {
                await chrome.action.setBadgeText({ text: '✓' })
                await chrome.action.setBadgeBackgroundColor({ color: '#10b981' })
                // 3秒后清除
                setTimeout(async () => {
                    await chrome.action.setBadgeText({ text: '' })
                }, 3000)
            } catch (e) {
                console.warn('Failed to update badge:', e)
            }

        } catch (e) {
            console.error('Card creation failed:', e)
            error.value = e instanceof Error ? e.message : '制卡失败'

            // 更新任务为失败状态
            if (currentTaskId.value) {
                await updateTask(currentTaskId.value, {
                    status: 'failed',
                    error: error.value
                })
            }
        } finally {
            isCreatingCard.value = false
            currentCreatingWord.value = ''
            currentProgressMessage.value = ''
            currentTaskId.value = null
        }
    }

    /**
     * 检查是否有进行中的任务
     */
    async function checkPendingTasks() {
        const pending = await getPendingTasks()
        // 如果有进行中的任务，可以在这里恢复或清理
        if (pending.length > 0) {
            console.log('Found pending tasks:', pending)
            // TODO: 可以实现任务恢复逻辑
        }
    }

    return {
        // State
        cards,
        isLoading,
        isCreatingCard,
        currentCreatingWord,
        currentProgressMessage,
        lastCompletedCard,
        showCompletionNotification,
        error,

        // Getters
        cardCount,
        hasCards,

        // Actions
        loadCards,
        getCard,
        deleteCard,
        updateReviewTime,
        search,
        dismissNotification,
        startCardCreation,
        checkPendingTasks
    }
})
