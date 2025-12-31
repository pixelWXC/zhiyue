/**
 * Flashcard Data Types
 * Type definitions for Magic Card content generation
 */

/**
 * Complete flashcard data model for Anki card generation
 */
export interface FlashcardData {
    /** The target word/token being studied */
    targetWord: string

    /** Furigana/Reading of the word (e.g., "食べる" → "たべる") */
    reading: string

    /** The full example sentence containing the target word */
    sentence: string

    /** Concise definition focused on the sentence context */
    meaning: string

    /** Helpful hint (e.g., related grammar point or usage note) */
    hint: string

    /** 
     * Highly descriptive, visual prompt for image generator
     * Must follow "Hand-Drawn Grammar Scenario" style:
     * - minimalist sketch
     * - doodle style
     * - white background
     */
    sceneDescription: string

    /**
     * Translation of the full sentence (Target Language -> Native Language)
     * Essential for the back of the card to understand the context.
     */
    translation?: string
}
