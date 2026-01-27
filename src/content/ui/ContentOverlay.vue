<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import SelectionBubble from './SelectionBubble.vue'
import AnalysisModal from './AnalysisModal.vue'
import SentenceCardOverlay from './SentenceCardOverlay.vue'
import type { AnalysisData } from '@/stores/ai-store'
import { jsonrepair } from 'jsonrepair'
import { STORAGE_KEYS } from '@/logic/storage'

// State
const bubbleVisible = ref(false)
const bubbleX = ref(0)
const bubbleY = ref(0)
const selectedText = ref('')

const modalVisible = ref(false)
const isStreaming = ref(false)
const streamingText = ref('')
const parsedData = ref<AnalysisData | null>(null)

// Rapid Translation State
const rapidTranslationEnabled = ref(true) // Default enabled
const rapidTranslationText = ref('')
const isRapidTranslating = ref(false)
const rapidTranslationError = ref('')

// Sentence Card Overlay State
const sentenceCardVisible = ref(false)
const sentenceCardImage = ref('')

// Story 4-7: 页面气泡显示开关状态
const showBubbleEnabled = ref(true) // Default enabled

// Watch for overlay visibility to toggle host pointer-events
watch(sentenceCardVisible, (newValue) => {
    const host = document.getElementById('zhiyue-extension-host')
    if (host) {
        // When overlay is visible, enable pointer events on host to ensure interaction
        // When hidden, disable pointer events to let clicks pass through to the page
        host.style.pointerEvents = newValue ? 'auto' : 'none'
    }
})

// Selection Handler
const handleSelection = () => {
    // If modal is open, ignore selection changes
    if (modalVisible.value) return;

    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (!text || text.length === 0) {
        bubbleVisible.value = false
        return
    }

    selectedText.value = text
    
    // Position bubble
    // We need to calculate position relative to the viewport because our host is fixed
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        // Position at bottom-right of the selection
        bubbleX.value = rect.right + 8 // 8px offset to the right
        bubbleY.value = rect.bottom + 8 // 8px offset below
        
        // Boundary checks
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const bubbleWidth = 80 // Approximate bubble width
        const bubbleHeight = 40 // Approximate bubble height
        
        // If bubble goes beyond right edge, position it to the left of selection
        if (bubbleX.value + bubbleWidth > viewportWidth) {
            bubbleX.value = rect.left - bubbleWidth - 8
        }
        
        // If bubble goes beyond bottom edge, position it above selection
        if (bubbleY.value + bubbleHeight > viewportHeight) {
            bubbleY.value = rect.top - bubbleHeight - 8
        }
        
        // Ensure bubble doesn't go beyond left edge
        if (bubbleX.value < 10) {
            bubbleX.value = 10
        }
        
        // Ensure bubble doesn't go beyond top edge
        if (bubbleY.value < 10) {
            bubbleY.value = 10
        }
        
        // Story 4-7: 只有启用气泡显示时才显示气泡
        bubbleVisible.value = showBubbleEnabled.value
    }
}

// Global mouseup listener to trigger selection check only after interaction finishes
const onMouseUp = () => {
    // Small delay to let selection update
    setTimeout(handleSelection, 10)
}

// Actions - Streaming Analysis
const hasApiKey = ref(false)

const checkApiKey = async () => {
    try {
        // Check both legacy apiKey and new providerCredentials
        const result = await chrome.storage.local.get([
            STORAGE_KEYS.API_KEY,
            STORAGE_KEYS.PROVIDER_CREDENTIALS
        ])
        
        // Parse providerCredentials (may be JSON string from useStorageAsync)
        let credentials: any = result[STORAGE_KEYS.PROVIDER_CREDENTIALS]
        if (typeof credentials === 'string') {
            try {
                credentials = JSON.parse(credentials)
            } catch { credentials = null }
        }
        
        // Check if any provider has an API key configured
        const hasNewConfig = credentials && (
            credentials.gemini?.apiKey ||
            credentials.openai?.apiKey ||
            credentials.doubao?.apiKey ||
            credentials.deepseek?.apiKey
        )
        
        // Support both old and new configuration
        hasApiKey.value = !!result[STORAGE_KEYS.API_KEY] || !!hasNewConfig
    } catch (e) {
        console.warn('Failed to check API key', e)
        hasApiKey.value = false
    }
}

// Helper function to parse boolean value (handles both string and boolean)
const parseBoolean = (value: any, defaultValue: boolean = true): boolean => {
    if (value === undefined || value === null) return defaultValue
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value !== 'false' && value !== '0'
    return Boolean(value)
}

// Load rapid services settings
const loadRapidSettings = async () => {
    try {
        const result = await chrome.storage.local.get([
            STORAGE_KEYS.RAPID_TRANSLATION,
            STORAGE_KEYS.RAPID_TOKEN_DETAIL,
            STORAGE_KEYS.SHOW_BUBBLE // Story 4-7
        ])
        // 修复 Bug: VueUse useStorageAsync 将 boolean 序列化为字符串存储
        // 需要正确处理字符串 "false" 和 boolean false 两种情况
        rapidTranslationEnabled.value = parseBoolean(result[STORAGE_KEYS.RAPID_TRANSLATION], true)
        rapidTokenDetailEnabled.value = parseBoolean(result[STORAGE_KEYS.RAPID_TOKEN_DETAIL], true)
        showBubbleEnabled.value = parseBoolean(result[STORAGE_KEYS.SHOW_BUBBLE], true)
        
        console.log('[Zhiyue] Rapid settings loaded:', {
            rapidTranslation: rapidTranslationEnabled.value,
            rapidTokenDetail: rapidTokenDetailEnabled.value,
            showBubble: showBubbleEnabled.value
        })
    } catch (e) {
        console.warn('Failed to load rapid settings', e)
    }
}

// Listen for storage changes
const onStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName === 'local' && (changes[STORAGE_KEYS.API_KEY] || changes[STORAGE_KEYS.PROVIDER_CREDENTIALS])) {
        // Re-check API key when any credential changes
        checkApiKey()
    }
    // 修复 Bug: 使用 parseBoolean 正确处理字符串/boolean 类型
    if (areaName === 'local' && changes[STORAGE_KEYS.RAPID_TRANSLATION]) {
        const newValue = parseBoolean(changes[STORAGE_KEYS.RAPID_TRANSLATION]?.newValue, true)
        rapidTranslationEnabled.value = newValue
        console.log('[Zhiyue] Rapid translation setting changed:', newValue)
    }
    if (areaName === 'local' && changes[STORAGE_KEYS.RAPID_TOKEN_DETAIL]) {
        const newValue = parseBoolean(changes[STORAGE_KEYS.RAPID_TOKEN_DETAIL]?.newValue, true)
        rapidTokenDetailEnabled.value = newValue
        console.log('[Zhiyue] Rapid token detail setting changed:', newValue)
    }
    // Story 4-7: 监听 SHOW_BUBBLE 配置变化
    if (areaName === 'local' && changes[STORAGE_KEYS.SHOW_BUBBLE]) {
        const newValue = parseBoolean(changes[STORAGE_KEYS.SHOW_BUBBLE]?.newValue, true)
        showBubbleEnabled.value = newValue
        console.log('[Zhiyue] Show bubble setting changed:', newValue)
    }
}

onMounted(() => {
    document.addEventListener('mouseup', onMouseUp)
    checkApiKey()
    loadRapidSettings()
    chrome.storage.onChanged.addListener(onStorageChange)

    // Listen for messages from Sidebar/Background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'show-sentence-card' && message.image) {
            sentenceCardImage.value = message.image
            sentenceCardVisible.value = true
            sendResponse({ success: true })
        }
    })
})

onUnmounted(() => {
    document.removeEventListener('mouseup', onMouseUp)
    chrome.storage.onChanged.removeListener(onStorageChange)
})

const onAnalyze = async () => {
    // If no API key, open side panel directly (which will likely show settings or error)
    if (!hasApiKey.value) {
        onOpenSidePanel()
        return
    }

    bubbleVisible.value = false
    modalVisible.value = true
    isStreaming.value = true
    streamingText.value = ''
    parsedData.value = { tokens: [] }
    
    // Reset rapid translation state
    rapidTranslationText.value = ''
    rapidTranslationError.value = ''
    isRapidTranslating.value = false
    
    // Trigger rapid translation in parallel (non-blocking)
    if (rapidTranslationEnabled.value) {
        triggerRapidTranslation(selectedText.value)
    }
    
    let port: chrome.runtime.Port | null = null
    
    try {
        port = chrome.runtime.connect({ name: 'ai-stream' })
        
        port.onMessage.addListener((msg) => {
            if (msg.error) {
                console.error('Stream error:', msg.error)
                isStreaming.value = false
                port?.disconnect()
            } else if (msg.chunk) {
                streamingText.value += msg.chunk
                
                // Attempt to repair and parse JSON incrementally
                try {
                    const repaired = jsonrepair(streamingText.value)
                    const parsed = JSON.parse(repaired)
                    
                    if (Array.isArray(parsed)) {
                        // Map array format to AnalysisData
                        parsedData.value = {
                            tokens: parsed.map((t: any) => ({
                                word: t.word,
                                reading: t.furigana || t.reading || '',
                                romaji: t.romaji || '',
                                pos: t.pos,
                                meaning: t.meaning
                            }))
                        }
                    } else if (parsed && Array.isArray(parsed.tokens)) {
                        parsedData.value = parsed
                    }
                } catch (e) {
                    // Silent failure on partial JSON
                }
            } else if (msg.done) {
                isStreaming.value = false
                
                // Final parse
                try {
                    const repaired = jsonrepair(streamingText.value)
                    const parsed = JSON.parse(repaired)
                    
                    if (Array.isArray(parsed)) {
                        parsedData.value = {
                            tokens: parsed.map((t: any) => ({
                                word: t.word,
                                reading: t.furigana || t.reading || '',
                                romaji: t.romaji || '',
                                pos: t.pos,
                                meaning: t.meaning
                            }))
                        }
                    } else if (parsed && Array.isArray(parsed.tokens)) {
                        parsedData.value = parsed
                    }
                } catch (e) {
                    console.error('Final parse failed', e)
                }
                
                port?.disconnect()
            }
        })
        
        // Send analysis request
        port.postMessage({ action: 'analyze', text: selectedText.value })
        
    } catch (error) {
        console.error('Connection failed', error)
        isStreaming.value = false
    }
}

// Rapid Translation Trigger (Parallel, Non-blocking)
const triggerRapidTranslation = async (text: string) => {
    isRapidTranslating.value = true
    rapidTranslationText.value = ''
    rapidTranslationError.value = ''
    
    let port: chrome.runtime.Port | null = null
    
    try {
        port = chrome.runtime.connect({ name: 'ai-stream' })
        
        port.onMessage.addListener((msg) => {
            if (msg.error) {
                rapidTranslationError.value = msg.error
                isRapidTranslating.value = false
                port?.disconnect()
            } else if (msg.chunk) {
                rapidTranslationText.value += msg.chunk
            } else if (msg.done) {
                isRapidTranslating.value = false
                port?.disconnect()
            }
        })
        
        port.postMessage({ action: 'rapid-translation', text })
        
    } catch (error) {
        console.error('Rapid translation failed', error)
        rapidTranslationError.value = '快速翻译失败'
        isRapidTranslating.value = false
    }
}

const onExplain = () => {
    // Explanation requests should go to the heavy-feature Sidebar
    onOpenSidePanel()
}

const onConfigure = () => {
    // Set pending view to settings
    chrome.storage.local.set({ pending_view: 'settings' }).then(() => {
        // Open side panel without text context to avoid auto-analysis
        onOpenSidePanel({ skipText: true })
    })
}

const onCloseModal = () => {
    modalVisible.value = false
    // Reset to main analysis view when closing modal
    selectedToken.value = null
    qaHistory.value = []
    qaStreamText.value = ''
    isQaStreaming.value = false
}

const onOpenSidePanel = (options?: { skipText?: boolean }) => {
    // ✅ 立即发送消息，不能有任何 await，否则会丢失用户手势
    // Background script 会负责存储文本和分析结果
    
    // 检查是否分析已完成（有结果且不在流式传输中）
    const analysisComplete = !isStreaming.value && parsedData.value && parsedData.value.tokens.length > 0
    
    const messagePayload: any = {
        type: 'open-side-panel',
        text: options?.skipText ? '' : selectedText.value
    }
    
    // 如果分析已完成，附带结果数据
    if (analysisComplete && !options?.skipText) {
        messagePayload.analysisResult = {
            data: parsedData.value,
            rapidTranslation: rapidTranslationText.value || undefined
        }
        console.log('📤 Sending analysis result to sidebar:', messagePayload.analysisResult)
    }
    
    chrome.runtime.sendMessage(messagePayload).then(response => {
        if (response?.success) {
            console.log('✅ Side panel opened successfully', analysisComplete ? '(with cached result)' : '(new analysis)')
        } else {
            console.error('❌ Failed to open side panel:', response?.error || 'Unknown error')
        }
    }).catch(e => {
        console.error('Failed to send open-side-panel message:', e)
    })
    
    modalVisible.value = false
}

// Q&A State Management for Content Script
const selectedToken = ref<any>(null)
const qaHistory = ref<{ question: string, answer: string }[]>([])
const isQaStreaming = ref(false)
const qaStreamText = ref('')

// Token Detail Rapid Query State
const rapidTokenDetailEnabled = ref(true) // Default enabled
const tokenDetailData = ref<any>(null)
const isTokenDetailLoading = ref(false)
const tokenDetailError = ref('')

function handleSelectToken(token: any) {
    selectedToken.value = token
    qaHistory.value = []
    qaStreamText.value = ''
    isQaStreaming.value = false
    
    // Reset token detail state
    tokenDetailData.value = null
    tokenDetailError.value = ''
    
    // Trigger rapid token detail query if enabled
    if (rapidTokenDetailEnabled.value && token?.word) {
        triggerTokenDetail(token.word)
    }
}

// Token Detail Rapid Query Trigger
const triggerTokenDetail = async (tokenWord: string) => {
    isTokenDetailLoading.value = true
    tokenDetailData.value = null
    tokenDetailError.value = ''
    
    let port: chrome.runtime.Port | null = null
    let fullResponse = ''
    
    try {
        port = chrome.runtime.connect({ name: 'ai-stream' })
        
        port.onMessage.addListener((msg) => {
            if (msg.error) {
                tokenDetailError.value = msg.error
                isTokenDetailLoading.value = false
                port?.disconnect()
            } else if (msg.chunk) {
                fullResponse += msg.chunk
            } else if (msg.done) {
                isTokenDetailLoading.value = false
                
                // Parse JSON response
                try {
                    tokenDetailData.value = JSON.parse(fullResponse)
                } catch (e) {
                    console.error('Failed to parse token detail JSON:', e)
                    tokenDetailError.value = '解析失败'
                }
                
                port?.disconnect()
            }
        })
        
        port.postMessage({ action: 'token-detail', token: tokenWord })
        
    } catch (error) {
        console.error('Token detail query failed', error)
        tokenDetailError.value = '查询失败'
        isTokenDetailLoading.value = false
    }
}

function handleBack() {
    selectedToken.value = null
}

async function handleAskQuestion(question: string) {
    if (!question.trim() || !selectedText.value) return
    
    isQaStreaming.value = true
    qaStreamText.value = ''
    
    let port: chrome.runtime.Port | null = null
    
    try {
        port = chrome.runtime.connect({ name: 'ai-stream' })
        
        port.onMessage.addListener((msg) => {
            if (msg.error) {
                qaStreamText.value = `❌ 错误: ${msg.error}`
                isQaStreaming.value = false
                port?.disconnect()
            } else if (msg.chunk) {
                qaStreamText.value += msg.chunk
            } else if (msg.done) {
                isQaStreaming.value = false
                qaHistory.value.push({
                    question,
                    answer: qaStreamText.value
                })
                qaStreamText.value = ''
                port?.disconnect()
            }
        })
        
        // Context construction
        const contextSentence = selectedText.value
        const contextToken = selectedToken.value?.word || '全文'
        
        port.postMessage({
            action: 'ask-question',
            sentence: contextSentence,
            token: contextToken,
            question
        })
        
    } catch (error) {
        console.error('QA Connection failed', error)
        qaStreamText.value = `❌ 连接失败: ${(error as Error).message}`
        isQaStreaming.value = false
    }
}
</script>

<template>
  <div class="zhiyue-overlay font-sans text-base">
      <SelectionBubble 
        :visible="bubbleVisible" 
        :x="bubbleX" 
        :y="bubbleY"
        :has-api-key="hasApiKey"
        @analyze="onAnalyze"
        @explain="onExplain"
        @configure="onConfigure"
        @close="bubbleVisible = false"
      />
      
      <AnalysisModal
        :visible="modalVisible"
        :analysis-data="parsedData"
        :is-streaming="isStreaming"
        :selected-token="selectedToken"
        :qa-history="qaHistory"
        :is-qa-streaming="isQaStreaming"
        :qa-stream-text="qaStreamText"
        :rapid-translation-text="rapidTranslationText"
        :is-rapid-translating="isRapidTranslating"
        :rapid-translation-error="rapidTranslationError"
        :token-detail-data="tokenDetailData"
        :is-token-detail-loading="isTokenDetailLoading"
        :token-detail-error="tokenDetailError"
        @close="onCloseModal"
        @open-sidebar="onOpenSidePanel"
        @select-token="handleSelectToken"
        @back="handleBack"
        @ask-question="handleAskQuestion"
      />

      <SentenceCardOverlay 
        :visible="sentenceCardVisible"
        :image="sentenceCardImage"
        @close="sentenceCardVisible = false"
      />
  </div>
</template>
