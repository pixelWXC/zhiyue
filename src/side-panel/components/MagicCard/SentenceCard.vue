<template>
  <div class="sentence-card-container">
    <!-- Generation Button (if no image) -->
    <div v-if="!image && !isGenerating" class="generate-section">
      <button
        @click="handleGenerate"
        class="generate-button"
      >
        <Sparkles class="w-5 h-5" />
        生成魔法卡片
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isGenerating" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在创作场景画面...</p>
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

   <!-- Image Result -->
    <div v-else-if="image" class="result-section">
      <div class="image-preview">
        <img :src="image" alt="生成的整句卡片" class="card-image" />
      </div>
      
      <div class="action-buttons">
        <button @click="handleDownload" class="download-button">
          <Download class="w-4 h-4" />
          保存图片
        </button>
        
        <button @click="handleRegenerate" class="regenerate-button">
          <RotateCw class="w-4 h-4" />
          重新生成
        </button>
      </div>

      <div class="action-buttons-secondary">
          <button @click="openFullscreen" class="fullscreen-button">
            <Maximize class="w-4 h-4" />
            全屏查看
          </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, AlertCircle, RotateCw, Download, Maximize } from 'lucide-vue-next'
import { useAiStore } from '@/stores/ai-store'

interface Props {
  sentence: string
}

const props = defineProps<Props>()
const aiStore = useAiStore()

// Computed state from store
const isGenerating = computed(() => aiStore.isSentenceCardGenerating)
const image = computed(() => aiStore.sentenceCardImage)
const error = computed(() => aiStore.sentenceCardError)

// Actions
async function handleGenerate() {
  if (!props.sentence?.trim()) {
    return
  }
  
  await aiStore.generateSentenceCard(props.sentence)
  
  if (aiStore.sentenceCardImage) {
    openFullscreen()
  }
}

async function openFullscreen() {
  if (!image.value) return
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'show-sentence-card',
        image: image.value
      })
    }
  } catch (e) {
    console.error('Failed to open fullscreen', e)
    // Fallback or notify user
  }
}

function handleRegenerate() {
  aiStore.clearSentenceCard()
  handleGenerate()
}

function handleDownload() {
  if (!image.value) return
  
  // Create download link
  const link = document.createElement('a')
  link.href = image.value
  link.download = `sentence-card-${Date.now()}.png`
  link.click()
}
</script>

<style scoped>
.sentence-card-container {
  width: 100%;
  max-width: 560px;
  margin: 2rem auto;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Header */
.card-header {
  text-align: center;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px 0;
}

.card-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Generate Section */
.generate-section {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: none;
  border-radius: 16px;
  box-shadow: inset 0 0 0 2px rgba(99, 102, 241, 0.3);
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

.generate-button:active {
  transform: translateY(0);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 48px 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 6px 0;
}

.loading-subtext {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 48px 24px;
  background: white;
  border: 1px solid #fca5a5;
  border-radius: 12px;
}

.error-message {
  font-size: 14px;
  color: #dc2626;
  margin: 0 0 16px 0;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fca5a5;
  color: #7f1d1d;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #f87171;
}

/* Result Section */
.result-section {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #c7d2fe;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.image-preview {
  width: 100%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.card-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}

.action-buttons {
  padding: 16px;
  display: flex;
  gap: 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.download-button,
.regenerate-button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.download-button {
  background: #10b981;
  color: white;
}

.download-button:hover {
  background: #059669;
  transform: translateY(-1px);
}

.regenerate-button {
  background: #e5e7eb;
  color: #374151;
}

.regenerate-button:hover {
  background: #d1d5db;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .card-title {
    color: #f9fafb;
  }

  .card-subtitle,
  .loading-subtext {
    color: #a1a1aa;
  }

  .generate-section,
  .loading-state,
  .error-state,
  .result-section {
    background: #18181b;
    border-color: #3f3f46;
  }

  .loading-text {
    color: #f9fafb;
  }

  .loading-spinner {
    border-color: #3f3f46;
    border-top-color: #8b5cf6;
  }

  .action-buttons {
    background: #27272a;
    border-top-color: #3f3f46;
  }

  .regenerate-button {
    background: #3f3f46;
    color: #e4e4e7;
  }

  .regenerate-button:hover {
    background: #52525b;
  }
}

.action-buttons-secondary {
  padding: 0 16px 16px; 
  background: #f9fafb;
}

.fullscreen-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.fullscreen-button:hover {
  background: #7c3aed;
}

@media (prefers-color-scheme: dark) {
  .action-buttons-secondary {
      background: #27272a;
  }
}
</style>
