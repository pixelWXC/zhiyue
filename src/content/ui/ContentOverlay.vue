<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SelectionBubble from './SelectionBubble.vue'
import AnalysisModal from './AnalysisModal.vue'
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
        
        bubbleVisible.value = true
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
        // Use local storage as defined in logic/storage
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY)
        hasApiKey.value = !!result[STORAGE_KEYS.API_KEY]
    } catch (e) {
        console.warn('Failed to check API key', e)
        hasApiKey.value = false
    }
}

// Load rapid services settings
const loadRapidSettings = async () => {
    try {
        const result = await chrome.storage.local.get([
            STORAGE_KEYS.RAPID_TRANSLATION,
            STORAGE_KEYS.RAPID_TOKEN_DETAIL
        ])
        rapidTranslationEnabled.value = result[STORAGE_KEYS.RAPID_TRANSLATION] !== false // Default true
        rapidTokenDetailEnabled.value = result[STORAGE_KEYS.RAPID_TOKEN_DETAIL] !== false // Default true
    } catch (e) {
        console.warn('Failed to load rapid settings', e)
    }
}

// Listen for storage changes
const onStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.API_KEY]) {
        hasApiKey.value = !!changes[STORAGE_KEYS.API_KEY]?.newValue
    }
    if (areaName === 'local' && changes[STORAGE_KEYS.RAPID_TRANSLATION]) {
        rapidTranslationEnabled.value = changes[STORAGE_KEYS.RAPID_TRANSLATION]?.newValue !== false
    }
}

onMounted(() => {
    document.addEventListener('mouseup', onMouseUp)
    checkApiKey()
    loadRapidSettings()
    chrome.storage.onChanged.addListener(onStorageChange)
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

const onCloseModal = () => {
    modalVisible.value = false
    // Reset to main analysis view when closing modal
    selectedToken.value = null
    qaHistory.value = []
    qaStreamText.value = ''
    isQaStreaming.value = false
}

const onOpenSidePanel = () => {
    // ✅ 立即发送消息，不能有任何 await，否则会丢失用户手势
    // Background script 会负责存储文本
    chrome.runtime.sendMessage({
        type: 'open-side-panel',
        text: selectedText.value
    }).then(response => {
        if (response?.success) {
            console.log('✅ Side panel opened successfully')
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
  </div>
</template>
