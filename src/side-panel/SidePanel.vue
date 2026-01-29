<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AnalysisResult from '@/components/Analysis/AnalysisResult.vue'
import { useAiStore } from '@/stores/ai-store'
import { useCardCollectionStore } from '@/stores/card-collection-store'
import { storeToRefs } from 'pinia'
import { Sparkles, AlertCircle, RotateCw, Trash2, Network, Settings as SettingsIcon, Home, Layers } from 'lucide-vue-next'
import ManualInput from './components/ManualInput.vue'
import SyntaxTree from './components/SyntaxTree.vue'
import TokenDetail from '@/components/Analysis/TokenDetail.vue'
import MagicCard from './components/MagicCard/MagicCard.vue'
import SentenceCard from './components/MagicCard/SentenceCard.vue'
import Settings from './components/Settings/Settings.vue'
import CardCollection from './components/CardCollection/CardCollection.vue'
import NotificationBubble from '@/components/ui/NotificationBubble.vue'
import ToastProvider from '@/components/ui/Toast/ToastProvider.vue'
import { onMessage, sendMessage } from 'webext-bridge/popup'
import type { VocabCard } from '@/types/vocab-card'

// View Management
const currentView = ref<'home' | 'settings' | 'collection'>('home')

// Card Collection Store
const cardCollectionStore = useCardCollectionStore()
const { cardCount } = storeToRefs(cardCollectionStore)

// Target card for jumping from notification
const targetCardId = ref<number | undefined>(undefined)

// AI Store
const aiStore = useAiStore()
const { 
    streamingText, isStreaming, parsedData, currentResult, error: aiError, selectedToken,
    syntaxData, isSyntaxLoading,
    cardData, isGeneratingCard, cardError,
    imageResult, imageError,
    rapidTranslationText, isRapidTranslating, rapidTranslationError,
    tokenDetailData, isTokenDetailLoading, tokenDetailError
} = storeToRefs(aiStore)

// Store last analyzed text for retry
const lastAnalyzedText = ref('')

// Compute data to display
const displayData = computed(() => {
    if (isStreaming.value) return parsedData.value
    return currentResult.value?.data || null
})

/**
 * Handle AI Analysis
 */
async function handleAnalyze(text: string) {
    if (!text || !text.trim()) return
    isSyntaxTabPending.value = false
    pendingSyntaxText.value = ''
    lastAnalyzedText.value = text
    await aiStore.analyzeText(text)
}

/**
 * Retry last analysis
 */
function handleRetry() {
    if (lastAnalyzedText.value) {
        handleAnalyze(lastAnalyzedText.value)
    }
}

/**
 * Clear analysis results
 */
function handleClear() {
    aiStore.clearResults()
    lastAnalyzedText.value = ''
    isSyntaxTabPending.value = false
    pendingSyntaxText.value = ''
}

function handleSelectToken(token: any) {
  aiStore.selectToken(token)
}

function handleBack() {
  aiStore.selectToken(null)
}

// Card Generation Logic
const showCardModal = ref(false)

async function handleGenerateCard() {
  if (!lastAnalyzedText.value) return
  
  showCardModal.value = true
  
  // Generate card content with context (selectedToken) if available
  const targetToken = aiStore.selectedToken || undefined
  await aiStore.generateCard(lastAnalyzedText.value, targetToken)
  
  // If card generation succeeded and has sceneDescription, generate image
  if (aiStore.cardData?.sceneDescription) {
    await aiStore.generateCardImage(aiStore.cardData.sceneDescription)
  }
}

// Sentence Card Logic
const showSentenceCardModal = ref(false)

async function handleGenerateSentenceCard() {
  if (!lastAnalyzedText.value) return
  showSentenceCardModal.value = true
}

function handleCloseSentenceCard() {
  showSentenceCardModal.value = false
}

// 从 TokenDetail 跳转到卡片收藏并打开指定卡片
function handleViewCardCollection(cardId?: number) {
  targetCardId.value = cardId
  currentView.value = 'collection'
}

// 制卡完成通知气泡点击处理
function handleNotificationClick(card: VocabCard) {
  cardCollectionStore.dismissNotification()
  targetCardId.value = card.id
  currentView.value = 'collection'
}

function handleCloseCard() {
  showCardModal.value = false
}

function handleRetryCard() {
  handleGenerateCard()
}

// Tab Logic
const currentTab = ref<'analysis' | 'syntax'>('analysis')
const isSyntaxTabPending = ref(false)
const pendingSyntaxText = ref('')

async function handleTabChange(tab: 'analysis' | 'syntax') {
    if (tab === 'analysis') {
        currentTab.value = 'analysis'
        return
    }

    if (tab === 'syntax') {
        if (syntaxData.value) {
            currentTab.value = 'syntax'
            return
        }
        if (!lastAnalyzedText.value) return

        isSyntaxTabPending.value = true
        pendingSyntaxText.value = lastAnalyzedText.value

        if (!isSyntaxLoading.value) {
            await aiStore.analyzeSyntax(lastAnalyzedText.value)
        }
    }
}

watch([syntaxData, isSyntaxLoading], ([data, loading]) => {
    if (!isSyntaxTabPending.value) return
    if (loading) return

    if (data && pendingSyntaxText.value === lastAnalyzedText.value) {
        currentTab.value = 'syntax'
    }
    isSyntaxTabPending.value = false
    pendingSyntaxText.value = ''
})



// Check for pending analysis on mount (from Open in Side Panel)
onMounted(async () => {
    try {
        const data = await chrome.storage.local.get(['pending_analysis_text', 'pending_analysis_result', 'pending_view'])
        
        // Handle pending view navigation (e.g. from "Configure" button)
        if (data.pending_view === 'settings') {
            console.log('⚙️ Opening Settings view from pending request')
            currentView.value = 'settings'
            await chrome.storage.local.remove('pending_view')
            return
        }

        const text = data['pending_analysis_text'] as string | undefined
        const cachedResult = data['pending_analysis_result'] as { data: any, rapidTranslation?: string } | undefined
        
        if (text && typeof text === 'string') {
            console.log('📬 Found pending analysis:', text)
            
            // Clear stored data
            await chrome.storage.local.remove(['pending_analysis_text', 'pending_analysis_result'])
            
            // Save the text for potential retry
            lastAnalyzedText.value = text
            
            // Check if we have cached analysis result
            if (cachedResult && cachedResult.data) {
                console.log('✨ Loading cached analysis result (no re-analysis needed)')
                
                // Use store action to properly load cached result
                aiStore.loadCachedResult(text, cachedResult.data, cachedResult.rapidTranslation)
                
                console.log('✅ Cached result loaded successfully')
            } else {
                // No cached result, start fresh analysis
                console.log('🔄 No cached result, starting new analysis')
                handleAnalyze(text)
            }
        }
    } catch (e) {
        console.error('Failed to check pending analysis', e)
    }
})

// IPC Listeners

// Handle clipboard read trigger from keyboard shortcut
// Clipboard automatic read removed by user request

// Story 4-7: 在挂载时通知 Background Side Panel 已打开
onMounted(() => {
    sendMessage('sidepanel-opened', undefined, 'background')
        .then(() => console.log('📌 Side Panel state: OPEN'))
        .catch((e) => console.warn('Failed to notify sidepanel-opened:', e))
    
    // 加载卡片收藏数据
    cardCollectionStore.loadCards()
})

// Story 4-7: 在卸载时通知 Background Side Panel 已关闭
onUnmounted(() => {
    sendMessage('sidepanel-closed', undefined, 'background')
        .then(() => console.log('📌 Side Panel state: CLOSED'))
        .catch((e) => console.warn('Failed to notify sidepanel-closed:', e))
})

// Story 4-7: Handle Side Panel close trigger from keyboard shortcut toggle
onMessage('close-sidepanel', () => {
    console.log('🔄 Toggle Shortcut: Closing Side Panel...')
    // 发送关闭消息给 Background，然后关闭窗口
    sendMessage('sidepanel-closed', undefined, 'background')
        .catch((e) => console.warn('Failed to notify sidepanel-closed:', e))
        .finally(() => {
            window.close()
        })
})
</script>

<template>
  <div class="min-h-screen bg-rice-paper dark:bg-zinc-950 text-charcoal dark:text-gray-100 font-sans transition-colors duration-300">
    <ToastProvider />
    <!-- Header -->
    <header class="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold bg-matcha bg-clip-text text-transparent">
            智阅伴侣
          </h1>
          <p class="text-xs text-charcoal/60 dark:text-gray-400 font-medium">即时分析助手</p>
        </div>
        <div class="flex items-center gap-2">
            <button 
              @click="currentView = 'home'"
              :class="currentView === 'home' ? 'text-deep-tea dark:text-blue-400 bg-matcha/20 dark:bg-blue-900/30' : 'text-charcoal/40 hover:text-charcoal dark:hover:text-gray-300'"
              class="p-2 rounded-lg transition-colors"
              title="主页"
            >
              <Home class="w-5 h-5" />
            </button>
            <button 
              @click="currentView = 'collection'; targetCardId = undefined"
              :class="currentView === 'collection' ? 'text-deep-tea dark:text-purple-400 bg-deep-tea/10 dark:bg-purple-900/30' : 'text-charcoal/40 hover:text-charcoal dark:hover:text-gray-300'"
              class="p-2 rounded-lg transition-colors relative"
              title="卡片收藏"
            >
              <Layers class="w-5 h-5" />
              <span 
                v-if="cardCount > 0" 
                class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-deep-tea text-rice-paper rounded-full flex items-center justify-center"
              >
                {{ cardCount > 99 ? '99+' : cardCount }}
              </span>
            </button>
            <button 
              @click="currentView = 'settings'"
              :class="currentView === 'settings' ? 'text-charcoal dark:text-indigo-400 bg-charcoal/10 dark:bg-indigo-900/30' : 'text-charcoal/40 hover:text-charcoal dark:hover:text-gray-300'"
              class="p-2 rounded-lg transition-colors"
              title="设置"
            >
              <SettingsIcon class="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>

    <!-- Settings View -->
    <Settings v-if="currentView === 'settings'" />

    <!-- Card Collection View -->
    <CardCollection 
      v-else-if="currentView === 'collection'" 
      :target-card-id="targetCardId"
    />

    <!-- Main Analysis View -->
    <main v-else class="p-6 max-w-2xl mx-auto space-y-8">
      
      <!-- AI Analysis Section -->
      <section>
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <h2 class="text-sm font-semibold tracking-wide uppercase text-deep-tea dark:text-blue-400 flex items-center gap-2">
                    <Sparkles class="w-4 h-4" /> 智能分析
                </h2>
            </div>
            
            <!-- View Toggle -->
            <div v-if="lastAnalyzedText" class="flex p-0.5 bg-matcha/10 dark:bg-zinc-800 rounded-lg">
                <button 
                    @click="handleTabChange('analysis')"
                    class="px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1"
                    :class="currentTab === 'analysis' ? 'bg-white dark:bg-zinc-700 text-deep-tea dark:text-blue-400 shadow-sm' : 'text-charcoal/60 hover:text-charcoal dark:text-gray-400'"
                >
                    <Sparkles class="w-3 h-3" />
                    <span>分析</span>
                </button>
                <button 
                     @click="handleTabChange('syntax')"
                     :aria-busy="isSyntaxTabPending"
                     class="px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1"
                     :class="currentTab === 'syntax'
                        ? 'bg-white dark:bg-zinc-700 text-deep-tea dark:text-indigo-400 shadow-sm'
                        : isSyntaxTabPending
                            ? 'text-matcha dark:text-indigo-400'
                            : 'text-charcoal/60 hover:text-charcoal dark:text-gray-400'"
                >
                    <Network class="w-3 h-3" />
                    <span>句法</span>
                    <span v-if="isSyntaxTabPending" class="ml-1 flex items-center gap-1 text-[10px] text-matcha dark:text-indigo-400">
                        <span class="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        等待中
                    </span>
                </button>
            </div>
        </div>

        <div class="space-y-4">
            <!-- Manual Input (shown when idle) -->
            <ManualInput 
                v-if="!isStreaming && !displayData"
                @analyze="handleAnalyze" 
            />

            <!-- Error Display -->
            <div v-if="aiError" class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div class="text-sm text-red-700 dark:text-red-400">
                    <p class="font-medium">分析失败</p>
                    <p class="opacity-90">{{ aiError }}</p>
                </div>
            </div>

            <!-- Result Area -->
            <div v-if="displayData || isStreaming" class="relative group">
                <div v-if="!isStreaming" class="absolute -inset-0.5 bg-gradient-to-r from-matcha to-deep-tea rounded-2xl opacity-10 transition duration-500 blur"></div>
                <div class="relative bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm min-h-[100px]">
                    <div class="p-6">
                        <!-- Analysis View -->
                        <div v-show="!selectedToken && currentTab === 'analysis'">
                            <!-- Rapid Translation Section (Only show when NOT viewing token detail) -->
                            <div 
                                v-if="rapidTranslationText || isRapidTranslating || rapidTranslationError" 
                                class="mb-4 p-3 bg-matcha/5 dark:bg-amber-900/20 border border-matcha/20 dark:border-amber-800 rounded-lg"
                            >
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-deep-tea dark:text-amber-400">⚡</span>
                                    <h4 class="text-xs font-semibold text-deep-tea dark:text-amber-300">快速翻译</h4>
                                </div>
                                
                                <!-- Loading State -->
                                <div v-if="isRapidTranslating && !rapidTranslationText" class="flex items-center gap-2 text-xs text-matcha dark:text-amber-400">
                                    <div class="w-3 h-3 border-2 border-matcha border-t-transparent rounded-full animate-spin"></div>
                                    <span>翻译中...</span>
                                </div>
                                
                                <!-- Translation Result -->
                                <p v-else-if="rapidTranslationText" class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {{ rapidTranslationText }}
                                </p>
                                
                                <!-- Error State -->
                                <p v-else-if="rapidTranslationError" class="text-xs text-rose-600 dark:text-rose-400">
                                    ⚠️ {{ rapidTranslationError }}（不影响深度分析）
                                </p>
                            </div>

                            <AnalysisResult 
                                :data="displayData" 
                                :isLoading="isStreaming"
                                :show-magic-card="true"
                                @select-token="handleSelectToken"
                                @generate-card="handleGenerateCard"
                                @generate-sentence-card="handleGenerateSentenceCard"
                            />
                            
                             <!-- Raw Text Fallback (Debug or if parse fails entirely but we have text) -->
                             <div v-if="isStreaming && (!displayData || displayData.tokens.length === 0) && streamingText" class="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-zinc-800">
                                <p class="text-xs text-gray-400 mb-1">Raw Stream (Parsing...)</p>
                                <div class="font-mono text-xs text-gray-500 whitespace-pre-wrap break-all">{{ streamingText }}</div>
                             </div>

                             <!-- Action Buttons (below analysis result) -->
                             <div v-if="!isStreaming" class="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                                <button 
                                    @click="handleRetry"
                                    :disabled="!lastAnalyzedText"
                                    class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal/80 dark:text-zinc-400 hover:text-deep-tea dark:hover:text-indigo-400 hover:bg-matcha/10 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="重新分析"
                                >
                                    <RotateCw class="w-4 h-4" />
                                    <span>重新分析</span>
                                </button>
                                <button 
                                    @click="handleClear"
                                    class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                    title="清除结果"
                                >
                                    <Trash2 class="w-4 h-4" />
                                    <span>清除结果</span>
                                </button>
                             </div>
                        </div>

                        <TokenDetail 
                            :token-detail-data="tokenDetailData"
                            :is-token-detail-loading="isTokenDetailLoading"
                            :token-detail-error="tokenDetailError"
                            :show-magic-card="true"
                            @back="handleBack"
                            @view-card-collection="handleViewCardCollection"
                        />

                        <!-- Syntax Tree View -->
                        <div v-if="currentTab === 'syntax'" class="animate-in fade-in zoom-in-95 duration-300">
                             <div v-if="isSyntaxLoading && !syntaxData" class="flex flex-col items-center justify-center py-12 text-gray-400">
                                <RotateCw class="w-6 h-6 animate-spin mb-2 text-indigo-500" />
                                <span class="text-xs">深度思考中...</span>
                             </div>
                             
                             <SyntaxTree 
                                v-else-if="syntaxData"
                                :data="syntaxData"
                                :sentence="lastAnalyzedText"
                                :is-loading="isSyntaxLoading"
                             />
                             
                             <div v-else class="text-center py-8 text-gray-400 text-xs">
                                暂无句法数据
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

    </main>

    <!-- Magic Card Modal -->
    <Transition name="modal">
      <div
        v-if="showCardModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="handleCloseCard"
      >
        <div class="relative max-w-[420px] w-full animate-in zoom-in-95 duration-300">
          <!-- Close Button -->
          <button
            @click="handleCloseCard"
            class="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            title="关闭"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Magic Card Component -->
          <MagicCard
            :data="cardData"
            :isLoading="isGeneratingCard"
            :image="imageResult"
            :error="cardError || imageError"
            @retry="handleRetryCard"
          />
        </div>
      </div>
    </Transition>

    <!-- Sentence Magic Card Modal -->
    <Transition name="modal">
      <div
        v-if="showSentenceCardModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="handleCloseSentenceCard"
      >
        <div class="relative max-w-[520px] w-full animate-in zoom-in-95 duration-300">
          <!-- Close Button -->
          <button
            @click="handleCloseSentenceCard"
            class="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            title="关闭"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Sentence Card Component -->
          <SentenceCard :sentence="lastAnalyzedText" />
        </div>
      </div>
    </Transition>

    <!-- Card Creation Notification Bubble -->
    <NotificationBubble
      :visible="cardCollectionStore.showCompletionNotification"
      :card="cardCollectionStore.lastCompletedCard"
      @click="handleNotificationClick"
      @close="cardCollectionStore.dismissNotification()"
    />
  </div>
</template>

<style scoped>
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Toast Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
