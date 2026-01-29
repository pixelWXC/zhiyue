<template>
  <div class="magic-card-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="card-skeleton">
      <MagicCardSkeleton />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card-error">
      <div class="humble-robot">
        <AlertCircle class="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          哎呀，创建卡片时出了点小问题
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {{ error }}
        </p>
        <button
          @click="$emit('retry')"
          class="retry-button"
        >
          <RotateCw class="w-4 h-4" />
          重试
        </button>
      </div>
    </div>

    <!-- Card Content -->
    <div v-else-if="data" class="magic-card">
      <!-- Image Section -->
      <div v-if="image" class="card-image-container">
        <Transition name="fade">
          <img
            :src="image"
            alt="Card illustration"
            class="card-image"
            @click="openFullscreen"
          />
        </Transition>
      </div>
      <div v-else class="card-image-placeholder">
        <ImageIcon class="w-16 h-16 text-gray-300" />
        <p class="text-xs text-gray-400 mt-2">等待图片生成...</p>
      </div>

      <!-- Card Content -->
      <div class="card-content">
        <!-- Target Word -->
        <div class="card-field card-target">
          <h2 class="target-word">{{ data.targetWord }}</h2>
          <p class="reading">{{ data.reading }}</p>
        </div>

        <!-- Meaning -->
        <div class="card-field">
          <label class="field-label">含义</label>
          <p class="field-value">{{ data.meaning }}</p>
        </div>

        <!-- Translation (New) -->
        <div v-if="data.translation" class="card-field">
          <label class="field-label">翻译</label>
          <p class="field-value">{{ data.translation }}</p>
        </div>

        <!-- Sentence -->
        <div class="card-field">
          <label class="field-label">例句</label>
          <p class="field-value sentence">{{ data.sentence }}</p>
        </div>

        <!-- Hint -->
        <div class="card-field">
          <label class="field-label">提示</label>
          <p class="field-value hint">{{ data.hint }}</p>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="card-footer">
        <p class="footer-hint">这是一个预览，请使用卡片收藏功能保存卡片</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card-empty">
      <Sparkles class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-sm text-gray-500">等待卡片生成...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, RotateCw, ImageIcon, Sparkles } from 'lucide-vue-next'
import type { FlashcardData } from '@/types/card'
import MagicCardSkeleton from './MagicCardSkeleton.vue'

interface Props {
  data: FlashcardData | null
  isLoading: boolean
  image: string | null
  error?: string | null
}

const props = defineProps<Props>()

defineEmits<{
  retry: []
}>()

async function openFullscreen() {
  if (!props.image) return
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'show-sentence-card',
        image: props.image
      })
    } else {
        console.warn('No active tab found for fullscreen overlay')
    }
  } catch (e) {
    console.error('Failed to open fullscreen', e)
  }
}
</script>

<style scoped>
.magic-card-container {
  width: 100%;
  max-width: 400px;
  min-width: 320px;
}

/* Loading Skeleton */
.card-skeleton {
  background: #fdfbf7;
  border-radius: 16px;
  border: 1px solid rgba(31, 64, 55, 0.12);
  overflow: hidden;
}

/* Error State */
.card-error {
  background: #fdfbf7;
  border-radius: 16px;
  border: 1px solid rgba(31, 64, 55, 0.2);
  padding: 32px 24px;
  text-align: center;
}

.humble-robot {
  max-width: 280px;
  margin: 0 auto;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1f4037;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #17342d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(31, 64, 55, 0.25);
}

/* Magic Card */
.magic-card {
  background: linear-gradient(135deg, #fdfbf7 0%, #ffffff 100%);
  border-radius: 16px;
  border: 2px solid rgba(31, 64, 55, 0.16);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(31, 64, 55, 0.08);
  transition: all 0.3s;
}

.magic-card:hover {
  box-shadow: 0 8px 24px rgba(31, 64, 55, 0.14);
  transform: translateY(-2px);
}

/* Image Section */
.card-image-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f1f5ee;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card-image-container:hover .card-image {
  transform: scale(1.05);
}

.card-image-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #f7faf5 0%, #eef3e7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Card Content */
.card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-field {
  margin-bottom: 16px;
}

.card-field:last-child {
  margin-bottom: 0;
}

/* Target Word */
.card-target {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(31, 64, 55, 0.12);
  margin-bottom: 20px;
}

.target-word {
  font-size: 32px;
  font-weight: 700;
  color: #1f4037;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.reading {
  font-size: 16px;
  color: #88c057;
  font-weight: 500;
}

/* Field Labels */
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7c6a;
  margin-bottom: 6px;
}

.field-value {
  font-size: 14px;
  line-height: 1.6;
  color: #2d3a34;
  margin: 0;
}

.field-value.sentence {
  font-size: 15px;
  font-weight: 500;
  color: #1f4037;
}

.field-value.hint {
  font-size: 13px;
  color: #6b7c6a;
  font-style: italic;
}

/* Card Footer */
.card-footer {
  padding: 12px 24px;
  background: #fdfbf7;
  border-top: 1px solid rgba(31, 64, 55, 0.12);
  display: flex;
  justify-content: center;
}

.footer-hint {
  font-size: 12px;
  color: #8b9a86;
  margin: 0;
}

/* Empty State */
.card-empty {
  background: #fdfbf7;
  border: 2px dashed rgba(31, 64, 55, 0.2);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .magic-card {
    background: linear-gradient(135deg, #111815 0%, #18211d 100%);
    border-color: #2a3a32;
  }

  .card-error {
    background: #111815;
    border-color: #2a3a32;
  }

  .card-target {
    border-bottom-color: #2a3a32;
  }

  .target-word {
    color: #e6f0da;
  }

  .reading {
    color: #9bc96a;
  }

  .field-label {
    color: #8b9a86;
  }

  .field-value {
    color: #d1dacb;
  }

  .field-value.sentence {
    color: #e6f0da;
  }

  .field-value.hint {
    color: #9aa896;
  }

  .card-footer {
    background: #18211d;
    border-top-color: #2a3a32;
  }

  .card-image-placeholder {
    background: linear-gradient(135deg, #18211d 0%, #223029 100%);
  }

  .card-empty {
    background: #111815;
    border-color: #2a3a32;
  }

  .humble-robot h3 {
    color: #e6f0da;
  }

  .humble-robot p {
    color: #9aa896;
  }
}
</style>
