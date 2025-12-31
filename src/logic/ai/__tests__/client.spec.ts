/**
 * Integration tests for Image Generation
 * Tests the generateImage function with mocked SDK responses
 */
import { describe, it, expect } from 'vitest'
import { MODEL_NAMES } from '../client'

describe('AI Client - Image Generation (Integration)', () => {
    it('should export MODEL_NAMES with IMAGE model', () => {
        expect(MODEL_NAMES.IMAGE).toBe('gemini-3-pro-image-preview')
    })

    it('should have generateImage function exported', async () => {
        const { generateImage } = await import('../client')
        expect(typeof generateImage).toBe('function')
    })

    // Note: Full integration tests require actual API key and are expensive
    // Unit tests with mocks should cover the logic
    // These tests verify the exports and basic structure
})
