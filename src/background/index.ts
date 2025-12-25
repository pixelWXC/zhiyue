/**
 * Background Service Worker
 * Handles Side Panel activation, IPC, and AI API calls
 */

console.log('Zhiyue Background Service Worker initialized')

// Open Side Panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return

    try {
        await chrome.sidePanel.open({ tabId: tab.id })
        console.log('Side Panel opened for tab:', tab.id)
    } catch (error) {
        console.error('Failed to open Side Panel:', error)
    }
})

// Storage change listener (for debugging)
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        console.log('Storage changed:', Object.keys(changes))
    }
})

// Message listener setup (will be enhanced with webext-bridge in Story 1-2)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message.type, 'from:', sender.tab ? 'content' : 'side-panel')

    // Placeholder - will implement typed IPC in Story 1-2
    sendResponse({ success: true })

    return true // Keep channel open for async response
})

console.log('Event listeners registered')
