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

// Story 4-7: 使用内存变量跟踪 Side Panel 是否打开
// 注意：不能使用 chrome.storage 因为 await 会打破用户手势上下文
let isSidePanelOpen = false

chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-sidepanel') {
        // 关键：不能在 sidePanel.open() 之前使用任何 await
        // 否则会丢失用户手势上下文

        if (isSidePanelOpen) {
            // Side Panel 已打开，发送关闭消息
            console.log('⌨️ Shortcut: Side Panel is open, sending close message...')
            sendMessage('close-sidepanel', undefined, 'popup')
                .then(() => {
                    console.log('⌨️ Shortcut: Side Panel close message sent')
                })
                .catch((e) => {
                    console.warn('⌨️ Shortcut: Failed to send close message:', e)
                    // 消息发送失败，重置状态
                    isSidePanelOpen = false
                })
        } else {
            // Side Panel 未打开，打开它
            console.log('⌨️ Shortcut: Side Panel not open, opening...')

            // 使用缓存的 windowId，避免 await
            const windowId = currentWindowId
            if (windowId) {
                chrome.sidePanel.open({ windowId })
                    .then(() => {
                        console.log('⌨️ Shortcut: Side Panel opened for window:', windowId)
                        // Notify Side Panel to read clipboard
                        setTimeout(() => {
                            sendMessage('trigger-clipboard-read', undefined, 'popup')
                                .then(() => console.log('📨 Sent trigger-clipboard-read'))
                                .catch((err) => console.warn('⚠️ Could not send clipboard trigger:', err))
                        }, 500)
                    })
                    .catch((error) => {
                        console.error('❌ Failed to open Side Panel:', error)
                    })
            } else {
                console.error('❌ No window ID available')
            }
        }
    }
})

// Story 4-7: 监听 Side Panel 状态变化消息
onMessage('sidepanel-opened', () => {
    isSidePanelOpen = true
    console.log('📌 Side Panel state updated: OPEN')
})

onMessage('sidepanel-closed', () => {
    isSidePanelOpen = false
    console.log('📌 Side Panel state updated: CLOSED')
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

// Native message listener for user-gesture-sensitive operations
// This preserves the user gesture context better than webext-bridge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'open-side-panel') {
        const { text, analysisResult } = message

        // ✅ 关键：立即调用 sidePanel.open()，不能有任何 await
        // 任何异步操作都会丢失用户手势上下文
        if (sender.tab?.id) {
            chrome.sidePanel.open({ tabId: sender.tab.id })
                .then(() => {
                    console.log('✅ Side panel opened for tab:', sender.tab?.id)

                    // 打开成功后存储文本和分析结果（如果有的话）
                    // 侧边栏通过 onMounted 检查这些数据来决定是直接显示还是重新分析
                    const storageData: Record<string, any> = {
                        'pending_analysis_text': text
                    }

                    // 如果有已完成的分析结果，一起存储
                    if (analysisResult) {
                        storageData['pending_analysis_result'] = analysisResult
                        console.log('📦 Storing cached analysis result for sidebar')
                    }

                    chrome.storage.local.set(storageData)

                    sendResponse({ success: true })
                })
                .catch((error) => {
                    console.error('❌ Failed to open side panel:', error)
                    sendResponse({ success: false, error: error.message })
                })
        } else {
            console.error('❌ No tab ID available from sender')
            sendResponse({ success: false, error: 'No tab ID available' })
        }

        // ✅ 返回 true 表示异步响应
        return true
    }
})

// ====================
// AI Streaming Handler (Native Ports)
// ====================

import { createAnalysisStream, createQaStream, createSyntaxStream, createRapidTranslationStream, createTokenDetailStream } from '../logic/ai/client'

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
        } else if (msg.action === 'ask-question') {
            const { sentence, token, question } = msg

            try {
                const API_KEY_STORAGE_KEY = 'zhiyue:apiKey'
                const storageResult = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
                const apiKey = storageResult[API_KEY_STORAGE_KEY]

                if (!apiKey) {
                    port.postMessage({ error: '请先配置 API 密钥' })
                    return
                }

                console.log('🤔 AI QA:', question)
                const result = await createQaStream(String(apiKey), sentence, token, question)

                for await (const chunk of result) {
                    const chunkText = chunk.text
                    if (chunkText) {
                        port.postMessage({ chunk: chunkText })
                    }
                }
                port.postMessage({ done: true })

            } catch (error) {
                port.postMessage({ error: (error as Error).message })
            }
        } else if (msg.action === 'rapid-translation') {
            const { text } = msg

            try {
                const API_KEY_STORAGE_KEY = 'zhiyue:apiKey'
                const storageResult = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
                const apiKey = storageResult[API_KEY_STORAGE_KEY]

                if (!apiKey) {
                    port.postMessage({ error: '请先配置 API 密钥' })
                    return
                }

                console.log('⚡ Rapid Translation:', String(text).substring(0, 20) + '...')
                const result = await createRapidTranslationStream(String(apiKey), String(text))

                for await (const chunk of result) {
                    const chunkText = chunk.text
                    if (chunkText) {
                        port.postMessage({ chunk: chunkText })
                    }
                }
                port.postMessage({ done: true })

            } catch (error) {
                console.error('❌ Rapid Translation Error:', error)
                port.postMessage({ error: (error as Error).message })
            }
        } else if (msg.action === 'token-detail') {
            const { token } = msg

            try {
                const API_KEY_STORAGE_KEY = 'zhiyue:apiKey'
                const storageResult = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
                const apiKey = storageResult[API_KEY_STORAGE_KEY]

                if (!apiKey) {
                    port.postMessage({ error: '请先配置 API 密钥' })
                    return
                }

                console.log('⚡ Token Detail:', token)
                const result = await createTokenDetailStream(String(apiKey), String(token))

                for await (const chunk of result) {
                    const chunkText = chunk.text
                    if (chunkText) {
                        port.postMessage({ chunk: chunkText })
                    }
                }
                port.postMessage({ done: true })

            } catch (error) {
                console.error('❌ Token Detail Error:', error)
                port.postMessage({ error: (error as Error).message })
            }
        }
    })
})

// ====================
// Content Script Support
// ====================

import { jsonrepair } from 'jsonrepair'

onMessage('analyze-text-content-script', async ({ data }) => {
    const { text } = data as { text: string }
    console.log('🔍 Content Script requested analysis for:', String(text).substring(0, 10))

    try {
        const API_KEY_STORAGE_KEY = 'zhiyue:apiKey'
        const storageResult = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
        const apiKey = storageResult[API_KEY_STORAGE_KEY]

        if (!apiKey) {
            return { success: false, error: 'API Key missing' }
        }

        // Use 'thinking' mode for best quality
        const stream = await createAnalysisStream(String(apiKey), String(text), 'thinking')

        // Accumulate full response
        let fullText = ''
        for await (const chunk of stream) {
            if (chunk.text) fullText += chunk.text
        }

        console.log('🤖 Raw AI Response:', fullText.substring(0, 50) + '...')

        // Parse JSON
        let json: any
        try {
            // Attempt to find JSON block if wrapped
            const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/) || fullText.match(/\{[\s\S]*\}/)
            const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : fullText

            const repaired = jsonrepair(jsonString)
            json = JSON.parse(repaired)
        } catch (e) {
            console.error('JSON Parse Error:', e)
            return { success: false, error: 'Failed to parse AI response' }
        }

        return { success: true, data: json }

    } catch (error) {
        console.error('❌ Analysis failed:', error)
        return { success: false, error: (error as Error).message }
    }
})

/**
 * Deep Syntax Analysis Handler (Story 2-1)
 * Buffers the stream from Gemini Pro and returns the full JSON tree
 */
onMessage('analyze-syntax', async ({ data }) => {
    const { text } = data
    console.log('🌳 Syntax Analysis requested for:', String(text).substring(0, 10))

    try {
        const API_KEY_STORAGE_KEY = 'zhiyue:apiKey'
        const storageResult = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
        const apiKey = storageResult[API_KEY_STORAGE_KEY]

        if (!apiKey) {
            return { success: false, error: 'API Key missing' }
        }

        // Use new createSyntaxStream
        const stream = await createSyntaxStream(String(apiKey), String(text))

        // Accumulate full response
        let fullText = ''
        for await (const chunk of stream) {
            if (chunk.text) fullText += chunk.text
        }

        console.log('🧠 Raw Syntax Response:', fullText.substring(0, 20) + '...')

        // Parse JSON
        let json: any
        try {
            // Attempt to find JSON block if wrapped
            const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/) || fullText.match(/\{[\s\S]*\}/)
            const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : fullText

            const repaired = jsonrepair(jsonString)
            json = JSON.parse(repaired)
        } catch (e) {
            console.error('JSON Parse Error:', e)
            return { success: false, error: 'Failed to parse AI response' }
        }

        return { success: true, data: json }

    } catch (error) {
        console.error('❌ Syntax Analysis failed:', error)
        return { success: false, error: (error as Error).message }
    }
})



console.log('✅ Event listeners registered')
