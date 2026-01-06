
import { describe, it, expect } from 'vitest'
import { WORD_CARD_IMAGE_PROMPT, buildWordCardPrompt } from './word-card'

describe('Word Card Prompt', () => {
    it('should have a default prompt constant', () => {
        expect(WORD_CARD_IMAGE_PROMPT).toBeDefined()
        expect(typeof WORD_CARD_IMAGE_PROMPT).toBe('string')
        expect(WORD_CARD_IMAGE_PROMPT).toContain('单词魔法卡片')
    })

    it('should build prompt with all context fields', () => {
        const template = 'Template {{word}}'
        const context = {
            word: '猫',
            kana: 'ねこ',
            meaning: 'cat',
            sentence: '猫がいる'
        }

        const result = buildWordCardPrompt(template, context)
        expect(result).toContain(template)
        expect(result).toContain(context.word)
        expect(result).toContain(context.kana)
        expect(result).toContain(context.meaning)
        expect(result).toContain(context.sentence)
    })
})
