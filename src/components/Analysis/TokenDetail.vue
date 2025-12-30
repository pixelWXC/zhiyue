<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useAiStore } from '@/stores/ai-store'
import { storeToRefs } from 'pinia'
import { Send, BookOpen, ExternalLink, ArrowLeft, Bot, User } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'

// Props for content script mode (optional)
interface Props {
  // Q&A state from parent (content script mode)
  externalSelectedToken?: any
  externalQaHistory?: { question: string, answer: string }[]
  externalIsQaStreaming?: boolean
  externalQaStreamText?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'ask-question', question: string): void
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

function openDictionary(type: 'jisho' | 'weblio') {
    if (!selectedToken.value) return
    let url = ''
    const word = selectedToken.value.word
    
    switch (type) {
        case 'jisho':
            url = `https://jisho.org/search/${encodeURIComponent(word)}`
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
</script>

<template>
  <div v-if="selectedToken" class="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
    
    <!-- Header / Back Navigation -->
    <div class="flex items-center gap-2 mb-4">
        <button 
            @click="$emit('back')"
            class="p-1.5 -ml-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
            <ArrowLeft class="w-5 h-5" />
        </button>
        <h2 class="text-sm font-bold text-zinc-500">词汇详情</h2>
    </div>

    <!-- Token Info Card -->
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm mb-4">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-xs text-zinc-500 font-medium mb-1 tracking-wide">{{ selectedToken.reading }}</p>
                <h1 class="text-3xl font-black text-zinc-800 dark:text-zinc-100 mb-2">{{ selectedToken.word }}</h1>
                <div class="flex gap-2">
                     <span class="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded uppercase tracking-wider">
                        {{ selectedToken.pos }}
                     </span>
                     <span v-if="selectedToken.romaji" class="px-2 py-0.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                        {{ selectedToken.romaji }}
                     </span>
                </div>
            </div>
            
            <!-- Dict Links -->
            <div class="flex flex-col gap-1.5">
                <button @click="openDictionary('jisho')" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700/50 transition-colors">
                    <BookOpen class="w-3.5 h-3.5" /> Jisho
                </button>
                <button @click="openDictionary('weblio')" class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700/50 transition-colors">
                    <ExternalLink class="w-3.5 h-3.5" /> Weblio
                </button>
            </div>
        </div>
        
        <div v-if="selectedToken.meaning" class="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <p class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{{ selectedToken.meaning }}</p>
        </div>
    </div>

    <!-- Q&A Section -->
    <div class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <!-- Chat History -->
        <div ref="chatContainer" class="flex-1 max-h-[30vh] overflow-y-auto p-4 space-y-4">
            
            <!-- Empty State -->
            <div v-if="qaHistory.length === 0 && !isQaStreaming" class="h-full flex flex-col items-center justify-center text-zinc-400 opacity-60">
                <Bot class="w-8 h-8 mb-2" />
                <p class="text-xs">关于“{{ selectedToken.word }}”有什么不懂的吗？</p>
                <div class="flex gap-2 mt-4">
                    <button @click="questionInput = '这个词在句子里是什么用法？'; handleAsk()" class="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] hover:border-indigo-400 transition-colors">
                        用法是什么？
                    </button>
                    <button @click="questionInput = '这个词还有其他意思吗？'; handleAsk()" class="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] hover:border-indigo-400 transition-colors">
                        其他意思？
                    </button>
                </div>
            </div>

            <!-- Messages -->
            <template v-for="(msg, idx) in qaHistory" :key="idx">
                <!-- User -->
                <div class="flex gap-3 flex-row-reverse">
                    <div class="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                        <User class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div class="bg-indigo-600 text-white px-3 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] leading-relaxed shadow-sm">
                        {{ msg.question }}
                    </div>
                </div>
                <!-- AI -->
                <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Bot class="w-4 h-4 text-white" />
                    </div>
                    <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 px-3 py-2 rounded-2xl rounded-tl-sm text-sm text-zinc-700 dark:text-zinc-200 max-w-[85%] leading-relaxed shadow-sm markdown-prose">
                        <div v-html="renderMarkdown(msg.answer)"></div>
                    </div>
                </div>
            </template>
            
            <!-- Streaming Message -->
            <div v-if="isQaStreaming" class="flex gap-3">
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                     <Bot class="w-4 h-4 text-white animate-pulse" />
                </div>
                <div class="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 px-3 py-2 rounded-2xl rounded-tl-sm text-sm text-zinc-700 dark:text-zinc-200 max-w-[85%] leading-relaxed shadow-sm markdown-prose">
                    <div v-if="qaStreamText" v-html="renderMarkdown(qaStreamText)"></div>
                    <div v-else class="flex gap-1 items-center h-5">
                        <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                        <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Input Area -->
        <div class="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <div class="relative flex items-center">
                <input 
                    v-model="questionInput"
                    @keydown.enter="handleAsk"
                    :disabled="isQaStreaming"
                    type="text" 
                    placeholder="输入问题..." 
                    class="w-full pl-4 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                >
                <button 
                    @click="handleAsk"
                    :disabled="!questionInput.trim() || isQaStreaming"
                    class="absolute right-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg disabled:opacity-30 transition-colors"
                >
                    <Send class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
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
    color: #6366f1;
    text-decoration: underline;
}

.markdown-prose :deep(a:hover) {
    color: #4f46e5;
}
</style>
