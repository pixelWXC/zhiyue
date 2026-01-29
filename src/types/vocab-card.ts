/**
 * 单词魔法卡片类型定义
 * 用于卡片收藏系统的数据结构
 */

/** 例句结构 */
export interface ExampleSentence {
    /** 日文例句（包含振假名标注，格式：[汉字:读音]） */
    japanese: string
    /** 中文翻译 */
    chinese: string
}

/** 常见搭配结构 */
export interface Collocation {
    /** 搭配模式（如 ~を取る） */
    pattern: string
    /** 搭配含义 */
    meaning: string
}

/** 完整词汇卡片数据 */
export interface VocabCard {
    /** 自增主键 */
    id?: number
    /** 词汇原文（如：連絡） */
    word: string
    /** 假名读音（如：れんらく） */
    reading: string
    /** 核心释义 */
    meaning: string
    /** 音调核（如：0, 1, 2），来自快捷词典，可选 */
    pitch?: string
    /** 音调可视化数据，来自快捷词典 */
    tones?: { char: string; high: boolean }[]
    /** 词性（如：n,vs） */
    pos: string
    /** JLPT等级（1-5，对应 N1-N5），AI生成 */
    level?: number
    /** 例句数组，AI生成 */
    examples: ExampleSentence[]
    /** 常见搭配，AI生成 */
    collocations: Collocation[]
    /** 卡片背面图片（Base64 DataURL） */
    imageUrl: string
    /** 创建时间戳 */
    createdAt: number
    /** 上次复习时间 */
    lastReviewAt?: number
    /** 复习次数 */
    reviewCount: number
    /** 来源页面URL */
    sourceUrl?: string
    /** 来源句子 */
    sourceSentence?: string
}

/** 制卡上下文（用于启动制卡任务） */
export interface CreateCardContext {
    /** 目标单词 */
    word: string
    /** 读音 */
    reading: string
    /** 基础释义 */
    meaning: string
    /** 词性 */
    pos: string
    /** 来源句子（可选） */
    sentence?: string
    /** 音调数据（可选，来自快捷词典） */
    pitch?: string
    /** 音调可视化数据（可选） */
    tones?: { char: string; high: boolean }[]
    /** 来源页面URL */
    sourceUrl?: string
}

/** 制卡任务状态 */
export type CardTaskStatus = 'pending' | 'generating_content' | 'generating_image' | 'completed' | 'failed'

/** 制卡任务 */
export interface CardTask {
    /** 自增主键 */
    id?: number
    /** 任务状态 */
    status: CardTaskStatus
    /** 目标单词 */
    word: string
    /** 制卡上下文 */
    context: CreateCardContext
    /** 创建时间戳 */
    createdAt: number
    /** 完成时间戳 */
    completedAt?: number
    /** 关联的卡片ID */
    cardId?: number
    /** 错误信息 */
    error?: string
    /** 进度描述 */
    progressMessage?: string
}

/** AI生成的卡片内容（正面信息） */
export interface AIGeneratedCardContent {
    /** JLPT等级推测 */
    level: number
    /** 例句数组 */
    examples: ExampleSentence[]
    /** 常见搭配 */
    collocations: Collocation[]
}
