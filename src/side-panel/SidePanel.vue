<script setup lang="ts">
import { ref, computed } from 'vue'
import { pingBackground } from '../lib/ipc'
import ApiKeyInput from '@/components/Settings/ApiKeyInput.vue'
import AnalysisResult from '@/components/Analysis/AnalysisResult.vue'
import { useAiStore } from '@/stores/ai-store'
import { storeToRefs } from 'pinia'
import { Sparkles, Send, Loader2, AlertCircle } from 'lucide-vue-next'

// AI Store
const aiStore = useAiStore()
const { streamingText, isStreaming, parsedData, currentResult, error: aiError, isLoading: isAiLoading } = storeToRefs(aiStore)

// Input state
const userInput = ref('')

// Compute data to display
const displayData = computed(() => {
    if (isStreaming.value) return parsedData.value
    return currentResult.value?.data || null
})

// Test state
const testMessage = ref('Hello from Side Panel!')
const testResult = ref('')
const isPingLoading = ref(false)

/**
 * Handle AI Analysis
 */
async function handleAnalyze() {
    if (!userInput.value.trim()) return
    await aiStore.analyzeText(userInput.value)
}

/**
 * Test ping-pong communication
 */
async function testPing() {
  isPingLoading.value = true
  testResult.value = '发送中...'
  
  try {
    const response = await pingBackground(testMessage.value)
    testResult.value = `✅ 成功！\n响应: ${response.pong}\n延迟: ${Date.now() - response.receivedAt}ms`
  } catch (error) {
    testResult.value = `❌ 错误: ${error}`
  } finally {
    isPingLoading.value = false
  }
}
// IPC Listeners
import { onMessage } from 'webext-bridge/popup'

onMessage('trigger-clipboard-read', async () => {
    console.log('📋 Shortcut Trigger: Reading clipboard...')
    try {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
            console.log('📋 Clipboard content found:', text.substring(0, 20) + '...')
            userInput.value = text
            if (!isStreaming.value) {
                await handleAnalyze()
            }
        } else {
            console.log('⚠️ Clipboard is empty or non-text')
            aiStore.setError('剪贴板为空或没有文本内容')
            userInput.value = ''
        }
    } catch (error) {
        console.warn('📋 Clipboard read failed:', error)
    }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
    <!-- Header -->
    <header class="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            智阅伴侣
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">即时分析助手</p>
        </div>
        <div class="flex items-center gap-2">
            <button class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-400 transition-colors">
                <span class="sr-only">菜单</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
        </div>
      </div>
    </header>

    <main class="p-6 max-w-2xl mx-auto space-y-8">
      
      <!-- AI Analysis Section -->
      <section>
        <div class="flex items-center gap-2 mb-4">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Sparkles class="w-4 h-4" /> 智能分析
            </h2>
            <div class="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
        </div>

        <div class="space-y-4">
            <!-- Input Area -->
            <div class="relative">
                <textarea
                    v-model="userInput"
                    placeholder="输入日语文本进行分析..."
                    class="w-full h-32 p-4 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-sm transition-all"
                    :disabled="isStreaming"
                ></textarea>
                
                <button
                    @click="handleAnalyze"
                    :disabled="!userInput.trim() || isStreaming"
                    class="absolute bottom-3 right-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                    <Loader2 v-if="isStreaming" class="w-4 h-4 animate-spin" />
                    <Send v-else class="w-4 h-4" />
                    {{ isStreaming ? '分析中...' : '开始分析' }}
                </button>
            </div>

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
                <div v-if="!isStreaming" class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-10 transition duration-500 blur"></div>
                <div class="relative bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm min-h-[100px]">
                    <AnalysisResult 
                        :data="displayData" 
                        :isLoading="isStreaming" 
                    />
                    
                     <!-- Raw Text Fallback (Debug or if parse fails entirely but we have text) -->
                     <div v-if="isStreaming && (!displayData || displayData.tokens.length === 0) && streamingText" class="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-zinc-800">
                        <p class="text-xs text-gray-400 mb-1">Raw Stream (Parsing...)</p>
                        <div class="font-mono text-xs text-gray-500 whitespace-pre-wrap break-all">{{ streamingText }}</div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      <!-- Configuration Section -->
      <section>
        <div class="flex items-center gap-2 mb-4">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">配置</h2>
            <div class="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
        </div>
        <ApiKeyInput />
      </section>

      <!-- Dev / Debug Section -->
      <section class="opacity-80 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2 mb-4">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">系统状态</h2>
            <div class="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
        </div>
        
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium">IPC 通信连接</span>
                <span 
                    class="w-2.5 h-2.5 rounded-full"
                    :class="testResult.includes('✅') ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500'"
                ></span>
            </div>
            
            <div class="flex gap-2">
                <input
                  v-model="testMessage"
                  type="text"
                  placeholder="Ping 消息..."
                  class="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  @keydown.enter="testPing"
                />
                <button
                  @click="testPing"
                  :disabled="isPingLoading"
                  class="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-medium rounded transition-colors"
                >
                  发送 Ping
                </button>
            </div>
            
            <div v-if="testResult" class="mt-3 p-2 bg-gray-50 dark:bg-zinc-950 rounded border border-gray-100 dark:border-zinc-800">
                <pre class="text-[10px] font-mono whitespace-pre-wrap text-gray-600 dark:text-gray-300">{{ testResult }}</pre>
            </div>
        </div>
      </section>

    </main>
  </div>
</template>
