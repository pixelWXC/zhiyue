<template>
  <div class="word-card-container">
    <!-- Generation Button (if no image) -->
    <div v-if="!image && !isGenerating" class="generate-section">
      <button
        @click="handleGenerate"
        class="generate-button"
      >
        <Sparkles class="w-5 h-5" />
        生成单词魔法卡片
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isGenerating" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在绘制单词场景...</p>
      <p class="loading-subtext">这可能需要 10-20 秒</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <AlertCircle class="w-10 h-10 text-red-500 mb-2" />
      <p class="error-message">{{ error }}</p>
      <button @click="handleGenerate" class="retry-button">
        <RotateCw class="w-4 h-4" />
        重试
      </button>
    </div>

    <!-- Image Result (Flashcard Layout) -->
    <div v-else-if="image" class="result-section">
      <!-- Card Front/Back Preview -->
      <div class="card-content p-4 space-y-4">
        <!-- Top: Word Info -->
        <div class="text-center pb-3 border-b border-gray-100">
            <h2 class="text-2xl font-bold text-gray-800 break-words">{{ context.word }}</h2>
            <p class="text-sm text-gray-500 font-mono mt-1">{{ context.kana }}</p>
            <p class="text-base text-gray-700 mt-2 font-medium">{{ context.meaning }}</p>
        </div>

        <!-- Middle: Image -->
        <div class="image-preview rounded-lg overflow-hidden border border-gray-100 shadow-sm">
          <img :src="image" :alt="context.word" class="w-full h-auto object-cover" />
        </div>

        <!-- Bottom: Context Sentence -->
        <div class="text-sm text-gray-600 leading-relaxed text-center px-2">
            {{ context.sentence }}
        </div>
      </div>
      
      <!-- Actions -->
      <div class="action-buttons">
        <button @click="handleDownload" class="download-button" title="第一步: 保存图片">
          <Download class="w-4 h-4" />
          保存图片
        </button>
        
        <button @click="handleCopyAnki" class="copy-button" title="第二步: 复制内容到 Anki">
          <Copy class="w-4 h-4" />
          复制 Anki 内容
        </button>
      </div>

       <div class="action-buttons-secondary">
          <button @click="handleRegenerate" class="regenerate-button">
            <RotateCw class="w-4 h-4" />
            重新生成
          </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sparkles, AlertCircle, RotateCw, Download, Copy } from 'lucide-vue-next'
import { useAiStore } from '@/stores/ai-store'
import type { WordContext } from '@/logic/prompts'
import { useClipboard } from '@vueuse/core'
import { useToast } from '@/composables/useToast'

interface Props {
  context: WordContext
}

const props = defineProps<Props>()
const aiStore = useAiStore()
const { copy, copied } = useClipboard()
const { toast } = useToast()

// State for filename consistency
const currentTimestamp = ref<number>(Date.now())

// Computed state from store
const isGenerating = computed(() => aiStore.isWordCardGenerating)
const image = computed(() => aiStore.wordCardImage)
const error = computed(() => aiStore.wordCardError)

async function handleGenerate() {
  if (!props.context.word) return
  currentTimestamp.value = Date.now()
  await aiStore.generateWordCard(props.context)
}

function handleRegenerate() {
  aiStore.clearWordCard()
  handleGenerate()
}

function getFilename() {
    // Sanitize word for filename
    const safeWord = props.context.word.replace(/[<>:"/\\|?*]/g, '')
    return `${safeWord}_${currentTimestamp.value}.png`
}

function handleDownload() {
  if (!image.value) return
  
  const link = document.createElement('a')
  link.href = image.value
  link.download = getFilename()
  link.click()
}

function handleCopyAnki() {
    const filename = getFilename()
    // HTML format for Anki
    // Intended for user to paste into a field, then drag the image in.
    // The <img> tag with just filename allows Anki to resolve it if the file is in media folder
    // or if the user drags it in, Anki often replaces implementation.
    // But text copy is main goal here.
    
    // We provide a rich text block
    const html = `
      <div class="anki-card-import">
        <div><strong>${props.context.word}</strong> (${props.context.kana})</div>
        <div>${props.context.meaning}</div>
        <br>
        <img src="${filename}" alt="${props.context.word}">
        <br>
        <hr>
        <div>${props.context.sentence}</div>
        <small>(请将下载的图片拖入此处)</small>
      </div>
    `
    copy(html)
    toast({ title: '已复制', description: 'Anki 内容已复制到剪贴板', variant: 'success' })
}
</script>

<style scoped>
.word-card-container {
  width: 100%;
  max-width: 560px;
  margin: 1rem auto;
  border-radius: 16px;
  /* Removed background/blur/shadow as it might be inside a modal */
}

/* Reuse styles but scoped locally */
.generate-section {
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 16px;
}

.generate-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.generate-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.loading-state {
  text-align: center;
  padding: 32px 24px;
  background: #f9fafb;
  border-radius: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.loading-subtext {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.error-state {
  text-align: center;
  padding: 24px;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  color: #dc2626;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 12px;
  background: #fca5a5;
  color: #7f1d1d;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.result-section {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: white;
}

/* Image styles handled by utility classes now */

.action-buttons {
  padding: 12px;
  display: flex;
  gap: 8px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.download-button, .copy-button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.download-button {
  background: #10b981;
  color: white;
}

.copy-button {
  background: #3b82f6;
  color: white;
}

.action-buttons-secondary {
  padding: 0 12px 12px;
  background: #fff;
}

.regenerate-button {
  width: 100%;
  padding: 8px;
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
