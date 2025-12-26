/**
 * IPC Communication Utilities
 * Typed wrappers around webext-bridge for convenient usage in Side Panel
 * 
 * IMPORTANT: Side Panel uses 'webext-bridge/popup' (similar to popup window context)
 */

import { sendMessage } from 'webext-bridge/popup'

/**
 * Send a ping message to background script
 */
export async function pingBackground(message: string) {
    console.log('[IPC] Sending ping:', message)
    try {
        const response = await sendMessage(
            'ping',
            { message, timestamp: Date.now() },
            'background'
        )
        console.log('[IPC] Ping response:', response)
        return response
    } catch (error) {
        console.error('❌ pingBackground failed:', error)
        throw error
    }
}

/**
 * Read clipboard content via background script
 */
export async function readClipboard() {
    console.log('[IPC] Reading clipboard')
    try {
        const response = await sendMessage('clipboard-read', undefined, 'background')
        console.log('[IPC] Clipboard response:', response)
        return response
    } catch (error) {
        console.error('❌ readClipboard failed:', error)
        throw error
    }
}

/**
 * Get user settings from storage
 */
export async function getSettings() {
    console.log('[IPC] Getting settings')
    try {
        const response = await sendMessage('get-settings', undefined, 'background')
        console.log('[IPC] Settings response:', response)
        return response
    } catch (error) {
        console.error('❌ getSettings failed:', error)
        throw error
    }
}

/**
 * Update user settings
 */
export async function updateSettings(settings: { apiKey?: string; theme?: string }) {
    console.log('[IPC] Updating settings:', settings)
    try {
        const response = await sendMessage('update-settings', settings, 'background')
        console.log('[IPC] Update response:', response)
        return response
    } catch (error) {
        console.error('❌ updateSettings failed:', error)
        throw error
    }
}

