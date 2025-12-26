/**
 * Typed messaging bridge using webext-bridge
 * Provides type-safe communication between Background, Content Scripts, and Side Panel
 * 
 * Architecture Rule: Never use chrome.runtime.sendMessage directly
 */

import { sendMessage as bridgeSendMessage, onMessage } from 'webext-bridge/window'

/**
 * Type-safe message sender
 * @example
 * const result = await sendMessage('analyze-text', { text: 'こんにちは', mode: 'flash' })
 */
export const sendMessage = bridgeSendMessage

/**
 * Type-safe message listener
 * @example
 * onMessageTyped('analyze-text', async ({ data }) => {
 *   return { result: '...', tokens: 100 }
 * })
 */
export const onMessageTyped = onMessage

/**
 * Send message to background script
 */
export async function sendToBackground<T = any>(type: string, data: T) {
    return sendMessage(type, data as any, 'background')
}

/**
 * Send message to specific tab's content script
 */
export async function sendToContentScript<T = any>(
    type: string,
    data: T,
    tabId: number
) {
    return sendMessage(type, data as any, `content-script@${tabId}`)
}

/**
 * Send message to side panel
 */
export async function sendToSidePanel<T = any>(type: string, data: T) {
    return sendMessage(type, data as any, 'side-panel')
}
