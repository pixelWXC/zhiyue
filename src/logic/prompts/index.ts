/**
 * System Prompt Templates - Unified Export
 * 
 * All LLM prompts are defined in separate files and re-exported here.
 * The PromptService provides runtime access with customization support.
 * 
 * Architecture Rules:
 * - Never hardcode prompts in components
 * - Use PromptService for runtime prompt access (supports user customization)
 * - Import from this index for static prompt constants
 */

// Re-export all prompt constants
export { ANALYSIS_SYSTEM_PROMPT, ANALYSIS_USER_PROMPT } from './analysis'
export { CARD_GEN_SYSTEM_PROMPT, CARD_GEN_USER_PROMPT } from './card-gen'
export { QA_SYSTEM_PROMPT, QA_USER_PROMPT } from './qa'
export { SYNTAX_ANALYSIS_SYSTEM_PROMPT } from './syntax-analysis'
export { OCR_PROMPT } from './ocr'
export { RAPID_TRANSLATION_PROMPT } from './rapid-translation'
export { TOKEN_DETAIL_PROMPT } from './token-detail'
export { SENTENCE_CARD_IMAGE_PROMPT, buildSentenceCardPrompt } from './sentence-card'
export { WORD_CARD_IMAGE_PROMPT, buildWordCardPrompt, type WordContext } from './word-card'
export { VOCAB_CARD_CONTENT_PROMPT, buildVocabCardContentPrompt, buildVocabCardContentPromptAsync, type VocabCardContentContext } from './vocab-card-content'

// Re-export PromptService and utilities
export {
    PromptService,
    promptService,
    usePromptService,
    PROMPT_KEYS,
    PROMPT_METADATA,
    type PromptKey,
    type PromptMetadata,
} from './prompt-service'

