<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useAiStore } from '@/stores/ai-store'
import { storeToRefs } from 'pinia'
import { Send, ExternalLink, ArrowLeft, Bot, User, Sparkles, X, Volume2, Zap, MessageCircleQuestion } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'
import CardCreationConfirm from '@/side-panel/components/MagicCard/CardCreationConfirm.vue'
import type { CreateCardContext, VocabCard } from '@/types/vocab-card'

// Props for content script mode (optional)
interface Props {
  // Q&A state from parent (content script mode)
  externalSelectedToken?: any
  externalQaHistory?: { question: string, answer: string }[]
  externalIsQaStreaming?: boolean
  externalQaStreamText?: string
  // Token Detail Rapid Query state
  tokenDetailData?: any
  isTokenDetailLoading?: boolean
  tokenDetailError?: string | null
  showMagicCard?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'ask-question', question: string): void
  (e: 'view-card-collection', cardId?: number): void
}>()

// Initialize markdown renderer
const md = new MarkdownIt({
  html: false, // Disable HTML tags for security
  breaks: true, // Convert \n to <br>
  linkify: true, // Auto-convert URLs to links
})

// Sidebar mode: use global store
const aiStore = useAiStore()
const { selectedToken: storeSelectedToken, qaHistory: storeQaHistory, isQaStreaming: storeIsQaStreaming, qaStreamText: storeQaStreamText } = storeToRefs(aiStore)

// Determine if we're in content script mode
const isContentScriptMode = computed(() => props.externalSelectedToken !== undefined)

// Computed values that work in both modes
const selectedToken = computed(() => isContentScriptMode.value ? props.externalSelectedToken : storeSelectedToken.value)
const qaHistory = computed(() => isContentScriptMode.value ? (props.externalQaHistory || []) : storeQaHistory.value)
const isQaStreaming = computed(() => isContentScriptMode.value ? (props.externalIsQaStreaming || false) : storeIsQaStreaming.value)
const qaStreamText = computed(() => isContentScriptMode.value ? (props.externalQaStreamText || '') : storeQaStreamText.value)

const questionInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const showCardCreationConfirm = ref(false)
const isAiModalOpen = ref(false)

const suggestedQuestions = ['用法是什么?', '其他意思?', '例句?']

// 制卡上下文，用于触发 CardCreationConfirm
const cardCreationContext = computed<CreateCardContext | null>(() => {
    if (!selectedToken.value) return null
    
    // 优先使用快捷词典的释义，如果没有则使用原始分析的释义
    const meaning = props.tokenDetailData?.definition || selectedToken.value.meaning || ''
    
    return {
        word: selectedToken.value.word,
        reading: selectedToken.value.reading || props.tokenDetailData?.pronunciation || '',
        meaning: meaning,
        pos: selectedToken.value.pos || '',
        sentence: aiStore.currentResult?.text || '',
        pitch: props.tokenDetailData?.pitch,
        tones: props.tokenDetailData?.tones,
        sourceUrl: undefined // 侧边栏模式下可能需要从其他地方获取
    }
})

// 处理制卡完成后查看卡片
function handleViewCardFromCreation(card: VocabCard) {
  showCardCreationConfirm.value = false
  emit('view-card-collection', card.id)
}

const WIDTH_SMALL = 40
const WIDTH_LARGE = 70
const PITCH_HEIGHT_HIGH = 10
const PITCH_HEIGHT_LOW = 30

const formattedTones = computed(() => {
    if (!props.tokenDetailData?.tones) return []
    
    const rawTones = props.tokenDetailData.tones
    const mergedTones: { char: string, high: boolean }[] = []
    
    // Small kana that should be merged with previous character (forming a single mora)
    // Excluding small tsu (っ/ッ) as it counts as a separate mora
    const smallKana = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゎ', 
                       'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ヮ']
    
    for (const t of rawTones) {
        if (mergedTones.length > 0 && smallKana.includes(t.char)) {
            mergedTones[mergedTones.length - 1]!.char += t.char
        } else {
            mergedTones.push({ ...t })
        }
    }
    return mergedTones
})

function getCharWidth(char: string) {
    return char.length > 1 ? WIDTH_LARGE : WIDTH_SMALL
}

// Calculate SVG paths for pitch pattern
const pitchSvg = computed(() => {
    const tones = formattedTones.value
    if (!tones.length) return { width: 0, height: 40, lines: [], circles: [] }

    let currentX = 0
    const points = tones.map(t => {
        const width = getCharWidth(t.char)
        const x = currentX + width / 2
        currentX += width
        const y = t.high ? PITCH_HEIGHT_HIGH : PITCH_HEIGHT_LOW
        return { x, y, high: t.high }
    })

    const lines = []
    const circles = []

    for (let i = 0; i < points.length; i++) {
        // Circle
        circles.push({
            cx: points[i]!.x,
            cy: points[i]!.y,
            fill: points[i]!.high ? '#88C057' : '#cbd5e1', // matcha : slate-300
            isHigh: points[i]!.high
        })

        // Line to next
        if (i < points.length - 1) {
            lines.push({
                x1: points[i]!.x,
                y1: points[i]!.y,
                x2: points[i + 1]!.x,
                y2: points[i + 1]!.y,
                stroke: points[i]!.high && points[i+1]!.high ? '#6FA141' : '#cbd5e1', // matcha-dark : slate-300
                // Use gradient logic if needed, but solid color is cleaner for now. 
                // If distinct High->Low, standard is usually just the line.
            })
        }
    }

    return {
        width: currentX,
        height: 40,
        lines,
        circles
    }
})

// Auto-scroll to bottom when chat updates
watch([qaHistory, qaStreamText], async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}, { deep: true })

async function handleAsk() {
    if (!questionInput.value.trim() || isQaStreaming.value) return
    
    const q = questionInput.value
    questionInput.value = ''
    
    // Content script mode: emit event to parent
    if (isContentScriptMode.value) {
        emit('ask-question', q)
    } else {
        // Sidebar mode: use store
        await aiStore.askQuestion(q)
    }
}

function handleQuickQuestion(question: string) {
    questionInput.value = question
}

function openDictionary(type: 'youdao' | 'mazii' | 'weblio') {
    if (!selectedToken.value) return
    let url = ''
    const word = selectedToken.value.word
    
    switch (type) {
        case 'youdao':
            url = `https://dict.youdao.com/w/jap/${encodeURIComponent(word)}`
            break
        case 'mazii':
            url = `https://mazii.net/zh-CN/search/word/ja-CN/${encodeURIComponent(word)}`
            break
        case 'weblio':
            url = `https://www.weblio.jp/content/${encodeURIComponent(word)}`
            break
    }
    window.open(url, '_blank')
}

// Render markdown safely
function renderMarkdown(text: string): string {
    return md.render(text)
}

// Speak Japanese text using Web Speech API
function playPronunciation(): void {
    if (!selectedToken.value) return
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(selectedToken.value.word)
        utterance.lang = 'ja-JP'
        utterance.rate = 0.9
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
    } else {
        console.warn('浏览器不支持语音朗读功能')
    }
}
</script>

<template>
  <div v-if="selectedToken" class="token-detail-container min-h-full">
    
    <!-- Main Content Area -->
    <main class="max-w-2xl mx-auto bg-white dark:bg-zinc-900">
      <!-- Back Navigation -->
      <button 
        @click="$emit('back')"
        class="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-5 transition-colors group"
      >
        <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span class="text-sm font-medium">词汇详情</span>
      </button>

      <!-- Word Card -->
      <div class="word-card relative bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-6 mb-4">
        <!-- AI Question Button (Absolute Top Right) -->
        <button 
          v-if="showMagicCard && tokenDetailData && !tokenDetailError"
          @click="isAiModalOpen = true"
          class="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-matcha/40 dark:border-matcha/40 text-deep-tea dark:text-matcha hover:bg-matcha/20 dark:hover:bg-deep-tea/30 hover:text-deep-tea/90 bg-white/80 dark:bg-zinc-900 rounded-lg transition-colors z-10"
        >
          <MessageCircleQuestion class="w-3.5 h-3.5" />
          向AI提问
        </button>

        <!-- Word Header -->
        <div class="mb-4 pr-24">
          <p class="text-deep-tea dark:text-matcha text-sm font-medium mb-1">{{ selectedToken.reading }}</p>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-4xl font-bold text-slate-900 dark:text-white break-all max-w-full">{{ selectedToken.word }}</h1>
            <button
              @click="playPronunciation"
              class="p-2 rounded-full hover:bg-matcha/15 dark:hover:bg-deep-tea/30 text-deep-tea dark:text-matcha transition-colors shrink-0"
              title="播放读音"
            >
              <Volume2 class="w-5 h-5" />
            </button>
          </div>
          <div class="flex items-center gap-2 mt-3 flex-wrap">
            <span class="px-2.5 py-1 text-xs font-semibold bg-matcha/20 dark:bg-deep-tea/40 text-deep-tea dark:text-matcha rounded-full">
              {{ selectedToken.pos }}
            </span>
            <span v-if="selectedToken.romaji" class="text-slate-500 dark:text-slate-400 text-sm font-mono break-all">
              {{ selectedToken.romaji }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <button 
            @click="openDictionary('youdao')" 
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 bg-transparent border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            有道
          </button>
          <button 
            @click="openDictionary('mazii')" 
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 bg-transparent border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Mazii
          </button>
          <button 
            @click="openDictionary('weblio')" 
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 bg-transparent border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Weblio
          </button>
          <button 
            v-if="showMagicCard && tokenDetailData && !tokenDetailError"
            @click="showCardCreationConfirm = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-matcha to-deep-tea hover:from-matcha/90 hover:to-deep-tea/90 rounded-lg shadow-md shadow-matcha/30 dark:shadow-deep-tea/40 transition-all"
          >
            <Sparkles class="w-3.5 h-3.5" />
            魔法卡片
          </button>
        </div>
      </div>

      <!-- Quick Dictionary Card -->
      <div class="dictionary-card bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-6">
        <div class="flex items-center gap-2 mb-5">
          <Zap class="w-4 h-4 text-matcha" />
          <h2 class="font-semibold text-slate-900 dark:text-white">快捷词典</h2>
          <div v-if="isTokenDetailLoading && !tokenDetailData" class="ml-auto">
            <div class="w-4 h-4 border-2 border-matcha border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="tokenDetailError" class="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <span>⚠️</span>
          <span>{{ tokenDetailError }}</span>
        </div>

        <!-- Dictionary Content -->
        <div v-else class="space-y-5">
          <!-- Definition -->
          <div v-if="tokenDetailData?.definition || selectedToken.meaning">
            <h3 class="text-xs font-medium text-deep-tea/70 dark:text-matcha/70 uppercase tracking-wider mb-2">释义</h3>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">{{ tokenDetailData?.definition || selectedToken.meaning }}</p>
          </div>

          <!-- Grammar -->
          <div v-if="tokenDetailData?.grammar">
            <h3 class="text-xs font-medium text-deep-tea/70 dark:text-matcha/70 uppercase tracking-wider mb-2">语法</h3>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">{{ tokenDetailData.grammar }}</p>
          </div>

          <!-- Pitch Accent / Tones -->
          <div v-if="formattedTones && formattedTones.length > 0">
            <h3 class="text-xs font-medium text-deep-tea/70 dark:text-matcha/70 uppercase tracking-wider mb-3">音调</h3>
            <div class="flex flex-col gap-2">
              <div class="flex items-end">
                <!-- Pitch Characters -->
                <div 
                  v-for="(t, idx) in formattedTones" 
                  :key="idx" 
                  class="flex flex-col items-center justify-end"
                  :style="{ width: getCharWidth(t.char) + 'px' }"
                >
                  <div
                    class="h-8 rounded-lg flex items-center justify-center text-lg font-medium transition-all"
                    :class="t.high 
                      ? 'bg-matcha/20 dark:bg-deep-tea/40 text-deep-tea dark:text-matcha -translate-y-2' 
                      : 'bg-rice-paper dark:bg-zinc-800 text-slate-600 dark:text-slate-400'"
                    :style="{ width: t.char.length > 1 ? '62px' : '32px' }"
                  >
                    {{ t.char }}
                  </div>
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{{ t.high ? '高' : '低' }}</span>
                </div>
              </div>
              
              <!-- Pitch Pattern Line (SVG) -->
              <div class="relative h-10 overflow-visible">
                 <svg 
                   :width="pitchSvg.width" 
                   :height="pitchSvg.height" 
                   :viewBox="`0 0 ${pitchSvg.width} ${pitchSvg.height}`"
                   class="overflow-visible"
                 >
                    <!-- Connecting Lines -->
                    <line 
                      v-for="(line, idx) in pitchSvg.lines" 
                      :key="'line-'+idx"
                      :x1="line.x1" 
                      :y1="line.y1" 
                      :x2="line.x2" 
                      :y2="line.y2" 
                      :stroke="line.stroke"
                      stroke-width="2"
                    />
                    <!-- Nodes -->
                    <circle 
                      v-for="(circle, idx) in pitchSvg.circles" 
                      :key="'circle-'+idx"
                      :cx="circle.cx" 
                      :cy="circle.cy" 
                      r="4"
                      :fill="circle.fill"
                    />
                 </svg>
              </div>
            </div>
          </div>
          
          <!-- Fallback Pronunciation -->
          <div v-else-if="tokenDetailData?.pronunciation">
            <h3 class="text-xs font-medium text-deep-tea/70 dark:text-matcha/70 uppercase tracking-wider mb-2">读音</h3>
            <p class="text-slate-700 dark:text-slate-300">{{ tokenDetailData.pronunciation }}</p>
          </div>

          <!-- Loading Placeholder -->
          <div v-if="isTokenDetailLoading && !tokenDetailData" class="space-y-4">
            <div class="animate-pulse">
              <div class="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-16 mb-2"></div>
              <div class="h-5 bg-slate-200 dark:bg-zinc-700 rounded w-full"></div>
            </div>
            <div class="animate-pulse">
              <div class="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-12 mb-2"></div>
              <div class="h-5 bg-slate-200 dark:bg-zinc-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- AI Question Modal - Fixed Position Overlay -->
    <Teleport to="body">
      <div v-if="isAiModalOpen" class="ai-modal-wrapper">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]"
          @click="isAiModalOpen = false"
        />

        <!-- Modal (Full Screen) -->
        <div class="fixed inset-0 z-[10000] flex flex-col animate-fade-in p-4">
          <div class="flex-1 flex flex-col max-w-2xl mx-auto w-full min-h-0">
            <div class="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden min-h-0">
              <!-- Modal Header -->
              <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-matcha to-deep-tea flex items-center justify-center shadow-lg shadow-matcha/30 dark:shadow-deep-tea/40 shrink-0">
                    <MessageCircleQuestion class="w-5 h-5 text-white" />
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-semibold text-slate-900 dark:text-white">AI 助手</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                      关于「<span class="text-deep-tea dark:text-matcha font-medium">{{ selectedToken.word }}</span>」有什么不懂的吗？
                    </p>
                  </div>
                </div>
                <button
                  @click="isAiModalOpen = false"
                  class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Chat History (Scrollable Area) -->
              <div 
                ref="chatContainer" 
                class="flex-1 overflow-y-auto p-4 space-y-4 bg-rice-paper/70 dark:bg-zinc-800/30 min-h-0"
              >
                <!-- Empty State -->
                <div v-if="qaHistory.length === 0 && !isQaStreaming" class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                  <Bot class="w-12 h-12 mb-3 opacity-50" />
                  <p class="text-sm">关于「{{ selectedToken.word }}」有什么不懂的吗？</p>
                  <p class="text-xs mt-1 opacity-70">选择下方的快捷提问或输入你的问题</p>
                </div>
                
                
                <!-- Messages -->
                <template v-for="(msg, idx) in qaHistory" :key="idx">
                  <!-- User -->
                  <div class="flex gap-3 flex-row-reverse">
                    <div class="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                      <User class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div class="bg-deep-tea text-rice-paper px-3 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] leading-relaxed shadow-sm">
                      {{ msg.question }}
                    </div>
                  </div>
                  <!-- AI -->
                  <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-matcha to-deep-tea flex items-center justify-center shrink-0 shadow-sm">
                      <Bot class="w-4 h-4 text-white" />
                    </div>
                    <div class="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 px-3 py-2 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-200 max-w-[100%] leading-relaxed shadow-sm markdown-prose">
                      <div v-html="renderMarkdown(msg.answer)"></div>
                    </div>
                  </div>
                </template>
                
                <!-- Streaming Message -->
                <div v-if="isQaStreaming" class="flex gap-3">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-br from-matcha to-deep-tea flex items-center justify-center shrink-0 shadow-sm">
                    <Bot class="w-4 h-4 text-white" />
                  </div>
                  <div class="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 px-3 py-2 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-200 max-w-[100%] leading-relaxed shadow-sm markdown-prose">
                    <div v-if="qaStreamText" v-html="renderMarkdown(qaStreamText)"></div>
                    <div v-else class="flex gap-1 items-center h-5">
                      <span class="w-1.5 h-1.5 bg-matcha rounded-full animate-bounce"></span>
                      <span class="w-1.5 h-1.5 bg-matcha rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span class="w-1.5 h-1.5 bg-matcha rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suggested Questions -->
              <div class="px-5 py-3 bg-rice-paper/60 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-800">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">快捷提问</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(q, index) in suggestedQuestions"
                    :key="index"
                    @click="handleQuickQuestion(q)"
                    class="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-600 dark:text-slate-400 hover:border-matcha/60 dark:hover:border-matcha/60 hover:text-deep-tea dark:hover:text-matcha hover:bg-matcha/10 dark:hover:bg-deep-tea/30 transition-colors"
                  >
                    {{ q }}
                  </button>
                </div>
              </div>

              <!-- Input Area -->
              <div class="p-4 flex items-center gap-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <input
                  v-model="questionInput"
                  placeholder="输入问题..."
                  :disabled="isQaStreaming"
                  class="flex-1 bg-rice-paper dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 focus:border-deep-tea dark:focus:border-matcha focus:ring-2 focus:ring-matcha/20 rounded-xl h-11 px-4 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                  @keydown.enter="handleAsk"
                />
                <button
                  @click="handleAsk"
                  :disabled="!questionInput.trim() || isQaStreaming"
                  class="h-11 w-11 rounded-xl bg-gradient-to-r from-matcha to-deep-tea hover:from-matcha/90 hover:to-deep-tea/90 shadow-lg shadow-matcha/30 dark:shadow-deep-tea/40 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Card Creation Confirm Modal -->
    <CardCreationConfirm 
      v-if="cardCreationContext"
      :visible="showCardCreationConfirm" 
      :context="cardCreationContext"
      @close="showCardCreationConfirm = false"
      @view-card="handleViewCardFromCreation"
    />
  </div>
</template>

<style scoped>
.token-detail-container {
  background: linear-gradient(to bottom right, 
    rgb(253 251 247) 0%, 
    rgb(255 255 255) 100%
  );
}

.dark .token-detail-container {
  background: linear-gradient(to bottom right, 
    rgb(15 26 23) 0%, 
    rgb(10 15 14) 60%, 
    rgb(18 24 20) 100%
  );
}

.word-card,
.dictionary-card {
  transition: all 0.3s ease;
}

.word-card:hover,
.dictionary-card:hover {
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.08);
}

.dark .word-card:hover,
.dark .dictionary-card:hover {
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.4);
}

/* Slide Up Animation */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

/* Fade In Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}

/* Markdown prose styling for AI responses */
.markdown-prose {
    overflow-wrap: break-word;
}

.markdown-prose :deep(p) {
    margin: 0.5em 0;
}

.markdown-prose :deep(p:first-child) {
    margin-top: 0;
}

.markdown-prose :deep(p:last-child) {
    margin-bottom: 0;
}

.markdown-prose :deep(strong) {
    font-weight: 700;
    color: inherit;
}

.markdown-prose :deep(em) {
    font-style: italic;
}

.markdown-prose :deep(code) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.9em;
}

.dark .markdown-prose :deep(code) {
    background-color: rgba(255, 255, 255, 0.1);
}

.markdown-prose :deep(pre) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.75rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 0.5em 0;
}

.dark .markdown-prose :deep(pre) {
    background-color: rgba(255, 255, 255, 0.05);
}

.markdown-prose :deep(ul),
.markdown-prose :deep(ol) {
    margin: 0.5em 0;
    padding-left: 1.5em;
}

.markdown-prose :deep(li) {
    margin: 0.25em 0;
}

.markdown-prose :deep(a) {
    color: #1F4037;
    text-decoration: underline;
}

.markdown-prose :deep(a:hover) {
    color: #88C057;
}
</style>
