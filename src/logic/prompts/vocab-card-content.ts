/**
 * 卡片内容生成提示词
 * 用于 AI 生成卡片正面的例句、搭配和等级信息
 */

export interface VocabCardContentContext {
    /** 目标单词 */
    word: string
    /** 读音 */
    reading: string
    /** 基础释义 */
    meaning: string
    /** 词性 */
    pos: string
    /** 来源句子（可选） */
    sourceSentence?: string
}

export const VOCAB_CARD_CONTENT_PROMPT = `[系统 / 提示]
你是一名专业的日语教学专家，专门为中国学习者制作高质量的单词学习卡片。
你的任务是根据给定的单词信息，生成丰富的学习内容。

📋 输出要求
请严格按照以下 JSON 格式输出，不要输出任何其他内容：

{
  "level": <数字 1-5，对应 JLPT N1-N5 级别>,
  "examples": [
    {
      "japanese": "<日文例句，生僻汉字用 [汉字:读音] 格式标注>",
      "chinese": "<中文翻译>"
    }
  ],
  "collocations": [
    {
      "pattern": "<搭配模式，如 ~を取る>",
      "meaning": "<搭配含义>"
    }
  ]
}

📝 生成规则

1. **等级推测 (level)**
   - 根据单词的常用程度和复杂度推测 JLPT 等级
   - 1 = N1 (最难), 5 = N5 (最简单)
   - 考虑：词汇复杂度、使用频率、学习阶段

2. **例句生成 (examples)**
   - 生成 2-3 个典型例句
   - 例句应该自然、实用，体现单词的常见用法
   - 如果提供了来源句子，可以参考但不必完全照搬
   - 对于较难的汉字、非常用读音，使用 [汉字:读音] 格式标注
   - 例如：「[後ほど:のちほど]連絡します」

3. **常见搭配 (collocations)**
   - 生成 2-4 个最常用的搭配
   - 使用 ~ 符号表示目标单词的位置
   - 包含动词搭配（を/に/と + 动词）、惯用表达等
   - 例如：「~を取る」「~がつく」

🎯 任务输入
`

/**
 * 构建卡片内容生成的完整提示词
 * @param context 单词上下文
 * @returns 完整的提示词字符串
 */
export function buildVocabCardContentPrompt(context: VocabCardContentContext): string {
    const sentencePart = context.sourceSentence
        ? `【来源句子】: ${context.sourceSentence}`
        : '【来源句子】: (无)'

    return `${VOCAB_CARD_CONTENT_PROMPT}

【目标单词】: ${context.word}
【读音】: ${context.reading}
【词义】: ${context.meaning}
【词性】: ${context.pos}
${sentencePart}

请根据以上信息，生成符合格式要求的 JSON 数据。
`
}
