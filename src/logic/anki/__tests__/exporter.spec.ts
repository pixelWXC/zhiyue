import { describe, expect, it } from 'vitest'
import type { FlashcardData } from '../../../types/card'
import { formatDataForAnki } from '../exporter'

describe('Anki TSV Exporter', () => {
    const mockCardData: FlashcardData = {
        targetWord: '食べる',
        reading: 'たべる',
        sentence: '私は毎日朝ごはんを食べる。',
        meaning: 'to eat',
        hint: 'る-verb (ichidan verb)',
        sceneDescription: 'A person eating breakfast at a table'
    }

    describe('formatDataForAnki', () => {
        it('should format card data with tabs as separators', () => {
            const result = formatDataForAnki(mockCardData, null)

            // TSV should have exactly 2 fields when no image is provided
            const fields = result.split('\t')
            expect(fields).toHaveLength(2)
        })

        it('should combine targetWord, reading, and sentence in field 1 (Front)', () => {
            const result = formatDataForAnki(mockCardData, null)
            const fields = result.split('\t')

            // Front field should contain all three components
            expect(fields[0]).toContain('食べる')
            expect(fields[0]).toContain('たべる')
            expect(fields[0]).toContain('私は毎日朝ごはんを食べる。')
        })

        it('should combine meaning, hint in field 2 (Back)', () => {
            const result = formatDataForAnki(mockCardData, null)
            const fields = result.split('\t')

            // Back field should contain meaning and hint
            expect(fields[1]).toContain('to eat')
            expect(fields[1]).toContain('る-verb (ichidan verb)')
        })

        it('should replace newlines with <br> tags', () => {
            const cardWithNewlines: FlashcardData = {
                ...mockCardData,
                sentence: 'Line 1\nLine 2\nLine 3',
                meaning: 'Meaning 1\nMeaning 2'
            }

            const result = formatDataForAnki(cardWithNewlines, null)

            // Should not contain actual newlines
            expect(result).not.toContain('\n')
            // Should contain <br> tags instead
            expect(result).toContain('<br>')
        })

        it('should include image as HTML img tag with Base64 when provided', () => {
            const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
            const result = formatDataForAnki(mockCardData, base64Image)
            const fields = result.split('\t')

            // Third field should be the image
            expect(fields[2]).toContain('<img')
            expect(fields[2]).toContain(base64Image)
            expect(fields[2]).toContain('src=')
        })

        it('should have only 2 fields when no image provided', () => {
            const result = formatDataForAnki(mockCardData, null)
            const fields = result.split('\t')

            // Should only have front and back fields (no third field)
            expect(fields).toHaveLength(2)
        })

        it('should sanitize HTML special characters in text fields', () => {
            const cardWithHtml: FlashcardData = {
                ...mockCardData,
                sentence: 'Test <script>alert("xss")</script>',
                meaning: 'Meaning with & ampersand'
            }

            const result = formatDataForAnki(cardWithHtml, null)

            // Should escape HTML special characters
            expect(result).toContain('&lt;script&gt;')
            expect(result).toContain('&amp;')
            expect(result).not.toContain('<script>')
        })

        it('should handle empty or missing optional fields', () => {
            const minimalCard: FlashcardData = {
                targetWord: '食べる',
                reading: '',
                sentence: '食べる',
                meaning: 'to eat',
                hint: '',
                sceneDescription: ''
            }

            const result = formatDataForAnki(minimalCard, null)
            const fields = result.split('\t')

            // Should produce 2 fields when no image (even with some empty text fields)
            expect(fields).toHaveLength(2)
        })

        it('should produce valid Anki-compatible TSV format', () => {
            const result = formatDataForAnki(mockCardData, null)

            // Should end with no trailing newline or tab
            expect(result).not.toMatch(/[\t\n]$/)

            // Should have exactly 1 tab separator when no image (2 fields)
            const tabCount = (result.match(/\t/g) || []).length
            expect(tabCount).toBe(1)
        })

        it('should have 3 fields with 2 tab separators when image is provided', () => {
            const base64Image = 'data:image/png;base64,test'
            const result = formatDataForAnki(mockCardData, base64Image)

            // Should have exactly 2 tab separators (3 fields)
            const tabCount = (result.match(/\t/g) || []).length
            expect(tabCount).toBe(2)

            // Should not have trailing tab
            expect(result).not.toMatch(/[\t\n]$/)
        })
    })
})
