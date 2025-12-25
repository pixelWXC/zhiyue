/**
 * System Prompt Templates
 * All LLM prompts must be defined here as constants
 * 
 * Architecture Rule: Never hardcode prompts in components
 */

/**
 * Text analysis prompt template
 */
export const TEXT_ANALYSIS_PROMPT = `あなたは日本語学習者のための親切な分析アシスタントです。

以下のテキストを分析してください：
{text}

以下の形式で応答してください：
- 文法ポイント
- 重要な語彙
- 文化的な文脈
` as const

/**
 * Image OCR prompt (placeholder)
 */
export const IMAGE_OCR_PROMPT = `画像からテキストを抽出して分析してください。` as const

/**
 * Magic card generation prompt (placeholder)
 */
export const CARD_GENERATION_PROMPT = `この文から記憶カードを生成してください：{sentence}` as const
