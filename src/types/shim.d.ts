/**
 * Type definitions for webext-bridge Protocol Map
 * All IPC messages between Background, Content Scripts, and Side Panel must be defined here
 */

import { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
    export interface ProtocolMap {
        // AI Analysis Messages
        'analyze-text': ProtocolWithReturn<
            { text: string; mode: 'flash' | 'pro' },
            { result: string; tokens: number }
        >
        'analyze-image': ProtocolWithReturn<
            { imageData: string },
            { text: string; result: string }
        >

        // Settings Messages
        'get-settings': ProtocolWithReturn<void, { apiKey?: string; theme?: string }>
        'update-settings': ProtocolWithReturn<
            { apiKey?: string; theme?: string },
            { success: boolean }
        >

        // Card Generation Messages
        'generate-card': ProtocolWithReturn<
            { sentence: string; context: string },
            { card: MagicCard }
        >
    }
}

/**
 * Magic Card structure for Anki export
 */
export interface MagicCard {
    id: string
    sentence: string
    translation: string
    grammar: string[]
    illustration?: string
    createdAt: number
}

/**
 * User Settings stored in chrome.storage.local
 */
export interface UserSettings {
    apiKey?: string
    theme: 'light' | 'dark' | 'auto'
    autoCapture: boolean
    preferredModel: 'flash' | 'pro'
}
