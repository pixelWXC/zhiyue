/**
 * Background Service Worker
 * Handles Side Panel activation, IPC, and AI API calls
 */

import { onMessage } from 'webext-bridge/background'

console.log('Zhiyue Background Service Worker initialized')

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

console.log('✅ Event listeners registered')
