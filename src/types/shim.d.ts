/**
 * Type definitions for webext-bridge Protocol Map
 * All IPC messages between Background, Content Scripts, and Side Panel must be defined here
 */

import { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
    export interface ProtocolMap {
        // Test Messages (for Story 1-2)
        'ping': ProtocolWithReturn<
            { message: string; timestamp: number },
            { pong: string; receivedAt: number }
        >

        // Clipboard Messages
        'clipboard-read': ProtocolWithReturn<
            void,
            { content: string; type: 'text' | 'image' }
        >

        'trigger-clipboard-read': ProtocolWithReturn<void, void>

        // Story 4-7: Side Panel Toggle
        'close-sidepanel': ProtocolWithReturn<void, void>
        'sidepanel-opened': ProtocolWithReturn<void, void>
        'sidepanel-closed': ProtocolWithReturn<void, void>

        // AI Analysis Messages (Note: Main streaming uses chrome.runtime.connect Ports)
        'analyze-image': ProtocolWithReturn<
            { imageData: string },
            { text: string; result: string }
        >
        'analyze-syntax': ProtocolWithReturn<{ text: string }, any>

        // Settings Messages
        'get-settings': ProtocolWithReturn<void, { apiKey?: string; theme?: string }>
        'update-settings': ProtocolWithReturn<
            { apiKey?: string; theme?: string },
            { success: boolean }
        >
        'validate-api-key': ProtocolWithReturn<
            { apiKey: string },
            { valid: boolean; error?: string }
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
    rapidTranslation?: boolean
    rapidTokenDetail?: boolean
    showBubble?: boolean // Story 4-7: 页面气泡显示开关
    providerCredentials?: import('./model-config').ProviderCredentials
    sceneConfig?: import('./model-config').SceneConfig
}
