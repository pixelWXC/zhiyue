/**
 * Anki Export Logic
 * Formats flashcard data into Anki-compatible TSV format
 */

import type { FlashcardData } from '../../types/card'

/**
 * Escapes HTML special characters to prevent XSS and formatting issues
 */
function escapeHtml(text: string): string {
    const htmlEscapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }

    return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Replaces newlines with HTML <br> tags for Anki field formatting
 */
function convertNewlinesToBr(text: string): string {
    return text.replace(/\n/g, '<br>')
}

/**
 * Formats a single text field: escapes HTML, then converts newlines to <br>
 */
function formatTextField(text: string): string {
    return convertNewlinesToBr(escapeHtml(text))
}

/**
 * Formats flashcard data into Anki TSV format
 * 
 * TSV Structure (3 fields):
 * TSV Structure (3 fields):
 * - Field 1 (Front): Target Word + Reading + Sentence
 * - Field 2 (Back): Meaning + Hint + Translation
 * - Field 3 (Image): HTML img tag with Base64 Data URI (or empty)
 * 
 * @param data - The flashcard content data
 * @param imageSrc - Base64 data URI of the generated image (optional)
 * @returns TSV-formatted string ready for clipboard export
 */
export function formatDataForAnki(
    data: FlashcardData,
    imageSrc: string | null
): string {
    // Field 1: Front (Target Word + Reading + Sentence)
    const frontParts: string[] = []

    if (data.targetWord) {
        frontParts.push(`<strong>${formatTextField(data.targetWord)}</strong>`)
    }

    if (data.reading) {
        frontParts.push(`<em>${formatTextField(data.reading)}</em>`)
    }

    if (data.sentence) {
        frontParts.push(formatTextField(data.sentence))
    }

    const frontField = frontParts.join('<br>')

    // Field 2: Back (Meaning + Hint)
    const backParts: string[] = []

    if (data.meaning) {
        backParts.push(formatTextField(data.meaning))
    }

    if (data.hint) {
        backParts.push(`<small>${formatTextField(data.hint)}</small>`)
    }

    if (data.translation) {
        backParts.push(`<div class="translation">${formatTextField(data.translation)}</div>`)
    }

    const backField = backParts.join('<br>')

    // Field 3: Image (HTML img tag or empty)
    // Only include the third field if there's actual image data
    // This avoids trailing tabs in the TSV format
    if (imageSrc) {
        // Note: We don't escape the imageSrc since it's a Data URI we control
        // but we do ensure it's properly formatted as an img tag
        const imageField = `<img src="${imageSrc}" alt="Card Illustration" style="max-width:100%;height:auto;" />`
        return `${frontField}\t${backField}\t${imageField}`
    }

    // No image: return only front and back fields
    return `${frontField}\t${backField}`
}
