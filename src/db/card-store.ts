/**
 * 卡片收藏 IndexedDB 数据库
 * 使用 Dexie.js 封装 IndexedDB 操作
 */

import Dexie, { type Table } from 'dexie'
import type { VocabCard, CardTask } from '@/types/vocab-card'

/**
 * 知阅卡片数据库
 * 包含两个表：cards（卡片）和 tasks（制卡任务）
 */
class ZhiyueCardDatabase extends Dexie {
    /** 卡片表 */
    cards!: Table<VocabCard>
    /** 制卡任务表 */
    tasks!: Table<CardTask>

    constructor() {
        super('zhiyueCardDB')

        // 定义数据库 Schema
        // 格式：++id 表示自增主键，其他字段用于创建索引
        this.version(1).stores({
            cards: '++id, word, level, pos, createdAt, lastReviewAt',
            tasks: '++id, status, word, createdAt'
        })
    }
}

/** 导出数据库实例 */
export const db = new ZhiyueCardDatabase()

// ============ 卡片操作方法 ============

/**
 * 添加卡片到收藏
 * @param card 卡片数据（不含id）
 * @returns 新卡片的id
 */
export async function addCard(card: Omit<VocabCard, 'id'>): Promise<number> {
    return await db.cards.add(card as VocabCard)
}

/**
 * 获取所有卡片
 * @param orderBy 排序字段，默认按创建时间降序
 * @returns 卡片数组
 */
export async function getAllCards(
    orderBy: 'createdAt' | 'lastReviewAt' | 'level' = 'createdAt'
): Promise<VocabCard[]> {
    return await db.cards.orderBy(orderBy).reverse().toArray()
}

/**
 * 根据ID获取卡片
 * @param id 卡片ID
 * @returns 卡片数据或 undefined
 */
export async function getCardById(id: number): Promise<VocabCard | undefined> {
    return await db.cards.get(id)
}

/**
 * 根据单词查找卡片
 * @param word 单词
 * @returns 卡片数据或 undefined
 */
export async function getCardByWord(word: string): Promise<VocabCard | undefined> {
    return await db.cards.where('word').equals(word).first()
}

/**
 * 更新卡片的复习时间
 * @param id 卡片ID
 */
export async function updateReviewTime(id: number): Promise<void> {
    const card = await db.cards.get(id)
    if (card) {
        await db.cards.update(id, {
            lastReviewAt: Date.now(),
            reviewCount: (card.reviewCount || 0) + 1
        })
    }
}

/**
 * 删除卡片
 * @param id 卡片ID
 */
export async function deleteCard(id: number): Promise<void> {
    await db.cards.delete(id)
}

/**
 * 获取卡片总数
 * @returns 卡片数量
 */
export async function getCardCount(): Promise<number> {
    return await db.cards.count()
}

/**
 * 搜索卡片
 * @param keyword 关键词
 * @returns 匹配的卡片数组
 */
export async function searchCards(keyword: string): Promise<VocabCard[]> {
    const lowerKeyword = keyword.toLowerCase()
    return await db.cards
        .filter(card =>
            card.word.toLowerCase().includes(lowerKeyword) ||
            card.reading.includes(keyword) ||
            card.meaning.toLowerCase().includes(lowerKeyword)
        )
        .toArray()
}

// ============ 任务操作方法 ============

/**
 * 添加制卡任务
 * @param task 任务数据（不含id）
 * @returns 新任务的id
 */
export async function addTask(task: Omit<CardTask, 'id'>): Promise<number> {
    return await db.tasks.add(task as CardTask)
}

/**
 * 获取任务
 * @param id 任务ID
 * @returns 任务数据或 undefined
 */
export async function getTaskById(id: number): Promise<CardTask | undefined> {
    return await db.tasks.get(id)
}

/**
 * 更新任务状态
 * @param id 任务ID
 * @param updates 要更新的字段
 */
export async function updateTask(
    id: number,
    updates: Partial<CardTask>
): Promise<void> {
    await db.tasks.update(id, updates)
}

/**
 * 获取进行中的任务
 * @returns 进行中的任务数组
 */
export async function getPendingTasks(): Promise<CardTask[]> {
    return await db.tasks
        .where('status')
        .anyOf(['pending', 'generating_content', 'generating_image'])
        .toArray()
}

/**
 * 获取已完成的任务（用于通知）
 * @returns 已完成的任务数组
 */
export async function getCompletedTasks(): Promise<CardTask[]> {
    return await db.tasks.where('status').equals('completed').toArray()
}

/**
 * 删除任务
 * @param id 任务ID
 */
export async function deleteTask(id: number): Promise<void> {
    await db.tasks.delete(id)
}

/**
 * 清理已完成的任务（保留最近7天）
 */
export async function cleanupOldTasks(): Promise<void> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    await db.tasks
        .where('createdAt')
        .below(sevenDaysAgo)
        .and(task => task.status === 'completed' || task.status === 'failed')
        .delete()
}
