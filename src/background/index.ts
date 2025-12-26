/**
 * Background Service Worker
 * Handles Side Panel activation, IPC, and AI API calls
 */

import { onMessage, sendMessage } from 'webext-bridge/background'

console.log('Zhiyue Background Service Worker initialized')

// ====================
// Command Handler (Shortcuts)
// ====================

// Command Handler (Shortcuts)
// ====================

// Track current window to avoid async calls in onCommand (which loses user gesture)
let currentWindowId: number | undefined;

chrome.windows.onFocusChanged.addListener((id) => {
    if (id !== chrome.windows.WINDOW_ID_NONE) {
        currentWindowId = id
    }
})

// Initial fetch
chrome.windows.getLastFocused().then(w => {
    if (w.id) currentWindowId = w.id
}).catch(console.error)


chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-sidepanel') {
        try {
            // Use cached ID or fallback to current query if strictly necessary (but query is also async usually)
            // If we don't have an ID, we can't open it.
            if (!currentWindowId) {
                const w = await chrome.windows.getLastFocused()
                currentWindowId = w.id
            }

            if (currentWindowId) {
                // Open Side Panel
                // Must be called synchronously-ish (no await before this call if possible, though we just did one above if missing)

                // Note: If we had to await above, this might fail. 
                // But normally currentWindowId is correctly cached by onFocusChanged.
                await chrome.sidePanel.open({ windowId: currentWindowId })
                console.log('⌨️ Shortcut: Side Panel opened for window:', currentWindowId)

                // Notify Side Panel to read clipboard
                // We wait a brief moment to ensure Side Panel is mounted/listening
                setTimeout(async () => {
                    try {
                        // Attempt to send message to 'popup' context (Side Panel)
                        await sendMessage('trigger-clipboard-read', undefined, 'popup')
                        console.log('📨 Sent trigger-clipboard-read')
                    } catch (e) {
                        // It's possible the side panel is not yet ready or bridge not established
                        console.warn('⚠️ Could not send clipboard trigger (Side Panel might be loading):', e)
                    }
                }, 500)
            }
        } catch (error) {
            console.error('❌ Failed to handle shortcut:', error)
        }
    }
})

// ====================
// IPC Message Handlers (using webext-bridge)
// ====================

/**
 * Ping-pong test handler
 * Used to verify IPC bridge is working correctly
 */
onMessage('ping', async ({ data }) => {
    console.log('📩 Received ping:', data.message, 'at', new Date(data.timestamp).toISOString())

    return {
        pong: `Received: "${data.message}"`,
        receivedAt: Date.now()
    }
})

/**
 * Clipboard read handler
 * Reads text/image data from system clipboard
 */
onMessage('clipboard-read', async () => {
    // Placeholder implementation - will be enhanced in Story 1-6
    console.log('📋 Clipboard read requested')

    return {
        content: '',
        type: 'text' as const
    }
})

/**
 * Settings handlers
 */
onMessage('get-settings', async () => {
    const settings = await chrome.storage.local.get(['apiKey', 'theme', 'autoCapture', 'preferredModel'])
    console.log('⚙️ Settings retrieved')

    return settings
})

onMessage('update-settings', async ({ data }) => {
    await chrome.storage.local.set(data)
    console.log('⚙️ Settings updated:', Object.keys(data))

    return { success: true }
})

/**
 * API Key Validation handler
 */
onMessage('validate-api-key', async ({ data }) => {
    const { apiKey } = data
    console.log('🔑 Validating API Key...')

    try {
        // Use a lightweight call to list models to verify the key
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        const json = await response.json()

        if (response.ok && json.models) {
            console.log('✅ API Key valid')
            return { valid: true }
        }

        console.warn('❌ API Key invalid:', json.error)
        return {
            valid: false,
            error: json.error?.message || 'Invalid API Key'
        }
    } catch (error) {
        console.error('❌ Validation network error:', error)
        return {
            valid: false,
            error: (error as Error).message || 'Network Error'
        }
    }
})

// ====================
// Chrome Extension Event Listeners
// ====================

// Open Side Panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return

    try {
        await chrome.sidePanel.open({ tabId: tab.id })
        console.log('🔓 Side Panel opened for tab:', tab.id)
    } catch (error) {
        console.error('❌ Failed to open Side Panel:', error)
    }
})

// Storage change listener (for debugging)
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        console.log('💾 Storage changed:', Object.keys(changes))
    }
})

// ====================
// AI Streaming Handler (Native Ports)
// ====================

import { createAnalysisStream } from '../logic/ai/client'

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'ai-stream') return

    console.log('🔌 AI Stream port connected')

    port.onMessage.addListener(async (msg) => {
        if (msg.action === 'analyze') {
            const { text } = msg

            try {
                // 1. Get API Key
                // IMPORTANT: Must use the exact same key as define in @/logic/storage
                // The storage utility prefixes keys with 'zhiyue:', so we must use that here.
                const API_KEY_STORAGE_KEY = 'zhiyue:apiKey'
                const storageResult = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
                const apiKey = storageResult[API_KEY_STORAGE_KEY]

                if (!apiKey) {
                    port.postMessage({ error: '请先配置 API 密钥' })
                    return
                }

                // 2. Start Stream - Using new @google/genai SDK wrapper
                console.log('🤖 Starting Gemini Stream for:', String(text).substring(0, 20) + '...')
                const result = await createAnalysisStream(String(apiKey), String(text))

                // 3. Push Chunks - New SDK iterable response
                for await (const chunk of result) {
                    const chunkText = chunk.text
                    if (chunkText) {
                        port.postMessage({ chunk: chunkText })
                    }
                }

                // 4. Done
                port.postMessage({ done: true })
                console.log('✅ Stream completed')

            } catch (error) {
                console.error('❌ AI Stream Error:', error)
                port.postMessage({ error: (error as Error).message || 'AI 服务请求失败' })
            }
        }
    })
})

console.log('✅ Event listeners registered')
